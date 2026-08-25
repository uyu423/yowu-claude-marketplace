# Presentation Design System v3 — Deck Engine (정본)

> **이 문서는 v3 `deck` 엔진의 유일 정본(canonical source)이다.**
> 슬라이드 라이브러리(reveal.js 등) 없이, 단일 HTML 파일 안에서 `position:absolute + .on` 페이지 넘김 방식으로
> 상용 프레젠테이션 SW급 인터랙티브 덱을 구현한다. 프로덕션급 상태 모델·엣지케이스 방어를 코드화했다.
>
> **생성 규칙**: SKILL.md는 이 문서의 각 `MODULE` 블록을 **그대로 복사해 인라인 삽입**한다. 코드를 재발명하지 않는다.
> `assets/example-{dark,light}.html`은 이 정본으로부터 생성된 골든 참조 산출물이다(정본 아님).
>
> **모듈 경계**: 각 모듈은 `<!-- MODULE: name (baseline|feature) -->` ~ `<!-- /MODULE -->`로 구획된다.
> - **baseline** = 모든 덱에 항상 삽입 (core, fluid, nav-hud, reveal, notes, presenter, components, components-ext)
> - **feature** = SKILL.md Capability Planning 판단에 따라 조건부 삽입 (sequencer, svg-drawing, lightbox, video, dataviz, lottie)
> - feature 모듈은 해당 콘텐츠 신호가 없으면 삽입하지 않는다(파일 크기 최적화).
>
> **핵심 불변식(절대 훼손 금지)**:
> 1. `.on` 단일 클래스가 활성 슬라이드의 유일 진실원. CSS·시퀀서·비디오·라이트박스·발표자보기가 모두 이를 구독.
> 2. 슬라이드 전환은 `gen` 세대 토큰으로 이전 타이머를 무효화(경쟁 상태 차단).
> 3. 시작은 **더블 rAF** 후 `go()` 호출 — 즉시 호출하면 드로잉 transition이 발화하지 않는다.
> 4. 페이지 총수는 `slides.length`로 런타임 자동 계산 — 하드코딩 금지.
> 5. `?presenter` 판정은 첫 페인트 전 `<head>` 최상단 스크립트로 — FOUC 방지.
> 6. SVG 드로잉 선은 `pathLength="1"`로 정규화하고, Mermaid는 활성 슬라이드에서만 지연 렌더한다.

---

## 0. 사용 원칙

1. 이 문서는 **자체 디자인 시스템(심플)** 및 **frontend-design** 경로 모두의 **엔진 기반**이다.
   frontend-design 선택 시에도 §3~§8, §10~§15의 **엔진/인터랙션 모듈은 그대로 사용**하고,
   색·그라디언트·질감만 frontend-design 지침으로 덮어쓴다. (레이아웃 골격·JS는 본 정본 우선)
2. 색상은 §1 테마 토큰을 기준으로 하고, 컴포넌트는 `var(--*)` 변수만 참조한다(하드코딩 금지).
3. 폰트는 나눔스퀘어 네오(본문) + 시스템 모노(kicker/HUD/타이머). 외부 폰트 CDN 불필요.

---

## 1. 테마 토큰 (CSS 변수)

deck 엔진은 기존 v2 토큰에 더해 `--bg-raise/--bg-card/--line/--line-soft/--mono/--hl`을 요구한다.

**악센트 3색에 의미를 배정한다.** "최대 3색"만 정하고 용도를 비워 두면 색이 장식으로 쓰인다. 색을 의미에 묶으면 청중이 색만 보고 정보의 종류를 안다.

| 토큰 | 배정 | 주로 쓰는 곳 |
|------|------|-------------|
| `--accent-1` | **실측·수치·분석** | 목록 점, `.stat-num`, `.why`, `.src` 라벨, HUD |
| `--accent-2` | **인용·문서·성과** | `q`, `.keep`, `.part-when`, 발표자 창 강조 |
| `--accent-3` | **위험·문제·예외** | `.risk`, `.chk.miss`, `.src.unverified`, `.tl-h .hot` |

주제에 따라 배정을 바꿔도 되지만, **한 덱 안에서는 끝까지 일관되게** 쓴다. 바꿀 때는 Step 1 컨펌 블록에 노출해 사용자가 알게 한다.

### 1.1 Dark Theme (기술 발표, 개발 주제)

```css
:root {
  /* Background — 3단 깊이 */
  --bg: #0a0e17;
  --bg-raise: #0f1523;
  --bg-card: #131a2b;
  --bg-gradient: linear-gradient(135deg, #0a0e17 0%, #141a2e 55%, #101830 100%);
  --surface: rgba(255, 255, 255, 0.04);
  --surface-hover: rgba(255, 255, 255, 0.07);

  /* Lines */
  --line: #1e2a3c;
  --line-soft: #16202f;
  --border: rgba(255, 255, 255, 0.09);
  --border-accent: rgba(255, 255, 255, 0.16);

  /* Text */
  --text-primary: #eaf0f9;
  --text-secondary: rgba(234, 240, 249, 0.72);
  --text-muted: rgba(234, 240, 249, 0.42);

  /* Accents — 최대 3색. --accent-1은 인터랙션/진행바 기준색 */
  --accent-1: #4da3ff;   /* blue  (하이라이트 기준) */
  --accent-2: #5de4c7;   /* mint  */
  --accent-3: #ff6b9d;   /* pink  */
  --hl: var(--accent-1);
  --accent-gradient: linear-gradient(135deg, var(--accent-1), var(--accent-2));

  /* Semantic */
  --ok: #5de4c7;
  --bad: #ff6b5b;
  --tag-bg: rgba(77, 163, 255, 0.15);
  --tag-color: #4da3ff;

  /* Fonts */
  --font-family: 'NanumSquareNeo', -apple-system, BlinkMacSystemFont, sans-serif;
  --mono: 'SF Mono', 'JetBrains Mono', 'Fira Code', ui-monospace, Menlo, monospace;

  --hljs-theme: github-dark;
  color-scheme: dark;
}
```

### 1.2 Light Theme (기획 제안, 비즈니스 주제)

```css
:root {
  --bg: #FAFAF8;
  --bg-raise: #FFFFFF;
  --bg-card: #FFFFFF;
  --bg-gradient: linear-gradient(135deg, #FDFDFB 0%, #F4F3EF 100%);
  --surface: #FFFFFF;
  --surface-hover: #F5F4F0;

  --line: #E7E5E0;
  --line-soft: #F0EEE9;
  --border: #EAE8E3;
  --border-accent: rgba(0, 0, 0, 0.12);

  --text-primary: #1A1A1A;
  --text-secondary: #4A4A48;
  --text-muted: #8A8A86;

  --accent-1: #5b5bd6;   /* indigo (하이라이트 기준) */
  --accent-2: #0a9d78;   /* green  */
  --accent-3: #d9772b;   /* orange */
  --hl: var(--accent-1);
  --accent-gradient: linear-gradient(135deg, var(--accent-1), var(--accent-2));

  --ok: #0a9d78;
  --bad: #d64545;
  --tag-bg: #EEEDFB;
  --tag-color: #5b5bd6;

  --font-family: 'NanumSquareNeo', -apple-system, BlinkMacSystemFont, sans-serif;
  --mono: 'SF Mono', 'JetBrains Mono', 'Fira Code', ui-monospace, Menlo, monospace;

  --hljs-theme: github;
  color-scheme: light;
}
```

> 테마는 `:root`에 둘 중 하나만 삽입한다. 다크/라이트 동시 전환이 필요하면 `body.theme-light` 스코프로 두 번째 세트를 감싼다.

---

## 2. 폰트 (@font-face 나눔스퀘어 네오)

```css
@font-face { font-family:'NanumSquareNeo'; src:url(https://hangeul.pstatic.net/hangeul_static/webfont/NanumSquareNeo/NanumSquareNeoTTF-aLt.woff2); font-weight:300; font-display:swap; }
@font-face { font-family:'NanumSquareNeo'; src:url(https://hangeul.pstatic.net/hangeul_static/webfont/NanumSquareNeo/NanumSquareNeoTTF-bRg.woff2); font-weight:400; font-display:swap; }
@font-face { font-family:'NanumSquareNeo'; src:url(https://hangeul.pstatic.net/hangeul_static/webfont/NanumSquareNeo/NanumSquareNeoTTF-cBd.woff2); font-weight:700; font-display:swap; }
@font-face { font-family:'NanumSquareNeo'; src:url(https://hangeul.pstatic.net/hangeul_static/webfont/NanumSquareNeo/NanumSquareNeoTTF-dEb.woff2); font-weight:800; font-display:swap; }
@font-face { font-family:'NanumSquareNeo'; src:url(https://hangeul.pstatic.net/hangeul_static/webfont/NanumSquareNeo/NanumSquareNeoTTF-eHv.woff2); font-weight:900; font-display:swap; }
```

폰트 로드 실패 시 `'Noto Sans KR', -apple-system, sans-serif` fallback(변수에 이미 포함). 모노 폰트는 시스템 스택이라 CDN 불필요.

---

## 3. MODULE: core (baseline) — deck/slide 골격 + 전환 엔진

deck의 심장. `.slide.on` 토글로 절대배치 슬라이드를 교차 전환한다.

<!-- MODULE: core-css (baseline) -->
```css
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { height: 100%; }
body {
  background: var(--bg);
  color: var(--text-primary);
  font-family: var(--font-family);
  font-size: 16px; line-height: 1.65;
  letter-spacing: -0.01em;
  -webkit-font-smoothing: antialiased;
  overflow: hidden;                 /* 페이지 넘김: 스크롤 차단 (모바일은 §4에서 해제) */
}

/* 배경 레이어 (선택적 장식) */
.stagebg { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
.stagebg::before {
  content: ''; position: absolute; inset: 0;
  background-image:
    linear-gradient(var(--line-soft) 1px, transparent 1px),
    linear-gradient(90deg, var(--line-soft) 1px, transparent 1px);
  background-size: 64px 64px;
  -webkit-mask-image: radial-gradient(ellipse 90% 70% at 50% 0%, rgba(0,0,0,.55), transparent 75%);
  mask-image: radial-gradient(ellipse 90% 70% at 50% 0%, rgba(0,0,0,.55), transparent 75%);
}

/* 슬라이드 골격 — 절대배치 교차 전환 */
.deck { position: fixed; inset: 0; z-index: 1; }
.slide {
  position: absolute; inset: 0;
  padding: 7vh 5vw 9vh;
  display: flex; flex-direction: column; justify-content: center;
  opacity: 0; visibility: hidden;
  transform: translateY(14px) scale(.992);
  transition: opacity .5s ease, transform .5s cubic-bezier(.22,1,.36,1), visibility 0s linear .5s;
  pointer-events: none;
}
.slide.on {
  opacity: 1; visibility: visible; transform: none;
  transition: opacity .5s ease, transform .5s cubic-bezier(.22,1,.36,1);
  pointer-events: auto;
}
.slide__inner, .inner { width: min(1160px, 100%); min-width: 0; margin: 0 auto; }
.slide svg, .slide img, .slide video, .slide canvas { max-width: 100%; }
/* 텍스트 위주 슬라이드는 더 좁게 */
.slide--content .slide__inner, .slide--quote .slide__inner { max-width: 820px; }
/* 2열(.split)·다이어그램처럼 폭이 필요한 본문 슬라이드는 .wide로 820px 제한을 푼다 */
.slide--content.wide .slide__inner, .slide--quote.wide .slide__inner { max-width: min(1160px, 100%); }

/* 슬라이드별 배경 변형 (선택) */
.slide--title   { background: var(--bg-gradient); }
.slide--closing { background: var(--bg-gradient); }
```
<!-- /MODULE -->

전환 엔진 JS. **body 끝, 다른 스크립트보다 먼저** 배치한다.

<!-- MODULE: core-js (baseline) -->
```html
<script>
/* ═══ deck 전환 엔진 ═══
   .on 단일 클래스로 슬라이드를 교차 전환. gen 세대 토큰으로 잔여 타이머 무효화.
   페이지 총수는 slides.length로 자동 계산(하드코딩 금지). window.__deckGo(i)로 외부 점프. */
(function () {
  'use strict';
  if (document.documentElement.classList.contains('presenter')) return; /* 발표자 창은 덱을 그리지 않음 */

  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var cur = -1, gen = 0, timers = [];
  function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  window.__deckLater = later;                 /* feature 모듈이 타이머를 공유 */
  window.__deckGen = function () { return gen; };

  var bar = document.getElementById('hudBar');
  var meta = document.getElementById('hudMeta');

  function go(i) {
    if (i < 0 || i >= slides.length || i === cur) return;
    gen++; clearTimers();
    if (cur >= 0) slides[cur].classList.remove('on');
    cur = i;
    var sl = slides[cur];
    sl.classList.add('on');
    var myGen = gen;
    /* 시퀀서 모듈이 있으면 [data-seq] 스테이지 가동 */
    if (window.__runStage) {
      Array.prototype.forEach.call(sl.querySelectorAll('[data-seq]'), function (st) { window.__runStage(st, myGen); });
    }
    if (bar)  bar.style.width = ((cur + 1) / slides.length * 100) + '%';
    if (meta) meta.textContent = pad(cur + 1) + ' / ' + pad(slides.length);
    if (history.replaceState) history.replaceState(null, '', '#' + (cur + 1));
    if (window.__deckSync) window.__deckSync(cur);   /* 발표자 창 동기화 */
    document.dispatchEvent(new CustomEvent('deck:change', { detail: { index: cur } }));
  }
  function next() { go(Math.min(cur + 1, slides.length - 1)); }
  function prev() { go(Math.max(cur - 1, 0)); }

  window.__deckGo = go;
  window.__deckNext = next;
  window.__deckPrev = prev;
  window.__deckSlides = slides;
  window.__deckCur = function () { return cur; };

  /* 시작: #n 딥링크 → 더블 rAF 후 진입 (첫 페인트 후여야 드로잉 transition이 발화) */
  var h = parseInt((location.hash || '').replace('#', ''), 10);
  var start = isNaN(h) ? 0 : Math.min(Math.max(h - 1, 0), slides.length - 1);
  requestAnimationFrame(function () { requestAnimationFrame(function () { go(start); }); });
})();
</script>
```
<!-- /MODULE -->

