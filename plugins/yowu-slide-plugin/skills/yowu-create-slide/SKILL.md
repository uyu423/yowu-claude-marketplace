---
name: yowu-create-slide
description: >
  미리 디자인된 고품질 reveal.js 템플릿을 기반으로 발표 슬라이드를 생성/수정한다.
  사용자가 슬라이드, 프레젠테이션, 발표자료, 덱을 만들거나 수정하려 할 때 사용한다.
  "발표 만들어줘", "슬라이드 작성", "프레젠테이션 생성", "PPT 대신 HTML 슬라이드",
  "기존 슬라이드 수정", "PDF로 변환" 등의 요청에 트리거된다.
  템플릿 선택 → 콘텐츠 채우기 → 완성의 워크플로를 제공한다.
disable-model-invocation: true
argument-hint: "발표 주제나 목적을 입력하세요"
---

# yowu-create-slide

미리 디자인된 5개의 reveal.js 템플릿을 **페이지 레이아웃 라이브러리**로 활용하여 발표 슬라이드를 생성한다. 템플릿의 각 페이지는 독립적인 레이아웃 패턴이며, AI가 콘텐츠에 맞게 취사선택·재조합·변형하여 새로운 덱을 구성한다.

## 언제 사용하는가

- 발표 슬라이드/프레젠테이션을 새로 만들어야 할 때
- 기존 템플릿 기반 슬라이드를 수정할 때
- 슬라이드를 PDF로 변환해야 할 때
- 어떤 주제든 — 비즈니스, 교육, 크리에이티브, 기술 등 — 발표자료가 필요할 때

## 사용 가능한 템플릿

`references/` 디렉토리에 5개 템플릿이 있다. **모든 템플릿은 특정 용도에 고정되지 않는다.** 원본 내용은 플레이스홀더일 뿐이며, 어떤 주제에든 활용 가능하다.

**핵심 원칙: 템플릿은 "페이지 레이아웃 라이브러리"다.**
- 템플릿의 각 페이지(section)는 독립적인 레이아웃 패턴이다
- 템플릿 전체를 1:1로 그대로 사용하는 것이 아니다
- AI가 콘텐츠에 맞게 **필요한 페이지만 취사선택**한다
- 같은 레이아웃 패턴을 **여러 번 중복 사용**할 수 있다
- 불필요한 페이지는 **사용하지 않는다**
- 템플릿의 레이아웃 패턴을 **변형하여 새로운 페이지**를 만들 수 있다
- 따라서 템플릿의 총 페이지 수는 의미가 없고, **제공하는 레이아웃 패턴의 종류**가 중요하다

