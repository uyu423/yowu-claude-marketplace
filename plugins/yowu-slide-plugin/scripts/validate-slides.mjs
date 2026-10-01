#!/usr/bin/env node

import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { basename, dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { launchChrome, sleep } from './lib/chrome.mjs';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const pluginRoot = resolve(scriptDir, '..');
const defaultFiles = [
  join(pluginRoot, 'skills/yowu-create-slides/assets/example-dark.html'),
  join(pluginRoot, 'skills/yowu-create-slides/assets/example-light.html'),
  join(pluginRoot, 'SAMPLE_SLIDES.html'),
  join(scriptDir, 'fixtures/long-svg.html'),
];
const desktopViewports = [
  { name: 'desktop-1920x1080', width: 1920, height: 1080, mobile: false },
  { name: 'desktop-1280x720', width: 1280, height: 720, mobile: false },
];
const mobileViewport = { name: 'mobile-390x844', width: 390, height: 844, mobile: true };
const args = process.argv.slice(2);
const staticOnly = args.includes('--static-only');
const requestedFiles = args.filter((arg) => arg !== '--static-only');
const files = (requestedFiles.length ? requestedFiles : defaultFiles).map((file) =>
  isAbsolute(file) ? file : resolve(process.cwd(), file),
);

function staticAudit(source, file) {
  const failures = [];
  const geometryTags = source.match(/<(?:path|line|polyline|polygon|circle|ellipse|rect)\b[^>]*>/gi) || [];
  const edges = geometryTags.filter((tag) => /class=["'][^"']*\beg\b[^"']*["']/i.test(tag));
  edges.forEach((tag, index) => {
    if (!/pathLength=["']1["']/i.test(tag)) {
      failures.push(`${basename(file)}: SVG edge ${index + 1}에 pathLength="1" 누락`);
    }
  });
  if (edges.length && !source.includes('__normalizeSvgEdges')) {
    failures.push(`${basename(file)}: SVG edge가 있지만 __normalizeSvgEdges 안전망 누락`);
  }

  // 발표자 브리지 무결성 (self-check M8) — presenter 모듈을 넣은 덱만 검사한다
  if (source.includes('presenter-view')) {
    ['__openPresenter', '__presenterOpen', 'yowu-presenter-hello', 'yowu-deck-sync'].forEach((token) => {
      if (!source.includes(token)) {
        failures.push(`${basename(file)}: 발표자 브리지 토큰 ${token} 누락 — 정본 §8 presenter-js 재삽입 필요`);
      }
    });

    // 노트·구간 라벨 (self-check M9~M11). 발표자 창을 갖춘 덱 = 발표용 덱이므로 대본이 있어야 한다.
    const slideTags = source.match(/<section[^>]*class=["'][^"']*\bslide\b[^"']*["'][^>]*>/gi) || [];
    const notes = source.match(/<aside[^>]*class=["'][^"']*\bslide-notes\b[^"']*["'][^>]*>[\s\S]*?<\/aside>/gi) || [];
    if (slideTags.length && notes.length < slideTags.length) {
      failures.push(`${basename(file)}: M9 노트 커버리지 — 슬라이드 ${slideTags.length}개 중 노트 ${notes.length}개 (발표자 창 대본이 빈다)`);
    }
    notes.forEach((note, index) => {
      const headings = (note.match(/<h4[^>]*>([\s\S]*?)<\/h4>/gi) || []).join(' ');
      ['요지', '핵심', '소요 시간'].forEach((required) => {
        if (!headings.includes(required)) {
          failures.push(`${basename(file)}: M10 노트 ${index + 1}에 '${required}' 항목 없음`
            + (required === '소요 시간' ? ' (발표자 창 페이싱 입력)' : ''));
        }
      });
    });
    if (slideTags.length > 10) {
      const missing = slideTags.filter((tag) => !/\bdata-part=/.test(tag)).length;
      if (missing) failures.push(`${basename(file)}: M11 구간 라벨 — data-part 없는 슬라이드 ${missing}개 (HUD가 구간명을 못 읽는다)`);
    }
  }

  const hasMermaid = /class=["'][^"']*\bmermaid\b/i.test(source);
  if (hasMermaid && /startOnLoad\s*:\s*true/i.test(source)) {
    failures.push(`${basename(file)}: hidden 렌더 위험 — Mermaid startOnLoad:true 사용`);
  }
  if (hasMermaid && (!source.includes('mermaid.run') || !source.includes('deck:change'))) {
    failures.push(`${basename(file)}: Mermaid deck:change 지연 렌더 모듈 누락`);
  }
  return failures;
}

async function evaluate(cdp, sessionId, expression) {
  const response = await cdp.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  }, sessionId);
  if (response.exceptionDetails) {
    const description = response.exceptionDetails.exception?.description || response.exceptionDetails.text;
    throw new Error(description);
  }
  return response.result?.value;
}

async function waitFor(cdp, sessionId, expression, timeoutMs = 5000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await evaluate(cdp, sessionId, expression)) return true;
    await sleep(80);
  }
  return false;
}

async function setViewport(cdp, sessionId, viewport) {
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: viewport.width,
    height: viewport.height,
    screenWidth: viewport.width,
    screenHeight: viewport.height,
    deviceScaleFactor: 1,
    mobile: viewport.mobile,
  }, sessionId);
  await evaluate(cdp, sessionId, `window.dispatchEvent(new Event('resize')); true`);
  await sleep(180);
}

const desktopAuditExpression = (index) => `(() => {
  const slides = Array.from(document.querySelectorAll('.slide'));
  const slide = slides[${index}];
  const viewport = { width: innerWidth, height: innerHeight };
  const tolerance = 3;
  const failures = [];
  const active = slides.filter((item) => item.classList.contains('on'));
  if (active.length !== 1 || active[0] !== slide) failures.push('활성 슬라이드가 정확히 1개가 아님');
  if (!slide) return { failures: ['슬라이드 인덱스 없음'], viewport };
  const slideRect = slide.getBoundingClientRect();
  const inner = slide.querySelector('.slide__inner, .inner');
  if (!inner) failures.push('slide__inner/inner 없음');
  else {
    const rect = inner.getBoundingClientRect();
    if (rect.left < -tolerance || rect.right > viewport.width + tolerance) failures.push('본문 가로 viewport 이탈');
    if (rect.top < -tolerance || rect.bottom > viewport.height + tolerance) failures.push('본문 세로 viewport 이탈');
    if (inner.scrollWidth > inner.clientWidth + tolerance) failures.push('본문 가로 overflow');
    Array.from(inner.children).forEach((child) => {
      const style = getComputedStyle(child);
      const childRect = child.getBoundingClientRect();
      if (style.display === 'none' || style.visibility === 'hidden' || childRect.width === 0 || childRect.height === 0) return;
      if (childRect.left < -tolerance || childRect.right > viewport.width + tolerance || childRect.top < -tolerance || childRect.bottom > viewport.height + tolerance) {
        failures.push('직접 자식 viewport 이탈: ' + child.tagName.toLowerCase() + (child.className ? '.' + String(child.className).trim().replace(/\\s+/g, '.') : ''));
      }
    });
  }
  if (slide.scrollWidth > slide.clientWidth + tolerance) failures.push('슬라이드 가로 overflow');
  if (slide.scrollHeight > slide.clientHeight + tolerance) failures.push('슬라이드 세로 overflow');

  Array.from(slide.querySelectorAll('.fc .eg')).forEach((edge, edgeIndex) => {
    if (edge.getAttribute('pathLength') !== '1') failures.push('SVG edge ' + (edgeIndex + 1) + ' pathLength 정규화 실패');
    const offset = parseFloat(getComputedStyle(edge).strokeDashoffset);
    if (Number.isFinite(offset) && Math.abs(offset) > 0.01) failures.push('SVG edge ' + (edgeIndex + 1) + ' 최종 stroke-dashoffset이 0이 아님');
  });

  Array.from(slide.querySelectorAll('pre.mermaid')).forEach((node, mermaidIndex) => {
    const svg = node.querySelector('svg');
    if (!svg) failures.push('Mermaid ' + (mermaidIndex + 1) + ' SVG 미생성');
    else {
      const rect = svg.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) failures.push('Mermaid ' + (mermaidIndex + 1) + ' 0-size 렌더');
      if (rect.right > viewport.width + tolerance || rect.bottom > viewport.height + tolerance) failures.push('Mermaid ' + (mermaidIndex + 1) + ' viewport 이탈');
    }
  });
  return { failures, viewport, title: (slide.querySelector('h1,h2')?.textContent || slide.dataset.name || '').replace(/\\s+/g, ' ').trim() };
})()`;

const mobileAuditExpression = `(() => {
  const tolerance = 3;
  const failures = [];
  const slides = Array.from(document.querySelectorAll('.slide'));
  if (document.documentElement.scrollWidth > innerWidth + tolerance) failures.push('문서 가로 overflow');
  if (getComputedStyle(document.querySelector('.deck')).position !== 'static') failures.push('모바일 deck이 static 아님');
  slides.forEach((slide, index) => {
    const style = getComputedStyle(slide);
    const rect = slide.getBoundingClientRect();
    const inner = slide.querySelector('.slide__inner, .inner');
    if (style.position !== 'relative') failures.push('슬라이드 ' + (index + 1) + ': position이 relative 아님');
    if (style.visibility === 'hidden' || style.display === 'none' || rect.height < 2) failures.push('슬라이드 ' + (index + 1) + ': 모바일에서 보이지 않음');
    if (inner) {
      const innerRect = inner.getBoundingClientRect();
      if (innerRect.left < -tolerance || innerRect.right > innerWidth + tolerance) failures.push('슬라이드 ' + (index + 1) + ': 본문 가로 이탈');
      if (inner.scrollWidth > inner.clientWidth + tolerance) {
        const offenders = Array.from(inner.children).filter((child) => {
          const childRect = child.getBoundingClientRect();
          return childRect.left < innerRect.left - tolerance || childRect.right > innerRect.right + tolerance;
        }).map((child) => {
          const className = typeof child.className === 'string' ? child.className.trim().replace(/\\s+/g, '.') : '';
          return child.tagName.toLowerCase() + (className ? '.' + className : '');
        });
        failures.push('슬라이드 ' + (index + 1) + ': 본문 가로 overflow' + (offenders.length ? ' — 직접 자식: ' + offenders.join(', ') : ''));
      }
    }
  });
  Array.from(document.querySelectorAll('pre.mermaid')).forEach((node, index) => {
    const svg = node.querySelector('svg');
    if (!svg) failures.push('Mermaid ' + (index + 1) + ': 모바일 SVG 미생성');
    else if (svg.getBoundingClientRect().width < 2 || svg.getBoundingClientRect().height < 2) failures.push('Mermaid ' + (index + 1) + ': 모바일 0-size 렌더');
  });
  return { failures, viewport: { width: innerWidth, height: innerHeight }, slides: slides.length };
})()`;

const presenterAuditExpression = (index) => `(() => {
  const failures = [];
  const pad = (n) => (n < 10 ? '0' : '') + n;
  const el = (id) => document.getElementById(id);
  const root = document.querySelector('.presenter-view');
  if (!document.documentElement.classList.contains('presenter')) failures.push('html.presenter 클래스 없음 — presenter-headscript 누락');
  if (!root) return { failures: failures.concat('.presenter-view 마크업 없음') };
  if (getComputedStyle(root).display === 'none') failures.push('.presenter-view가 렌더되지 않음 — presenter-css 누락');
  if (root.hasAttribute('aria-hidden')) failures.push('.presenter-view에 aria-hidden 잔존 — 발표자 창이 스크린리더에서 숨는다');
  const slides = document.querySelectorAll('.slide');
  const expect = pad(${index} + 1) + ' / ' + pad(slides.length);
  const got = el('pvCount') ? el('pvCount').textContent.trim() : '(pvCount 없음)';
  if (got !== expect) failures.push('#pvCount 동기화 실패 — 기대 ' + expect + ', 실제 ' + got);
  const title = el('pvTitle') ? el('pvTitle').textContent.trim() : '';
  if (!title) failures.push('#pvTitle 비어 있음 — 대본 렌더 실패');
  const hasNote = Boolean(slides[${index}] && slides[${index}].querySelector('.slide-notes'));
  const notes = el('pvNotes') ? el('pvNotes').textContent : '';
  if (hasNote && /이 슬라이드의 노트 없음/.test(notes)) failures.push('#pvNotes가 노트를 못 읽음 — 대본 소스 연결 끊김');
  const anyPlan = Array.from(slides).some((slide) => {
    const note = slide.querySelector('.slide-notes');
    if (!note) return false;
    return Array.from(note.querySelectorAll('h4')).some((h) => /소요\\s*시간/.test(h.textContent));
  });
  const plan = el('pvPlan');
  if (anyPlan && (!plan || plan.classList.contains('off') || !plan.textContent.trim())) {
    failures.push('#pvPlan 비어 있음 — 노트에 소요 시간이 있는데 페이싱이 꺼졌다');
  }
  return { failures };
})()`;

// 발표자 뷰(?presenter)를 실제로 열어 렌더와 동기화 왕복을 확인한다.
// window.opener가 없으므로 sync 메시지를 자기 자신에게 주입해 렌더 경로만 검사한다.
async function auditPresenter(cdp, sessionId, file, slideCount) {
  const failures = [];
  const url = `${pathToFileURL(file).href}?presenter`;
  await setViewport(cdp, sessionId, desktopViewports[0]);
  const navigation = await cdp.send('Page.navigate', { url }, sessionId);
  if (navigation.errorText) {
    failures.push(`${basename(file)} presenter: 탐색 실패 — ${navigation.errorText}`);
    return failures;
  }
  if (!await waitFor(cdp, sessionId, `document.readyState === 'complete'`, 12000)) {
    failures.push(`${basename(file)} presenter: load 이벤트 시간 초과`);
    return failures;
  }
  const index = Math.min(3, Math.max(0, slideCount - 1));
  await evaluate(cdp, sessionId, `window.postMessage({ type: 'yowu-deck-sync', index: ${index} }, '*'); true`);
  await sleep(200);
  const result = await evaluate(cdp, sessionId, presenterAuditExpression(index));
  result.failures.forEach((message) => failures.push(`${basename(file)} presenter slide ${index + 1}: ${message}`));
  return failures;
}

async function auditFile(cdp, sessionId, file, runtimeErrors) {
  const failures = [];
  const source = await readFile(file, 'utf8');
  failures.push(...staticAudit(source, file));
  runtimeErrors.length = 0;

  await setViewport(cdp, sessionId, desktopViewports[0]);
  const navigation = await cdp.send('Page.navigate', { url: pathToFileURL(file).href }, sessionId);
  if (navigation.errorText) failures.push(`${basename(file)}: 탐색 실패 — ${navigation.errorText}`);
  const loaded = await waitFor(cdp, sessionId, `document.readyState === 'complete'`, 12000);
  if (!loaded) failures.push(`${basename(file)}: load 이벤트 시간 초과`);
  await evaluate(cdp, sessionId, `(() => {
    const style = document.createElement('style');
    style.id = '__slideAuditMotion';
    style.textContent = '*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition-duration:0s!important;transition-delay:0s!important}';
    document.head.appendChild(style);
    return true;
  })()`);

  const slideCount = await evaluate(cdp, sessionId, `document.querySelectorAll('.slide').length`);
  if (!slideCount) failures.push(`${basename(file)}: .slide가 없음`);
  const hasDeckGo = await evaluate(cdp, sessionId, `typeof window.__deckGo === 'function'`);
  if (!hasDeckGo) failures.push(`${basename(file)}: window.__deckGo 없음`);

  for (const viewport of desktopViewports) {
    await setViewport(cdp, sessionId, viewport);
    for (let index = 0; index < slideCount; index += 1) {
      if (hasDeckGo) await evaluate(cdp, sessionId, `window.__deckGo(${index}); true`);
      const hasMermaid = await evaluate(cdp, sessionId, `Boolean(document.querySelectorAll('.slide')[${index}]?.querySelector('pre.mermaid'))`);
      if (hasMermaid) {
        await waitFor(cdp, sessionId, `Boolean(document.querySelectorAll('.slide')[${index}]?.querySelector('pre.mermaid svg'))`, 6000);
      }
      await sleep(50);
      const result = await evaluate(cdp, sessionId, desktopAuditExpression(index));
      result.failures.forEach((message) => failures.push(`${basename(file)} ${viewport.name} slide ${index + 1} (${result.title || '제목 없음'}): ${message}`));
    }
  }

  await setViewport(cdp, sessionId, mobileViewport);
  await waitFor(cdp, sessionId, `Array.from(document.querySelectorAll('pre.mermaid')).every((node) => node.querySelector('svg'))`, 6000);
  const mobileResult = await evaluate(cdp, sessionId, mobileAuditExpression);
  mobileResult.failures.forEach((message) => failures.push(`${basename(file)} ${mobileViewport.name}: ${message}`));

  if (source.includes('presenter-view')) {
    failures.push(...await auditPresenter(cdp, sessionId, file, slideCount));
  }

  runtimeErrors.forEach((message) => failures.push(`${basename(file)} console: ${message}`));
  return failures;
}

async function main() {
  if (typeof WebSocket === 'undefined') {
    throw new Error('이 검증기는 내장 WebSocket을 제공하는 Node.js 22 이상이 필요합니다.');
  }
  for (const file of files) await access(file, constants.R_OK);
  const staticFailures = [];
  for (const file of files) staticFailures.push(...staticAudit(await readFile(file, 'utf8'), file));
  if (staticOnly) {
    if (staticFailures.length) {
      staticFailures.forEach((failure) => console.error(`FAIL ${failure}`));
      process.exitCode = 1;
    } else console.log(`PASS static ${files.length} file(s)`);
    return;
  }

  const chrome = await launchChrome();
  const runtimeErrors = [];
  try {
    const { targetId } = await chrome.cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await chrome.cdp.send('Target.attachToTarget', { targetId, flatten: true });
    await chrome.cdp.send('Page.enable', {}, sessionId);
    await chrome.cdp.send('Runtime.enable', {}, sessionId);
    await chrome.cdp.send('Log.enable', {}, sessionId);
    chrome.cdp.on('Runtime.exceptionThrown', (params, eventSessionId) => {
      if (eventSessionId !== sessionId) return;
      runtimeErrors.push(params.exceptionDetails?.exception?.description || params.exceptionDetails?.text || 'JavaScript exception');
    });
    chrome.cdp.on('Runtime.consoleAPICalled', (params, eventSessionId) => {
      if (eventSessionId !== sessionId || !['error', 'assert'].includes(params.type)) return;
      runtimeErrors.push((params.args || []).map((arg) => arg.value || arg.description || '').join(' '));
    });
    chrome.cdp.on('Log.entryAdded', (params, eventSessionId) => {
      if (eventSessionId !== sessionId || params.entry?.level !== 'error' || params.entry?.source !== 'javascript') return;
      runtimeErrors.push(params.entry.text);
    });

    const failures = [];
    for (const file of files) {
      const fileFailures = await auditFile(chrome.cdp, sessionId, file, runtimeErrors);
      failures.push(...fileFailures);
      console.log(`${fileFailures.length ? 'FAIL' : 'PASS'} ${file}`);
    }
    if (failures.length) {
      console.error(`\n${failures.length} rendering issue(s):`);
      failures.forEach((failure) => console.error(`- ${failure}`));
      process.exitCode = 1;
    } else {
      console.log(`\nPASS ${files.length} file(s): 1920x1080, 1280x720, 390x844`);
    }
  } finally {
    await chrome.close();
  }
}

main().catch((error) => {
  console.error(`ERROR ${error.stack || error.message}`);
  process.exitCode = 2;
});