---

## 4. MODULE: fluid (baseline) — 유동 캔버스 + 반응형 + 인쇄

해상도 독립 16:9. `transform:scale` 없이 `vh/vw + 중첩 clamp/min`으로 요소가 화면에 유동한다.

<!-- MODULE: fluid-css (baseline) -->
```css
/* ── 유동 타이포 (vh 기준: 화면 높이에 비례해 16:9 유지) ── */
.kicker, .label {
  font-family: var(--mono);
  font-size: clamp(10px, 1.25vh, 13px);
  font-weight: 600; letter-spacing: .22em; text-transform: uppercase;
  color: var(--hl); display: inline-flex; align-items: center; gap: 12px;
  margin-bottom: 1.6vh;
}
.kicker::after, .label.rule::after {
  content: ''; width: 40px; border-top: 1px solid var(--border-accent);
}
h1, .deck-title {
  font-size: clamp(40px, min(11vh, 8vw), 104px);
  font-weight: 900; line-height: 1.08; letter-spacing: -0.035em;
  margin-bottom: 2vh;
}
h2, .sl-title {
  font-size: clamp(24px, 5vh, 46px);
  font-weight: 800; line-height: 1.16; letter-spacing: -0.03em;
  margin-bottom: 1.4vh;
}
h3 { font-size: clamp(16px, 2.4vh, 22px); font-weight: 700; margin-bottom: 1vh; }
.desc, .sl-desc {
  color: var(--text-secondary);
  font-size: clamp(14px, 1.9vh, 18px); line-height: 1.75;
  max-width: 900px; margin-bottom: 3vh;
}
.desc strong, .sl-desc strong { color: var(--text-primary); font-weight: 700; }
.footnote { margin-top: 2.4vh; font-size: clamp(11px, 1.5vh, 13.5px); color: var(--text-muted); }

/* gradient text 강조 */
.gradient-text {
  background: var(--accent-gradient);
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent;
}
h1 .em, h2 .em, .accent { color: var(--accent-1); }
.em2, .accent.c2 { color: var(--accent-2); }
.em3, .accent.c3 { color: var(--accent-3); }

/* ── 미디어 aspect-ratio 패턴: 확정 높이(vh) → aspect-ratio로 너비 결정 ── */
.media-frame {
  height: clamp(240px, 46vh, 600px);
  width: auto; max-width: 100%; align-self: center;
  border-radius: 16px; overflow: hidden;
  border: 1px solid var(--line); background: #000;
}
.media-frame.ratio-16-9 { aspect-ratio: 16 / 9; }
.media-frame.ratio-9-16 { aspect-ratio: 9 / 16; }
.media-frame.ratio-4-3  { aspect-ratio: 4 / 3; }
.media-frame video, .media-frame img { width: 100%; height: 100%; object-fit: contain; display: block; }
```
<!-- /MODULE -->

<!-- MODULE: fluid-responsive (baseline) -->
```css
/* ── 모바일: 페이지 넘김 → 세로 스크롤 폴백 (100dvh로 iOS 주소창 대응) ── */
@media (max-width: 820px) {
  body { overflow: auto; }
  .deck { position: static; }
  .slide {
    position: relative; inset: auto;
    opacity: 1 !important; visibility: visible !important; transform: none !important;
    min-height: 100dvh; height: auto;
    padding: 6vh 6vw 10vh;
    justify-content: flex-start; overflow-y: visible; pointer-events: auto;
    border-top: 1px solid var(--line-soft);
  }
  .slide__inner, .inner { width: 100%; min-width: 0; overflow-wrap: anywhere; }
  pre { max-width: 100%; overflow-x: auto; }
  .slide .rv, .slide .rvx { opacity: 1 !important; transform: none !important; animation: none !important; }
  .card-grid, .stat-row, .comparison, .workflow-grid, .flow-container, .code-cmp,
  .split, .split-2, .tri, .shot-row, .part { grid-template-columns: 1fr !important; flex-direction: column; }
  /* 수평 타임라인은 grid-auto-flow라 위 규칙으로 안 접힌다 — 세로 목록으로 폴백하고 선·점을 숨긴다 */
  .tl-h { grid-auto-flow: row !important; padding-top: 0; gap: 14px; }
  .tl-h::before, .tl-h .n::before { display: none; }
  .tl-h .d { margin-bottom: 4px; }
  .part-num { font-size: clamp(48px, 12vh, 88px); }
  .hud .nav { display: none; }              /* 모바일은 스크롤로 이동 */
}

/* ── 인쇄/PDF: 전 슬라이드 세로 나열 + 모든 모션 완료 강제 ── */
@media print {
  body { overflow: visible; background: #fff; color: #111; }
  .stagebg, .slashbg, .hud, .lightbox, .lb-close, .lb-hint, .notes-btn { display: none !important; }
  .deck { position: static; }
  .slide {
    position: relative; inset: auto; height: auto; min-height: 100vh;
    opacity: 1 !important; visibility: visible !important; transform: none !important;
    page-break-after: always; pointer-events: auto;
  }
  .rv, .rvx { opacity: 1 !important; transform: none !important; animation: none !important; }
  .fc .nd { opacity: 1 !important; } .fc .eg { stroke-dashoffset: 0 !important; opacity: 1 !important; }
  [data-step] { opacity: 1 !important; transform: none !important; }
  .md-plot .fill, .md-plot .ghost { animation: none !important; opacity: 1 !important; width: var(--w) !important; }
  aside.slide-notes { display: block !important; page-break-inside: avoid; }
}
```
<!-- /MODULE -->

---

## 5. MODULE: nav-hud (baseline) — HUD + 네비게이션

진행바·페이지 인디케이터·이전/다음 버튼 + 키보드/터치/클릭/전체화면 입력.

> **주의**: HUD는 CSS 클래스(`.bar`/`.meta`)와 JS용 id(`#hudBar`/`#hudMeta`)를 **둘 다** 가진다.

<!-- MODULE: nav-hud-css (baseline) -->
```css
.hud { position: fixed; inset: auto 0 0 0; z-index: 30; pointer-events: none; }
.hud .bar {
  position: absolute; left: 0; bottom: 0; height: 3px; width: 0%;
  background: linear-gradient(90deg, var(--accent-1), var(--accent-2));
  transition: width .4s ease;
}
.hud .meta {
  position: absolute; left: 24px; bottom: 14px;
  font-family: var(--mono); font-size: 11.5px; letter-spacing: .12em; color: var(--text-muted);
}
.hud .nav { position: absolute; right: 20px; bottom: 10px; display: flex; gap: 6px; pointer-events: auto; }
.hud .nav button {
  width: 38px; height: 38px; border-radius: 10px;
  border: 1px solid var(--border-accent); background: var(--surface);
  color: var(--text-secondary); font-size: 17px; line-height: 1; cursor: pointer;
  -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
  transition: color .2s, border-color .2s; display: flex; align-items: center; justify-content: center;
}
.hud .nav button:hover { color: var(--text-primary); border-color: var(--accent-1); }

/* 전체화면 버튼 (좌하단) */
.fs-btn {
  position: fixed; bottom: 14px; left: 96px; z-index: 31;
  width: 34px; height: 34px; border-radius: 9px;
  background: var(--surface); border: 1px solid var(--border-accent);
  color: var(--text-secondary); font-size: 15px; line-height: 1; cursor: pointer;
  -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center;
  transition: color .2s, border-color .2s;
}
.fs-btn:hover { color: var(--text-primary); border-color: var(--accent-1); }
@media print { .fs-btn { display: none; } }
```
<!-- /MODULE -->

HUD 마크업 — `<body>` 시작 직후 삽입:

<!-- MODULE: nav-hud-markup (baseline) -->
```html
<div class="hud">
  <div class="meta" id="hudMeta">01 / 01</div>
  <div class="bar" id="hudBar"></div>
  <div class="nav">
    <button id="btnPrev" type="button" aria-label="이전 슬라이드">‹</button>
    <button id="btnNext" type="button" aria-label="다음 슬라이드">›</button>
  </div>
</div>
<button class="fs-btn" id="fsBtn" type="button" aria-label="전체화면 전환" title="전체화면 (F)">⛶</button>
```
<!-- /MODULE -->

네비게이션 JS — core-js 뒤에 배치:

<!-- MODULE: nav-hud-js (baseline) -->
```html
<script>
/* 네비게이션: 키보드 / 클릭 / 터치 스와이프 / 전체화면(F) / 발표자보기(P) */
(function () {
  if (document.documentElement.classList.contains('presenter')) return;
  var next = window.__deckNext, prev = window.__deckPrev, go = window.__deckGo;
  var slides = window.__deckSlides || [];

  function editing(t) { return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable); }
  document.addEventListener('keydown', function (e) {
    if (window.__lightboxOpen && window.__lightboxOpen()) return;   /* 라이트박스 열림 시 양보 */
    if (editing(e.target) || e.isComposing) return;
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev(); }
    else if (e.key === 'Home') { e.preventDefault(); go(0); }
    else if (e.key === 'End') { e.preventDefault(); go(slides.length - 1); }
    else if (e.key === 'f' || e.key === 'F') {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
    }
    else if (e.key === 'p' || e.key === 'P') {
      /* 팝업이 막히면 노트 버튼과 같은 인라인 폴백을 탄다 — P가 무반응으로 끝나지 않게 */
      if (window.__openPresenter && window.__openPresenter() === false && window.__notesInline) window.__notesInline();
    }
  });

  var bn = document.getElementById('btnNext'), bp = document.getElementById('btnPrev');
  if (bn) bn.addEventListener('click', next);
  if (bp) bp.addEventListener('click', prev);

  /* 전체화면 버튼 + 아이콘 동기화 (미지원 환경은 버튼 숨김) */
  var fs = document.getElementById('fsBtn');
  if (fs) {
    if (!document.documentElement.requestFullscreen) { fs.style.display = 'none'; }
    else {
      fs.addEventListener('click', function () {
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen();
      });
      document.addEventListener('fullscreenchange', function () {
        fs.textContent = document.fullscreenElement ? '✕' : '⛶';
      });
    }
  }

  /* 터치 스와이프 (임계 56px) */
  var tx = null;
  document.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
  document.addEventListener('touchend', function (e) {
    if (tx === null) return;
    var dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 56 && window.innerWidth > 820) { dx < 0 ? next() : prev(); }  /* 모바일 스크롤과 충돌 방지 */
    tx = null;
  }, { passive: true });
})();
</script>
```
<!-- /MODULE -->

---

## 6. MODULE: reveal (baseline) — 등장 애니메이션

`.on`이 될 때 `--d` 지연으로 요소가 스태거 등장. `@media print`/모바일에서는 §4가 자동 무효화.

<!-- MODULE: reveal-css (baseline) -->
```css
.rv  { opacity: 0; transform: translateY(16px); }
.rvx { opacity: 0; transform: translateX(-14px); }
.slide.on .rv  { animation: rise  .5s cubic-bezier(.22,1,.36,1) forwards; animation-delay: var(--d, 0s); }
.slide.on .rvx { animation: risex .45s cubic-bezier(.22,1,.36,1) forwards; animation-delay: var(--d, 0s); }
@keyframes rise  { to { opacity: 1; transform: none; } }
@keyframes risex { to { opacity: 1; transform: none; } }
```
<!-- /MODULE -->

사용: `<h2 class="sl-title rv" style="--d:.08s">…</h2>` — 요소마다 `--d`를 0.06~0.1s씩 늘려 순차 등장.

---

## 7. MODULE: notes (baseline) — 발표자 노트 + 별창 진입

각 슬라이드 끝에 `<aside class="slide-notes" hidden>` 5요소 노트. **발표자 보기(§8)의 대본 데이터 소스다.**

노트 버튼(`N`)과 `Shift+N`은 **별창(발표자 보기)을 연다** — 슬라이드 아래에 노트를 펼치는 것은 팝업이 차단됐을 때의 폴백이다. `P` 키와 목적지가 같다. 인라인 노트 CSS(`body.notes-visible`)는 그 폴백과 인쇄를 위해 남는다.

