# Presentation Design System (심플)

디자인 스타일 선택에서 **"2. 자체 디자인 가이드 (심플)"**을 선택했을 때 사용되는 디자인 시스템.
절제된 미니멀 스타일, 일관된 3단 타이포그래피 위계, 역공학으로 추출한 고품질 패턴 기반.

> `/frontend-design` 선택 시에는 이 문서 대신 frontend-design skill의 지침을 따른다.

---

## 1. Dark Theme (기술 발표, 개발 주제)

```css
:root {
  /* Background */
  --bg: #0a0a0a;
  --bg-gradient: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
  --surface: rgba(255, 255, 255, 0.04);
  --surface-hover: rgba(255, 255, 255, 0.06);
  --border: rgba(255, 255, 255, 0.08);
  --border-accent: rgba(255, 255, 255, 0.12);

  /* Text */
  --text-primary: #f5f5f5;
  --text-secondary: rgba(255, 255, 255, 0.7);
  --text-muted: rgba(255, 255, 255, 0.4);

  /* Accents — 최대 3색, gradient 조합 가능 */
  --accent-1: #00d2ff;   /* cyan */
  --accent-2: #7b2ff7;   /* purple */
  --accent-3: #ff6b6b;   /* coral */

  /* Semantic */
  --accent-gradient: linear-gradient(135deg, var(--accent-1), var(--accent-2));
  --tag-bg: rgba(0, 210, 255, 0.15);
  --tag-color: #00d2ff;

  /* Font — 나눔스퀘어 네오 (본문 기본), @font-face 블럭은 별도 삽입 */
  --font-family: 'NanumSquareNeo', -apple-system, sans-serif;

  /* highlight.js */
  --hljs-theme: github-dark;
}
```

### Dark 배경 변형 (슬라이드별 미세 변화)
```css
.slide--title  { background: var(--bg-gradient); }
.slide--problem { background: linear-gradient(180deg, #0a0a0a, #1a0a0a); }
.slide--solution { background: linear-gradient(180deg, #0a0a1a, #0a1a0a); }
.slide--closing { background: linear-gradient(135deg, #16213e, #1a1a2e, #0a0a0a); }
```

---

## 2. Light Theme (기획 제안, 비즈니스 주제)

```css
:root {
  /* Background */
  --bg: #FAFAF8;
  --bg-gradient: #FAFAF8;
  --surface: #FFFFFF;
  --surface-hover: #F5F4F0;
  --border: #EEEDEB;
  --border-accent: rgba(0, 0, 0, 0.1);

  /* Text */
  --text-primary: #1A1A1A;
  --text-secondary: #555555;
  --text-muted: #888888;

  /* Accents */
  --accent-1: #6C5CE7;   /* purple */
  --accent-2: #00B894;   /* green */
  --accent-3: #F0932B;   /* orange */

  /* Semantic */
  --accent-gradient: linear-gradient(135deg, var(--accent-1), var(--accent-2));
  --tag-bg: #F0EFFF;
  --tag-color: #6C5CE7;

  /* Font — 나눔스퀘어 네오 (본문 기본), @font-face 블럭은 별도 삽입 */
  --font-family: 'NanumSquareNeo', -apple-system, sans-serif;

  /* highlight.js */
  --hljs-theme: github;
}
```

---

## 3. 구조 CSS (공통)

```css
/* 나눔스퀘어 네오 @font-face (필수 weight만 포함) */
@font-face {
  font-family: 'NanumSquareNeo';
  src: url(https://hangeul.pstatic.net/hangeul_static/webfont/NanumSquareNeo/NanumSquareNeoTTF-aLt.woff2);
  font-weight: 300;
  font-display: swap;
}
@font-face {
  font-family: 'NanumSquareNeo';
  src: url(https://hangeul.pstatic.net/hangeul_static/webfont/NanumSquareNeo/NanumSquareNeoTTF-bRg.woff2);
  font-weight: 400;
  font-display: swap;
}
@font-face {
  font-family: 'NanumSquareNeo';
  src: url(https://hangeul.pstatic.net/hangeul_static/webfont/NanumSquareNeo/NanumSquareNeoTTF-cBd.woff2);
  font-weight: 700;
  font-display: swap;
}
@font-face {
  font-family: 'NanumSquareNeo';
  src: url(https://hangeul.pstatic.net/hangeul_static/webfont/NanumSquareNeo/NanumSquareNeoTTF-dEb.woff2);
  font-weight: 800;
  font-display: swap;
}
@font-face {
  font-family: 'NanumSquareNeo';
  src: url(https://hangeul.pstatic.net/hangeul_static/webfont/NanumSquareNeo/NanumSquareNeoTTF-eHv.woff2);
  font-weight: 900;
  font-display: swap;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

/* 페이지 단위 스크롤 스냅 */
html {
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
}
body {
  font-family: var(--font-family);
  background: var(--bg);
  color: var(--text-primary);
  line-height: 1.7;
  overflow-x: hidden;
}

/* 슬라이드 기본 — height 고정 + scroll-snap */
.slide {
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 60px 24px;
  position: relative;
  overflow: hidden;
  scroll-snap-align: start;
}

.slide__inner {
  max-width: 720px;
  margin: 0 auto;
  width: 100%;
}

/* 다크 테마 슬라이드 구분선 */
.slide + .slide {
  border-top: 1px solid var(--border);
}
```

---

## 4. 타이포그래피 스케일

