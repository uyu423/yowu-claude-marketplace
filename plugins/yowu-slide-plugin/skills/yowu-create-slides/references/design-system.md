# Presentation Design System v3 — Deck Engine (정본)

> **이 문서는 v3 `deck` 엔진의 유일 정본(canonical source)이다.**
> 슬라이드 라이브러리(reveal.js 등) 없이, 단일 HTML 파일 안에서 `position:absolute + .on` 페이지 넘김 방식으로
> 상용 프레젠테이션 SW급 인터랙티브 덱을 구현한다. 프로덕션급 상태 모델·엣지케이스 방어를 코드화했다.
>
> **생성 규칙**: SKILL.md는 이 문서의 각 `MODULE` 블록을 **그대로 복사해 인라인 삽입**한다. 코드를 재발명하지 않는다.
> `assets/example-{dark,light}.html`은 이 정본으로부터 생성된 골든 참조 산출물이다(정본 아님).
>
> **모듈 경계**: 각 모듈은 `<!-- MODULE: name (baseline|feature) -->` ~ `<!-- /MODULE -->`로 구획된다.
> - **baseline** = 모든 덱에 항상 삽입 (core, fluid, nav-hud, reveal, notes, presenter, components)
> - **feature** = SKILL.md Capability Planning 판단에 따라 조건부 삽입 (sequencer, svg-drawing, lightbox, video, dataviz, lottie)
> - feature 모듈은 해당 콘텐츠 신호가 없으면 삽입하지 않는다(파일 크기 최적화).
>
> **핵심 불변식(절대 훼손 금지)**:
> 1. `.on` 단일 클래스가 활성 슬라이드의 유일 진실원. CSS·시퀀서·비디오·라이트박스·발표자보기가 모두 이를 구독.
> 2. 슬라이드 전환은 `gen` 세대 토큰으로 이전 타이머를 무효화(경쟁 상태 차단).
> 3. 시작은 **더블 rAF** 후 `go()` 호출 — 즉시 호출하면 드로잉 transition이 발화하지 않는다.
> 4. 페이지 총수는 `slides.length`로 런타임 자동 계산 — 하드코딩 금지.
> 5. `?presenter` 판정은 첫 페인트 전 `<head>` 최상단 스크립트로 — FOUC 방지.

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
.slide__inner, .inner { width: min(1160px, 100%); margin: 0 auto; }
/* 텍스트 위주 슬라이드는 더 좁게 */
.slide--content .slide__inner, .slide--quote .slide__inner { max-width: 820px; }

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
  width: auto; align-self: center;
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
  .slide .rv, .slide .rvx { opacity: 1 !important; transform: none !important; animation: none !important; }
  .card-grid, .stat-row, .comparison, .workflow-grid, .flow-container, .code-cmp { grid-template-columns: 1fr !important; flex-direction: column; }
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
    else if (e.key === 'p' || e.key === 'P') { if (window.__openPresenter) window.__openPresenter(); }
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

## 7. MODULE: notes (baseline) — 발표자 노트 + 토글

각 슬라이드 끝에 `<aside class="slide-notes" hidden>` 5요소 노트. Shift+N 토글. **발표자 보기(§8)의 대본 데이터 소스이기도 하다.**

<!-- MODULE: notes-css (baseline) -->
```css
aside.slide-notes { display: none; }
body.notes-visible aside.slide-notes {
  display: block;
  margin-top: 3vh; padding: 18px 22px;
  background: var(--surface); border-left: 3px solid var(--accent-1);
  border-radius: 0 12px 12px 0;
  font-size: 13px; line-height: 1.6; color: var(--text-secondary); max-width: 820px;
}
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

마크업: HUD 마크업 옆에 `<button class="notes-btn" id="notesBtn" type="button" aria-label="발표자 노트 토글" title="노트 (Shift+N)" aria-pressed="false">N</button>` 추가. 노트 5요소 구조는 `references/note-protocol.md` 참조.

<!-- MODULE: notes-js (baseline) -->
```html
<script>
/* 발표자 노트 토글 (Shift+N) */
(function () {
  var btn = document.getElementById('notesBtn');
  if (!btn) return;
  var body = document.body;
  function sync() {
    var active = body.classList.contains('notes-visible');
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  }
  btn.addEventListener('click', function () { body.classList.toggle('notes-visible'); sync(); });
  document.addEventListener('keydown', function (e) {
    if (!(e.shiftKey && (e.key === 'N' || e.key === 'n'))) return;
    if (e.isComposing) return;
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    btn.click();
  });
})();
</script>
```
<!-- /MODULE -->

---

## 8. MODULE: presenter (baseline) — 발표자 보기 (postMessage 팝업 동기화)

`P` 키로 같은 파일을 `?presenter` 별창으로 열어 대본·타이머·다음 슬라이드·진행바를 표시하고 양방향 동기화한다.
**대본은 별도 객체가 아니라 각 슬라이드의 `aside.slide-notes`에서 직접 읽는다.**

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
.pv-timer { font-family: var(--mono); font-size: 21px; font-weight: 600; color: var(--accent-2); background: none; border: 1px solid var(--line); border-radius: 10px; padding: 4px 15px; cursor: pointer; }
.pv-timer:hover { border-color: var(--accent-2); }
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
    <button class="pv-timer" id="pvTimer" title="클릭/T: 타이머 리셋">00:00</button>
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
    <span class="pv-keys">← → 이동 · T 타이머 · +/- 글자크기</span>
  </div>
</div>
```
<!-- /MODULE -->

