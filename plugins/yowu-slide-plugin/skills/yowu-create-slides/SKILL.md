---
name: yowu-create-slides
description: 깔끔하고 전문적인 HTML 기반 발표자료를 단일 파일로 생성한다.  deck(페이지 넘김) 엔진 기반의 인터랙티브 프레젠테이션으로, 슬라이드 라이브러리 없이 순수 HTML+CSS+바닐라 JS로 구현한다.  해상도 독립 16:9, 키보드/터치/진행바 네비게이션, 발표자 보기, 등장 애니메이션, 라이트박스, 비디오, 발표자 노트를 콘텐츠에 따라 자동 적용한다.  다크/라이트 테마, highlight.js 코드 블럭을 지원하며 frontend-design 스킬 연동으로 화려한 비주얼도 선택 가능하다.  트리거: "make a presentation", "create slides", "build a deck", "발표자료", "프레젠테이션", "슬라이드", "제안서", "발표 만들어", "ppt", "keynote", "pitch deck", "tech talk", "발표 만들어줘".
---

# Interactive Deck Presentation Generator

## Philosophy

이 skill은 reveal.js 같은 슬라이드 라이브러리를 사용하지 않는다.
대신 **순수 HTML+CSS+바닐라 JS로 구현한 deck(페이지 넘김) 엔진**을 사용한다.
`position:absolute` 슬라이드를 `.on` 단일 클래스로 교차 전환하며, 상용 프레젠테이션 SW급 인터랙션을 단일 파일에 담는다.

핵심 원칙:

- **단일 HTML 파일**: 모든 CSS는 `<style>` 인라인. JS는 정본(`references/design-system.md`)의 모듈을 그대로 인라인 삽입 (재발명 금지)
- **deck 페이지 넘김**: `position:absolute + .on` 전환. 키보드/터치/진행바 HUD/딥링크 네비게이션
- **해상도 독립 16:9**: `vh/vw + clamp()` 유동 타이포로 어떤 화면에서도 비율 유지, 모바일은 세로 스크롤 폴백
- **상태 모델 일관성**: `.on` 단일 진실원을 CSS·시퀀서·비디오·라이트박스·발표자 보기가 공유
- **자율 적용**: 콘텐츠 신호를 보고 AI가 인터랙션 기능(시퀀서/드로잉/라이트박스/비디오/발표자 보기)을 스스로 선택·적용 (Step 0.5)
- **콘텐츠 중심**: 절제된 등장 애니메이션 + 타이포그래피·여백으로 완성도 달성

품질 기준: 상용 프레젠테이션 SW급 인터랙티브 덱 — 한국 디자인 에이전시가 만든 랜딩페이지 수준의 완성도.

---

---

## Content Philosophy

이 skill은 시각만이 아니라 **콘텐츠 품질**도 책임진다. 다음 규칙은 모든 생성에 기본 적용된다 (Strict mode). 사용자가 "lite mode" 또는 "빠른 초안"을 명시하면 §10 자기 검증 루브릭만 건너뛴다. 환각 방지와 금지 문구 필터는 Lite에서도 유지된다.

- **결론형 제목**: 제목은 주제가 아니라 결론 (가이드 §5.2)
- **키워드 본문**: 완전 문장 금지, 불릿 4개 이하 (가이드 §5.3)
- **한 슬라이드 한 메시지**: 25단어 이내 요약 가능해야 함 (가이드 §5.1)
- **훅·CTA 의무**: "Agenda/Thank you" 슬라이드 금지 (가이드 §2.3, §2.5)
- **환각 금지**: 사용자 미제공 수치·고객명·인용 절대 금지. 플레이스홀더 `[INSERT: ...]` 사용 (가이드 §2.1)
- **이모지**: 장식 금지. 기능적 아이콘(역할 구분)만 허용 (가이드 §2.3)

상세 규칙은 `references/content-rules.md`, 서사 구조는 `references/narrative-structures.md`, 금지 문구는 `references/forbidden-phrases.md`, 검증은 `references/self-check.md` 참조.

## Workflow

### Step -1: Mode 판별

사용자 입력에서 아래 트리거를 감지하여 모드를 설정한다. AskUserQuestion을 호출하지 않는다.

| 트리거 | 모드 | 효과 |
|--------|------|------|
| `lite mode`, `빠른 초안`, `draft`, `rough` 포함 | **Lite** | §10 루브릭 체크 생략. §2.1/§2.4 필터는 유지 |
| `\b(\d+)\s*분\b` 매칭 (예: "30분", "12분 발표") | **Timed** | §2.5 장수 공식 적용 (목표분 × 1~1.5장) |
| 둘 다 없음 | **Strict + Untimed** (기본값) | 루브릭 전수 체크, 분량은 콘텐츠 밀도 기반 |

판별 결과는 Step 8 메타 블록의 "모드" 필드에 기록한다.

### Step 0: 콘텐츠 이해 및 입력 검증

사용자 입력을 먼저 분석한다. 입력 형태는 다양할 수 있다:

- 구체적인 아웃라인/본문 → 바로 구조화
- 주제만 ("AI 에이전트에 대한 발표") → 적절한 수의 섹션 아웃라인을 제안하고 확인받기
- 기존 문서/노트 → 핵심 메시지를 추출하여 슬라이드 구조로 변환

**필수 입력 체크** (가이드 §1.1):
아래 3개가 입력 또는 첨부 문서에서 확인 가능한지 검사한다.

| 항목 | 확인 기준 | 누락 시 |
|------|-----------|---------|
| 청중 (Who) | 역할·기술 수준·의사결정 권한 | Step 1 제안 블록 상단에 추정치 포함 후 정정 기회 부여 |
| 목표 (Goal) | 발표 후 청중의 결정/행동 (행동 동사) | Step 1 제안 블록에 추정 목표 포함 후 정정 기회 부여 |
| 내용 소스 (Source) | 수치·사례의 근거 자료 | 계속 진행. 수치는 `[INSERT: ...]` 플레이스홀더로 처리 |

**목표 동사 검증** (가이드 §3.2):
목표 문장에 "설명한다·소개한다·공유한다·알린다"가 포함되면 행동 동사(결정·채택·적용·등록·승인·연락·파일럿)로 치환 제안을 Step 1 제안 블록에 포함한다. 허용 동사 목록은 `references/content-rules.md` 섹션 6 참조.

### Step 0.5: Capability Planning (자율 기능 결정)

**v3의 핵심 단계.** deck 엔진의 인터랙션 기능은 **사용자의 별도 지시 없이도 AI가 콘텐츠·목적·에셋을 스캔해 스스로 on/off를 결정**한다. 아래 매트릭스를 따라 각 기능을 판정하고, 결정 근거를 1줄씩 기록하여 Step 1 컨펌 블록의 "자동 적용" 항목에 노출한다(자동이되 투명하게 — 사용자가 원하면 끌 수 있다).