<!-- MODULE: notes-css (baseline) -->
```css
aside.slide-notes { display: none; }
body.notes-visible aside.slide-notes {
  display: block;
  width: min(1160px, 100%); margin: 3vh auto 0;   /* .slide__inner와 동일 폭·중앙 정렬 — 좌측 쏠림 방지 */
  padding: 18px 22px;
  background: var(--surface); border-left: 3px solid var(--accent-1);
  border-radius: 0 12px 12px 0;
  font-size: 13px; line-height: 1.6; color: var(--text-secondary);
}
/* 텍스트 위주 슬라이드는 본문 inner(820px)와 좌측 정렬을 맞춘다 */
body.notes-visible .slide--content aside.slide-notes,
body.notes-visible .slide--quote aside.slide-notes { width: min(820px, 100%); }
aside.slide-notes h4 {
  font-size: 11px; text-transform: uppercase; letter-spacing: .1em;
  color: var(--accent-1); margin: 12px 0 4px; font-weight: 700;
}
aside.slide-notes h4:first-child { margin-top: 0; }
aside.slide-notes ul { padding-left: 20px; }

.notes-btn {
  position: fixed; bottom: 14px; left: 136px; z-index: 31;
  width: 34px; height: 34px; border-radius: 9px;
  background: var(--surface); border: 1px solid var(--border-accent);
  color: var(--text-secondary); font-size: 12px; font-weight: 700; cursor: pointer;
  -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center;
  transition: color .2s, border-color .2s;
}
.notes-btn[aria-pressed="true"] { color: var(--accent-1); border-color: var(--accent-1); }
@media print { .notes-btn { display: none; } }
```
<!-- /MODULE -->

마크업(§5 HUD 마크업 바로 옆에 그대로 복사):

<!-- MODULE: notes-btn-markup (baseline) -->
```html
<button class="notes-btn" id="notesBtn" type="button" aria-label="발표자 노트 토글" title="노트 (Shift+N)" aria-pressed="false">N</button>
```
<!-- /MODULE -->

노트 5요소 구조는 `references/note-protocol.md` 참조.

<!-- MODULE: notes-js (baseline) -->
```html
<script>
/* 발표자 노트 버튼 — 슬라이드 아래가 아니라 별창(발표자 보기)을 연다.
   별창은 __deckSync로 덱을 따라 넘어간다. 팝업이 막히면 그때만 슬라이드 아래로 되돌린다.
   presenter-js보다 먼저 로드돼도 안전하다 — 훅을 호출 시점에 찾는다. */
(function () {
  if (document.documentElement.classList.contains('presenter')) return; /* 별창 자신은 이 버튼을 쓰지 않는다 */
  var btn = document.getElementById('notesBtn');
  if (!btn) return;
  var body = document.body;
  function sync() {
    var open = !!(window.__presenterOpen && window.__presenterOpen());
    btn.setAttribute('aria-pressed', (open || body.classList.contains('notes-visible')) ? 'true' : 'false');
  }
  function inlineFallback() {                 /* 팝업 차단 시의 폴백. P 키(nav-hud-js)도 이 경로를 쓴다 */
    body.classList.add('notes-visible');
    btn.title = '팝업이 차단되어 슬라이드 아래에 표시합니다 (노트 · Shift+N)';
    sync();
  }
  window.__notesInline = inlineFallback;
  function toggle() {
    if (body.classList.contains('notes-visible')) { body.classList.remove('notes-visible'); sync(); return; }
    if (window.__presenterOpen && window.__presenterOpen()) { window.__closePresenter(); sync(); return; }
    if (window.__openPresenter && window.__openPresenter() === false) inlineFallback();
    sync();
  }
  btn.addEventListener('click', toggle);
  document.addEventListener('keydown', function (e) {
    if (!(e.shiftKey && (e.key === 'N' || e.key === 'n'))) return;
    if (e.isComposing) return;
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    toggle();
  });
  setInterval(sync, 900);                     /* 별창을 사용자가 닫아도 버튼 상태가 따라온다 */
})();
</script>
```
<!-- /MODULE -->

---

## 8. MODULE: presenter (baseline) — 발표자 보기 (postMessage 팝업 동기화)

`P` 키 또는 노트 버튼(`N`·`Shift+N`)으로 같은 파일을 `?presenter` 별창으로 열어 대본·타이머·페이싱·다음 슬라이드·진행바를 표시하고 양방향 동기화한다.
**대본은 별도 객체가 아니라 각 슬라이드의 `aside.slide-notes`에서 직접 읽는다.**

**연결 유지**: 별창이 2초마다 `hello`를 쏘고 덱이 `sync`로 답한다. 덱을 새로고침하면 덱은 별창 참조를 잃으므로, 복구를 시작할 수 있는 쪽은 별창뿐이다. 이 ping-pong이 없으면 새로고침 후 조용히 끊긴 채 "연결됨"만 표시된다.

**페이싱**: 노트의 `<h4>소요 시간</h4>`을 초로 환산해 계획 누적과 경과를 비교한다. 값은 `cumPlan(i)` 기준, 색은 구간 `[cumPlan(i-1), cumPlan(i)+30초]` 판정이다 — 계획한 만큼 머무는 것은 늦은 게 아니다. 노트에 소요 시간이 하나도 없으면 계획·페이싱 칸을 감춘다.

**타이머**: `T`·클릭 리셋, `S` 정지·재개. 누적(`acc`) + 마지막 재개 시각(`t0`) 모델이라 정지를 지원한다. 상태가 바뀔 때만 `localStorage`(`yowu-deck-pv-timer-<deckId>`)에 저장하고, 6시간 지난 기록은 폐기한다. 글자 크기(`yowu-deck-pv-fs`)는 덱 공통이고 타이머는 덱별이다 — 시력은 덱마다 바뀌지 않지만 경과는 바뀐다.

**두 조각으로 구성**: (A) `<head>` 최상단 first-paint 스크립트, (B) `<body>` 끝 브리지+부트.

<!-- MODULE: presenter-headscript (baseline) -->
```html
<!-- <head> 최상단 (FOUC 방지: 첫 페인트 전 발표자 모드 판정) -->
<script>
if (/[?&]presenter(?:[=&]|$)/.test(location.search)) document.documentElement.className += ' presenter';
</script>
```
<!-- /MODULE -->

<!-- MODULE: presenter-css (baseline) -->
```css
.presenter-view { display: none; }
html.presenter .deck, html.presenter .hud, html.presenter .fs-btn,
html.presenter .notes-btn, html.presenter .stagebg, html.presenter .lightbox { display: none !important; }
html.presenter { overflow: hidden; }
html.presenter .presenter-view {
  display: flex; flex-direction: column; position: fixed; inset: 0; z-index: 300;
  background: var(--bg); color: var(--text-primary);
}
.pv-top { flex: none; display: flex; align-items: center; gap: 16px; padding: 12px 26px; border-bottom: 1px solid var(--line); background: var(--bg-raise); }
.pv-brand { font-family: var(--mono); font-size: 11.5px; font-weight: 600; letter-spacing: .1em; color: var(--text-muted); display: flex; align-items: center; gap: 9px; }
.pv-brand .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--accent-1); box-shadow: 0 0 12px var(--accent-1); }
.pv-count { font-family: var(--mono); font-size: 15px; font-weight: 600; letter-spacing: .1em; }
.pv-spacer { flex: 1 1 auto; }
.pv-plan { font-family: var(--mono); font-size: 11.5px; letter-spacing: .08em; color: var(--text-muted); white-space: nowrap; }
.pv-timer { font-family: var(--mono); font-size: 21px; font-weight: 600; color: var(--accent-2); background: none; border: 1px solid var(--line); border-radius: 10px; padding: 4px 15px; cursor: pointer; }
.pv-timer:hover { border-color: var(--accent-2); }
.pv-timer.paused { opacity: .55; border-style: dashed; }
/* 페이싱: 노트의 '소요 시간' 누적 대비 경과. 값은 cumPlan(i) 기준, 색은 구간 판정 */
.pv-pace { font-family: var(--mono); font-size: 13.5px; font-weight: 700; min-width: 64px; text-align: right; color: var(--text-secondary); }
.pv-pace.ahead { color: var(--ok); }
.pv-pace.late { color: var(--bad); }
.pv-plan.off, .pv-pace.off { display: none; }   /* 노트에 소요 시간이 하나도 없으면 감춘다 */
.pv-bar { flex: none; height: 3px; background: var(--line-soft); }
.pv-bar i { display: block; height: 100%; width: 0%; background: linear-gradient(90deg, var(--accent-1), var(--accent-2)); transition: width .3s ease; }
.pv-main { flex: 1 1 auto; display: flex; flex-direction: column; min-height: 0; width: min(1080px, 100%); margin: 0 auto; padding: 20px 30px 0; }
.pv-kicker { font-family: var(--mono); font-size: 11px; font-weight: 600; letter-spacing: .22em; text-transform: uppercase; color: var(--accent-1); min-height: 16px; }
.pv-title { font-size: clamp(19px, 3.6vh, 27px); font-weight: 800; letter-spacing: -0.02em; margin: 4px 0 12px; }
.pv-notes { flex: 1 1 auto; min-height: 0; overflow-y: auto; font-size: 18px; line-height: 1.8; padding-right: 8px; }
.pv-notes h4 { font-size: 12px; text-transform: uppercase; letter-spacing: .1em; color: var(--accent-1); margin: 14px 0 5px; }
.pv-notes h4:first-child { margin-top: 0; }
.pv-notes ul { padding-left: 22px; }
.pv-notes b, .pv-notes strong { color: var(--accent-2); }
.pv-next { flex: none; margin: 16px 0 18px; border: 1px solid var(--line); border-radius: 14px; background: var(--bg-card); padding: 12px 18px; }
.pv-next-label { font-family: var(--mono); font-size: 10px; font-weight: 600; letter-spacing: .2em; color: var(--text-muted); text-transform: uppercase; }
.pv-next-title { font-size: 15.5px; font-weight: 700; margin-top: 3px; }
.pv-foot { flex: none; display: flex; align-items: center; gap: 14px; padding: 9px 26px; border-top: 1px solid var(--line-soft); font-family: var(--mono); font-size: 10.5px; color: var(--text-muted); }
.pv-link.lost { color: var(--bad); }
.pv-keys { margin-left: auto; }
@media (max-width: 620px) { .pv-brand { display: none; } }   /* 좁은 별창에서 상단 줄바꿈 방지 */
```
<!-- /MODULE -->

발표자 창 마크업 — `<body>` 끝(덱 뒤)에 삽입:

<!-- MODULE: presenter-markup (baseline) -->
```html
<div class="presenter-view" aria-hidden="true">
  <div class="pv-top">
    <span class="pv-brand"><span class="dot"></span>발표자 보기</span>
    <span class="pv-count" id="pvCount">01 / 01</span>
    <span class="pv-spacer"></span>
    <span class="pv-plan" id="pvPlan"></span>
    <button class="pv-timer" id="pvTimer" title="클릭 또는 T: 리셋 · S: 정지·재개">00:00</button>
    <span class="pv-pace" id="pvPace"></span>
  </div>
  <div class="pv-bar"><i id="pvBar"></i></div>
  <div class="pv-main">
    <div class="pv-kicker" id="pvKicker"></div>
    <div class="pv-title" id="pvTitle"></div>
    <div class="pv-notes" id="pvNotes"></div>
    <div class="pv-next">
      <div class="pv-next-label">다음 슬라이드</div>
      <div class="pv-next-title" id="pvNextTitle"></div>
    </div>
  </div>
  <div class="pv-foot">
    <span class="pv-link lost" id="pvLink">연결 대기…</span>
    <span class="pv-keys">← → 이동 · ↑ ↓ 노트 · T 리셋 · S 정지 · +/- 글자크기</span>
  </div>
</div>
```
<!-- /MODULE -->