| 템플릿 | 색상 톤 | 제공하는 레이아웃 패턴 |
|--------|---------|---------------------|
| `template-blue-1.html` | 파란(#4A6CF7)+흰색, 밝고 깔끔 | 타이틀, 목차(카드그리드), 좌우분할(이미지+텍스트), 상하분할(텍스트+차트), 2단컬럼, 3키워드행, 인과관계(화살표카드), 4단컬럼, 감사페이지 |
| `template-blue-2.html` | 파란(#4A6CF7)+흰색 | 커버, 목차(좌우분할), 소개(이미지+텍스트), 통계카드(3열숫자), 특징행리스트, 차트+배지, 아이콘그리드, 프로세스타임라인, Before/After비교, 감사페이지 |
| `template-catalog-1.html` | 다크차콜(#474F5E)+골드(#9B7F3A) | 커버, 목차카드, 소개(좌우), 3카드(원형이미지), 4포인트그리드, 차트+사이드텍스트, 4컬럼, 섹션디바이더, 가로타임라인, 3컬럼(이미지+텍스트), 인용문카드, 미디어플레이어, 감사페이지 |
| `template-modern-black-1.html` | 연회색(#EDEDEF)+모노크롬 | 타이틀(SVG장식), 프로필(좌사진+우텍스트), 아젠다(넘버링), 체크리스트, 센터질문, 키워드+설명(좌우), 넘버블록3행, 배너카드4열, 이미지Before/After, 넘버탭카드3열, 좌우(아이콘+키워드), Before/After리스트, 도넛차트+범례, 필배지행4열, 스텝계단4단 |
| `template-modern-black-portpolio-1.html` | 블랙(#000)+핑크(#E91E8C) | 커버(수직선+커시브), 슬로건(큰텍스트+라인), 로고+서비스3열, 벤다이어그램, 순환다이어그램, 타임라인(큰원형), 4컬럼(다크), 글로우서클강조, 쇼케이스(라인+점), 비교테이블, 프로젝트카드(2종) |

각 템플릿의 상세 구조는 실제 파일을 읽어서 확인한다. 추천 시에는 반드시 `references/` 내 템플릿을 직접 읽고 **어떤 레이아웃 패턴이 콘텐츠에 필요한지** 판단한다.

## 워크플로

### Step 1: 콘텐츠 분석

사용자의 요청에서 다음을 파악한다:
- 발표 주제/목적
- 대상 청중
- 분위기/톤 (포멀, 캐주얼, 크리에이티브, 다크 등)
- 필요한 슬라이드 수
- 차트/데이터 시각화 필요 여부
- 브랜딩 정보 (회사명, 로고, 연락처 — 있으면)
- 특수 요구사항 (다크 테마, 특정 색상, 코드 블록 등)

### Step 2: 템플릿 추천

`references/` 내 템플릿을 직접 읽고, 아래 판단 기준을 종합하여 1~2개를 추천한다. **고정된 매칭 테이블을 따르지 않는다.**

**판단 기준** (디자인/구성 요소 중심):
- **레이아웃 패턴 종류**: 콘텐츠에 필요한 레이아웃(좌우분할, 통계카드, 프로세스, 비교, 타임라인, 인용문, 테이블 등)을 제공하는 템플릿인가
- **색상 톤**: 밝고 깔끔(blue계열) / 고급 다크+골드(catalog) / 모노톤(modern-black) / 강렬한 다크+네온(portfolio)
- **차트 유무**: 라인(blue-1), 막대(blue-2, catalog), 도넛(modern-black), 없음(portfolio)
- **장식 요소**: SVG패턴(modern-black), 커시브폰트(portfolio), 골드악센트(catalog)

추천 이유를 디자인/구성 요소 관점에서 구체적으로 설명한다. 특정 템플릿을 편향적으로 추천하지 않는다.

추천 결과를 표시할 때, **추천 템플릿 외에 전체 사용 가능한 템플릿 목록도 함께 보여준다.** 형식 예시:

```
**추천: template-modern-black-1** (모노크롬)
→ 추천 이유: 넘버블록, 카드, 체크리스트 등 기술 콘텐츠에 적합한 레이아웃 패턴이 풍부

전체 템플릿 목록:
1. template-blue-1 — 파란+흰색, 좌우분할/2단/3키워드/인과관계/4단 등 다양한 패턴 ⭐ 추천
2. template-blue-2 — 파란+흰색, 통계카드/프로세스/Before-After
3. template-catalog-1 — 다크차콜+골드, 타임라인/인용문/미디어/4컬럼
4. template-modern-black-1 — 모노크롬, 넘버블록/카드/체크리스트/스텝계단 ⭐ 추천
5. template-modern-black-portpolio-1 — 블랙+핑크, 벤다이어그램/글로우서클/비교테이블
```

### Step 3: 사용자 확인

**AskUserQuestion 도구를 사용하여** 사용자에게 템플릿 선택을 요청한다. 추천 템플릿과 전체 목록을 보여준 뒤 번호나 이름으로 선택하도록 안내한다. 사용자가 직접 템플릿명을 지정한 경우 이 단계를 건너뛴다.

### Step 4: 슬라이드 구성 계획

콘텐츠를 분석하여 **필요한 슬라이드 목록**을 먼저 계획한다:
1. 콘텐츠의 각 섹션/포인트를 나열한다
2. 각 섹션에 가장 적합한 **레이아웃 패턴**을 템플릿에서 선택한다
3. 필요하면 같은 패턴을 여러 번 재사용한다
4. 불필요한 패턴은 사용하지 않는다
5. 기존 패턴을 변형하여 새로운 레이아웃을 만들 수도 있다

### Step 5: 슬라이드 생성

1. **새 HTML 파일 생성**: 선택한 템플릿의 CSS/JS/폰트 설정을 복사하고, Step 4에서 계획한 슬라이드만 조합하여 새 파일을 구성한다
2. **콘텐츠 채우기**: Edit 도구로 슬라이드 단위로 수정 (한 번에 전체 파일 쓰지 않음)
   - 플레이스홀더 텍스트 → 실제 내용
   - 이미지 플레이스홀더 → 실제 경로 또는 설명 유지
3. **차트 데이터**: Chart.js 데이터/레이블을 실제 데이터로 교체
4. **브랜딩**: 사용자 요청에 따라 브랜드명, 로고, 연락처 등 교체
5. **CSS 변수**: 색상 팔레트 변경 (필요 시)
6. **결과 요약**: 파일 경로, 슬라이드 구성, 다음 수정 포인트 제안

## 기존 덱 수정

1. 대상 HTML 파일을 Read로 읽기
2. 어떤 템플릿 기반인지 식별 (CSS 변수, 구조로 판단)
3. 수정 요청 사항 파악
4. Edit 도구로 해당 슬라이드만 수정
5. (사용자 요청 시) 스크린샷 검증

## 기본값

- 언어: 한국어
- 해상도: 1280x720 (HD, 16:9)
- 전환 효과: fade
- 브랜딩: 사용자 요청에 따라 결정. 미지정 시 템플릿 기본값 유지
- Reveal.js 설정: `width: 1280, height: 720, margin: 0, transition: 'fade', center: false, controls: false`

## 공통 기술 사양

- **reveal.js 5.1.0** (CDN: `https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/`)
- **NanumSquareNeo** 웹폰트 (Naver CDN, 5가지 weight: 300/400/700/800/900) — 본문 텍스트용. 제목/헤더는 NanumSquareNeo를 강제할 필요 없이 템플릿 기본 설정을 따른다
- **Font Awesome 6.5.1** 아이콘
- **Chart.js** (차트가 있는 템플릿만)
- **단일 HTML 파일** (CSS 내장 `<style>` 태그)

## reveal.js 제약사항

**절대 위반 불가**:
- `<section>` 요소에 `position: relative`를 설정하면 안 됨 — reveal.js가 `position: absolute`로 관리하므로 슬라이드가 깨짐
- 슬라이드 내 콘텐츠 컨테이너에는 `position: relative` 사용 가능

## 코드 블록 처리

코드 블록이 포함되면:
1. RevealHighlight 플러그인 + highlight.js CDN 활성화
2. `<pre><code class="language-xxx">` 구조 사용
3. highlight theme CSS 반드시 포함
4. 코드는 슬라이드당 최대 10줄 기본, 필요 시 초과 가능

```html
<!-- head에 추가 -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/plugin/highlight/monokai.css">

<!-- Reveal.initialize에 추가 -->
<script src="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/plugin/highlight/highlight.js"></script>
plugins: [ RevealHighlight ]
```

## Speaker Notes

- `<aside class="notes">` 패턴 사용
- 모든 슬라이드에 notes 포함을 기본 원칙으로
- RevealNotes 플러그인 기본 활성화

```html
<script src="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/plugin/notes/notes.js"></script>
plugins: [ RevealNotes ]
```

## 토글 버튼

생성되는 HTML에 아래 토글 기능을 내장한다:

### Notes 토글
버튼 클릭으로 슬라이드 내 notes 영역 표시/숨김 전환. 기본: 숨김.

### Print PDF 모드 토글
버튼 클릭으로 `?print-pdf` 모드 진입. 기본: 비활성.

토글 버튼은 슬라이드 우하단 등 비간섭 위치에 배치한다.

```html
<!-- 슬라이드 HTML 하단, Reveal.initialize() 이후에 추가 -->
<div id="slide-toggles" style="position: fixed; bottom: 12px; right: 12px; z-index: 100; display: flex; gap: 8px;">
  <button onclick="toggleNotes()" style="padding: 6px 12px; font-size: 11px; border: 1px solid #ccc; border-radius: 4px; background: rgba(255,255,255,0.85); cursor: pointer; font-family: sans-serif;">
    Notes
  </button>
  <button onclick="togglePrintPdf()" style="padding: 6px 12px; font-size: 11px; border: 1px solid #ccc; border-radius: 4px; background: rgba(255,255,255,0.85); cursor: pointer; font-family: sans-serif;">
    PDF
  </button>
</div>
<script>
  function toggleNotes() {
    document.querySelectorAll('aside.notes').forEach(n => {
      if (n.style.display === 'block') {
        n.style.display = 'none';
      } else {
        n.style.display = 'block';
        n.style.padding = '10px';
        n.style.marginTop = '10px';
        n.style.background = 'rgba(0,0,0,0.05)';
        n.style.borderRadius = '4px';
        n.style.fontSize = '12px';
        n.style.color = '#666';
        n.style.borderLeft = '3px solid #4A6CF7';
      }
    });
  }
  function togglePrintPdf() {
    if (window.location.search.includes('print-pdf')) {
      window.location.search = '';
    } else {
      window.location.search = '?print-pdf';
    }
  }
</script>
```

## PDF Export (사용자 요청 시)

사용자가 PDF 변환을 요청한 경우에만 진행한다.

```bash
npx --yes decktape -- reveal "file.html?export" output.pdf --size 1920x1080
```

스크린샷 동시 생성이 필요하면:
```bash
npx --yes decktape -- reveal "file.html?export" output.pdf \
  --screenshots \
  --screenshots-directory "screenshots/$(date +%Y%m%d_%H%M%S)" \
  --size 1920x1080
```

## 스크린샷 검증 (사용자 요청 시에만)

기본 워크플로에서는 생략. 사용자가 명시적으로 검증을 요청한 경우에만 실행한다.

```bash
# 전체 슬라이드
npx --yes decktape -- reveal "file.html?export" output.pdf \
  --screenshots --screenshots-directory "screenshots/$(date +%Y%m%d_%H%M%S)" --size 1920x1080

# 특정 슬라이드만
npx --yes decktape -- reveal "file.html?export" output.pdf \
  --screenshots --screenshots-directory "screenshots/$(date +%Y%m%d_%H%M%S)" --slides 2,5,7-9 --size 1920x1080
```

Read 도구로 스크린샷을 확인하여:
- 텍스트 overflow/겹침 없는지
- 색상 대비 충분한지
- 레이아웃이 의도대로인지
- 차트가 정상 렌더링되는지

## 디자인 기준

**폰트 크기 보존 (매우 중요)**:
- 콘텐츠를 채울 때 **템플릿 원본의 font-size를 절대 줄이지 않는다**
- 템플릿의 CSS 변수(--h1-size, --h2-size, --text-size 등)와 인라인 font-size 값을 그대로 유지한다
- 내용이 많아서 공간이 부족하면 폰트를 줄이는 대신 **내용을 줄이거나 슬라이드를 나눈다**
- 템플릿 원본에서 `44pt`인 제목은 `44pt`로, `11pt`인 본문은 `11pt`로 유지한다

기타 기준:
- 작은 글씨, overflow, 겹침, 레이아웃 깨짐 금지
- 과한 애니메이션 금지 — fragments와 auto-animate는 최소 사용
- 색 대비 충분히 유지
- 슬라이드당 핵심 메시지 1개
- 불릿 최대 5개
- 문장 밀도는 낮게 유지

## 검수 체크리스트

- [ ] reveal 초기화 코드와 실제 포함한 plugin이 일치하는가
- [ ] CSS/JS CDN 경로가 유효한가
- [ ] 코드 블록 있을 때 highlight CSS와 plugin 등록이 되어 있는가
- [ ] 차트 데이터가 올바른가
- [ ] 텍스트 overflow/겹침/작은 글씨가 없는가
- [ ] 색 대비가 충분한가
- [ ] 브랜딩이 사용자 요청에 맞게 교체되었는가
- [ ] `<section>`에 `position: relative`가 없는가
- [ ] 모든 플레이스홀더가 실제 콘텐츠로 교체되었는가
- [ ] 토글 버튼(Notes/PDF)이 정상 동작하는가

## 최종 출력

- 단일 HTML 파일 (CSS 내장)
- 파일 경로 안내
- 슬라이드 구성 요약 (번호 + 제목 + 한줄 설명)
- 브라우저에서 열기 안내
- 추가 수정 가능 포인트 제안

## 예시 invocation

```
/yowu-slide:create-slide "FastAPI 아키텍처 소개 12분 발표"
→ 슬라이드 수 많고 체계적 흐름 필요 → 템플릿 분석 후 추천 → 확인 후 생성

/yowu-slide:create-slide "우리 회사 신규 서비스 소개서 - 브랜드: ABC Corp"
→ 통계/프로세스 표현 필요 판단 → 템플릿 추천 → 브랜딩 ABC Corp으로 교체

/yowu-slide:create-slide "기존 slides/presentation.html PDF로 변환해줘"
→ decktape으로 PDF export 진행

/yowu-slide:create-slide "template-catalog-1 기반으로 신제품 소개 10장"
→ 사용자가 템플릿 직접 지정 → 추천 단계 생략 → 바로 생성
```