**A. Always-On Baseline** (콘텐츠와 무관하게 항상 포함, 판단 불필요):
deck 골격(core) · 유동 캔버스/반응형/인쇄(fluid) · 네비게이션 HUD(nav-hud) · 등장 애니메이션(reveal) · 발표자 노트(notes) · 발표자 보기(presenter) · 기본 컴포넌트(components).
→ 정본 `references/design-system.md`의 baseline 모듈을 모두 삽입한다.

**B. Content-Triggered Auto-Apply** (신호 감지 시 자동 활성 — 해당 feature 모듈 삽입):

| 감지 신호 (콘텐츠에서 찾는 것) | 자동 적용 (정본 모듈) |
|---|---|
| 코드 블럭 존재 | highlight.js (§16) |
| 순차적 항목·빌드업·단계별 강조 | 등장 시퀀서 `sequencer` (§10) |
| 프로세스·플로우·파이프라인·의존 관계 | SVG 순차 드로잉 CSS+길이 정규화 JS `svg-drawing` (§11) |
| 이미지·스크린샷·도표·복잡한 SVG 다이어그램 | 라이트박스 `lightbox` (§12) |
| `.mp4`/데모 영상 에셋이 실제 존재 | 비디오 거버넌스 `video` (§13) |
| 정량 데이터·비교·추이(막대) / 조직·계층·팀 | CSS 수제 차트·조직도 `dataviz` (§14) |
| 인트로 애니메이션 에셋(`*.anim.js` 등) 실제 존재 | Lottie 인트로 `lottie` (§15) |
| 슬라이드 10장 초과 | **결론형 제목**의 로드맵/여정 슬라이드(선택: `title` 타입 구간 디바이더). 제목에 "목차/Agenda/개요" 금지 — **M1·M4가 로드맵 지침보다 항상 우선**. 점프네비 신설 금지(딥링크 `#n`·Home/End로 충분) |
| 복잡한 다이어그램(노드 4+/시퀀스/ER/간트) | Mermaid + 활성 슬라이드 지연 렌더 모듈 (Allowed CDN, 정본 §14) |
| 수학 수식 | KaTeX (Allowed CDN) |

**판정 원칙**:
- feature 모듈은 신호가 **있을 때만** 삽입한다(파일 크기 최적화). 신호가 없으면 코드를 넣지 않는다.
- 에셋 의존 기능(video/lottie)은 **에셋이 실제 존재할 때만** 활성화. 없으면 CSS 대체(정적 히어로/스크린샷 placeholder)로 폴백.
- 발표자 보기는 baseline이지만, "순수 열람용 문서 배포"가 목적이면 생략 가능.
- 확신이 낮으면 켠다(그레이스풀 폴백이 있으므로 켜서 손해가 적다). 단, 근거를 로그에 남긴다.

**결정 로그 형식** (Step 1 컨펌 블록 + Step 8 메타 블록에 기록):
```
[자동 적용]
- 시퀀서: '3단계 검증 프로세스' 감지 → ON
- 라이트박스: 스크린샷 4장 → ON
- 발표자 보기: '경영진 보고' 목적 → ON (baseline)
- 비디오: .mp4 에셋 없음 → OFF
- Lottie: 인트로 에셋 없음 → OFF (정적 히어로 대체)
```

### Step 1: 사용자 컨펌 (필수)

콘텐츠를 분석한 뒤, **반드시 AskUserQuestion으로 아래 항목을 한 번에 제안하고 사용자 확인을 받는다.**
**이 절차는 생략할 수 없다.** AI가 추론한 결과를 제시하되, 최종 결정은 사용자가 한다.
단, 사용자가 요청에서 모든 항목을 이미 명시한 경우에만(예: "다크 + frontend-design + 8장으로") 질문을 생략할 수 있다.

**제안 항목:**

1. **청중·목표** (Step 0에서 불명확한 경우에만): 추정치를 보이고 정정 기회 부여
2. **테마**: Dark 또는 Light (콘텐츠 성격 기반 추천 이유 포함)
3. **디자인 스타일**: frontend-design / 자체 심플 / 직접 제공
4. **슬라이드 구성**: 각 슬라이드의 제목(결론형, 가이드 §5.2)과 타입을 번호 목록으로 제안
5. **악센트 컬러**: 콘텐츠에 어울리는 2~3색 조합 제안 (hex 코드 포함)

**제안 예시:**
```
발표 내용을 분석했습니다. 아래 구성으로 진행할까요?

■ 청중: 시니어 백엔드 엔지니어 10인 내외 (추정 — 정정 가능)
■ 목표: 청중이 2주 내 SDK 베타에 등록하도록 한다
■ 테마: Dark (권장) — 기술 주제라 어두운 배경이 적합합니다
■ 디자인: /frontend-design (기본값) — 화려한 비주얼
■ 검증: Strict (기본) — 체크리스트 검증 포함. 빠른 초안이면 "lite로" 라고 답해주세요.
■ 악센트 컬러: #00d2ff (cyan) + #7b2ff7 (purple) + #ff6b6b (coral)

■ 슬라이드 구성 (5장):
  1. [title] 콜드 스타트 2.3초 → 0.4초, 어떻게 줄였는가
  2. [content] 기존 런타임의 부팅 병목 3가지
  3. [card-grid] 교체한 컴포넌트 4개
  4. [code] 적용 전/후 코드 — data class, coroutine
  5. [closing] 2주 내 베타 등록을 제안한다

수정하고 싶은 부분이 있으면 알려주세요.
엔터만 누르면 위 구성으로 진행합니다.
```

**테마 권장 기준:**
- **Dark 권장**: 기술 발표, 개발 이야기, 해커톤, 라이브 코딩, 아키텍처 설명
- **Light 권장**: 기획 제안, 비즈니스 전략, 제품 소개, 교육 자료

### Step 2: 디자인 소스 로드

사용자가 컨펌한 디자인 스타일에 따라 로드한다:

| 선택       | 디자인 소스                                       | 특징                                              |
| ---------- | ------------------------------------------------- | ------------------------------------------------- |
| frontend-design (기본값) | frontend-design skill                  | 화려하고 창의적인 비주얼 (glassmorphism, glow 등) |
| 자체 심플  | `references/design-system.md` (자체 디자인시스템) | 일관되고 절제된 미니멀 스타일                     |
| 직접 제공  | 사용자 제공 가이드                                | 사용자 지정 스타일                                |

**frontend-design 로드 방법:**
1. 시스템에 `/frontend-design` skill이 설치되어 있으면 해당 skill을 호출한다.
2. 설치되어 있지 않으면 아래 URL에서 SKILL.md를 WebFetch로 가져와 지침으로 사용한다:
   `https://raw.githubusercontent.com/anthropics/skills/refs/heads/main/skills/frontend-design/SKILL.md`

**frontend-design 사용 시 경계 규칙:**
frontend-design skill의 **컬러, 그라디언트, 글래스모피즘, 텍스처 스타일**만 차용한다.
레이아웃 구조(deck 엔진), 폰트(@font-face 나눔스퀘어 네오), 인터랙션 JS(정본 모듈)는 **본 스킬의 규칙을 우선**한다.