<!-- MODULE: presenter-js (baseline) -->
```html
<script>
/* ═══ 발표자 보기 ═══
   메인 덱: P 키 또는 노트 버튼(N)으로 ?presenter 별창을 열고 postMessage로 현재 인덱스를 push.
   발표자 창: aside.slide-notes를 대본으로 렌더 + 타이머·페이싱 + 다음 슬라이드. 방향키는 opener로 되돌림.
   연결 유지: 별창이 2초마다 hello를 쏘고 덱이 sync로 답한다 — 덱을 새로고침해도 스스로 다시 붙는다.
                (덱은 새로고침되면 별창 참조를 잃는다. 복구를 시작할 수 있는 쪽은 별창뿐이다.)
   file:// origin 불투명 → targetOrigin '*' 고정. */
(function () {
  var isPresenter = document.documentElement.classList.contains('presenter');
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  /* 덱 파일명으로 창 이름·저장 키를 분리 — 덱 두 개를 열어도 서로의 발표자 창을 뺏지 않는다 */
  var deckId = (location.pathname.split('/').pop() || 'deck').replace(/[^\w.-]/g, '') || 'deck';
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function clock(sec) { var s = Math.max(0, Math.round(sec)); return pad(Math.floor(s / 60)) + ':' + pad(s % 60); }
  function titleOf(i) {
    var t = slides[i].querySelector('h1, h2, .deck-title, .sl-title');
    if (!t) return slides[i].dataset.name || ('슬라이드 ' + (i + 1));
    var c = t.cloneNode(true);
    Array.prototype.forEach.call(c.querySelectorAll('br'), function (b) { b.parentNode.replaceChild(document.createTextNode(' '), b); });
    return c.textContent.replace(/\s+/g, ' ').trim();
  }
  function kickerOf(i) { var k = slides[i].querySelector('.kicker, .label'); return k ? k.textContent.replace(/\s+/g, ' ').trim() : ''; }
  function notesOf(i) { var n = slides[i].querySelector('.slide-notes'); return n ? n.innerHTML : '<p style="color:var(--text-muted)">이 슬라이드의 노트 없음</p>'; }

  if (!isPresenter) {
    /* ── 메인 덱 브리지 ── */
    var win = null, kick = null;
    window.__deckSync = function (idx) {
      if (!win || win.closed) return;
      try { win.postMessage({ type: 'yowu-deck-sync', index: idx }, '*'); } catch (e) {}
    };
    window.__presenterOpen = function () { return !!(win && !win.closed); };
    window.__closePresenter = function () { if (win && !win.closed) { try { win.close(); } catch (e) {} } win = null; };
    window.__openPresenter = function () {   /* 성공 true · 팝업 차단 false — 호출자(notes-js)가 폴백을 정한다 */
      if (win && !win.closed) { try { win.focus(); } catch (e) {} window.__deckSync(window.__deckCur()); return true; }
      var base = location.href.split('#')[0];
      var w = Math.min(1180, Math.round((screen.availWidth || 1440) * .62));
      var h = Math.min(820, Math.round((screen.availHeight || 900) * .82));
      var x = Math.max(0, (screen.availWidth || 1440) - w - 40);
      var feat = 'width=' + w + ',height=' + h + ',left=' + x + ',top=60,menubar=no,toolbar=no,location=no,status=no';
      win = window.open(base + (base.indexOf('?') > -1 ? '&' : '?') + 'presenter', 'yowu-presenter-' + deckId, feat);
      if (!win) return false;
      var tries = 0;
      kick = setInterval(function () {        /* 별창이 뜨는 동안의 초기 응답성. 이후는 별창의 hello가 맡는다 */
        if (++tries > 40 || !win || win.closed) { clearInterval(kick); return; }
        window.__deckSync(window.__deckCur());
      }, 250);
      return true;
    };
    window.addEventListener('message', function (e) {
      var d = e.data || {};
      if (d.type === 'yowu-presenter-hello') { win = e.source; window.__deckSync(window.__deckCur()); }
      else if (d.type === 'yowu-deck-nav') {
        win = e.source || win;
        if (d.action === 'next') window.__deckNext();
        else if (d.action === 'prev') window.__deckPrev();
        else if (d.action === 'home') window.__deckGo(0);
        else if (d.action === 'end') window.__deckGo(slides.length - 1);
      }
    });
    return;
  }

  /* ── 발표자 창 부트 ── */
  document.title = '발표자 보기';
  var pvRoot = document.querySelector('.presenter-view');
  if (pvRoot) pvRoot.removeAttribute('aria-hidden');   /* 마크업의 aria-hidden은 메인 덱에서 숨길 때만 유효 */
  var elCount = document.getElementById('pvCount'), elBar = document.getElementById('pvBar'),
      elKicker = document.getElementById('pvKicker'), elTitle = document.getElementById('pvTitle'),
      elNotes = document.getElementById('pvNotes'), elNextTitle = document.getElementById('pvNextTitle'),
      elTimer = document.getElementById('pvTimer'), elLink = document.getElementById('pvLink'),
      elPlan = document.getElementById('pvPlan'), elPace = document.getElementById('pvPace');

  /* 계획 시간: 노트의 '소요 시간' 항목을 초로 환산. "예상 1분 20초 + Q&A" 같은 꼬리표는 무시한다 */
  function planOf(i) {
    var n = slides[i].querySelector('.slide-notes'); if (!n) return 0;
    var hs = n.querySelectorAll('h4');
    for (var k = 0; k < hs.length; k++) {
      if (!/소요\s*시간|duration/i.test(hs[k].textContent)) continue;
      var p = hs[k].nextElementSibling; if (!p) return 0;
      var t = p.textContent;
      var m = /(\d+)\s*분/.exec(t), s = /(\d+)\s*초/.exec(t);
      if (!m && !s) { var only = /(\d+)/.exec(t); return only ? +only[1] * 60 : 0; }   /* 단위 없는 숫자는 분으로 읽는다 */
      return (m ? +m[1] * 60 : 0) + (s ? +s[1] : 0);
    }
    return 0;
  }
  var CUM = [], TOTAL = 0;
  for (var pi = 0; pi < slides.length; pi++) { TOTAL += planOf(pi); CUM[pi] = TOTAL; }
  function cumPlan(i) { return i < 0 ? 0 : (CUM[i] || 0); }
  if (TOTAL > 0) { elPlan.textContent = '총 ' + clock(TOTAL); }
  else { elPlan.classList.add('off'); elPace.classList.add('off'); }

  /* 타이머: 누적(acc) + 마지막 재개 시각(t0). 정지·재개를 지원하려면 시작 시각 하나로는 부족하다 */
  var TKEY = 'yowu-deck-pv-timer-' + deckId;
  var tm = { acc: 0, t0: null, paused: true };
  try {
    var st = JSON.parse(localStorage.getItem(TKEY) || 'null');
    if (st && Date.now() - (st.savedAt || 0) < 216e5) {   /* 6시간 지난 기록은 폐기 — 어제 발표가 되살아나지 않게 */
      tm.acc = +st.acc || 0; tm.t0 = st.t0 || null; tm.paused = !!st.paused;
      if (!tm.paused && !tm.t0) tm.paused = true;
    }
  } catch (e) {}
  function saveTimer() {
    try { localStorage.setItem(TKEY, JSON.stringify({ acc: tm.acc, t0: tm.t0, paused: tm.paused, savedAt: Date.now() })); } catch (e) {}
  }
  function elapsed() { return tm.paused ? tm.acc : tm.acc + (Date.now() - tm.t0) / 1000; }
  function startTimer() { if (tm.paused) { tm.t0 = Date.now(); tm.paused = false; saveTimer(); } }
  function pauseTimer() { if (!tm.paused) { tm.acc = elapsed(); tm.paused = true; saveTimer(); } }
  function resetTimer() { tm.acc = 0; tm.t0 = Date.now(); tm.paused = false; saveTimer(); tick(); }

  var curIdx = -1;
  function paceTick() {
    if (TOTAL <= 0) return;
    var e = elapsed(), hi = cumPlan(curIdx), lo = cumPlan(curIdx - 1), d = e - hi;
    elPace.textContent = (d < 0 ? '−' : '+') + clock(Math.abs(d));
    /* 정상 구간은 [cumPlan(i-1), cumPlan(i)+30] — 계획만큼 머무는 것은 늦은 게 아니다 */
    elPace.className = 'pv-pace' + (e < lo ? ' ahead' : (e > hi + 30 ? ' late' : ''));
  }
  function tick() {
    elTimer.textContent = clock(elapsed());
    elTimer.classList.toggle('paused', tm.paused);
    paceTick();
  }

  function render(i) {
    if (typeof i !== 'number' || i < 0 || i >= slides.length) return;
    if (i === curIdx) { paceTick(); return; }   /* 같은 슬라이드 재수신 — 다시 그리지 않는다(노트 스크롤 위치 보존) */
    curIdx = i;
    elCount.textContent = pad(i + 1) + ' / ' + pad(slides.length);
    elBar.style.width = ((i + 1) / slides.length * 100) + '%';
    elKicker.textContent = kickerOf(i);
    elTitle.textContent = titleOf(i);
    elNotes.innerHTML = notesOf(i);
    elNotes.scrollTop = 0;
    elNextTitle.textContent = (i + 1 < slides.length) ? titleOf(i + 1) : '(마지막 슬라이드)';
    paceTick();
  }

  var fs = 18; try { fs = +localStorage.getItem('yowu-deck-pv-fs') || 18; } catch (e) {}   /* 글자크기는 덱 공통 */
  function setFs(v) { fs = Math.min(32, Math.max(13, v)); elNotes.style.fontSize = fs + 'px'; try { localStorage.setItem('yowu-deck-pv-fs', String(fs)); } catch (e) {} }
  setFs(fs);

  var lastSync = 0, deckWin = window.opener;
  function link(text, lost) { elLink.textContent = text; elLink.classList.toggle('lost', !!lost); }
  function hello() { if (deckWin && !deckWin.closed) { try { deckWin.postMessage({ type: 'yowu-presenter-hello' }, '*'); } catch (e) {} } }
  function nav(action) { if (deckWin && !deckWin.closed) { try { deckWin.postMessage({ type: 'yowu-deck-nav', action: action }, '*'); } catch (e) {} } }

  window.addEventListener('message', function (e) {
    var d = e.data || {};
    if (d.type !== 'yowu-deck-sync') return;
    deckWin = e.source || deckWin;
    lastSync = Date.now();
    if (tm.paused && tm.acc === 0 && tm.t0 === null) startTimer();   /* 첫 연결에 타이머 시작 (복원된 기록은 건드리지 않는다) */
    link('메인 덱과 연결됨', false);
    render(d.index);
  });

  document.addEventListener('keydown', function (e) {
    if (e.isComposing) return;
    var k = e.key;
    if (k === 'ArrowRight' || k === ' ' || k === 'PageDown') { e.preventDefault(); nav('next'); }
    else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); nav('prev'); }
    else if (k === 'Home') { e.preventDefault(); nav('home'); }
    else if (k === 'End') { e.preventDefault(); nav('end'); }
    else if (k === 'ArrowDown') { e.preventDefault(); elNotes.scrollTop += 80; }
    else if (k === 'ArrowUp') { e.preventDefault(); elNotes.scrollTop -= 80; }
    else if (k === 't' || k === 'T') resetTimer();
    else if (k === 's' || k === 'S') { if (tm.paused) startTimer(); else pauseTimer(); tick(); }
    else if (k === '+' || k === '=') setFs(fs + 1);
    else if (k === '-' || k === '_') setFs(fs - 1);
  });
  elTimer.addEventListener('click', resetTimer);

  setInterval(tick, 1000);
  setInterval(function () {                    /* 하트비트 — 덱이 살아 있으면 2초마다 다시 붙는다 */
    if (!deckWin) { link('단독으로 열렸습니다 — 메인 덱에서 P 키로 여세요', true); return; }
    if (deckWin.closed) { link('메인 덱 창이 닫혔습니다 — 덱에서 P 키로 다시 여세요', true); return; }
    hello();
    if (lastSync === 0) { link('연결 대기…', true); return; }   /* 첫 연결 전과 끊긴 뒤는 다른 상태다 */
    if (Date.now() - lastSync > 5000) link('재연결 중…', true);
  }, 2000);

  render(0);                                   /* 첫 sync 전에도 자기 슬라이드를 안다 */
  tick();
  if (!deckWin) link('단독으로 열렸습니다 — 메인 덱에서 P 키로 여세요', true);
  else hello();
})();
</script>
```
<!-- /MODULE -->

> **자동 적용**: 발표/피칭/보고 목적이면 baseline으로 항상 포함. 순수 열람용(문서 배포) 목적이 명확하면 생략 가능.
> **생략하면 노트 버튼도 죽는다** — `notes-js`가 `__openPresenter`를 호출하므로, presenter 모듈을 뺄 때는 인라인 토글판 `notes-js`로 되돌려야 한다.

---

## 9. MODULE: components (baseline) — 기본 컴포넌트

필요한 컴포넌트 CSS만 골라 삽입한다. 모든 색은 `var(--*)` 참조.

