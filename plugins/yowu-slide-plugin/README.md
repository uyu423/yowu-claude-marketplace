# yowu-slide-plugin

HTML **deck(페이지 넘김) 엔진** 기반 인터랙티브 발표자료 생성 플러그인. 슬라이드 라이브러리(reveal.js 등) 없이 순수 HTML+CSS+바닐라 JS로, 상용 프레젠테이션 SW급 인터랙션을 담은 단일 HTML 파일을 생성한다.

## 기능

- **deck 페이지 넘김 엔진**: `position:absolute + .on` 클래스 토글 전환. 키보드(←→ Space PageUp/Down Home/End)·클릭·터치 스와이프·진행바 HUD·딥링크(`#n`) 네비게이션
- **해상도 독립 16:9**: `vh/vw + clamp()` 유동 타이포로 어떤 화면·프로젝터에서도 비율 유지, 모바일은 세로 스크롤 폴백(`100dvh`)
- **발표자 보기(Presenter View)**: `P` 키 또는 노트 버튼(`N`)으로 같은 파일을 별창으로 열어 대본·타이머·**페이싱**·다음 슬라이드·진행바 표시. `postMessage`로 메인 덱과 양방향 동기화 (발표자 노트가 대본 데이터 소스)
  - **페이싱**: 노트의 `소요 시간`을 누적해 계획 대비 지금 몇 분 빠른지/늦은지 표시
  - **자동 재연결**: 별창이 2초마다 신호를 보내 메인 덱을 새로고침해도 스스로 다시 붙는다
  - **팝업 차단 폴백**: 별창이 막히면 슬라이드 아래 인라인 노트로 되돌아간다
- **등장 애니메이션 + 시퀀서**: `.rv` 스태거 등장, `[data-seq]/[data-step]` 순차 점등, 길이 정규화된 SVG `stroke-dashoffset` 순차 드로잉 (긴 연결선 분절 방지)
- **라이트박스**: 슬라이드의 SVG/이미지를 클릭하면 전체화면 확대 (SVG 색 컨텍스트 복원)
- **비디오 거버넌스**: 활성 슬라이드의 `<video>`만 무음 자동재생, 이탈 시 정지 (에셋 있을 때 자동)
- **CSS 수제 데이터비주얼**: 차트 라이브러리 없이 막대·워터폴·조직도를 순수 CSS로
- **자율 적용(Auto-Apply)**: 콘텐츠 신호를 보고 AI가 위 인터랙션 기능을 **스스로 판단해 적용** (별도 지시 불필요, Step 0.5)
- **멀티 출력**: 인쇄/PDF 선형화(`@media print`), 딥링크 공유, 전체화면(`F`)
- **테마 선택**: Dark(기술) / Light(비즈니스), 콘텐츠 성격 자동 권장
- **디자인 소스**: frontend-design(화려) / 자체 디자인시스템(심플) / 사용자 커스텀
- **콘텐츠 품질 가드**: 환각 금지, 결론형 제목, 키워드 본문, 금지 문구 필터, 자기 검증 루브릭(Strict 모드)
- **발표자 노트**: 각 슬라이드 5요소 노트(요지/전환/핵심/상호작용/Q&A 대비/소요 시간). `Shift+N`으로 발표자 창을 열고, 그 창의 대본·페이싱 입력으로 재사용
- **Strict/Lite 모드**: 기본 Strict, "lite mode"·"빠른 초안" 입력으로 Lite 전환
- **실브라우저 렌더 검증**: Chrome에서 모든 슬라이드를 16:9 두 해상도와 모바일로 순회하며 overflow·SVG·Mermaid·console 오류 검사. `?presenter` 발표자 뷰의 렌더와 동기화 왕복도 함께 검사

## 설치

```
/plugin install yowu-slide-plugin@yowu-claude-marketplace
```

## 사용법

### 스킬

| 스킬 | 설명 |
|------|------|
| `/yowu-slide:yowu-create-slides <주제>` | 발표자료 생성 |
| `/yowu-slide:gemini-design-review <html>` | Gemini CLI로 시각 디자인 보완(선택, 미설치 시 quiet pass) |

### 예시

```
/yowu-slide:yowu-create-slides "FastAPI 아키텍처 소개 12분 발표"
/yowu-slide:yowu-create-slides "Q2 제품 전략 제안서"
/yowu-slide:yowu-create-slides works/planning/slide-outline.md 에 따른 발표자료
```

### 키보드 단축키 (생성된 덱)

| 키 | 동작 |
|----|------|
| `→` `Space` `PageDown` | 다음 슬라이드 |
| `←` `PageUp` | 이전 슬라이드 |
| `Home` / `End` | 처음 / 마지막 |
| `F` | 전체화면 토글 |
| `P` | 발표자 보기 열기 |
| `Shift+N` | 발표자 보기 열기·닫기 (팝업 차단 시 인라인 노트) |
| 터치 스와이프 | 슬라이드 이동(모바일) |

