#!/usr/bin/env node

// 덱 HTML을 배포용으로 내보낸다.
//   {deck}.standalone.html — 로컬 자산을 data URI로 넣은 단일 파일 (브라우저 불필요)
//   {deck}.pdf             — 슬라이드 한 장이 한 면인 16:9 PDF (Chrome + Node 22 필요)

import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { basename, dirname, extname, isAbsolute, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { launchChrome, sleep } from './lib/chrome.mjs';

const MIME = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.webp': 'image/webp', '.avif': 'image/avif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime', '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  '.otf': 'font/otf', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
};
const WARN_BYTES = 8 * 1024 * 1024;
const FAIL_BYTES = 20 * 1024 * 1024;
// 1600×900px = 16.667×9.375in (96dpi)
const PAGE = { width: 1600, height: 900 };

const USAGE = '사용: node scripts/export-slides.mjs <deck.html> [--standalone | --pdf] [--with-notes] [--force] [--out <dir>]';
const FLAGS = new Set(['--standalone', '--pdf', '--with-notes', '--force', '--out']);
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const outIndex = args.indexOf('--out');
const outArg = outIndex >= 0 ? args[outIndex + 1] : null;
const deckArg = args.find((arg, index) => !arg.startsWith('--') && (outIndex < 0 || index !== outIndex + 1));
const wantStandalone = !flag('--pdf') || flag('--standalone');
const wantPdf = !flag('--standalone') || flag('--pdf');
const badArgs = args.filter((arg) => arg.startsWith('--') && !FLAGS.has(arg));
if (outIndex >= 0 && (!outArg || outArg.startsWith('--'))) badArgs.push('--out에 폴더가 없다');

// 외부 URL·data:·#fragment·JS 템플릿은 건드리지 않는다
const isLocalRef = (ref) => ref && !/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(ref) && !ref.includes('${');