<!-- MODULE: components-css (baseline) -->
```css
/* Card */
.card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: clamp(16px, 2.2vh, 24px); }
.card-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.card-grid.cols-3 { grid-template-columns: repeat(3, 1fr); }
.card-grid.cols-4 { grid-template-columns: repeat(4, 1fr); }
.card-icon { font-size: 1.9rem; margin-bottom: 10px; }
.card-title { font-size: clamp(14px, 1.9vh, 16px); font-weight: 700; margin-bottom: 4px; }
.card-desc { font-size: clamp(12px, 1.6vh, 13px); color: var(--text-muted); line-height: 1.6; }

/* Stat */
.stat-row { display: flex; gap: 14px; margin-bottom: 3vh; }
.stat-box { flex: 1; background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: clamp(14px, 2vh, 20px); text-align: center; }
.stat-num { font-size: clamp(1.8rem, 6vh, 2.8rem); font-weight: 900; color: var(--accent-1); line-height: 1.1; }
.stat-label { font-size: 12px; color: var(--text-muted); margin-top: 6px; }

/* Timeline */
.timeline { position: relative; padding-left: 32px; }
.timeline::before { content: ''; position: absolute; left: 11px; top: 8px; bottom: 8px; width: 2px; background: var(--border); }
.tl-item { position: relative; margin-bottom: 2.4vh; }
.tl-dot { position: absolute; left: -27px; top: 6px; width: 14px; height: 14px; border-radius: 50%; border: 3px solid var(--accent-1); background: var(--bg); }
.tl-dot.active { background: var(--accent-1); }
.tl-title { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
.tl-desc { font-size: 14px; color: var(--text-muted); }

/* Flow (workflow-grid) */
.workflow-grid { display: grid; grid-template-columns: repeat(var(--steps, 5), 1fr); gap: 0; }
.wf-step { position: relative; text-align: center; padding: clamp(16px, 2.6vh, 28px) 14px; background: var(--surface); border: 1px solid var(--border); border-right: none; }
.wf-step:first-child { border-radius: 16px 0 0 16px; }
.wf-step:last-child { border-radius: 0 16px 16px 0; border-right: 1px solid var(--border); }
.wf-step::after { content: ''; position: absolute; right: -10px; top: 50%; transform: translateY(-50%); width: 0; height: 0; border-top: 8px solid transparent; border-bottom: 8px solid transparent; border-left: 10px solid var(--border-accent); z-index: 1; }
.wf-step:last-child::after { display: none; }
.wf-num { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 50%; background: var(--accent-gradient); color: #fff; font-size: 12px; font-weight: 700; margin: 0 auto 10px; }
.wf-title { font-size: 13px; font-weight: 700; margin-bottom: 4px; }
.wf-desc { font-size: 11px; color: var(--text-muted); line-height: 1.5; }

/* Quote */
.quote-box { background: var(--surface); border-left: 4px solid var(--accent-1); border-radius: 0 14px 14px 0; padding: clamp(18px, 2.6vh, 24px); }
.quote-text { font-size: clamp(15px, 2.2vh, 19px); font-weight: 500; line-height: 1.7; }
.quote-author { font-size: 13px; color: var(--text-muted); margin-top: 10px; }

/* Comparison */
.comparison { display: grid; grid-template-columns: 1fr auto 1fr; gap: 16px; align-items: center; }
.comparison-col { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: clamp(16px, 2.4vh, 24px); }
.comparison-col.bad { border-color: rgba(255,107,91,.3); }
.comparison-col.good { border-color: rgba(93,228,199,.3); }
.comparison-divider { font-size: 24px; color: var(--text-muted); }

/* Tag / Chip */
.tag { display: inline-block; background: var(--tag-bg); color: var(--tag-color); padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: 600; margin: 0 4px 8px 0; }

/* Hero badge row */
.hero-badge-row { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 3vh; align-self: center; width: fit-content; }
.hero-badge { display: inline-flex; align-items: center; gap: 7px; background: var(--surface); border: 1px solid var(--border-accent); border-radius: 99px; padding: 6px 14px 6px 10px; font-size: 13px; font-weight: 500; color: var(--text-secondary); white-space: nowrap; }
.hero-badge::before { content: ''; width: 7px; height: 7px; border-radius: 50%; background: var(--accent-1); flex-shrink: 0; }
.hero-badge.c2::before { background: var(--accent-2); }
.hero-badge.c3::before { background: var(--accent-3); }

/* Code block */
pre { border-radius: 12px; overflow: hidden; margin-bottom: 2.4vh; }
pre code { font-size: clamp(12px, 1.8vh, 14px); line-height: 1.6; padding: 22px !important; }

/* Naming / Formula */
.naming-box { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: clamp(20px, 3vh, 32px); text-align: center; }
.naming-formula { display: flex; align-items: center; justify-content: center; gap: 10px; flex-wrap: wrap; margin-bottom: 20px; }
.naming-chip { background: var(--tag-bg); color: var(--tag-color); padding: 8px 16px; border-radius: 99px; font-size: 14px; font-weight: 700; }

/* Table (baseline) — 데이터/스펙 표. 셀 내 code/.mono는 accent-2 강조 */
.data-table { width:100%; border-collapse:collapse; font-size:clamp(12px,1.7vh,15px); }
.data-table th, .data-table td { text-align:left; padding:clamp(7px,1.3vh,12px) 14px; border-bottom:1px solid var(--line); }
.data-table thead th { color:var(--hl); font-family:var(--mono); font-size:clamp(10px,1.3vh,12px); letter-spacing:.1em; text-transform:uppercase; border-bottom:1px solid var(--border-accent); }
.data-table tbody tr:last-child td { border-bottom:none; }
.data-table td code, .data-table td .mono { font-family:var(--mono); font-size:.9em; color:var(--accent-2); }

/* Status pill (baseline) — 상태 라벨. on=활성, proposed=제안/미구현, legacy=구버전 (content-rules 상태 라벨 보존과 연결) */
.status-pill { display:inline-block; padding:2px 9px; border-radius:99px; font-size:11px; font-weight:700; font-family:var(--mono); white-space:nowrap; }
.status-pill.on { background:rgba(93,228,199,.15); color:var(--ok); }
.status-pill.proposed { background:rgba(255,107,157,.15); color:var(--accent-3); }
.status-pill.legacy { background:rgba(234,240,249,.08); color:var(--text-muted); }
```
<!-- /MODULE -->

표 사용(`thead`/`tbody` + 셀 안 `.status-pill`):
```html
<table class="data-table">
  <thead><tr><th>필드</th><th>타입</th><th>상태</th></tr></thead>
  <tbody>
    <tr><td><code>id</code></td><td>UUID</td><td><span class="status-pill on">활성</span></td></tr>
    <tr><td><code>legacyKey</code></td><td>String</td><td><span class="status-pill legacy">구버전</span></td></tr>
    <tr><td><code>ttl</code></td><td>Int</td><td><span class="status-pill proposed">제안</span></td></tr>
  </tbody>
</table>
```

코드 비교(2열 전후 비교). `.cmp-head` 라벨 + `<pre><code class="language-…">` 2열. **자동 적용 신호**: before/after·언어/버전 대비.

<!-- MODULE: code-comparison (feature) -->
```css
.code-cmp { display:grid; grid-template-columns:1fr 1fr; gap:16px; align-items:start; }
.code-cmp pre { margin-bottom:0; }
.code-cmp .cmp-head { font-family:var(--mono); font-size:12px; letter-spacing:.06em; margin-bottom:8px; color:var(--text-secondary); }
.code-cmp .cmp-head .status-pill { margin-left:6px; }
```
<!-- /MODULE -->

코드 비교 사용:
```html
<div class="code-cmp">
  <div>
    <div class="cmp-head">Before<span class="status-pill legacy">구버전</span></div>
    <pre><code class="language-js">var x = fn();</code></pre>
  </div>
  <div>
    <div class="cmp-head">After<span class="status-pill on">활성</span></div>
    <pre><code class="language-ts">const x = fn();</code></pre>
  </div>
</div>
```

---

## 9.1 MODULE: components-ext (baseline) — 본문·구간·강조 컴포넌트

§9가 카드·통계·플로우 같은 **블록**을 준다면, 여기는 본문 슬라이드를 실제로 채우는 **문장·목록·구간** 컴포넌트다.
실전 44면 덱에서 뽑아 토큰으로 일반화했다. 필요한 것만 골라 삽입한다.

색은 §1의 **악센트 의미 배정**을 따른다 — `--accent-1` 실측·수치, `--accent-2` 인용·성과, `--accent-3` 위험·예외.