**어떤 선택이든 유지되는 공통 규칙:**
- 단일 HTML 파일 출력
- deck 페이지 넘김 엔진 (`position:absolute + .on`, 정본 core 모듈) — scroll-snap 미사용
- 해상도 독립 16:9 유동 캔버스 + 모바일 세로 스크롤 폴백 (정본 fluid 모듈)
- 나눔스퀘어 네오 폰트 (@font-face)
- baseline 인터랙션(네비 HUD·등장 애니·발표자 보기·발표자 노트) 항상 포함
- highlight.js CDN (코드 블럭 포함 시)

**사용자 제공 가이드 사용 시:**
- 사용자가 URL, 파일, 또는 텍스트로 디자인 가이드를 제공하면 해당 지침을 우선 적용한다.
- 위의 공통 규칙은 동일하게 유지한다.

### Step 3: 슬라이드 아웃라인 플래닝

Step 1에서 사용자가 컨펌한 슬라이드 구성을 바탕으로, **구체적인 슬라이드 아웃라인**을 먼저 작성한다.
이 단계에서 각 슬라이드의 실제 콘텐츠 요소를 상세히 설계하여, 이후 HTML 작성 시 일관성과 품질을 확보한다.

**서사 구조 선택** (가이드 §4, 세부 내용은 `references/narrative-structures.md` 참조):
아웃라인 작성 전에 아래 기준으로 구조를 고른다. 기본값은 **SCQA**. 선택한 구조는 메타 블록에 기록한다.

| 청중 / 상황 | 구조 |
|-------------|------|
| 경영진·구매 결정자, 시간 짧음 | Pyramid Principle |
| 내부 팀·같은 분야 전문가 (문제 인식 있음) | **SCQA (기본값)** |
| 제품·서비스 구매 후보 (RFP·파일럿) | SCQA 또는 BAB |
| 문제 인식 낮음, 발표자가 고통 언어화 필요 | PAS |
| 청중이 영웅인 서사 (사용자 사례 중심) | StoryBrand |

Timed 모드인 경우: 총 슬라이드 수는 `목표분 × 1~1.5` 범위로 조정. 콘텐츠 밀도와 맞지 않으면 메타 블록에 명시.

**아웃라인 저장 방식 (분량에 따라 자율 판단):**
- **10장 이하**: 인메모리(대화 컨텍스트 내)에서 관리
- **11장 이상**: 임시 마크다운 파일(`{title-slug}-outline.md`)로 작성하여 참조. HTML 완성 후 삭제

**아웃라인 포맷** — 각 슬라이드마다 아래 항목을 명시한다:

```markdown
## Slide {N}: {제목} [{type}]

- **Label**: {서사 슬롯 + 선택적 카테고리. 예: "SITUATION · 현재 배포 관행"}
- **Title (결론형)**: {주제 아님. 결론 또는 수치 포함. 예: "수작업 롤백이 주당 3회 발생한다" (가이드 §5.2)}
- **25단어 요약**: {이 슬라이드 핵심 메시지를 한글 50자 이내 한 문장으로. 불가능하면 슬라이드 분할}
- **Heading**: {핵심 메시지}
- **Content**: {본문 요약 또는 항목 목록}
- **Visual**: {사용할 컴포넌트 — stat-box 3개, card 4개, code block 등}
    - 다이어그램 타입 선택 기준:

      | 조건 | 사용 타입 |
      |------|---------|
      | sequence / 시퀀스 / 요청-응답 흐름 | Mermaid (`sequenceDiagram`) |
      | flowchart / 분기 / if-else / 순서도 | Mermaid (`flowchart LR`) |
      | ER / 테이블 관계 / DB 스키마 | Mermaid (`erDiagram`) |
      | gantt / 일정 / 로드맵 | Mermaid (`gantt`) |
      | 노드 4개 이상 아키텍처 | Mermaid (`flowchart`) |
      | 단순 컴포넌트 관계, **노드 ≤3개**, 슬라이드 테마 색 필요 | Inline SVG (`diagram` 타입) |

    - `diagram` 타입 (Inline SVG): `viewBox="0 0 600 {높이}"` — 노드 3개 이하 전용. 노드(`<g class="diag-node">`), 엣지(`<line class="diag-edge">`), `<defs>` 마커. fill/stroke는 CSS 변수 참조. **마커 id는 슬라이드마다 고유값** (예: `id="diag-arrow-s5"`) — Mermaid/다중 diagram 슬라이드 공존 시 id 중복 방지.
    - `flow` 5-step 변형: `.workflow-grid` grid + `.wf-step::after` 화살표. `.flow-arrow` div 불필요.
    - `title` 히어로 배지: `.hero-badge-row` + `.hero-badge`. Iconify 없이 dot + 텍스트로 키포인트 3-4개 표시.
- **Notes**: {특이사항 — min-height 필요 여부, CDN 라이브러리, overflow 전환 등}
```

**구조 가이드라인:**
- 콘텐츠가 5개 이하면 5~7개 섹션도 충분하다. 무리하게 늘리지 않는다.
- 15장을 초과하면 **결론형 제목의 로드맵/여정 슬라이드**(예: "오늘 세 가지를 결정한다")를 **타이틀 다음에** 두고, 선택적으로 `title` 타입 구간 디바이더로 챕터를 나눈다. 제목에 "목차/Agenda/개요"라는 단어를 쓰지 않는다. 첫 슬라이드는 언제나 훅 타이틀(`slide--title`)이며, **M1(첫 슬라이드=slide--title)·M4(목차/개요형 제목 금지)는 로드맵 지침보다 항상 우선한다**. 존재하지 않는 점프네비를 만들지 않는다.
- 구조 패턴: `title → context/problem → solution → details(2-4장) → evidence → next-steps → closing`

### Step 3.5: 개요 검증

HTML Skeleton 생성 전에 아웃라인 자체를 점검한다. 아래 항목을 순서대로 확인하고, 실패 시 해당 슬라이드만 수정 후 재제안한다. 전면 재작성 금지.

- [ ] 첫 슬라이드가 훅인가? (Agenda/목차 내용이 아님, 가이드 §2.3)
- [ ] 마지막 슬라이드가 구체적 CTA를 포함하는가? ("Thank you" 단독이 아님, 가이드 §2.5)
- [ ] 서사 구조(SCQA/PAS/Pyramid 등)에 모든 슬라이드 슬롯이 매핑되는가?
- [ ] 제목만 나열했을 때 핵심 메시지가 이해되는가? (결론형 제목 테스트, 가이드 §3.2)
- [ ] Timed 모드: 총 슬라이드 수가 `목표분 × 1~1.5` 범위인가?
- [ ] 환각 가능 수치가 `[INSERT: ...]` 플레이스홀더 또는 출처 명시 상태인가?

### Step 4: HTML Skeleton 작성

아웃라인이 확정되면, **HTML의 뼈대(Head + CSS + 엔진 JS)만 먼저 Write**한다.
이 단계에서는 `<div class="deck">`를 비워둔다(슬라이드 콘텐츠는 Step 5에서 append).