```css
/* 섹션 라벨 — 작은 카테고리 표시 */
.label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--accent-1);
  font-weight: 600;
  margin-bottom: 12px;
}

/* 메인 헤딩 */
h1 {
  font-size: clamp(2.25rem, 8vw, 3.5rem);
  font-weight: 900;
  line-height: 1.15;
  margin-bottom: 20px;
}

h2 {
  font-size: clamp(1.75rem, 5vw, 2.5rem);
  font-weight: 700;
  line-height: 1.3;
  margin-bottom: 16px;
}

h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 12px;
}

/* 본문 설명 */
.desc {
  font-size: 1rem;
  color: var(--text-secondary);
  line-height: 1.8;
  margin-bottom: 32px;
}

/* 통계 숫자 */
.stat-num {
  font-size: clamp(1.75rem, 6vw, 2.5rem);
  font-weight: 800;
  color: var(--accent-1);
}

/* 강조 텍스트 — gradient clip */
.gradient-text {
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 헤딩 내 강조 */
h2 .em { color: var(--accent-1); }
h2 .em2 { color: var(--accent-2); }
h2 .em3 { color: var(--accent-3); }
```

---

## 5. 컴포넌트 패턴

### Card
```css
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
}
.card-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.card-icon { font-size: 2rem; margin-bottom: 10px; }
.card-title { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
.card-desc { font-size: 13px; color: var(--text-muted); line-height: 1.6; }
```

### Stat Box
```css
.stat-row {
  display: flex;
  gap: 12px;
  margin-bottom: 32px;
}
.stat-box {
  flex: 1;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 16px;
  text-align: center;
}
.stat-label {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
}
```

### Timeline
```css
.timeline {
  position: relative;
  padding-left: 32px;
}
.timeline::before {
  content: '';
  position: absolute;
  left: 11px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background: var(--border);
}
.tl-item { position: relative; margin-bottom: 28px; }
.tl-dot {
  position: absolute;
  left: -27px;
  top: 6px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 3px solid var(--accent-1);
  background: var(--bg);
}
.tl-dot.active { background: var(--accent-1); }
.tl-title { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
.tl-desc { font-size: 14px; color: var(--text-muted); }
```

### Flow Diagram
```css
.flow-container {
  display: flex;
  align-items: stretch;
  gap: 0;
}
.flow-step {
  flex: 1;
  text-align: center;
  padding: 28px 20px;
  background: var(--surface);
  border: 1px solid var(--border);
}
.flow-step:first-child { border-radius: 16px 0 0 16px; }
.flow-step:last-child { border-radius: 0 16px 16px 0; }
.flow-num {
  display: inline-block;
  width: 32px; height: 32px;
  line-height: 32px;
  border-radius: 50%;
  background: var(--accent-gradient);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 12px;
}
.flow-arrow {
  display: flex;
  align-items: center;
  font-size: 20px;
  color: var(--text-muted);
  flex-shrink: 0;
  padding: 0 4px;
}
```

### Quote
```css
.quote-box {
  background: var(--surface);
  border-left: 4px solid var(--accent-1);
  border-radius: 0 14px 14px 0;
  padding: 24px;
  margin-bottom: 32px;
}
.quote-text {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1.8;
}
.quote-author {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 8px;
}
```

### Code Block (highlight.js 연동)
```css
pre {
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 24px;
}
pre code {
  font-size: 14px;
  line-height: 1.6;
  padding: 24px !important;
}
```

### Tag / Chip
```css
.tag {
  display: inline-block;
  background: var(--tag-bg);
  color: var(--tag-color);
  padding: 4px 12px;
  border-radius: 99px;
  font-size: 12px;
  font-weight: 500;
  margin: 0 4px 8px 0;
}
```

### Comparison (Side-by-side)
```css
.comparison {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 16px;
  align-items: center;
}
.comparison-col {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
}
.comparison-divider {
  font-size: 24px;
  color: var(--text-muted);
}
```

### Naming / Formula Box
```css
.naming-box {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 32px;
  text-align: center;
  margin-bottom: 32px;
}
.naming-formula {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}
.naming-chip {
  background: var(--tag-bg);
  color: var(--tag-color);
  padding: 8px 16px;
  border-radius: 99px;
  font-size: 14px;
  font-weight: 600;
}
```

---

## 6. Page Number (선택적, 다크 테마 기본 활성)

```css
body { counter-reset: slide; }
.slide::after {
  counter-increment: slide;
  content: counter(slide, decimal-leading-zero);
  position: absolute;
  bottom: 30px;
  right: 40px;
  font-size: 13px;
  color: var(--text-muted);
  font-weight: 500;
}
```

---

## 7. 반응형 (768px 이하)

```css
@media (max-width: 768px) {
  .slide { padding: 40px 24px; }
  .card-grid { grid-template-columns: 1fr; }
  .stat-row { flex-direction: column; }
  .flow-container { flex-direction: column; }
  .flow-step:first-child { border-radius: 16px 16px 0 0; }
  .flow-step:last-child { border-radius: 0 0 16px 16px; }
  .flow-arrow { transform: rotate(90deg); justify-content: center; }
  .comparison { grid-template-columns: 1fr; }
  .comparison-divider { transform: rotate(90deg); }
}
```

---

## 8. highlight.js CDN

```html
<!-- Dark theme -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css">

<!-- Light theme -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css">

<!-- 공통 스크립트 (body 끝) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
<script>hljs.highlightAll();</script>
```

코드 블럭 마크업:
```html
<pre><code class="language-javascript">
const hello = "world";
</code></pre>
```

지원 언어: `javascript`, `typescript`, `python`, `rust`, `go`, `java`, `kotlin`, `css`, `html`, `bash`, `json`, `yaml`, `sql` 등. `language-` 접두사 필수.