<!-- MODULE: components-ext-css (baseline) -->
```css
/* ── 본문 목록 ── */
.blist { list-style: none; display: flex; flex-direction: column; gap: clamp(6px, 1.15vh, 13px); }
.blist > li { position: relative; padding-left: 20px; font-size: clamp(13px, 1.92vh, 18px); line-height: 1.62; color: var(--text-secondary); }
.blist > li::before { content: ''; position: absolute; left: 2px; top: .72em; width: 6px; height: 6px; border-radius: 2px; background: var(--accent-1); opacity: .85; }
.blist > li strong { color: var(--text-primary); font-weight: 800; }
.blist > li em { font-style: normal; color: var(--accent-2); }   /* 한국어에서 이탤릭은 읽기 나쁘다 — 색으로만 강조 */
.blist.num { counter-reset: bl; }
.blist.num > li { padding-left: 30px; }
.blist.num > li::before {
  counter-increment: bl; content: counter(bl, decimal-leading-zero);
  width: auto; height: auto; background: none; border-radius: 0; top: 0;
  font-family: var(--mono); font-size: .74em; font-weight: 700; color: var(--accent-1); opacity: 1;
}
.blist .sub { list-style: none; margin-top: 5px; display: flex; flex-direction: column; gap: 4px; }
.blist .sub > li { position: relative; padding-left: 14px; font-size: .86em; color: var(--text-muted); }
.blist .sub > li::before { content: '·'; position: absolute; left: 2px; color: var(--accent-1); }

/* ── 강조 블록: .risk 기본형 + .keep/.why 색 변형 ── */
.risk {
  border-left: 3px solid var(--accent-3);
  background: linear-gradient(90deg, color-mix(in srgb, var(--accent-3) 14%, transparent), transparent 72%);
  border-radius: 0 12px 12px 0;
  padding: clamp(10px, 1.6vh, 18px) clamp(12px, 1.8vh, 20px);
}
.risk > .rl {
  font-family: var(--mono); font-size: clamp(9.5px, 1.25vh, 11.5px); font-weight: 700;
  letter-spacing: .2em; text-transform: uppercase; color: var(--accent-3);
  display: block; margin-bottom: 7px;
}
.risk .blist > li::before { background: var(--accent-3); }
.keep { border-left-color: var(--accent-2); background: linear-gradient(90deg, color-mix(in srgb, var(--accent-2) 14%, transparent), transparent 72%); }
.keep > .rl { color: var(--accent-2); }
.keep .blist > li::before { background: var(--accent-2); }
.why { border-left-color: var(--accent-1); background: linear-gradient(90deg, color-mix(in srgb, var(--accent-1) 14%, transparent), transparent 72%); }
.why > .rl { color: var(--accent-1); }
.why .blist > li::before { background: var(--accent-1); }

/* ── 인용 문장 ── */
q, .q { color: var(--accent-2); font-style: normal; }
q::before { content: '\201C'; } q::after { content: '\201D'; }

/* ── 결론 한 문장 ── */
.punch {
  font-size: clamp(20px, 3.9vh, 38px); font-weight: 900; line-height: 1.32; letter-spacing: -.03em;
  padding: clamp(16px, 2.6vh, 30px) clamp(18px, 2.8vh, 34px);
  border: 1px solid var(--border-accent); border-radius: 20px;
  background: linear-gradient(150deg, color-mix(in srgb, var(--accent-1) 14%, transparent), color-mix(in srgb, var(--accent-2) 5%, transparent) 70%, transparent);
  -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px);
}
.punch .em { color: var(--accent-1); }   /* §9의 .em은 h1/h2 스코프라 여기 따로 둔다 */

/* ── 키-값 나열 (dl/dt/dd) ── */
.kv { display: grid; grid-template-columns: auto 1fr; gap: 6px clamp(12px, 1.6vw, 20px); font-size: clamp(12px, 1.7vh, 15px); align-items: baseline; }
.kv dt { font-family: var(--mono); font-size: .84em; letter-spacing: .06em; color: var(--accent-1); white-space: nowrap; }
.kv dd { color: var(--text-secondary); margin: 0; }
.kv dd strong { color: var(--text-primary); font-weight: 800; }

/* ── 2·3열 분할 ── */
.split { display: grid; grid-template-columns: 1.02fr .98fr; gap: clamp(14px, 2.2vw, 30px); align-items: start; }
.split.img-l { grid-template-columns: .92fr 1.08fr; }
.split-2 { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(12px, 1.6vw, 20px); }
.tri { display: grid; grid-template-columns: repeat(3, 1fr); gap: clamp(10px, 1.4vw, 16px); }
.split > *, .split-2 > *, .tri > * { min-width: 0; }   /* grid 자식 overflow 방어 — 빠뜨리면 코드/표가 슬라이드를 넘긴다 */

/* ── 스크린샷 프레임 ── */
.shot { border-radius: 14px; overflow: hidden; border: 1px solid var(--line); background: var(--bg-card); box-shadow: 0 14px 40px rgba(0,0,0,.18); display: flex; align-items: center; justify-content: center; }
.shot img { display: block; width: 100%; height: auto; max-width: 100%; }
.shot.tall img { width: auto; height: auto; max-height: var(--sh, 44vh); }   /* 세로형 캡처는 높이로 잡는다 — 폭 기준이면 슬라이드를 넘긴다 */
.shot-row { display: flex; gap: 12px; align-items: stretch; }
.shot-row .shot { flex: 1; min-width: 0; }
.shot-cap { font-family: var(--mono); font-size: 10.5px; letter-spacing: .08em; color: var(--text-muted); margin-top: 7px; }

/* ── 구간 표지 (10장 넘는 덱의 부 나눔) ── */
.slide--part { background: var(--bg-gradient); }
.slide--part .slide__inner { max-width: min(1160px, 100%); }
.part { display: grid; grid-template-columns: minmax(0, 26%) 1fr; gap: clamp(18px, 3vw, 48px); align-items: center; }
.part-num {
  font-family: var(--mono); font-weight: 700;
  font-size: clamp(72px, 17vh, 200px); line-height: .82; letter-spacing: -.05em;
  color: transparent; -webkit-text-stroke: 1.5px color-mix(in srgb, var(--accent-1) 42%, transparent);
  user-select: none;
}
@supports not (-webkit-text-stroke: 1px black) {   /* stroke 미지원이면 숫자가 통째로 사라진다 */
  .part-num { color: color-mix(in srgb, var(--accent-1) 30%, transparent); }
}
.part-title { font-size: clamp(28px, 6.4vh, 62px); margin-bottom: 2vh; }
.part-when { font-family: var(--mono); font-size: clamp(10.5px, 1.5vh, 13.5px); letter-spacing: .1em; color: var(--text-muted); padding-left: 13px; border-left: 2px solid var(--accent-2); }
.part-when b { color: var(--accent-2); font-weight: 700; }

/* ── 수평 타임라인 ──
   --tl-pad: 컨테이너 위 여백 · --tl-dot: 컨테이너 기준 점 위 좌표 · --tl-dot-size: 점 지름.
   가로선과 점을 같은 변수로 묶는다 — 따로 두면 다시 어긋난다. */
.tl-h { --tl-pad: 26px; --tl-dot: 52px; --tl-dot-size: 9px;
  position: relative; display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; gap: 0; padding-top: var(--tl-pad); }
.tl-h::before { content: ''; position: absolute; left: 0; right: 0; height: 1px; background: var(--line); top: calc(var(--tl-dot) + var(--tl-dot-size) / 2); }
.tl-h .n { position: relative; padding: 0 8px 0 0; }
.tl-h .n::before {
  content: ''; position: absolute; top: calc(var(--tl-dot) - var(--tl-pad)); left: 0;
  width: var(--tl-dot-size); height: var(--tl-dot-size); border-radius: 50%;
  background: var(--bg); border: 2px solid var(--accent-1); z-index: 1;
}
.tl-h .n.hot::before { background: var(--accent-3); border-color: var(--accent-3); box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent-3) 18%, transparent); }
.tl-h .d { font-family: var(--mono); font-size: clamp(10px, 1.4vh, 12.5px); color: var(--accent-1); letter-spacing: .06em; margin-bottom: 22px; display: block; line-height: 1.35; }
.tl-h .n.hot .d { color: var(--accent-3); }
.tl-h .t { font-size: clamp(11.5px, 1.6vh, 14px); color: var(--text-secondary); line-height: 1.5; padding-right: 10px; word-break: keep-all; }
.tl-h .n.hot .t { color: var(--text-primary); font-weight: 700; }

/* ── 전환 행 (A → B) ──
   행끼리 열 폭을 공유해야 화살표가 한 줄로 맞는다. 그래서 컨테이너가 grid, 각 행은 display:contents.
   (행 요소가 접근성 트리에서 사라지는 대가를 치른다 — 표 형태 데이터에는 쓰지 않는다) */
.arrow-rows { display: grid; grid-template-columns: auto 22px minmax(0, 1fr); align-items: center; gap: clamp(5px, .95vh, 11px) 10px; font-size: clamp(12px, 1.72vh, 15.5px); }
.arrow-rows .ar { display: contents; }
.arrow-rows .ar > .k { grid-column: 1 / -1; font-family: var(--mono); font-size: clamp(9.5px, 1.25vh, 11.5px); letter-spacing: .14em; text-transform: uppercase; color: var(--text-muted); margin-top: 4px; }
.arrow-rows .from { color: var(--text-muted); text-align: right; }
.arrow-rows .mid { text-align: center; color: var(--accent-1); font-family: var(--mono); }
.arrow-rows .to { color: var(--text-primary); font-weight: 800; }

/* ── 체크 격자 (통과·실패) ── */
.checks { display: flex; gap: 10px; flex-wrap: wrap; }
.chk { flex: 1; min-width: 84px; border: 1px solid var(--border); border-radius: 12px; padding: clamp(9px, 1.5vh, 16px) 10px; text-align: center; background: var(--surface); }
.chk .m { font-size: clamp(18px, 3.2vh, 28px); line-height: 1; font-weight: 900; font-family: var(--mono); color: var(--text-muted); }
.chk .l { font-size: clamp(10.5px, 1.4vh, 12.5px); color: var(--text-muted); margin-top: 7px; line-height: 1.4; }
.chk.hit { border-color: color-mix(in srgb, var(--ok) 40%, transparent); background: color-mix(in srgb, var(--ok) 6%, transparent); }
.chk.hit .m { color: var(--ok); }
.chk.miss { border-color: color-mix(in srgb, var(--accent-3) 45%, transparent); background: color-mix(in srgb, var(--accent-3) 7%, transparent); }
.chk.miss .m { color: var(--accent-3); }

/* ── 표 가로 스크롤 안전망 (모바일 overflow의 단골) ── */
.table-scroll { width: 100%; overflow-x: auto; }
.table-scroll > table { min-width: max-content; }

/* ── 근거 스탬프 ──
   수치·인용이 있는 슬라이드는 자기 출처를 화면에 달고 있는다. 출처가 없으면 .unverified로 밝힌다. */
.src {
  margin-top: auto; padding-top: 1.8vh;
  display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap;
  font-family: var(--mono); font-size: clamp(9.5px, 1.25vh, 12px);
  letter-spacing: .04em; color: var(--text-muted);
}
.src::before {
  content: '근거'; flex: none;
  padding: 2px 7px; border-radius: 4px;
  background: color-mix(in srgb, var(--accent-1) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent-1) 28%, transparent);
  color: var(--accent-1); font-weight: 700; letter-spacing: .16em;
}
.src code { color: var(--accent-2); }
.src.unverified::before {
  content: '미확인';
  background: color-mix(in srgb, var(--accent-3) 10%, transparent);
  border-color: color-mix(in srgb, var(--accent-3) 30%, transparent);
  color: var(--accent-3);
}
html[lang="en"] .src::before { content: 'SOURCE'; }
html[lang="en"] .src.unverified::before { content: 'UNVERIFIED'; }

/* ── 장 전환 한 줄 ──
   본문이 다 뜬 뒤 마지막에 등장해, 지금 장의 결론을 다음 장의 질문으로 바꾼다. */
.bridge {
  margin-top: auto; padding-top: 1.6vh;
  display: flex; align-items: baseline; gap: 9px;
  font-size: clamp(11.5px, 1.58vh, 14.5px); line-height: 1.55;
  color: var(--text-muted);
}
.bridge::before { content: '\2193'; flex: none; font-family: var(--mono); font-weight: 700; color: var(--accent-1); opacity: .8; }
.bridge strong { color: var(--text-secondary); font-weight: 700; }
.bridge + .src { margin-top: 0; padding-top: 1.1vh; }

/* .src/.bridge를 바닥에 붙이려면 inner가 flex column이어야 한다.
   §3의 .slide__inner를 전역으로 바꾸면 기존 덱이 영향을 받으므로 :has()로 옵트인한다.
   :has() 미지원 환경에서는 바닥 정렬만 사라진다(내용은 그대로). */
.slide__inner:has(> .src), .slide__inner:has(> .bridge) { display: flex; flex-direction: column; }

/* ── SVG 아키텍처 다이어그램 클래스 규약 ──
   inline <svg class="arch">에 붙인다. 색을 토큰으로 묶어 두면 테마를 따라간다. */
.arch { width: 100%; height: auto; display: block; }
.arch .box { fill: var(--bg-card); stroke: var(--line); stroke-width: 1.2; }
.arch .box.mine { fill: color-mix(in srgb, var(--accent-1) 10%, transparent); stroke: color-mix(in srgb, var(--accent-1) 55%, transparent); stroke-width: 1.8; }
.arch .box.ext { fill: color-mix(in srgb, var(--accent-2) 14%, transparent); stroke: color-mix(in srgb, var(--accent-2) 45%, transparent); }
.arch .nm { fill: var(--text-primary); font-size: 15px; font-weight: 800; }
.arch .sub { fill: var(--text-muted); font-size: 12px; }
.arch .org { fill: var(--accent-1); font-size: 10.5px; font-family: var(--mono); letter-spacing: .06em; }
.arch .wire { stroke: color-mix(in srgb, var(--text-primary) 24%, transparent); stroke-width: 1.4; fill: none; }
.arch .wire.hot { stroke: color-mix(in srgb, var(--accent-2) 70%, transparent); stroke-width: 1.8; }
.arch .cap { fill: var(--text-secondary); font-size: 11.5px; }
.arch .cap.hot { fill: var(--accent-2); }
```
<!-- /MODULE -->

마크업 (필요한 것만 골라 쓴다):

<!-- MODULE: components-ext-markup (baseline) -->
```html
<!-- 본문 목록: strong=핵심, em=인용 뉘앙스, .sub=하위 -->
<ul class="blist">
  <li><strong>결론 문구</strong> — 근거 한 조각
    <ul class="sub"><li>보조 설명</li></ul>
  </li>
</ul>
<ol class="blist num"><li>번호가 필요한 순서</li></ol>

<!-- 강조 블록: risk=위험 · keep=유지·성과 · why=원인·분석 -->
<div class="risk"><span class="rl">여기서 무너졌습니다</span>
  <p class="desc" style="margin:0">한 문장 진술</p>
</div>
<div class="risk keep"><span class="rl">이건 남깁니다</span><p class="desc" style="margin:0">…</p></div>
<div class="risk why"><span class="rl">왜 그렇게 됐나</span><p class="desc" style="margin:0">…</p></div>

<!-- 결론 한 문장 · 키-값 -->
<div class="punch">핵심은 <span class="em">한 문장</span>입니다.</div>
<dl class="kv"><dt>범위</dt><dd><strong>44면</strong> · 22분</dd></dl>

<!-- 2열 분할 + 스크린샷 -->
<div class="split">
  <div>
    <div class="shot-row">
      <figure class="shot tall" style="--sh:40vh"><img src="assets/shot-1.png" alt="화면 1"></figure>
    </div>
    <div class="shot-cap">실제 화면 · 클릭하면 확대됩니다</div>
  </div>
  <ul class="blist"><li>오른쪽 설명</li></ul>
</div>

<!-- 구간 표지: slide--part + data-part -->
<section class="slide slide--title slide--part" data-name="part-1" data-part="1부 무엇을 만들었나">
  <div class="slide__inner">
    <div class="part">
      <div class="part-num" aria-hidden="true">01</div>
      <div>
        <div class="label rv">1부 · 무엇을 만들었나</div>
        <h2 class="part-title rv" style="--d:.06s">결론형 구간 제목</h2>
        <div class="part-when rv" style="--d:.14s">시점 · <b>2026-07-23</b> · 3장</div>
      </div>
    </div>
  </div>
</section>

<!-- 수평 타임라인: .hot = 이 발표가 가리키는 지점 -->
<div class="tl-h">
  <div class="n"><span class="d">07-23</span><span class="t">기획 리뷰</span></div>
  <div class="n hot"><span class="d">08-19</span><span class="t">최초 제공<br><strong>하루 넘겼습니다</strong></span></div>
</div>

<!-- 전환 행 · 체크 격자 -->
<div class="arrow-rows">
  <div class="ar"><span class="from">기존</span><span class="mid">→</span><span class="to">바뀐 것</span></div>
</div>
<div class="checks">
  <div class="chk hit"><div class="m">PASS</div><div class="l">조건 A</div></div>
  <div class="chk miss"><div class="m">FAIL</div><div class="l">조건 B</div></div>
</div>

<!-- 근거 스탬프 · 장 전환 (.slide__inner 직계 자식으로 둔다) -->
<div class="bridge rv" style="--d:.44s">여기까지가 <strong>무엇</strong>입니다. 그럼 <strong>얼마나 걸렸을까요.</strong></div>
<div class="src"><code>retro.md</code> · 실측 200건</div>
<div class="src unverified">추정 — 실측 전</div>
```
<!-- /MODULE -->

> **`.src` / `.bridge` 사용 규칙**은 `references/content-rules.md`를 따른다. 수치·인용이 있으면 출처를 달고, 없으면 `.unverified`로 밝힌다.

---

## 10. MODULE: sequencer (feature) — 등장 시퀀서

`[data-seq]` 스테이지 안의 `[data-step]`을 순번대로 누적 점등. **자동 적용 신호**: 순차적 항목·빌드업·단계별 강조.

<!-- MODULE: sequencer-css (feature) -->
```css
[data-seq] [data-step] { opacity: 0; transform: translateY(10px); transition: opacity .4s ease, transform .4s cubic-bezier(.22,1,.36,1); }
[data-seq] [data-step].lit { opacity: 1; transform: none; }
```
<!-- /MODULE -->

<!-- MODULE: sequencer-js (feature) -->
```html
<script>
/* 범용 시퀀서: [data-seq][data-interval] 안의 [data-step]을 순번대로 .lit 점등.
   core-js의 gen 토큰으로 전환 후 잔여 타이머 무효화. */
(function () {
  if (document.documentElement.classList.contains('presenter')) return;
  window.__runStage = function (stage, myGen) {
    var steps = Array.prototype.slice.call(stage.querySelectorAll('[data-step]'))
      .sort(function (a, b) { return (+a.dataset.step) - (+b.dataset.step); });
    var interval = +stage.dataset.interval || 700;
    steps.forEach(function (s) { s.classList.remove('lit'); });
    steps.forEach(function (s) {
      window.__deckLater(function () { if (myGen === window.__deckGen()) s.classList.add('lit'); }, 150 + (+s.dataset.step - 1) * interval);
    });
  };
  /* 이미 활성인 슬라이드 재가동 (모듈 로드 순서 대비) */
  var on = document.querySelector('.slide.on');
  if (on) Array.prototype.forEach.call(on.querySelectorAll('[data-seq]'), function (st) { window.__runStage(st, window.__deckGen()); });
})();
</script>
```
<!-- /MODULE -->

사용: `<div data-seq data-interval="600"><li data-step="1">…</li><li data-step="2">…</li></div>`

---

## 11. MODULE: svg-drawing (feature) — SVG 순차 드로잉