**정본 조립 원칙 — 재발명 금지**: CSS/JS는 직접 타이핑하지 않고 `references/design-system.md`의 모듈을 **그대로 복사해 인라인 삽입**한다.
- **baseline 모듈**(core / fluid / nav-hud / reveal / notes / presenter / components) — 항상 삽입
- **feature 모듈**(sequencer / svg-drawing CSS+JS / lightbox / video / dataviz / lottie / mermaid-deferred) — Step 0.5 판정 결과에 따라 삽입
- 삽입 순서는 정본 **§17 조립 가이드**를 따른다

**Skeleton 구조:**

```html
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{발표 제목}</title>
    <script>/* 정본 §8 presenter-headscript — 반드시 첫 페인트 전, 최상단 */</script>
    {highlight.js / KaTeX CSS CDN — 신호 있을 때만}
    <style>
      /* 순서: §2 @font-face → §1 테마 토큰(:root) → 모듈 CSS */
      {§2 나눔스퀘어 네오 @font-face}
      {§1 테마 토큰 :root — Dark 또는 Light}
      {§3 core-css}{§4 fluid-css + fluid-responsive}{§5 nav-hud-css}
      {§6 reveal-css}{§7 notes-css}{§8 presenter-css}{§9 components-css — 사용분만}
      {feature CSS — §10~§14 중 Step 0.5에서 켠 것만}
    </style>
  </head>
  <body>
    {§5 nav-hud-markup — HUD + fs-btn + notesBtn}
    <div class="stagebg"></div>            <!-- 선택적 배경 -->
    <div class="deck">
      <!-- Step 5에서 슬라이드 append -->
    </div>
    {§8 presenter-markup — 발표자 창 UI}

    <!-- 스크립트: core → nav-hud → notes → presenter → feature → highlight -->
    <script>{§3 core-js}</script>
    <script>{§5 nav-hud-js}</script>
    <script>{§7 notes-js}</script>
    <script>{§8 presenter-js}</script>
    {feature JS — §10 sequencer / §11 svg-drawing / §13 video / §12 lightbox / §15 lottie / §14 mermaid-deferred 중 켠 것}
    {highlight.js — 코드 있을 때}
  </body>
</html>
```

**핵심**:
- `<head>` 최상단 presenter-headscript는 **필수**(FOUC 방지) — 발표자 보기가 baseline이므로 항상 넣는다
- **core-js가 반드시 첫 스크립트** — 다른 모듈이 `window.__deck*` 훅에 의존한다
- 페이지 총수는 core-js가 `slides.length`로 **자동 계산** — CSS/마크업에 하드코딩하지 않는다
- CSS는 아웃라인의 **모든 슬라이드 타입 스타일을 한 번에** 포함해 이후 append 시 CSS 수정이 없도록 한다

**Speaker Notes**: 각 `<section class="slide">` 끝에 `<aside class="slide-notes" hidden>` 포함. 이 노트는 **발표자 보기(presenter)의 대본 데이터 소스**이기도 하다(정본 §8). 5요소 마크업은 `references/note-protocol.md` 참조. Mermaid/Chart.js를 aside 내부에 넣지 않는다.

### Step 5: 슬라이드 Append

Skeleton이 준비되면, **Edit 도구로 `<div class="deck">` 안쪽(닫는 `</div>` 직전)에 슬라이드를 순차 append**한다.
한 번에 전체를 쓰지 않고, 적절한 단위로 나누어 추가한다.

**Append 단위 (자율 판단):**
- **기본**: 1~3개 슬라이드를 한 번의 Edit으로 추가
- **단순한 슬라이드** (title, closing, quote 등): 2~3개씩 묶어도 됨
- **복잡한 슬라이드** (code 30줄+, card-grid 4개+, timeline 5단계+): 1개씩 단독 추가
- **전체 10장 이하의 간단한 발표**: 한 번에 모두 추가해도 무방

**Append 방법:**

각 Edit에서 `<div class="deck">`의 닫는 `</div>` 또는 이전 슬라이드의 `</section>`을 `old_string`으로 잡고,
해당 위치에 `<section>` 블럭을 삽입한다. (deck 컨테이너 밖에 슬라이드를 두지 않는다)

```
Edit:
  old_string: "{이전 슬라이드의 closing </section> 태그 또는 body 내 마지막 콘텐츠}"
  new_string: "{이전 콘텐츠}\n\n    {새 <section> 블럭들}"
```

**진행 시 사용자에게 간단한 진척 상황을 알린다:**
- `"슬라이드 1-3/8 추가 중..."` 식의 짧은 상태 업데이트

**각 `<section>` 블록 구성** (가이드 §2.2, §6.1):

```html
<section class="slide slide--{type}" data-name="{slug}">
  <div class="slide__inner">
    <!-- 슬라이드 콘텐츠 — label/heading/desc/visual. 주요 요소에 .rv + style="--d:.08s" 스태거 등장 -->
    <!-- 시퀀서(§10) 신호가 있으면 <div data-seq data-interval="600"> 안에 [data-step] 배치 -->
  </div>

  <aside class="slide-notes" hidden>
    <h4>요지</h4><p>{한 문장 결론}</p>
    <h4>전환</h4><p>{앞 슬라이드 연결 문장}</p>
    <h4>핵심</h4>
    <ul>
      <li>{말할 포인트 1 — 수치·사례·출처}</li>
      <li>{말할 포인트 2}</li>
    </ul>
    <h4>상호작용</h4><p>{질문·멈춤·데모 타이밍. 없으면 "없음"}</p>
    <h4>Q&amp;A 대비</h4>
    <ul>
      <li>{예상 질문 + 답변 요점}</li>
    </ul>
    <h4>소요 시간</h4><p>{분·초}</p>
  </aside>
</section>
```

노트는 슬라이드 본문 문장을 **반복하지 않는다** (Redundancy Effect 차단, 가이드 §2.2).
Lite 모드: 요지, 핵심, 소요 시간 3요소만 필수.

### Step 6: 마무리 및 파일 확인

모든 슬라이드 append가 완료되면:

1. 최종 HTML 파일의 슬라이드 수가 아웃라인과 일치하는지 확인한다
2. 페이지 총수는 core-js가 `slides.length`로 자동 계산하므로 하드코딩 동기화가 불필요하다. 대신 `<div class="deck">` 안에만 `.slide`가 있고, HUD·발표자 마크업 등 비(非)슬라이드 요소에 `.slide` 클래스가 섞이지 않았는지 확인한다
3. 임시 아웃라인 파일이 있으면 삭제한다

### Step 6.4: 브라우저 렌더 검증 (모든 모드 필수)

HTML을 파일로 완성한 뒤 플러그인 루트의 `scripts/validate-slides.mjs`를 실행한다. DOM 문자열 검사만으로는 실제 폰트·SVG·브라우저 레이아웃 파손을 찾을 수 없으므로, 이 검증은 Lite에서도 생략하지 않는다.

```bash
node {plugin-root}/scripts/validate-slides.mjs /absolute/path/to/deck.html
```

