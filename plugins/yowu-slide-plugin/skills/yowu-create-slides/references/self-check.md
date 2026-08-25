# 자기 검증 루브릭

> 가이드 §10 기반. Strict 모드의 Step 6.5에서 실행. Lite 모드는 이 파일을 호출하지 않는다.

---

## 브라우저 렌더 체크 (모든 모드, 선행 필수)

`SKILL.md` Step 6.4에 따라 `scripts/validate-slides.mjs`를 실행한다. 이 검사는 Strict/Lite와 무관하게 실제 Chrome 렌더 결과를 판정한다.

- 16:9 `1920×1080`, `1280×720`의 모든 슬라이드 overflow·viewport 이탈
- 모바일 `390×844`의 가로 overflow·세로 스크롤 폴백·전체 슬라이드 가시성
- 긴 SVG 연결선 길이 정규화와 활성화 후 완성 상태
- 숨은 슬라이드 Mermaid 지연 렌더와 0이 아닌 SVG 크기
- `?presenter` 발표자 뷰 렌더와 동기화 왕복(대본·제목·페이지 카운트가 지정 인덱스로 갱신되는지)
- JavaScript 예외와 `console.error`

브라우저 검증 실패 또는 Chrome 미탐지는 PASS가 아니다. 수정 후 재실행하거나 최종 메타 블록에 `[RENDER-CHECK WARN]`을 남긴다.

---

## 기계 판정 체크리스트 (Strict 모드 재시도 트리거)

아래 8개 항목은 HTML에서 기계적으로 판정 가능하다. 1개 이상 실패 시 해당 슬라이드나 모듈만 Edit으로 수정 (1회 한정). 재시도 후에도 실패하면 통과 처리 + 메타 블록에 `[SELF-CHECK WARN]` 기록.

| # | 항목 | 합격 기준 |
|---|------|---------|
| M1 | 첫 슬라이드 타입 | `class` 속성에 `slide--title` 포함 |
| M2 | 마지막 슬라이드 타입 | `class` 속성에 `slide--closing` 포함 |
| M3 | 마지막 슬라이드 제목 | `h1`/`h2` 텍스트가 `/^(감사합니다|Thank\s*you|Q\s*&\s*A|질문\s*있으신가요)$/` 패턴과 **일치하지 않음** |
| M4 | 슬라이드 제목 결론형 | 모든 `h1`/`h2` 텍스트가 `/^(소개|개요|목차|결론|Overview|Agenda|Conclusion)$/` 패턴과 **일치하지 않음** |
| M5 | 엔진 무결성 | 결과물에 `__deckGo` · 더블 rAF(`requestAnimationFrame` 중첩 호출) · `slides.length` · `[?&]presenter`(발표자 headscript 정규식; 리터럴 `?presenter` 아님 — 정본은 문자열 연결로 생성) · `hudBar`가 모두 존재 (누락 시 정본 design-system.md 모듈 재삽입) |
| M6 | SVG 드로잉 무결성 | `.fc .eg`가 존재하면 모든 SVG geometry에 `pathLength="1"`이 있고 결과물에 `__normalizeSvgEdges`가 존재 |
| M7 | Mermaid 렌더 무결성 | `.mermaid`가 존재하면 `startOnLoad:true`가 없고 `mermaid.run`·`deck:change`가 존재 |
| M8 | 발표자 브리지 무결성 | `__openPresenter` · `__presenterOpen` · `yowu-presenter-hello` · `yowu-deck-sync`가 모두 존재. M5는 headscript만 보므로 별창을 여는 코드가 빠져도 통과한다 (누락 시 정본 §7 notes-js + §8 presenter-js 재삽입) |

---

## LLM 판정 체크리스트 (로깅만, 재시도 트리거 없음)

아래 항목은 LLM이 주관적으로 판단한다. YES/NO 집계 후 메타 블록에 기록하되, 재시도를 자동으로 유발하지 않는다.

**덱 단위**

- [ ] 첫 슬라이드가 훅인가? (Agenda/목차 내용이 아님)
- [ ] 마지막 슬라이드가 구체적 CTA를 포함하는가?
- [ ] 서사 구조가 `narrative-structures.md` 중 하나에 매핑되는가?
- [ ] 청중 맞춤이 최소 3곳에 반영됐는가?
- [ ] 환각 가능 수치가 모두 플레이스홀더 또는 출처 명시 상태인가?
- [ ] `forbidden-phrases.md` HARD 목록의 문구가 없는가?

**슬라이드 단위 (샘플 3개)**

- [ ] 제목이 결론형인가?
- [ ] 본문이 키워드 단위인가? (완전 문장 없음)
- [ ] 글머리표 4개 이하인가?
- [ ] 차트가 있다면 의도 기반 선택인가? (§7.4)
- [ ] 수치에 단위·기간·조건이 있는가?

**노트 단위 (샘플 3개)**

- [ ] 5요소(요지/전환/핵심/상호작용/Q&A 대비/소요 시간)가 모두 있는가?
- [ ] 슬라이드 본문 문장을 반복하지 않는가?
- [ ] 소요 시간이 명시돼 있는가? (**전 슬라이드 필수** — 발표자 창 페이싱의 입력이다. 한 장이라도 비면 그 뒤 계산이 어긋난다)

---

## 판정 표

| 기계 판정 M1-M8 | LLM 판정 YES 비율 | 처리 |
|-----------------|-------------------|------|
| 전부 통과 | — | Step 7로 진행 |
| 1개 이상 실패 | — | 실패 슬라이드만 Edit 재생성 (1회) |
| 재시도 후 실패 | — | 통과 처리 + 메타 블록 `[SELF-CHECK WARN]` |
| — | < 70% | 메타 블록에 경고 목록 기록 |

---

## 메타 블록 기록 형식

```
Render-check: PASS (16:9 2종 + mobile + 전체 슬라이드)
Self-check: PASS (M1-M8 전부 통과) | LLM: 8/10 (80%)
또는
Render-check: WARN — Chrome 미탐지로 브라우저 검증 미실행
Self-check: WARN — M3 실패 (1회 재시도, 최종 통과) | LLM: 7/10 (70%)
또는
Self-check: WARN — M4 재시도 실패, 진행 | LLM: 5/10 (50%, 경고)
```