플로우차트 선을 `stroke-dashoffset`으로 하나씩 그린다. **자동 적용 신호**: 프로세스/플로우/파이프라인/의존 관계.

> **함정(주석 유지)**: ① `transition` shorthand 금지 — delay가 0으로 리셋됨. ② 화살촉(marker-end)은 dashoffset에 안 걸려 선보다 먼저 뜨므로 opacity를 함께 페이드. ③ `.slide:not(.on)`에서 transition을 끊어 재진입 잔상 차단. ④ 고정값 `stroke-dasharray`를 실제 길이가 더 긴 선에 적용하면 선과 공백이 반복되어 연결선이 여러 조각으로 끊긴다. 모든 `.eg` SVGGeometryElement에 `pathLength="1"`을 넣고, 아래 JS 안전망도 함께 삽입한다.

<!-- MODULE: svg-drawing-css (feature) -->
```css
.fc { width: 100%; height: auto; overflow: visible; }
.fc text { font-family: var(--font-family); fill: var(--text-primary); }
.fc .nd rect, .fc .nd circle { fill: var(--surface); stroke: var(--border-accent); stroke-width: 1.5; }
.fc .nd.accent rect, .fc .nd.accent circle { fill: none; stroke: var(--accent-1); stroke-width: 2; }
.fc .nd { opacity: 0; transition: opacity .5s ease; transition-delay: calc(var(--i) * .1s); }
.slide.on .fc .nd { opacity: 1; }
/* 선: dashoffset 드로잉 + opacity 동시 페이드 (마커 조기 표시 방지) */
.fc .eg {
  stroke: var(--border-accent); stroke-width: 1.6; fill: none;
  stroke-dasharray: 1; stroke-dashoffset: 1; opacity: 0;       /* pathLength="1" 기준: 실제 길이와 무관하게 전체 선을 한 번에 드로잉 */
  transition: stroke-dashoffset .7s ease, opacity .25s ease;   /* shorthand 금지 */
  transition-delay: calc(var(--i) * .1s);
}
.fc .eg.accent { stroke: var(--accent-1); }
.slide.on .fc .eg { stroke-dashoffset: 0; opacity: 1; }
.slide:not(.on) .fc .nd, .slide:not(.on) .fc .eg { transition: none; }   /* 잔상 차단 */
```
<!-- /MODULE -->

마커 id는 슬라이드마다 고유값(`diag-arrow-s{N}`). `<defs><marker id="diag-arrow-s5" …>`. 선(`<path>`, `<line>`, `<polyline>` 등 `.eg` SVGGeometryElement)에는 **반드시 `pathLength="1"`**을 붙여 전체 길이를 1로 정규화하고, `style="--i:0"`, `--i:1`… 로 스태거한다. 예: `<path class="eg accent" style="--i:3" pathLength="1" d="…" marker-end="url(#diag-arrow-s5)"></path>`.

마크업 누락이 다시 긴 선 파손으로 이어지지 않도록 CSS와 함께 아래 안전망을 삽입한다. 이 스크립트는 첫 슬라이드 활성화 전에 모든 `.eg` geometry를 같은 척도로 정규화한다. 작성된 HTML에도 `pathLength="1"`을 남겨야 하며, 스크립트는 방어 수단이지 마크업 생략 허가가 아니다.

<!-- MODULE: svg-drawing-js (feature) -->
```html
<script>
/* SVG 드로잉 길이 정규화 — 긴 path/line/polyline도 하나의 연속선으로 그린다. */
(function () {
  if (document.documentElement.classList.contains('presenter')) return;
  window.__normalizeSvgEdges = function (root) {
    Array.prototype.forEach.call((root || document).querySelectorAll('.fc .eg'), function (edge) {
      if (typeof edge.getTotalLength !== 'function') return;
      edge.setAttribute('pathLength', '1');
    });
  };
  window.__normalizeSvgEdges(document);
})();
</script>
```
<!-- /MODULE -->

---

## 12. MODULE: lightbox (feature) — 클릭 확대

모든 `.slide svg, .slide img`를 클릭하면 전체화면 확대. **자동 적용 신호**: 이미지/스크린샷/도표/복잡한 SVG 다이어그램 존재.

<!-- MODULE: lightbox-css (feature) -->
```css
.slide svg, .slide img { cursor: zoom-in; transition: outline-color .18s ease, filter .18s ease; }
.slide svg:hover, .slide img:hover { outline: 1.5px solid var(--border-accent); outline-offset: 3px; filter: brightness(1.05); }
.lightbox { position: fixed; inset: 0; z-index: 200; display: flex; align-items: center; justify-content: center; padding: 3vh 3vw; background: rgba(6,10,18,.9); -webkit-backdrop-filter: blur(10px) saturate(1.05); backdrop-filter: blur(10px) saturate(1.05); cursor: zoom-out; visibility: hidden; opacity: 0; pointer-events: none; transition: opacity .22s ease, visibility 0s linear .22s; }
.lightbox.open { visibility: visible; opacity: 1; pointer-events: auto; transition: opacity .22s ease; }
.lb-stage { display: flex; align-items: center; justify-content: center; cursor: default; transform: scale(.97); transition: transform .24s cubic-bezier(.22,1,.36,1); filter: drop-shadow(0 30px 80px rgba(0,0,0,.6)); }
.lightbox.open .lb-stage { transform: scale(1); }
.lb-svgbox { box-sizing: border-box; background: var(--bg-card); border: 1px solid var(--line); border-radius: 18px; padding: clamp(18px, 3vh, 44px); }
.lb-svgbox svg { display: block; width: 100%; height: 100%; cursor: default; outline: none; filter: none; }
.lb-imgbox img { display: block; width: 100%; height: 100%; object-fit: contain; border-radius: 12px; border: 1px solid var(--line); outline: none; filter: none; cursor: default; }
.lb-close { position: fixed; top: 20px; right: 26px; z-index: 201; width: 46px; height: 46px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; background: var(--surface); border: 1px solid var(--line); color: var(--text-primary); font-size: 19px; }
.lb-close:hover { transform: scale(1.06); }
.lb-hint { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 201; font-family: var(--mono); font-size: 12px; letter-spacing: .1em; color: var(--text-muted); pointer-events: none; }
```
<!-- /MODULE -->

<!-- MODULE: lightbox-js (feature) -->
```html
<script>
/* 클릭 확대 라이트박스 — svg는 부모 클래스를 래퍼로 재현해 CSS 상속(fill/stroke) 복원 */
(function () {
  if (document.documentElement.classList.contains('presenter')) return;
  var lb = document.createElement('div');
  lb.className = 'lightbox'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true');
  lb.innerHTML = '<button class="lb-close" type="button" aria-label="닫기">✕</button><div class="lb-stage"></div><div class="lb-hint">클릭 · ESC 로 닫기</div>';
  document.body.appendChild(lb);
  var stage = lb.querySelector('.lb-stage'), closeBtn = lb.querySelector('.lb-close');
  window.__lightboxOpen = function () { return lb.classList.contains('open'); };

  function openWith(el) {
    stage.innerHTML = '';
    if (el.tagName.toLowerCase() === 'svg') {
      var vb = el.viewBox && el.viewBox.baseVal;
      var ar = (vb && vb.height) ? (vb.width / vb.height) : 1.6;
      var box = document.createElement('div');
      box.className = 'lb-svgbox'; box.style.aspectRatio = String(ar); box.style.width = 'min(94vw, calc(92vh * ' + ar + '))';
      var ctx = document.createElement('div');
      ctx.style.cssText = 'width:100%;height:100%;display:block;flex:none;opacity:1;transform:none';
      var parent = el.parentElement;
      if (parent && parent.className) ctx.className = parent.className;
      var clone = el.cloneNode(true);
      clone.removeAttribute('width'); clone.removeAttribute('height'); clone.style.width = '100%'; clone.style.height = '100%';
      clone.style.opacity = '1'; clone.style.transform = 'none'; clone.classList.remove('rv');   /* 루트 svg의 등장 애니 상태만 해제 */
      clone.querySelectorAll('[data-step]').forEach(function (s) { s.classList.add('lit'); });
      /* 하위 노드는 opacity/dashoffset만 리셋 — transform은 건드리지 않는다(Mermaid 등 <g transform="translate()"> 구조 배치 보존) */
      clone.querySelectorAll('*').forEach(function (n) { if (n.classList) n.classList.remove('rv'); if (n.style) { n.style.opacity = '1'; n.style.strokeDashoffset = '0'; } });
      ctx.appendChild(clone); box.appendChild(ctx); stage.appendChild(box);
    } else {
      if (!el.naturalWidth) return;
      var iar = el.naturalWidth / el.naturalHeight;
      var ibox = document.createElement('div');
      ibox.className = 'lb-imgbox'; ibox.style.aspectRatio = String(iar); ibox.style.width = 'min(94vw, calc(92vh * ' + iar + '))';
      var img = document.createElement('img'); img.src = el.currentSrc || el.src; img.alt = el.alt || '';
      ibox.appendChild(img); stage.appendChild(ibox);
    }
    lb.classList.add('open');
  }
  function close() { lb.classList.remove('open'); setTimeout(function () { if (!lb.classList.contains('open')) stage.innerHTML = ''; }, 240); }

  document.addEventListener('click', function (e) {
    if (lb.classList.contains('open')) return;
    var t = e.target.closest('.slide svg, .slide img');
    if (!t || t.closest('a')) return;
    if (t.tagName.toLowerCase() === 'img' && !t.naturalWidth) return;
    e.preventDefault(); openWith(t);
  });
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target === stage || e.target === closeBtn) close(); });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    e.stopImmediatePropagation(); e.preventDefault();
  }, true);
})();
</script>
```
<!-- /MODULE -->

---

## 13. MODULE: video (feature) — 비디오 자동재생 거버넌스

활성 슬라이드(`.on`)의 `<video>`만 무음 자동재생, 이탈 시 정지+되감기. **자동 적용 신호**: `.mp4`/데모 영상 에셋 존재. (에셋이 없으면 삽입하지 않는다.)

<!-- MODULE: video-js (feature) -->
```html
<script>
/* 데모 영상 — 활성 슬라이드(.on)에서만 무음 재생, 이탈 시 정지 + 되감기 */
(function () {
  if (document.documentElement.classList.contains('presenter')) return;
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  function sync(sl) {
    var on = sl.classList.contains('on');
    Array.prototype.forEach.call(sl.querySelectorAll('video'), function (v) {
      v.muted = true;
      if (on) { try { v.currentTime = 0; } catch (e) {} var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      else v.pause();
    });
  }
  var mo = new MutationObserver(function (muts) { muts.forEach(function (m) { if (m.attributeName === 'class') sync(m.target); }); });
  slides.forEach(function (sl) { if (sl.querySelector('video')) { mo.observe(sl, { attributes: true, attributeFilter: ['class'] }); sync(sl); } });
})();
</script>
```
<!-- /MODULE -->

비디오 마크업 규격: `<video muted playsinline preload="metadata" poster="...">`. 소리가 꼭 필요하면 `controls` 추가(자동재생은 무음만 허용). 배속이 필요하면 위 `sync` 안에서 `v.playbackRate = 2;` 추가.

---

## 14. MODULE: dataviz (feature) — CSS/SVG 수제 차트·조직도

차트 라이브러리 없이 순수 CSS로 그린다. **자동 적용 신호**: 정량 데이터/비교/추이(막대), 조직/계층/팀(조직도). 단순 차트는 Chart.js보다 이걸 우선.

<!-- MODULE: dataviz-css (feature) -->
```css
/* 오버레이 막대차트 (예상=점선 ghost, 실측=fill) */
.md-row { margin-bottom: 1.6vh; }
.md-label { font-size: clamp(12px, 1.6vh, 14px); color: var(--text-secondary); margin-bottom: 6px; display: flex; justify-content: space-between; }
.md-plot { position: relative; height: clamp(28px, 4vh, 40px); border-left: 1px solid var(--line);
  background: linear-gradient(var(--line-soft), var(--line-soft)) no-repeat 50% 0 / 1px 100%; }
.md-plot .ghost, .md-plot .fill { position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 0; }
.md-plot .ghost { height: clamp(16px, 2.6vh, 24px); border: 1.5px dashed rgba(217,119,43,.6); border-left: none; background: rgba(217,119,43,.07); border-radius: 0 6px 6px 0; }
.md-plot .fill { height: clamp(7px, 1.2vh, 11px); background: linear-gradient(90deg, color-mix(in srgb, var(--accent-2) 55%, transparent), var(--accent-2) 85%); border-radius: 0 4px 4px 0; box-shadow: 0 0 0 2px var(--bg); }
.slide.on .md-plot .ghost { animation: mdgrow .5s cubic-bezier(.22,1,.36,1) forwards; animation-delay: var(--g, 0s); }
.slide.on .md-plot .fill  { animation: mdgrow .55s cubic-bezier(.22,1,.36,1) forwards; animation-delay: var(--f, .15s); }
@keyframes mdgrow { from { opacity: 1; width: 0; } to { opacity: 1; width: var(--w); } }

/* CSS-only 조직도 */
.org-tier { display: flex; justify-content: center; gap: clamp(8px, 1.1vw, 16px); }
.org-tier.members { position: relative; padding-top: clamp(16px, 2.4vh, 26px); --stem: clamp(16px, 2.4vh, 26px); --hgap: clamp(8px, 1.1vw, 16px); }
.org-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: clamp(10px, 1.5vh, 16px); text-align: center; flex: 1; min-width: 0; }
.org-card.lead { flex: 0 1 auto; border-color: var(--accent-1); }
.org-tier.members .org-card { position: relative; }
.org-tier.members .org-card::before { content: ''; position: absolute; top: calc(var(--stem) * -1); left: 50%; width: 2px; height: var(--stem); background: var(--line); }
.org-tier.members .org-card::after { content: ''; position: absolute; top: calc(var(--stem) * -1); left: calc(var(--hgap) * -0.5); right: calc(var(--hgap) * -0.5); height: 2px; background: var(--line); }
.org-tier.members .org-card:first-child::after { left: 50%; }
.org-tier.members .org-card:last-child::after { right: 50%; }
```
<!-- /MODULE -->