검증기는 실제 Chrome에서 다음을 전수 확인한다.

- 16:9 데스크톱 `1920×1080`, `1280×720`: 모든 슬라이드를 순회하며 가로·세로 overflow, viewport 이탈, 활성 슬라이드 수 확인
- 모바일 `390×844`: 세로 스크롤 폴백, 가로 overflow, 모든 슬라이드 가시성 확인
- SVG 드로잉: 모든 `.fc .eg`의 `pathLength="1"`, 길이 정규화 모듈, 활성화 후 `stroke-dashoffset: 0` 확인
- Mermaid: `startOnLoad:true` 금지, 활성화 뒤 SVG 생성 및 0이 아닌 크기 확인
- 전 구간 JavaScript 예외와 `console.error` 확인

실패하면 보고된 슬라이드·요소만 수정하고 같은 명령을 다시 실행한다. Chrome을 찾지 못하면 검증을 통과 처리하지 말고 `[RENDER-CHECK WARN]`으로 기록한다. 테스트 도구 자체 확인은 `node {plugin-root}/scripts/test-validate-slides.mjs`로 실행한다.

### Step 6.5: 자기 검증 (Strict 모드 전용)

**Lite 모드에서는 이 Step을 건너뛴다.**

`references/self-check.md`의 기계 판정 항목 M1-M7을 확인한다. 렌더링 항목은 Step 6.4의 브라우저 결과를 사용한다.

| # | 항목 | 합격 기준 |
|---|------|---------|
| M1 | 첫 슬라이드 | `class`에 `slide--title` 포함 |
| M2 | 마지막 슬라이드 | `class`에 `slide--closing` 포함 |
| M3 | 마지막 슬라이드 제목 | "감사합니다/Thank you/Q&A" 단독이 아님 |
| M4 | 모든 슬라이드 제목 | "소개/개요/목차/결론" 단독이 아님 |
| M5 | 엔진 무결성 | `__deckGo` · 더블 rAF(`requestAnimationFrame` 중첩 호출) · `slides.length` · `[?&]presenter`(발표자 headscript 정규식; 리터럴 `?presenter` 아님) · `hudBar` 가 결과물에 모두 존재 |
| M6 | SVG 드로잉 무결성 | `.fc .eg`가 있으면 모든 geometry에 `pathLength="1"` + `__normalizeSvgEdges` 존재 |
| M7 | Mermaid 렌더 무결성 | `.mermaid`가 있으면 `startOnLoad:true` 없음 + `mermaid.run` + `deck:change` 존재 |

**실패 시**: 해당 슬라이드만 Edit으로 수정 (1회 한정). 재시도 후에도 실패하면 통과 처리 + 메타 블록에 `[SELF-CHECK WARN]` 기록.

LLM 판정 항목(서사 품질, 청중 맞춤 등)은 `references/self-check.md` 참조. 재시도 트리거로 쓰지 않고 메타 블록에 로깅만 한다.

### Step 7: Gemini 디자인 리뷰 (선택적)

`gemini-design-review` 스킬을 호출하여 HTML 디자인을 보완한다.
gemini CLI 미설치 시 자동으로 quiet pass되므로 별도 분기 처리가 필요 없다.

**호출 방법:**

`gemini-design-review` 스킬에 아래 컨텍스트를 전달한다:
- **HTML 파일 경로**: 방금 생성한 HTML 파일의 절대 경로
- **보호 규칙**:
  - `엔진 보호: deck` — `.slide.on` 토글, `position:absolute` 슬라이드, `.deck` 컨테이너, HUD(`#hudBar`/`#hudMeta`), 전환 JS 변경 금지
  - `애니 보호: 의도된 모션` — `.rv` 등장, `[data-seq]/[data-step]` 시퀀서, `.fc .eg` SVG 드로잉은 정상 기능. 제거 금지(타이밍·이징 보정만 허용)
  - `폰트 보호: NanumSquareNeo` — 폰트 변경 금지
  - `콘텐츠 보호: 텍스트 원문` — 제목·본문·노트 문구 수정 금지 (Gemini는 시각만 리뷰)
  - `구조 보호: 슬라이드 타입 클래스` — `slide--{type}` 클래스명 및 `<aside class="slide-notes">` 구조 변경 금지
  - `위계 보호: label/heading/desc 3단 구조` — label 제거·병합 지침 무시
  - `키 보호: 네비게이션` — 방향키/Space/PageUp·Down/Home/End, F(전체화면), Shift+N(노트), P(발표자 보기) 바인딩 변경 금지

스킬이 지침을 적용하면 결과를 사용자에게 요약 보고하고, 스킵되면 아무 메시지 없이 다음 단계로 진행한다.

Gemini가 HTML을 수정했다면 Step 6.4 브라우저 렌더 검증을 다시 실행한다. 시각 리뷰 이전 결과를 최종 검증으로 재사용하지 않는다.

### Step 8: 최종 안내

저장 경로를 사용자에게 알려준다: `현재 디렉토리에 {제목-slug}.html로 저장했습니다.`

**Strict 모드** 또는 **플레이스홀더가 존재**하는 경우, 아래 메타 블록을 함께 출력한다 (가이드 §13.2).

```
[생성 근거 요약]
- 모드: {Strict|Lite} + {Timed ({N}분)|Untimed}
- 구조: {SCQA|PAS|BAB|StoryBrand|Pyramid}
- 청중: {확인됨|추정: ...}
- 목표: {행동 동사 포함 한 문장}
- 플레이스홀더: {개수}개 — {목록}
- 자동 적용 기능: {Step 0.5 결정 로그 — 켠 feature 모듈 + 근거, 끈 것 + 이유}
- Self-check: {PASS|WARN: ...}
- 가이드 규칙 비활성화: {없음|비활성 규칙 + 이유}
```

**플레이스홀더가 있을 때**: "아래 항목들을 실제 데이터로 채워주시면 완성도가 높아집니다"로 목록을 강조.

**사용자 지시와 가이드 충돌 시** (가이드 §13.4): 사용자 지시를 따른다. 메타 블록 "가이드 규칙 비활성화" 필드에 어떤 규칙이 왜 꺼졌는지 기록. 예: "사용자 요청에 따라 Thank you 클로징 슬라이드 포함. Peak-End 약화 가능성."

---

## Slide Type Catalog

각 섹션은 아래 타입 중 하나를 사용한다. 한 발표에서 같은 타입을 반복해도 된다.
**매칭 힌트**를 참고하여 콘텐츠에 적합한 타입을 선택한다.

