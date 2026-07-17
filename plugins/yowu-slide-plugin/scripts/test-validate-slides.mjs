#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const validator = join(scriptDir, 'validate-slides.mjs');
const validFixture = join(scriptDir, 'fixtures/long-svg.html');
const invalidFixture = join(scriptDir, 'fixtures/invalid-long-svg.html');
const invalidMobileFixture = join(scriptDir, 'fixtures/invalid-mobile-overflow.html');

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

console.log('PASS validator self-test: valid deck accepted, broken long SVG and mobile overflow rejected');
