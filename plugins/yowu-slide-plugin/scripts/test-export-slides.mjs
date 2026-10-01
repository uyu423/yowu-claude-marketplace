#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { access, copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const exporter = join(scriptDir, 'export-slides.mjs');
const validator = join(scriptDir, 'validate-slides.mjs');
const baseFixture = join(scriptDir, 'fixtures/components.html');
const codeSample = '&lt;img src="assets/mark.svg"&gt; .x { background: url(assets/mark.svg) }';
const mark = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="12" cy="12" r="10" fill="#4af"/></svg>';

function run(script, args, env = process.env) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(process.execPath, [script, ...args], { stdio: ['ignore', 'pipe', 'pipe'], env });
    let output = '';
    child.stdout.on('data', (chunk) => { output += chunk; });
    child.stderr.on('data', (chunk) => { output += chunk; });
    child.once('error', rejectRun);
    child.once('exit', (code) => resolveRun({ code, output }));
  });
}

function fail(message, output) {
  if (output) console.error(output);
  throw new Error(message);
}

const work = await mkdtemp(join(tmpdir(), 'yowu-slide-export-'));
try {
  // 다크 덱(components.html)에 로컬 자산을 네 방식으로 붙인다: <img src>, srcset, style 속성, <style>의 url()
  // 코드 블록의 예시 마크업은 덱 본문이므로 그대로 남아야 한다
  // fold-probe: 인쇄 미디어 쿼리가 1600px가 아니라 기본 Letter 폭(816px)으로 평가되면 마지막 슬라이드가 사라진다
  const deckDir = join(work, 'deck');
  await mkdir(join(deckDir, 'assets'), { recursive: true });
  await writeFile(join(deckDir, 'assets/mark.svg'), mark);
  const source = (await readFile(baseFixture, 'utf8'))
    .replace('</head>', `<style>
  .stagebg { background-image: url('assets/mark.svg'); }
  @media print and (max-width: 820px) { .slide:last-of-type { display: none !important; } }
</style>
</head>`)
    .replace(/(<section class="slide[^"]*"[^>]*>)/, `$1<img src="assets/mark.svg" alt="" style="position:absolute;top:8px;right:8px;width:24px">
<img srcset="assets/mark.svg 1x" alt="" style="position:absolute;top:8px;right:40px;width:24px">
<i style="position:absolute;top:8px;right:72px;width:24px;height:24px;background:url('assets/mark.svg')"></i>
<pre style="display:none"><code>${codeSample}</code></pre>`);
  const deck = join(deckDir, 'deck.html');
  await writeFile(deck, source);
  const slideCount = (source.match(/<section[^>]*class="slide[\s"]/g) || []).length;

  const result = await run(exporter, [deck]);
  if (result.code !== 0) fail(`내보내기가 실패했습니다 (exit=${result.code})`, result.output);

  // 단일 HTML: 상대 경로가 남지 않고, data URI가 원본 바이트와 같다
  const standalone = await readFile(join(deckDir, 'deck.standalone.html'), 'utf8');
  const expected = `data:image/svg+xml;base64,${Buffer.from(mark).toString('base64')}`;
  if (!standalone.includes(codeSample)) fail('코드 블록 속 예시 마크업까지 바뀌었습니다');
  if (standalone.replace(codeSample, '').includes('assets/mark.svg')) fail('단일 HTML에 assets/ 경로가 남았습니다');
  if (standalone.split(expected).length - 1 !== 4) fail('src·srcset·style 속성·<style> url() 네 곳이 모두 인라인되지 않았습니다');

  // 자산 폴더가 없는 곳으로 옮겨도 렌더 검증을 통과한다
  const isolated = join(work, 'isolated');
  await mkdir(isolated);
  await copyFile(join(deckDir, 'deck.standalone.html'), join(isolated, 'deck.html'));
  const validation = await run(validator, [join(isolated, 'deck.html')]);
  if (validation.code !== 0) fail(`격리한 단일 HTML이 렌더 검증에 실패했습니다 (exit=${validation.code})`, validation.output);

  // PDF: 면 수 = 슬라이드 수(fold-probe 포함), MediaBox 16:9, 원본 무오염
  const pdf = (await readFile(join(deckDir, 'deck.pdf'))).toString('latin1');
  const pages = (pdf.match(/\/Type\s*\/Page\b/g) || []).length;
  if (pages !== slideCount) fail(`PDF 면 수 ${pages} ≠ 슬라이드 수 ${slideCount} — 인쇄가 Letter 폭으로 평가됐을 수 있습니다`);
  const box = pdf.match(/\/MediaBox\s*\[\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\]/);
  const ratio = box ? (box[3] - box[1]) / (box[4] - box[2]) : 0;
  if (Math.abs(ratio - 16 / 9) > 0.01) fail(`PDF 비율 ${ratio.toFixed(3)}이 16:9가 아닙니다`);
  if (await readFile(deck, 'utf8') !== source) fail('원본 덱이 바뀌었습니다');
  if (await access(join(deckDir, '.deck.print.html')).then(() => true, () => false)) fail('인쇄용 임시본이 남았습니다');

  // Chrome이 뜨지 못해도 단일 HTML은 만들어지고, 종료 코드 1, 임시본은 지워진다
  await rm(join(deckDir, 'deck.standalone.html'));
  const broken = await run(exporter, [deck], { ...process.env, SLIDE_CHROME: '/usr/bin/false' });
  if (broken.code !== 1 || !broken.output.includes('FAIL PDF')) fail(`Chrome 실패를 보고하지 않았습니다 (exit=${broken.code})`, broken.output);
  if (!await access(join(deckDir, 'deck.standalone.html')).then(() => true, () => false)) fail('PDF 실패가 단일 HTML 생성을 막았습니다');
  if (await access(join(deckDir, '.deck.print.html')).then(() => true, () => false)) fail('Chrome 실패 뒤 인쇄용 임시본이 남았습니다');

  console.log(`PASS export self-test: standalone inlined (src·srcset·style·<style>, code sample kept) + isolated render OK; PDF ${pages} pages 16:9; Chrome failure isolated`);
} finally {
  await rm(work, { recursive: true, force: true });
}