| Type         | 용도          | 핵심 요소                                     | 매칭 힌트                            |
| ------------ | ------------- | --------------------------------------------- | ------------------------------------ |
| `title`      | 표지 슬라이드 | gradient 텍스트 제목, badge/eyebrow, subtitle | 첫 슬라이드, 파트 디바이더           |
| `content`    | 일반 내용     | label + heading + desc 본문                   | 설명/서술이 중심인 슬라이드          |
| `stat-grid`  | 숫자 강조     | 2-4개의 stat-box (큰 숫자 + 라벨)             | 수치, KPI, 성과가 2개 이상 등장할 때 |
| `card-grid`  | 항목 나열     | 2-4개의 카드 (아이콘 + 제목 + 설명)           | 병렬적 항목, 기능 목록, 장점 나열    |
| `code`       | 코드 설명     | heading + highlight.js 코드 블럭 + 설명       | 코드 예시, CLI 명령, 설정 파일       |
| `timeline`   | 단계/일정     | 세로 타임라인 (dot + title + desc)            | 시간순/단계별 순서가 명확할 때       |
| `flow`       | 프로세스      | 가로 플로우 다이어그램 (step + arrow)         | 파이프라인, 워크플로우, 데이터 흐름  |
| `quote`      | 인용/강조     | quote-box (좌측 보더 + 텍스트 + 출처)         | 핵심 메시지 강조, 사용자 후기, 인용  |
| `comparison` | 비교          | 2열 비교 (before/after, A/B)                  | "기존 vs 신규", "A vs B" 대비 구조   |
| `naming`     | 이름/공식     | naming-box (chip + 결과 + 설명)               | 브랜딩, 합성어 설명, 공식/수식       |
| `code-comparison` | 코드 비교 | 2열 `.code-cmp` 코드 블럭 (`.cmp-head`+`<pre>`, 정본 §9) | "JS vs TS", "before/after", 문법 비교 |
| `closing`    | 마무리        | CTA 버튼, 감사 메시지, 연락처                 | 마지막 슬라이드, Q&A                 |
| `diagram`    | SVG 아키텍처 다이어그램 | Inline SVG (`<rect>` + `<path>` + `<marker>` + CSS 변수 참조) | 컴포넌트 관계, 데이터 흐름 — JS 없이 테마 연동 다이어그램이 필요할 때 |
| `media`      | 비디오/이미지 데모 | `.media-frame`(확정높이→aspect-ratio) + `<video>`/`<img>` | .mp4 데모, 앱 시연, 스크린샷 (video 모듈 자동 재생, 클릭 시 라이트박스 확대) |
| `org`        | 조직도/팀 구조 | `.org-tier` + `.org-card` 커넥터 (정본 §14) | 조직·계층·팀·역할 분담 구조 |
| `chart`      | CSS 데이터 시각화 | `.md-plot` 막대·워터폴 (정본 §14) | 정량 비교·추이 — 단순 차트는 Chart.js 대신 이것 우선 |
| `process`    | 순차 프로세스 애니 | `[data-seq]/[data-step]` 시퀀서 + `.fc` SVG 드로잉 | 단계별 빌드업, 파이프라인, 흐름을 순차 점등으로 |

> **`flow` 5-step 변형**: step이 정확히 5개이면 `.workflow-grid` + `::after` 화살표 사용 권장. `.flow-arrow` div 불필요. `design-system.md` 섹션 5 참조.

---

## HTML Structure Rules

1. **단일 파일**: 외부 CSS/JS 파일 없음. 모든 스타일은 `<style>`, 스크립트는 `<script>`에 인라인(정본 모듈 복사)
2. **CSS 변수**: `:root`에 테마 토큰 정의(정본 §1), 컴포넌트는 `var(--*)`만 참조(하드코딩 금지)
3. **섹션 구조**: `<section class="slide slide--{type}" data-name="{slug}">`를 `<div class="deck">` 안에 배치. 테마 차이는 CSS 변수로만 처리
4. **deck 페이지 넘김**: `.slide { position:absolute; inset:0 }` + `.slide.on` 토글 전환(정본 §3). scroll-snap 미사용. `body { overflow:hidden }` (모바일은 정본 §4가 자동 해제)
5. **콘텐츠 오버플로우**: `.slide`는 세로 중앙 정렬(`justify-content:center`). 콘텐츠가 넘치면 슬라이드를 분할하거나 밀도를 낮춘다 — 페이지 넘김에서는 스크롤로 도망갈 수 없다
6. **콘텐츠 폭**: `.slide__inner`는 `min(1160px, 100%)`. 텍스트 위주 슬라이드는 `max-width: 820px`
7. **나눔스퀘어 네오 폰트**: 정본 §2 `@font-face` 블럭을 그대로 삽입한다. 로드 실패 시 `'Noto Sans KR', -apple-system, sans-serif` fallback(정본 변수에 포함). 모노 폰트(kicker/HUD/타이머)는 시스템 스택이라 CDN 불필요
8. **유동 캔버스**: 폰트·간격은 `clamp()` 중심(정본 §4). 타이틀은 세로/가로 동시 대응 `clamp(.., min(..vh, ..vw), ..)`. 모바일은 `@media (max-width:820px)`에서 세로 스크롤 폴백 + `100dvh`(iOS 주소창 대응)
9. **페이지 번호**: HUD의 `#hudMeta`가 `01 / N`을 JS로 **자동** 표시(정본 §3/§5). `.slide::after` counter로 총수를 하드코딩하는 방식은 쓰지 않는다 — 슬라이드 추가/삭제가 자동 반영된다
10. **접근성**: `<html lang="ko|en">` 설정. WCAG AA 이상의 색상 대비 유지. heading 레벨을 `h1` → `h2` → `h3` 순서로 사용
11. **Flex 컨테이너 내 인라인 요소**: `.hero-badge-row`, badge, tag, pill 등 인라인 요소가 flex column 컨테이너의 직접 자식일 때 반드시 `align-self: center; width: fit-content;`을 추가한다. 누락 시 전체 너비로 늘어나는 버그 발생
12. **SVG 드로잉 길이 정규화**: `.fc .eg`를 붙인 `<path>`·`<line>`·`<polyline>` 등 모든 SVG geometry에 `pathLength="1"`을 넣고 정본 §11의 `svg-drawing-js`를 함께 삽입한다. 고정 dash 길이를 실제 path 길이에 직접 적용하지 않는다

---

## Typography & Color

### 공통 베이스라인 스케일

아래 값은 **모든 디자인 경로**(자체 심플, frontend-design, 직접 제공)에 적용되는 최소 베이스라인이다.
AI는 이 값을 **하한선**으로 사용하되, 콘텐츠 밀도와 슬라이드 구성에 따라 더 크게 조정할 수 있다.
단, 이 값보다 **작게** 설정하지 않는다.

> **v3 note**: 레이아웃 치수(슬라이드 padding, `.slide__inner`/다열 폭)는 **정본 §3/§4가 단일 소유**하므로 아래 표에 수치를 나열하지 않는다(정본은 `vh` 기반 `clamp()`로 화면 높이에 맞게 유동시킴). 아래 표는 **폰트 크기 하한선** 참고용이다.