<!-- MODULE: presenter-js (baseline) -->
```html
<script>
/* ═══ 발표자 보기 ═══
   메인 덱: P 키로 ?presenter 별창 오픈, postMessage로 현재 인덱스 push.
   발표자 창: aside.slide-notes를 대본으로 렌더 + 타이머 + 다음 슬라이드. 방향키는 opener로 되돌림.
   file:// origin 불투명 → targetOrigin '*' 고정. */
(function () {
  var isPresenter = document.documentElement.classList.contains('presenter');
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  function pad(n) { return (n < 10 ? '0' : '') + n; }
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
    window.__openPresenter = function () {
      if (win && !win.closed) { try { win.focus(); } catch (e) {} window.__deckSync(window.__deckCur()); return; }
      var base = location.href.split('#')[0];
      win = window.open(base + (base.indexOf('?') > -1 ? '&' : '?') + 'presenter', 'yowu-presenter', 'width=1180,height=760');
      if (!win) return;
      var tries = 0;
      kick = setInterval(function () {
        if (++tries > 40 || !win || win.closed) { clearInterval(kick); return; }
        window.__deckSync(window.__deckCur());
      }, 250);
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
  var elCount = document.getElementById('pvCount'), elBar = document.getElementById('pvBar'),
      elKicker = document.getElementById('pvKicker'), elTitle = document.getElementById('pvTitle'),
      elNotes = document.getElementById('pvNotes'), elNextTitle = document.getElementById('pvNextTitle'),
      elTimer = document.getElementById('pvTimer'), elLink = document.getElementById('pvLink');

  function render(i) {
    if (typeof i !== 'number' || i < 0 || i >= slides.length) return;
    elCount.textContent = pad(i + 1) + ' / ' + pad(slides.length);
    elBar.style.width = ((i + 1) / slides.length * 100) + '%';
    elKicker.textContent = kickerOf(i);
    elTitle.textContent = titleOf(i);
    elNotes.innerHTML = notesOf(i);
    elNotes.scrollTop = 0;
    elNextTitle.textContent = (i + 1 < slides.length) ? titleOf(i + 1) : '(마지막 슬라이드)';
  }

  var t0 = null;
  function resetTimer() { t0 = Date.now(); elTimer.textContent = '00:00'; }
  setInterval(function () {
    if (t0 === null) return;
    var s = Math.floor((Date.now() - t0) / 1000);
    elTimer.textContent = pad(Math.floor(s / 60)) + ':' + pad(s % 60);
  }, 1000);
  elTimer.addEventListener('click', resetTimer);

  var fs = 18; try { fs = +localStorage.getItem('yowu-deck-pv-fs') || 18; } catch (e) {}
  function setFs(v) { fs = Math.min(32, Math.max(13, v)); elNotes.style.fontSize = fs + 'px'; try { localStorage.setItem('yowu-deck-pv-fs', String(fs)); } catch (e) {} }
  setFs(fs);

  var linked = false, deckWin = window.opener;
  window.addEventListener('message', function (e) {
    var d = e.data || {};
    if (d.type !== 'yowu-deck-sync') return;
    deckWin = e.source || deckWin;
    if (!linked) { linked = true; elLink.classList.remove('lost'); elLink.textContent = '메인 덱과 연결됨'; if (t0 === null) resetTimer(); }
    render(d.index);
  });
  function nav(action) { if (deckWin && !deckWin.closed) { try { deckWin.postMessage({ type: 'yowu-deck-nav', action: action }, '*'); } catch (e) {} } }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); nav('next'); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); nav('prev'); }
    else if (e.key === 'Home') nav('home');
    else if (e.key === 'End') nav('end');
    else if (e.key === 't' || e.key === 'T') resetTimer();
    else if (e.key === '+' || e.key === '=') setFs(fs + 1);
    else if (e.key === '-' || e.key === '_') setFs(fs - 1);
  });
  setInterval(function () {
    if (!deckWin || deckWin.closed) { elLink.textContent = '메인 덱 창이 닫혔습니다 — 덱에서 P 키로 다시 여세요'; elLink.classList.add('lost'); linked = false; }
  }, 1500);

  if (window.opener) { try { window.opener.postMessage({ type: 'yowu-presenter-hello' }, '*'); } catch (e) {} }
  else { elLink.textContent = '단독으로 열렸습니다 — 메인 덱에서 P 키로 여세요'; elLink.classList.add('lost'); }
})();
</script>
```
<!-- /MODULE -->