막대 사용: `<div class="md-plot"><span class="fill" style="--w:72%;--f:.1s"></span></div>`. 조직도는 `.org-tier`(리더) + `.org-tier.members`(하위) 2단.

워터폴(증감 흐름) 차트. **자동 적용 신호**: 총량 → 감소/증가 → 결과의 누적 분해(예: 필드 수, 예산, 성능 예산). base=총량 막대, cut=감소분(빗금), total=결과 막대.

<!-- MODULE: dataviz-waterfall (feature) -->
```css
.wfall { display:flex; flex-direction:column; gap:1.4vh; margin-top:1vh; }
.wfall-row { display:grid; grid-template-columns:150px 1fr 74px; align-items:center; gap:14px; }
.wfall-label { font-size:clamp(12px,1.6vh,14px); color:var(--text-secondary); }
.wfall-track { position:relative; height:clamp(22px,3.2vh,32px); background:linear-gradient(var(--line-soft),var(--line-soft)) no-repeat 0 100% / 100% 1px; }
.wfall-bar { position:absolute; top:50%; transform:translateY(-50%); height:70%; border-radius:5px; transform-origin:left center; }
.wfall-bar.base { background:linear-gradient(90deg,color-mix(in srgb,var(--accent-1) 55%,transparent),var(--accent-1) 85%); }
.wfall-bar.cut { background:repeating-linear-gradient(45deg,rgba(255,107,157,.45),rgba(255,107,157,.45) 6px,rgba(255,107,157,.15) 6px,rgba(255,107,157,.15) 12px); border:1px dashed var(--accent-3); }
.wfall-bar.total { background:linear-gradient(90deg,color-mix(in srgb,var(--accent-2) 55%,transparent),var(--accent-2) 85%); }
.slide.on .wfall-bar { animation:wfgrow .55s cubic-bezier(.22,1,.36,1) both; animation-delay:var(--d,0s); }
@keyframes wfgrow { from { opacity:0; transform:translateY(-50%) scaleX(.4); } to { opacity:1; transform:translateY(-50%) scaleX(1); } }
.wfall-val { font-family:var(--mono); font-size:clamp(12px,1.7vh,15px); text-align:right; font-weight:700; }
.wfall-val.minus { color:var(--accent-3); }
.wfall-val.eq { color:var(--accent-2); }
/* 비활성 슬라이드 애니 잔상 차단 (svg-drawing의 .slide:not(.on) 규칙과 동일 맥락) */
.slide:not(.on) .wfall-bar { animation:none !important; opacity:1 !important; }
```
<!-- /MODULE -->

워터폴 사용(base=총량, cut=감소 빗금, total=결과):
```html
<div class="wfall rv" style="--d:.14s">
  <div class="wfall-row"><div class="wfall-label">직렬화 필드</div><div class="wfall-track"><span class="wfall-bar base" style="left:0; width:100%; --d:0s"></span></div><div class="wfall-val">17</div></div>
  <div class="wfall-row"><div class="wfall-label">미참조</div><div class="wfall-track"><span class="wfall-bar cut" style="left:76%; width:24%; --d:.15s"></span></div><div class="wfall-val minus">−4</div></div>
  <div class="wfall-row"><div class="wfall-label">실사용</div><div class="wfall-track"><span class="wfall-bar total" style="left:0; width:76%; --d:.3s"></span></div><div class="wfall-val eq">13</div></div>
</div>
```

### Mermaid deck 연동 — 활성 슬라이드 지연 렌더

초기 hidden(`position:absolute`) 슬라이드에서 `startOnLoad:true`로 자동 렌더하면 컨테이너 폭·높이가 0 또는 잘못된 값으로 계산될 수 있다. `startOnLoad:false`로 초기화하고, 활성 슬라이드 진입(`deck:change`) 후에만 렌더한다. 모바일에서는 모든 슬라이드가 세로로 보이므로 전체 Mermaid 노드를 렌더한다. 단순 노드/플로우는 정본 SVG 드로잉(§11)·조직도(`.org-tier`)로 대체를 권장한다.

> **주의 (Mermaid 컨테이너 여백)**: `pre.mermaid`에 큰 `min-height` 스테이지를 잡고 `align-items:center`로 다시 중앙 정렬하면, 짧은 LR 플로우가 스테이지 중앙에 떠서 제목↔다이어그램 사이에 과도한 **이중 여백**이 생긴다. `min-height`는 과하지 않게 두고 `align-items:flex-start`로 상단 정렬한다(남는 공간이 다이어그램 아래로 몰려 제목 바로 밑 리듬이 콘텐츠 슬라이드와 일치). `min-height`는 floor라 큰 다이어그램은 그대로 확장된다.
> ```css
> .mermaid { display:flex; justify-content:center; align-items:flex-start; min-height:clamp(160px,24vh,340px); }
> .mermaid svg { max-width:100%; height:auto; }
> ```

Mermaid CDN 뒤에 아래 모듈을 그대로 삽입한다. `data-mermaid-pending`은 빠른 전환·resize 중 같은 노드가 중복 렌더되는 것을 막는다.

<!-- MODULE: mermaid-deferred-js (feature) -->
```html
<script>
/* Mermaid — hidden 슬라이드의 0-size 렌더를 피하고 활성화 뒤에 그린다. */
(function () {
  if (!window.mermaid || document.documentElement.classList.contains('presenter')) return;
  mermaid.initialize({
    theme: 'dark', /* Light 테마는 'default' */
    startOnLoad: false,
    fontFamily: "'NanumSquareNeo','Noto Sans KR',sans-serif"
  });

  function pendingNodes(root) {
    return Array.prototype.filter.call((root || document).querySelectorAll('pre.mermaid'), function (node) {
      return !node.hasAttribute('data-processed') && !node.hasAttribute('data-mermaid-pending');
    });
  }
  function render(root) {
    var nodes = pendingNodes(root);
    if (!nodes.length) return;
    nodes.forEach(function (node) { node.setAttribute('data-mermaid-pending', ''); });
    Promise.resolve(mermaid.run({ nodes: nodes })).catch(function (error) {
      nodes.forEach(function (node) { node.removeAttribute('data-mermaid-pending'); });
      console.error('[slides] Mermaid render failed', error);
    });
  }
  function renderVisible() {
    if (window.matchMedia('(max-width: 820px)').matches) render(document);
    else {
      var active = document.querySelector('.slide.on');
      if (active) render(active);
    }
  }

  document.addEventListener('deck:change', function (event) {
    var slides = window.__deckSlides || [];
    render(slides[event.detail.index]);
  });
  requestAnimationFrame(function () { requestAnimationFrame(renderVisible); });
  var resizeTimer = 0;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(renderVisible, 120);
  });
})();
</script>
```
<!-- /MODULE -->

---

## 15. MODULE: lottie (feature) — Lottie 인트로

브랜드 오프닝 임팩트. **자동 적용 신호**: 인트로 애니메이션 에셋(`assets/*.anim.js` 등)이 실제로 존재할 때만. 없으면 §9의 정적 히어로로 대체.

<!-- MODULE: lottie-js (feature) -->
```html
<script src="https://cdn.jsdelivr.net/npm/lottie-web@5.12.2/build/player/lottie_light.min.js"></script>
<script src="assets/intro-lottie.anim.js"></script> <!-- window.INTRO_ANIM 정의 -->
<script>
/* Lottie 인트로 — 활성 진입마다 1회 재생 후 유휴 세그먼트 루프. lottie/데이터 부재 시 정적 폴백 */
(function () {
  if (document.documentElement.classList.contains('presenter')) return;
  var box = document.getElementById('introLottie'); if (!box) return;
  var slide = box.closest('.slide');
  var LOOP = [ /* from */ 0, /* to */ 60 ];   /* 유휴 루프 구간 — 에셋에 맞게 조정 */
  var anim = null, failed = false;
  function ensure() {
    if (anim || failed) return anim;
    if (!window.lottie || !window.INTRO_ANIM) { failed = true; box.outerHTML = '<div class="intro-fallback">' + (box.dataset.fallback || '') + '</div>'; return null; }
    anim = lottie.loadAnimation({ container: box, renderer: 'svg', loop: false, autoplay: false, animationData: window.INTRO_ANIM });
    anim.addEventListener('complete', function () { anim.loop = true; anim.playSegments(LOOP, true); });
    return anim;
  }
  function sync() {
    var a = ensure(); if (!a) return;
    if (slide.classList.contains('on')) { a.loop = false; a.resetSegments(true); a.goToAndStop(0, true); a.play(); }
    else a.stop();
  }
  new MutationObserver(function (muts) { muts.forEach(function (m) { if (m.attributeName === 'class') sync(); }); }).observe(slide, { attributes: true, attributeFilter: ['class'] });
  sync();
})();
</script>
```
<!-- /MODULE -->

---

## 16. highlight.js CDN (feature) — 코드 구문 강조

**자동 적용 신호**: 코드 블럭 존재.

```html
<!-- head: Dark -->  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css">
<!-- head: Light --> <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css">
<!-- body 끝 -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
<script>hljs.highlightAll();</script>
```

마크업: `<pre><code class="language-{lang}">…</code></pre>`. `language-` 접두사 필수.

> **주의(common 번들 언어 한계)**: `highlight.min.js` 공용 번들에는 일부 언어가 빠져 있다(대표적으로 `http`). 번들에 없는 언어를 `language-…`로 지정하면 콘솔 WARN + no-highlight 폴백이 뜬다. 지원이 확실한 언어(`bash`·`json`·`javascript`·`typescript`·`kotlin`·`java`·`python`·`sql`·`yaml`·`xml`·`css` 등)로 지정하거나, 특수 언어가 꼭 필요하면 해당 언어 컴포넌트를 추가 로드한다.

---

## 17. 조립 가이드 (skeleton 삽입 순서)

```
<!DOCTYPE html><html lang="ko">
<head>
  <meta charset/viewport>
  <title>
  [MODULE presenter-headscript]        ← 첫 페인트 전 (필수, 최상단)
  [highlight.js/KaTeX CSS — 필요시]
  <style>
    §2 폰트 @font-face
    §1 테마 토큰(:root)
    [MODULE core-css]                  ← baseline
    [MODULE fluid-css][fluid-responsive]← baseline
    [MODULE nav-hud-css]               ← baseline
    [MODULE reveal-css]                ← baseline
    [MODULE notes-css]                 ← baseline
    [MODULE presenter-css]             ← baseline
    [MODULE components-css]            ← baseline (사용분만)
    [MODULE components-ext-css]        ← baseline (사용분만 — 목록·강조·구간·근거 스탬프)
    [MODULE sequencer/svg-drawing/lightbox/dataviz-css] ← feature (신호 있을 때)
  </style>
</head>
<body>
  [MODULE nav-hud-markup]              ← HUD + fs-btn + notesBtn
  <div class="stagebg"></div>          ← 선택적 배경
  <div class="deck">
    <section class="slide slide--title" data-name="..." data-part="0부 여는 장">…<aside class="slide-notes" hidden>…</aside></section>
    … 슬라이드 N개 …
  </div>
  [MODULE presenter-markup]            ← 발표자 창 UI (baseline)

  <!-- 스크립트: core → nav-hud → notes → presenter → feature → highlight -->
  [MODULE core-js]                     ← 반드시 첫 스크립트
  [MODULE nav-hud-js]
  [MODULE notes-js]
  [MODULE presenter-js]
  [MODULE sequencer-js / svg-drawing-js / video-js / lightbox-js / lottie-js] ← feature (신호 있을 때)
  [Mermaid CDN + MODULE mermaid-deferred-js] ← 복잡한 다이어그램이 있을 때
  [highlight.js — 코드 있을 때]
</body></html>
```

**엔진 무결성 체크(생성 후 self-check)**: `__deckGo` / `requestAnimationFrame(...requestAnimationFrame` / `slides.length` / `[?&]presenter`(발표자 headscript 정규식 — 리터럴 `?presenter`는 정본이 문자열 연결로 생성하므로 검사 토큰으로 부적합) / `hudBar` 가 결과물에 모두 존재해야 한다. (self-check.md M5와 동일 집합)

**발표자 브리지 무결성**: `__openPresenter` / `__presenterOpen` / `yowu-presenter-hello` / `yowu-deck-sync` 가 모두 존재해야 한다. 위 M5 집합은 headscript만 보므로 별창을 여는 코드가 통째로 빠져도 통과한다. (self-check.md M8과 동일 집합)