| 요소 | 베이스라인 | 비고 |
|------|-----------|------|
| h1 | `clamp(2.25rem, 8vw, 4rem)` | 타이틀 슬라이드 |
| h2 | `clamp(1.75rem, 5vw, 2.625rem)` | 섹션 헤딩 |
| h3 | `1.25rem` | 서브 헤딩 |
| .label | `13px`, letter-spacing 0.15em | 섹션 카테고리 |
| .desc | `16px`, line-height 1.8 | 본문 설명 |
| subtitle | `22px` | 타이틀 부제 |
| .card-title | `16px` | 카드 제목 |
| .card-desc | `13px` | 카드 설명 |
| .stat-num | `clamp(1.75rem, 6vw, 2.5rem)` | 통계 숫자 |
| .stat-label | `13px` | 통계 라벨 |
| pre code | `14px` | 코드 블럭 |
| .tag | `13px` | 태그/칩 |
| page number | `13px` | 슬라이드 번호 |
| 레이아웃 치수 | 정본 §3/§4 | slide padding·`.slide__inner` 폭·다열 폭은 정본이 `vh`/`clamp()`로 소유(여기 수치 나열 안 함) |
| card padding | `24px` | 카드 내부 여백 |
| card border-radius | `16px` | 카드 라운딩 |
| gap (기본) | `12px` | 그리드/플렉스 간격 |

**3단 위계** — 모든 섹션에 일관되게 적용:

1. **Label**: 12px, uppercase, letter-spacing, accent color — 섹션 카테고리
2. **Heading**: clamp() 반응형, bold/black weight — 핵심 메시지
3. **Description**: 16px, muted color, line-height 1.8 — 상세 설명

**강조 패턴**:

- gradient text (`-webkit-background-clip: text`) — 타이틀 슬라이드 제목
- `<span class="em">` — 헤딩 내 키워드 강조
- tag/chip — 인라인 태그 표시

**컬러 제한**: 악센트 최대 3색. 테마별 권장 팔레트는 design-system.md 참조.

**폰트**:

- 기본 본문 폰트: **나눔스퀘어 네오** (`NanumSquareNeo`) — @font-face 블럭은 HTML Structure Rules 7번 참조
- 영어 전용 발표가 필요한 경우: Plus Jakarta Sans, Outfit, 또는 Geist (Google Fonts CDN)

---

## JavaScript Policy

v3는 인터랙티브 deck이므로 바닐라 JS를 적극 사용한다. 단, **정본 모듈만 사용**하고 새 로직을 즉흥 작성하지 않는다.

- **엔진 JS는 정본 모듈 복사**: 전환·네비·시퀀서·라이트박스·비디오·발표자보기·노트 JS는 `references/design-system.md`의 해당 MODULE 블록을 **그대로** 삽입한다. 직접 재작성 금지 — 세대 토큰·더블 rAF·transition shorthand 회피 같은 렌더링 함정을 재발명하지 않기 위함이다.
- **baseline JS는 항상 포함**: core-js(전환 엔진) → nav-hud-js → notes-js → presenter-js 순. **core-js가 반드시 첫 스크립트**(다른 모듈이 `window.__deck*` 훅에 의존).
- **feature JS는 Step 0.5 판정에 따라**: sequencer / svg-drawing / video / lightbox / lottie / mermaid-deferred.
- **외부 라이브러리는 화이트리스트만**: 아래 Allowed CDN Libraries 목록(highlight.js, Chart.js, Mermaid, KaTeX, Iconify, lottie-web)만 허용. 그 외 프레임워크/라이브러리 추가 금지.
- **커스텀 JS가 꼭 필요하면**: 정본 훅(`window.__deckGo(i)`, `document`의 `deck:change` 이벤트)을 사용하고 `.on` 상태 모델을 존중한다. 전환 로직 자체를 직접 건드리지 않는다.

---

## Anti-Patterns

- **슬라이드 라이브러리 금지**: reveal.js, impress.js, Marp 등을 사용하지 않는다
- **일반 폰트 금지**: Arial, Inter, Roboto, system-ui를 메인 폰트로 쓰지 않는다
- **CSS 프레임워크 금지**: Bootstrap, Tailwind 등을 사용하지 않는다
- **과잉 애니메이션만 금지**: 등장(`.rv`)·시퀀서·SVG 드로잉·페이지 전환은 정본이 제공하는 정상 기능이다. 다만 요소마다 제각각인 과한 모션, 무한 반복으로 시선을 뺏는 장식, 3초 넘는 인트로는 피한다. 등장 스태거는 슬라이드당 총 1초 이내를 권장한다
- **보라+흰 클리셰 금지**: 무조건 보라색 그라디언트를 쓰지 않는다. 콘텐츠에 맞는 악센트 선택
- **base64 이미지 금지**: 인코딩된 이미지를 넣지 않는다
- **데이터 날조 금지**: 사용자가 제공하지 않은 수치, 연도별 추이, 발표 제목, 프로젝트명, 직무 설명 등을 추측하여 작성하지 않는다. 원본 데이터에 없는 정보는 placeholder(`[TODO: 데이터 필요]`)로 남기고 사용자에게 확인을 요청한다
- **Agenda/Thank you 반사 금지**: 1번 슬라이드를 "목차"로만, 마지막 슬라이드를 "감사합니다/Q&A"로만 채우지 않는다. 훅과 CTA로 대체한다 (가이드 §2.3, §9.4)
- **주제형 제목 금지**: 제목에 "~소개", "~개요", "성능", "결론" 같은 카테고리만 적지 않는다. 결론이나 수치를 포함한다 (가이드 §5.2, §9.10)
- **완전 문장 본문 금지**: 슬라이드 본문에 주어+서술어 완전 문장을 쓰지 않는다. 키워드와 명사구로 압축 (가이드 §5.3, §9.1)
- **제네릭 문구 금지**: "혁신적", "차세대", "시너지", "엔드 투 엔드", "In today's fast-paced world..." 등. 전체 목록은 `references/forbidden-phrases.md`. 이 문구가 포함된 문장은 환언이 아니라 **폐기 후 재작성** (가이드 §2.4, §9.2)
- **노트-슬라이드 중복 금지**: aside 노트가 슬라이드 본문 문장을 동일하게 반복하지 않는다. 노트는 서사·수치·타이밍을, 슬라이드는 키워드를 담는다 (가이드 §2.2, §9.9)
- **환각 고유명사·인용 금지**: 사용자가 명시하지 않은 고객사명, 실존 인물 인용, 논문 제목, 제품 기능 주장을 생성하지 않는다. 해당 위치에는 `[INSERT: 고객사 예시 — 업종·규모]` 형태의 플레이스홀더를 넣는다 (가이드 §2.1)

**이미지/비주얼 대안**:

- 아이콘이 필요한 경우 emoji를 기본으로 활용한다. 더 정교한 아이콘이 필요하면 Iconify CDN을 사용한다 (아래 허용 라이브러리 참조)
- 간단한 다이어그램은 CSS+HTML로 직접 그린다. 복잡한 플로우/시퀀스/ER 다이어그램은 Mermaid를 사용한다
- 실제 이미지(사진, 스크린샷)가 필요한 위치에는 비율과 의도를 명시한 placeholder를 넣고, 주석으로 권장 이미지 설명을 남긴다
- 영상 데모 에셋(.mp4 등)이 **실제로 존재하면** 비디오 거버넌스 모듈(정본 §13)로 활성 슬라이드에서 자동 재생한다. 에셋이 없으면 스크린샷 placeholder + 링크로 대안을 제안한다. 오디오 단독은 지원하지 않는다