> **자동 적용**: 발표/피칭/보고 목적이면 baseline으로 항상 포함. 순수 열람용(문서 배포) 목적이 명확하면 생략 가능.

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

> **함정(주석 유지)**: ① `transition` shorthand 금지 — delay가 0으로 리셋됨. ② 화살촉(marker-end)은 dashoffset에 안 걸려 선보다 먼저 뜨므로 opacity를 함께 페이드. ③ `.slide:not(.on)`에서 transition을 끊어 재진입 잔상 차단.

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
  stroke-dasharray: 100; stroke-dashoffset: 100; opacity: 0;
  transition: stroke-dashoffset .7s ease, opacity .25s ease;   /* shorthand 금지 */
  transition-delay: calc(var(--i) * .1s);
}
.fc .eg.accent { stroke: var(--accent-1); }
.slide.on .fc .eg { stroke-dashoffset: 0; opacity: 1; }
.slide:not(.on) .fc .nd, .slide:not(.on) .fc .eg { transition: none; }   /* 잔상 차단 */
```
<!-- /MODULE -->

마커 id는 슬라이드마다 고유값(`diag-arrow-s{N}`). `<defs><marker id="diag-arrow-s5" …>`. 선에 `style="--i:0"`, `--i:1`… 스태거.

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
      clone.querySelectorAll('[data-step]').forEach(function (s) { s.classList.add('lit'); });
      clone.querySelectorAll('*').forEach(function (n) { if (n.style) { n.style.opacity = '1'; n.style.transform = 'none'; n.style.strokeDashoffset = '0'; } });
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

> **주의 (Mermaid deck 연동)**: Mermaid를 쓸 경우 반드시 `mermaid.initialize({startOnLoad:false})`로 두고, 첫 페인트 후 또는 활성 슬라이드 진입(`deck:change`) 시점에 `mermaid.run({nodes:...})`로 지연 렌더한다. 초기 hidden(`position:absolute`) 슬라이드에서 `startOnLoad:true` 자동 렌더는 크기가 0으로 잡혀 다이어그램이 깨진다. `SAMPLE_SLIDES.html`처럼 첫 title 슬라이드가 처음부터 보이는 경우는 동작하지만, 숨은 슬라이드에 Mermaid를 두면 이 함정이 발생한다. 단순 노드/플로우는 정본 SVG 드로잉(§11)·조직도(`.org-tier`)로 대체를 권장한다.

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
    [MODULE sequencer/svg-drawing/lightbox/dataviz-css] ← feature (신호 있을 때)
  </style>
</head>
<body>
  [MODULE nav-hud-markup]              ← HUD + fs-btn + notesBtn
  <div class="stagebg"></div>          ← 선택적 배경
  <div class="deck">
    <section class="slide slide--title" data-name="...">…<aside class="slide-notes" hidden>…</aside></section>
    … 슬라이드 N개 …
  </div>
  [MODULE presenter-markup]            ← 발표자 창 UI (baseline)

  <!-- 스크립트: core → nav-hud → notes → presenter → feature → highlight -->
  [MODULE core-js]                     ← 반드시 첫 스크립트
  [MODULE nav-hud-js]
  [MODULE notes-js]
  [MODULE presenter-js]
  [MODULE sequencer-js / video-js / lightbox-js / lottie-js] ← feature (신호 있을 때)
  [highlight.js — 코드 있을 때]
</body></html>
```

**엔진 무결성 체크(생성 후 self-check)**: `__deckGo` / `requestAnimationFrame(...requestAnimationFrame` / `slides.length` / `?presenter` / `hudBar` 가 결과물에 모두 존재해야 한다. (self-check.md M5와 동일 집합)
