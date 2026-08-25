#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const validator = join(scriptDir, 'validate-slides.mjs');
const validFixture = join(scriptDir, 'fixtures/long-svg.html');
const invalidFixture = join(scriptDir, 'fixtures/invalid-long-svg.html');
const invalidMobileFixture = join(scriptDir, 'fixtures/invalid-mobile-overflow.html');
const presenterFixture = join(scriptDir, 'fixtures/presenter.html');
const invalidPresenterFixture = join(scriptDir, 'fixtures/invalid-presenter.html');
const componentsFixture = join(scriptDir, 'fixtures/components.html');
const componentsLightFixture = join(scriptDir, 'fixtures/components-light.html');
const invalidNotesFixture = join(scriptDir, 'fixtures/invalid-notes.html');

function run(args) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(process.execPath, [validator, ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.once('error', rejectRun);
    child.once('exit', (code) => resolveRun({ code, output: stdout + stderr }));
  });
}

const valid = await run([validFixture]);
if (valid.code !== 0) {
  console.error(valid.output);
  throw new Error(`정상 fixture가 실패했습니다 (exit=${valid.code})`);
}

const invalid = await run(['--static-only', invalidFixture]);
if (invalid.code !== 1 || !invalid.output.includes('pathLength="1" 누락')) {
  console.error(invalid.output);
  throw new Error(`잘못된 fixture를 잡지 못했습니다 (exit=${invalid.code})`);
}

const invalidMobile = await run([invalidMobileFixture]);
if (invalidMobile.code !== 1 || !invalidMobile.output.includes('mobile-390x844') || !invalidMobile.output.includes('직접 자식: div.badge-row')) {
  console.error(invalidMobile.output);
  throw new Error(`모바일 overflow fixture를 잡지 못했습니다 (exit=${invalidMobile.code})`);
}

const presenter = await run([presenterFixture]);
if (presenter.code !== 0) {
  console.error(presenter.output);
  throw new Error(`발표자 창 정상 fixture가 실패했습니다 (exit=${presenter.code})`);
}

const invalidPresenter = await run([invalidPresenterFixture]);
const presenterChecks = [
  '발표자 브리지 토큰 __presenterOpen 누락',
  'aria-hidden 잔존',
  '#pvCount 동기화 실패',
];
const missed = presenterChecks.filter((needle) => !invalidPresenter.output.includes(needle));
if (invalidPresenter.code !== 1 || missed.length) {
  console.error(invalidPresenter.output);
  throw new Error(`발표자 창 결함 fixture를 잡지 못했습니다 (exit=${invalidPresenter.code}, 놓친 검사: ${missed.join(', ') || '없음'})`);
}

const components = await run([componentsFixture, componentsLightFixture]);
if (components.code !== 0) {
  console.error(components.output);
  throw new Error(`components-ext fixture가 실패했습니다 (exit=${components.code})`);
}

const invalidNotes = await run(['--static-only', invalidNotesFixture]);
const noteChecks = ['M9 노트 커버리지', "M10 노트 1에 '소요 시간' 항목 없음", 'M11 구간 라벨'];
const missedNotes = noteChecks.filter((needle) => !invalidNotes.output.includes(needle));
if (invalidNotes.code !== 1 || missedNotes.length) {
  console.error(invalidNotes.output);
  throw new Error(`노트·구간 라벨 결함을 잡지 못했습니다 (exit=${invalidNotes.code}, 놓친 검사: ${missedNotes.join(', ') || '없음'})`);
}

console.log('PASS validator self-test: valid deck + components-ext accepted; long SVG / mobile overflow / presenter bridge / notes rejected');