---

## Allowed CDN Libraries

**화이트리스트 방식**: 아래 목록의 라이브러리만 사용할 수 있다. 이 목록에 없는 라이브러리를 임의로 추가하지 않는다.
모든 라이브러리는 **"필요할 때만 포함"** 원칙을 따른다. 해당 콘텐츠가 없으면 CDN을 포함하지 않는다.

**CDN URL 규칙**: 아래 명시된 URL과 버전을 **그대로** 사용한다. 버전을 임의로 올리거나 다른 CDN 호스트로 변경하지 않는다. (cdnjs는 최신 버전 누락이 잦아 jsdelivr 또는 검증된 cdnjs URL만 사용)

### highlight.js — 코드 구문 강조

**포함 조건**: 코드 블럭이 있을 때

```html
<!-- head에 테마 CSS -->
<!-- Dark: -->
<link
  rel="stylesheet"
  href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css"
/>
<!-- Light: -->
<link
  rel="stylesheet"
  href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css"
/>

<!-- body 끝 -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
<script>
  hljs.highlightAll();
</script>
```

마크업: `<pre><code class="language-{lang}">...</code></pre>`. `language-` 접두사 필수.

### Chart.js — 차트/데이터 시각화

**포함 조건**: 수치 데이터를 bar, line, pie, radar, doughnut 등 차트로 보여줄 때. `stat-grid` 대신 또는 보완으로 사용.

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"></script>
```

마크업: `<canvas id="myChart"></canvas>` + 초기화 스크립트.
**주의**: `animation: false`로 설정하여 스크롤 시 깜빡임을 방지한다. 다크 테마에서는 `color`/`borderColor`를 테마에 맞게 조정.

### Mermaid — 다이어그램

**포함 조건**: 아키텍처, 플로우차트, 시퀀스 다이어그램, 간트 차트, ER 다이어그램이 필요할 때. CSS+HTML로 그리기 복잡한 경우 사용.

```html
<script src="https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.min.js"></script>
<!-- 이어서 정본 design-system.md §14의 MODULE: mermaid-deferred-js를 그대로 삽입 -->
```

마크업: `<pre class="mermaid">graph LR; A-->B;</pre>`. `startOnLoad:false`와 `deck:change` 지연 렌더가 필수이며, 라이트 테마에서는 정본 모듈의 `theme`을 `'default'`로 변경한다.

### KaTeX — 수학 수식

**포함 조건**: LaTeX 수학 수식이 등장할 때 (학술 발표, 알고리즘 설명).

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css"
/>
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"></script>
<script>
  renderMathInElement(document.body);
</script>
```

마크업: 인라인 `\( E = mc^2 \)`, 블럭 `$$ \sum_{i=1}^{n} x_i $$`.

### Iconify — 아이콘

**포함 조건**: 카드나 항목에 emoji보다 정교한 아이콘이 필요할 때. emoji로 충분하면 사용하지 않는다.

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/iconify/2.0.0/iconify.min.js"></script>
```

마크업: `<span class="iconify" data-icon="lucide:rocket"></span>`. Lucide, Material, Font Awesome 등 20만+ 아이콘 접근 가능.

### lottie-web — 인트로 애니메이션

**포함 조건**: 브랜드 인트로 애니메이션 에셋(`assets/*.anim.js` 등 `window.INTRO_ANIM` 정의)이 **실제로 존재할 때만**. 없으면 정적 히어로로 대체하고 CDN을 포함하지 않는다.

```html
<script src="https://cdn.jsdelivr.net/npm/lottie-web@5.12.2/build/player/lottie_light.min.js"></script>
```

제어 스크립트는 정본 §15 MODULE: lottie 참조. 활성 슬라이드 진입 시 1회 재생 후 유휴 세그먼트 루프, 로드 실패 시 정적 폴백.

### 요약 테이블

| 라이브러리   | 포함 조건                     | 슬라이드 타입 연관           |
| ------------ | ----------------------------- | ---------------------------- |
| highlight.js | 코드 블럭이 있을 때           | `code`                       |
| Chart.js     | 수치를 차트로 시각화할 때     | `stat-grid` 보완             |
| Mermaid      | 복잡한 다이어그램이 필요할 때 | `flow`, `timeline` 상위 대안 |
| KaTeX        | 수학 수식이 등장할 때         | `content` (학술)             |
| Iconify      | 정교한 아이콘이 필요할 때     | `card-grid`, `flow`          |
| lottie-web   | 인트로 애니메이션 에셋이 있을 때 | `title` 인트로               |

---

## Reference Files

슬라이드 생성 시 참조하는 파일 (`design-system.md`는 모든 디자인 경로에서 **엔진으로 필수**):

- `references/design-system.md`: **deck 엔진 정본**. 테마 토큰, 유동 캔버스, 전환/네비/시퀀서/라이트박스/비디오/발표자보기 모듈, 컴포넌트 전체. baseline/feature 모듈을 그대로 복사해 삽입한다
- `references/content-rules.md`: 슬라이드·노트 콘텐츠 생성 규칙 (제목/본문/수치/유형별 규칙)
- `references/narrative-structures.md`: SCQA/PAS/BAB/StoryBrand/Pyramid 결정 트리·슬롯 배분·시간 분배·훅/CTA 패턴
- `references/forbidden-phrases.md`: 금지 문구 목록 + 교체 원칙 (§2.4)
- `references/self-check.md`: 덱·슬라이드·노트 단위 자기 검증 루브릭 (§10)
- `references/note-protocol.md`: 발표자 노트 5요소 마크업, CSS, 토글 JS (§6)
- `../../scripts/validate-slides.mjs`: Chrome 기반 16:9·모바일·overflow·SVG·Mermaid·console 전수 검증기
- 파일이 존재하지 않으면 본 skill에 명시된 CSS 규칙과 폰트 fallback만으로 진행한다. 에러를 사용자에게 알리고 계속 생성한다.

Gemini 디자인 리뷰 (Step 7):

- `gemini-design-review` 스킬: HTML 디자인 리뷰를 Gemini CLI로 수행하는 전용 스킬. 리뷰 프롬프트와 실행 로직이 해당 스킬에 캡슐화되어 있다.

품질 레퍼런스 (참고용, 복사 대상 아님):

- `assets/example-dark.html`: 다크 테마 deck 예시 (기술 발표) — baseline + 대표 feature 모듈 시연
- `assets/example-light.html`: 라이트 테마 deck 예시 (비즈니스 전략)
- 이 파일들은 **목표 품질 수준의 적용 예시**이다. 구조, CSS 값, 컴포넌트 배치를 참고하되, 콘텐츠에 맞게 자유롭게 변형한다. 템플릿을 그대로 복사하거나 템플릿의 슬라이드 구성에 갇히지 않는다.
