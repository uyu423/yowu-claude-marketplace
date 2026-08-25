#!/usr/bin/env node
/* 발표자 창 동기화 통합 테스트.
   validate-slides.mjs의 ?presenter 검사는 한 창에서 sync 메시지를 자기 자신에게 주입해 렌더 경로만 본다.
   여기서는 덱과 별창을 실제로 두 개 띄워 opener 경로·하트비트 재연결·타이머를 확인한다.
   덱을 새로고침하면 덱은 별창 참조를 잃으므로, 별창의 hello ping이 없으면 조용히 끊긴다 — 그 회귀를 잡는 것이 목적이다.

   usage: node test-presenter-sync.mjs <deck.html> [...]
   env:   SLIDE_CHROME=/path/to/chrome */

import { spawn } from 'node:child_process';
import { access, mkdtemp } from 'node:fs/promises';
import { constants } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, delimiter, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const files = process.argv.slice(2);
if (!files.length) {
  files.push(join(scriptDir, 'fixtures/presenter.html'));
  files.push(join(scriptDir, '../skills/yowu-create-slides/assets/example-dark.html'));
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function isExecutable(path) {
  try { await access(path, constants.X_OK); return true; } catch { return false; }
}

async function findChrome() {
  const names = process.platform === 'win32'
    ? ['chrome.exe', 'msedge.exe']
    : ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser'];
  const candidates = [
    process.env.SLIDE_CHROME,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean);
  for (const dir of (process.env.PATH || '').split(delimiter)) {
    for (const name of names) candidates.push(join(dir, name));
  }
  for (const candidate of candidates) if (await isExecutable(candidate)) return candidate;
  throw new Error('Chrome/Chromium을 찾지 못했습니다. SLIDE_CHROME으로 경로를 지정하세요.');
}

class CdpClient {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (!message.id || !this.pending.has(message.id)) return;
      const { resolve, reject, timer } = this.pending.get(message.id);
      this.pending.delete(message.id);
      clearTimeout(timer);
      message.error ? reject(new Error(message.error.message)) : resolve(message.result);
    });
  }
  send(method, params = {}, sessionId) {
    const id = this.nextId++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP ${method} 시간 초과`)); }, 15000);
      this.pending.set(id, { resolve, reject, timer });
      this.socket.send(JSON.stringify(payload));
    });
  }
}

async function launchChrome() {
  const executable = await findChrome();
  const userDataDir = await mkdtemp(join(tmpdir(), 'yowu-presenter-sync-'));
  const child = spawn(executable, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--disable-popup-blocking',            // 별창은 사용자 제스처 없이 열린다
    '--remote-debugging-port=0', `--user-data-dir=${userDataDir}`, 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  const wsUrl = await new Promise((resolve, reject) => {
    let stderr = '';
    const timer = setTimeout(() => reject(new Error(`Chrome 시작 시간 초과\n${stderr}`)), 15000);
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
      const match = /ws:\/\/[^\s]+/.exec(stderr);
      if (match) { clearTimeout(timer); resolve(match[0]); }
    });
  });
  const socket = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', () => reject(new Error('DevTools 연결 실패')), { once: true });
  });
  return { cdp: new CdpClient(socket), close: () => child.kill() };
}

async function auditDeck(cdp, file, failures) {
  const label = basename(file);
  const check = (name, ok, detail = '') => {
    console.log(`  ${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : ` — ${detail}`}`);
    if (!ok) failures.push(`${label}: ${name}${detail ? ` (${detail})` : ''}`);
  };
  const evaluate = async (sessionId, expression) => {
    const response = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId);
    if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description || 'evaluate 실패');
    return response.result?.value;
  };
  const pad = (n) => (n < 10 ? '0' : '') + n;

  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId: deck } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  await cdp.send('Page.enable', {}, deck);
  await cdp.send('Runtime.enable', {}, deck);
  await cdp.send('Page.navigate', { url: pathToFileURL(file).href }, deck);
  await sleep(1200);

  const count = await evaluate(deck, `document.querySelectorAll('.slide').length`);
  if (count < 4) { console.log(`  SKIP ${label}: 슬라이드 4장 미만`); return failures; }

  check('__openPresenter()가 성공을 boolean으로 알린다', (await evaluate(deck, `window.__openPresenter()`)) === true);

  let presenter = null;
  for (let i = 0; i < 20 && !presenter; i += 1) {
    await sleep(200);
    const { targetInfos } = await cdp.send('Target.getTargets');
    presenter = targetInfos.find((t) => t.type === 'page'
      && t.url.includes(encodeURI(basename(file)))
      && /[?&]presenter/.test(t.url));
  }
  check('발표자 별창이 열린다', Boolean(presenter), '새 target 없음');
  if (!presenter) return failures;

  const { sessionId: view } = await cdp.send('Target.attachToTarget', { targetId: presenter.targetId, flatten: true });
  await cdp.send('Runtime.enable', {}, view);
  await sleep(800);
  const pvCount = () => evaluate(view, `document.getElementById('pvCount').textContent.trim()`);

  check('별창이 덱의 현재 인덱스를 받는다', (await pvCount()) === `01 / ${pad(count)}`, await pvCount());
  check('aria-hidden이 제거된다', await evaluate(view, `!document.querySelector('.presenter-view').hasAttribute('aria-hidden')`));
  check('대본이 렌더된다', Boolean((await evaluate(view, `document.getElementById('pvNotes').textContent`) || '').trim()));

  await evaluate(deck, `window.__deckGo(2); true`);
  await sleep(500);
  check('덱을 넘기면 별창이 따라온다', (await pvCount()) === `03 / ${pad(count)}`, await pvCount());

  await evaluate(view, `window.opener.postMessage({ type: 'yowu-deck-nav', action: 'next' }, '*'); true`);
  await sleep(500);
  check('별창에서 넘기면 덱이 따라온다', (await evaluate(deck, `window.__deckCur()`)) === 3);

  await evaluate(view, `const n = document.getElementById('pvNotes');
    n.style.height = '40px';
    n.insertAdjacentHTML('beforeend', '<p data-probe style="height:400px"></p>');   // 다시 그리면 사라진다
    n.scrollTop = 30; true`);
  await sleep(2600);   // hello ping 최소 1회
  const scrollTop = await evaluate(view, `document.getElementById('pvNotes').scrollTop`);
  check('ping이 반복돼도 노트 스크롤이 유지된다', scrollTop === 30, `scrollTop=${scrollTop}`);

  // 핵심: 덱을 새로고침하면 덱은 별창 참조를 잃는다. 별창의 hello가 이를 복구해야 한다.
  await cdp.send('Page.reload', {}, deck);
  await sleep(1500);
  await evaluate(deck, `window.__deckGo(1); true`);
  await sleep(3500);
  check('덱을 새로고침해도 별창이 스스로 다시 붙는다', (await pvCount()) === `02 / ${pad(count)}`, await pvCount());
  check('연결 상태 표시가 정상으로 돌아온다',
    (await evaluate(view, `document.getElementById('pvLink').textContent`)).includes('연결됨'),
    await evaluate(view, `document.getElementById('pvLink').textContent`));

  const timerText = () => evaluate(view, `document.getElementById('pvTimer').textContent`);
  await evaluate(view, `document.dispatchEvent(new KeyboardEvent('keydown', { key: 's' })); true`);
  const stoppedAt = await timerText();
  await sleep(2200);
  const stillStopped = await timerText();
  check('S 키로 타이머가 멈춘다', stoppedAt === stillStopped, `${stoppedAt} → ${stillStopped}`);
  check('정지 상태가 시각적으로 표시된다', await evaluate(view, `document.getElementById('pvTimer').classList.contains('paused')`));
  await evaluate(view, `document.dispatchEvent(new KeyboardEvent('keydown', { key: 's' })); true`);
  await sleep(2200);
  const resumed = await timerText();
  check('S 키로 다시 흐른다', resumed !== stillStopped, `${stillStopped} → ${resumed}`);

  await evaluate(deck, `window.__closePresenter(); true`);
  await sleep(400);
  check('__presenterOpen()이 닫힘을 반영한다', (await evaluate(deck, `window.__presenterOpen()`)) === false);

  await cdp.send('Target.closeTarget', { targetId });
  return;
}

if (typeof WebSocket === 'undefined') {
  console.error('ERROR 이 테스트는 내장 WebSocket을 제공하는 Node.js 22 이상이 필요합니다.');
  process.exit(2);
}

const chrome = await launchChrome();
const allFailures = [];
try {
  for (const file of files) {
    console.log(basename(file));
    try {
      await auditDeck(chrome.cdp, file, allFailures);
    } catch (error) {
      // 구버전 덱은 브리지 함수 자체가 없어 중간에 던진다 — 그것도 실패로 기록하고 다음 덱으로 간다
      console.log(`  FAIL 검사 중 예외 — ${error.message}`);
      allFailures.push(`${basename(file)}: 검사 중 예외 — ${error.message}`);
    }
  }
} finally {
  chrome.close();
}

if (allFailures.length) {
  console.error(`\n${allFailures.length} presenter sync issue(s):`);
  allFailures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`\nPASS presenter sync: ${files.length} deck(s)`);
}