async function inlineAssets(source, root) {
  const warnings = [];
  const cache = new Map();
  async function toDataUri(ref) {
    let path;
    try {
      path = resolve(root, decodeURIComponent(ref.replace(/[?#].*$/, '')));
    } catch {
      path = resolve(root, ref);
    }
    if (!cache.has(path)) {
      try {
        const data = await readFile(path);
        cache.set(path, `data:${MIME[extname(path).toLowerCase()] || 'application/octet-stream'};base64,${data.toString('base64')}`);
      } catch {
        cache.set(path, null);
        warnings.push(`자산 없음: ${ref} — 원본 경로를 유지한다`);
      }
    }
    return cache.get(path);
  }
  async function replaceAsync(text, pattern, build) {
    const parts = [];
    let last = 0;
    for (const match of text.matchAll(pattern)) {
      parts.push(text.slice(last, match.index), await build(match));
      last = match.index + match[0].length;
    }
    return parts.join('') + text.slice(last);
  }
  const inlineUrls = (css) => replaceAsync(css, /url\(\s*(['"]?)([^)'"]+)\1\s*\)/g, async (match) => {
    const [whole, , ref] = match;
    const uri = isLocalRef(ref.trim()) && await toDataUri(ref.trim());
    return uri ? `url("${uri}")` : whole;
  });
  // 실제 태그 안의 속성만 바꾼다. 코드 블록의 예시(&lt;img src=…&gt;)와 JS 문자열 조립은 건드리지 않는다
  let output = await replaceAsync(source, /<([a-z][a-z0-9-]*)\b[^<>]*>/gi, async ([tag, name]) => {
    const hrefTag = /^(?:link|image)$/i.test(name);
    return replaceAsync(tag, /(\s)(src|poster|srcset|href|xlink:href|style)=(["'])([\s\S]*?)\3/gi, async (match) => {
      const [whole, space, attr, quote, value] = match;
      const key = attr.toLowerCase();
      let next = value;
      if (key === 'style') next = await inlineUrls(value);
      else if (key === 'srcset') {
        if (value.includes('data:')) return whole;
        const entries = await Promise.all(value.split(',').map(async (entry) => {
          const [ref, ...descriptor] = entry.trim().split(/\s+/);
          const uri = isLocalRef(ref) && await toDataUri(ref);
          return [uri || ref, ...descriptor].join(' ');
        }));
        next = entries.join(', ');
      } else if (key === 'src' || key === 'poster' || hrefTag) {
        next = (isLocalRef(value) && await toDataUri(value)) || value;
      }
      return next === value ? whole : `${space}${attr}=${quote}${next}${quote}`;
    });
  });
  // CSS url()은 <style> 블록 안에서만 바꾼다
  output = await replaceAsync(output, /(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi, async ([, open, css, close]) =>
    `${open}${await inlineUrls(css)}${close}`);
  return { output, warnings, inlined: [...cache.values()].filter(Boolean).length };
}

function printOverride(withNotes) {
  return `
<style id="yowu-export-print">
  @page { size: ${PAGE.width}px ${PAGE.height}px; margin: 0; }
  @media print {
    /* 정본 인쇄 규칙의 흰 바탕을 덱 토큰으로 되돌린다 — 다크 덱이 흰 바탕에 흰 글씨가 된다 */
    html, body {
      background: var(--bg) !important; color: var(--text-primary) !important;
      -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
    }
    .stagebg { display: block !important; }
    .deck { position: static !important; }
    .slide {
      width: ${PAGE.width}px !important; min-height: ${PAGE.height}px !important;
      height: ${withNotes ? 'auto' : `${PAGE.height}px`} !important;
      overflow: ${withNotes ? 'visible' : 'hidden'} !important;
      display: flex !important; justify-content: center !important;
      break-after: page; page-break-after: always;
    }
    .slide:last-child { break-after: auto; page-break-after: auto; }
    ${withNotes ? '' : 'aside.slide-notes { display: none !important; }'}
    .hud, .fs-btn, .notes-btn, .presenter-view, .lightbox { display: none !important; }
  }
</style>
`;
}

async function exportPdf(deck, source, pdfPath, withNotes) {
  if (typeof WebSocket === 'undefined') {
    throw new Error('PDF 내보내기는 내장 WebSocket을 제공하는 Node.js 22 이상이 필요합니다.');
  }
  if (!source.includes('</head>')) throw new Error('</head>가 없어 인쇄 CSS를 넣지 못했습니다.');
  // 원본을 오염시키지 않도록 같은 폴더의 임시본에 인쇄 CSS를 얹는다 (상대 경로 자산 유지)
  const printPath = join(dirname(deck), `.${basename(deck, '.html')}.print.html`);
  let chrome;
  try {
    await writeFile(printPath, source.replace('</head>', `${printOverride(withNotes)}</head>`));
    chrome = await launchChrome();
    const { cdp } = chrome;
    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
    await cdp.send('Page.enable', {}, sessionId);
    await cdp.send('Page.navigate', { url: pathToFileURL(printPath).href }, sessionId);
    const evaluate = async (expression) => (await cdp.send('Runtime.evaluate', {
      expression, awaitPromise: true, returnByValue: true,
    }, sessionId)).result?.value;
    const started = Date.now();
    while (await evaluate(`document.readyState`) !== 'complete') {
      if (Date.now() - started > 20000) throw new Error('덱 로드 시간 초과');
      await sleep(100);
    }
    // Mermaid·차트는 deck:change에서 지연 렌더된다 — 전 슬라이드를 한 번씩 거쳐 깨운다
    await evaluate(`(async () => {
      const count = document.querySelectorAll('.slide').length;
      if (typeof window.__deckGo === 'function') {
        for (let i = 0; i < count; i += 1) { window.__deckGo(i); await new Promise((r) => setTimeout(r, 30)); }
        window.__deckGo(0);
      }
      const until = Date.now() + 6000;
      while (Date.now() < until && Array.from(document.querySelectorAll('pre.mermaid')).some((n) => !n.querySelector('svg'))) {
        await new Promise((r) => setTimeout(r, 100));
      }
      await document.fonts.ready;
      return true;
    })()`);
    const slideCount = await evaluate(`document.querySelectorAll('.slide').length`);
    // 용지를 덱 크기로 넘긴다. 기본 Letter(816px 폭)로 두면 인쇄 미디어 쿼리가 816px로 평가돼
    // 모바일 폴백(max-width: 820px)이 잡히고 다열 배치가 1열로 접힌다
    const { data } = await cdp.send('Page.printToPDF', {
      paperWidth: PAGE.width / 96,
      paperHeight: PAGE.height / 96,
      marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0,
      printBackground: true,
      displayHeaderFooter: false,
      preferCSSPageSize: true,
    }, sessionId, 120000);
    const pdf = Buffer.from(data, 'base64');
    await writeFile(pdfPath, pdf);
    const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page\b/g) || []).length;
    return { pages, slideCount, bytes: pdf.length };
  } finally {
    await chrome?.close();
    await rm(printPath, { force: true });
  }
}

const mb = (bytes) => `${(bytes / 1048576).toFixed(1)}MB`;

async function main() {
  if (!deckArg || badArgs.length) {
    if (badArgs.length) console.error(`잘못된 인자: ${badArgs.join(', ')}`);
    console.error(USAGE);
    process.exitCode = 2;
    return;
  }
  const outDir = outArg ? resolve(outArg) : null;
  const deck = isAbsolute(deckArg) ? deckArg : resolve(process.cwd(), deckArg);
  await access(deck, constants.R_OK);
  const source = await readFile(deck, 'utf8');
  if (outDir) await mkdir(outDir, { recursive: true });
  const base = join(outDir || dirname(deck), basename(deck, '.html'));
  let failed = false;

  if (wantStandalone) {
    const { output, warnings, inlined } = await inlineAssets(source, dirname(deck));
    warnings.forEach((warning) => console.warn(`! ${warning}`));
    const size = Buffer.byteLength(output);
    if (size > FAIL_BYTES && !flag('--force')) {
      console.error(`FAIL 단일 HTML ${mb(size)} — 상한 ${mb(FAIL_BYTES)} 초과. 자산을 줄이거나 --force로 넘긴다.`);
      failed = true;
    } else {
      await writeFile(`${base}.standalone.html`, output);
      console.log(`단일 HTML: ${base}.standalone.html (자산 ${inlined}개, ${mb(size)})`);
      if (size > WARN_BYTES) console.warn(`! ${mb(WARN_BYTES)} 초과 — 메일 첨부 한도에 걸릴 수 있다`);
    }
  }

  if (wantPdf) {
    try {
      const withNotes = flag('--with-notes');
      const { pages, slideCount, bytes } = await exportPdf(deck, source, `${base}.pdf`, withNotes);
      console.log(`PDF: ${base}.pdf (${pages}면, 슬라이드 ${slideCount}장, ${mb(bytes)})`);
      // 정본 @media print(fluid-responsive 모듈)가 없으면 활성 슬라이드 한 장만 찍힌다
      if (withNotes ? pages < slideCount : pages !== slideCount) {
        console.error(`FAIL PDF 면 수(${pages})가 슬라이드 수(${slideCount})와 맞지 않는다 — 덱에 정본 @media print 규칙이 있는지 확인한다`);
        failed = true;
      }
    } catch (error) {
      // 단일 HTML은 이미 만들어졌다 — PDF 실패가 그것을 막지 않는다
      console.error(`FAIL PDF: ${error.message}`);
      failed = true;
    }
  }
  if (failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`ERROR ${error.stack || error.message}`);
  process.exitCode = 2;
});