### 발표자 창 단축키

| 키 | 동작 |
|----|------|
| `←` `→` `Space` `PageUp/Down` `Home` `End` | 메인 덱 이동 |
| `↑` `↓` | 노트 스크롤 |
| `T` (또는 타이머 클릭) | 타이머 리셋 |
| `S` | 타이머 정지·재개 |
| `+` `-` | 대본 글자 크기 |

### 워크플로우

1. **콘텐츠 이해 + 입력 검증** — 청중/목표/소스 확인, 모드 판별(Strict/Lite/Timed)
2. **Capability Planning** — 콘텐츠 신호로 인터랙션 기능 자동 결정(시퀀서/드로잉/라이트박스/비디오/발표자 보기)
3. **사용자 컨펌** — 테마/디자인/슬라이드 구성/컬러 + 자동 적용 기능 제안(AskUserQuestion)
4. **서사 구조 + 아웃라인** — SCQA(기본)/PAS/BAB/Pyramid 등, 결론형 제목·훅·CTA 검증
5. **HTML 생성** — 정본(design-system.md) 모듈을 조립: Skeleton(head+CSS+엔진 JS) → 슬라이드 Append
6. **브라우저 렌더 검증** — 16:9·모바일 전수 순회, overflow·SVG·Mermaid·console 확인(모든 모드)
7. **자기 검증** — M1~M8 체크(엔진·SVG·Mermaid·발표자 브리지 무결성 포함, Strict 모드)
8. **Gemini 디자인 리뷰 + 렌더 재검증 + 메타 블록 출력**(선택)

## 기술 스택

- deck 페이지 넘김 엔진 (`position:absolute + .on`, 세대 토큰·더블 rAF)
- 나눔스퀘어 네오 웹폰트 (@font-face) + 시스템 모노
- 해상도 독립 유동 캔버스 (`vh/vw + clamp()`)
- 조건부 CDN 화이트리스트: highlight.js · Chart.js · Mermaid · KaTeX · Iconify · lottie-web (콘텐츠 신호 있을 때만)
- 단일 HTML 파일 (외부 파일 의존성 없음)

## 구조

```
skills/
  yowu-create-slides/
    SKILL.md                      # 생성 워크플로우 + Capability Planning + 정책
    references/
      design-system.md            # ★ deck 엔진 정본 (모듈 소스 — baseline/feature)
      content-rules.md            # 콘텐츠 생성 규칙
      narrative-structures.md     # SCQA/PAS/BAB/Pyramid/StoryBrand
      forbidden-phrases.md        # 금지 문구
      self-check.md               # 자기 검증 루브릭
      note-protocol.md            # 발표자 노트 5요소 (+ 발표자 보기 대본 소스)
    assets/
      example-dark.html           # 골든 참조 (기술, 다크)
      example-light.html          # 골든 참조 (비즈니스, 라이트)
  gemini-design-review/           # 선택적 Gemini CLI 시각 리뷰
scripts/
  validate-slides.mjs             # 의존성 없는 Chrome DevTools 기반 렌더 검증기
  test-validate-slides.mjs        # 검증기 정상/실패 fixture 회귀 테스트
  test-presenter-sync.mjs         # 덱·발표자 창 두 창 통합 테스트 (동기화·재연결·타이머)
  fixtures/                       # 긴 SVG·overflow·발표자 브리지 회귀 fixture
```

## 렌더 검증

Node.js 22+와 Chrome 또는 Chromium이 설치된 환경에서 실행한다. 별도 npm 설치는 필요 없다.

```bash
node plugins/yowu-slide-plugin/scripts/validate-slides.mjs path/to/deck.html
node plugins/yowu-slide-plugin/scripts/test-validate-slides.mjs
node plugins/yowu-slide-plugin/scripts/test-presenter-sync.mjs path/to/deck.html   # 발표자 창 동기화
```

검증기는 `1920×1080`, `1280×720`, `390×844`에서 모든 슬라이드를 열어 본 뒤 실패한 슬라이드와 요소를 출력한다. 덱에 발표자 모듈이 있으면 `?presenter`로 한 번 더 열어 대본 렌더와 인덱스 동기화를 확인한다.

`test-presenter-sync.mjs`는 덱과 발표자 창을 **실제로 두 개 띄워** 창 사이 왕복을 검사한다. 덱을 새로고침한 뒤에도 별창이 스스로 다시 붙는지(하트비트), 노트 스크롤이 유지되는지, 타이머 정지·재개가 되는지를 본다 — 한 창만 여는 검사로는 잡히지 않는 회귀다. 인자를 생략하면 fixture와 다크 예제를 검사한다. `SLIDE_CHROME=/path/to/chrome`으로 브라우저 경로를 지정할 수 있다.
