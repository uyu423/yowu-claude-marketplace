# 발표자 노트 프로토콜

> 가이드 §6 기반. 각 슬라이드에 `<aside class="slide-notes" hidden>`으로 임베드한다.
> 단일 HTML 파일 원칙을 유지하면서 발표자 노트 5요소를 제공한다.

---

## 1. 5요소 템플릿 (§6.1)

각 슬라이드 노트는 아래 5요소(요지/전환/핵심/상호작용/Q&A 대비) + 소요 시간을 포함한다. Lite 모드에서는 ★ 표시 3개만 필수.

```html
<aside class="slide-notes" hidden>
  <h4>요지 ★</h4>
  <p>이 슬라이드에서 청중이 가져야 할 한 문장 결론.</p>

  <h4>전환</h4>
  <p>앞 슬라이드에서 이어지는 연결 문장 1~2개.</p>

  <h4>핵심 ★</h4>
  <ul>
    <li>말해야 할 포인트 1 — 수치·사례·출처 포함</li>
    <li>말해야 할 포인트 2</li>
    <li>말해야 할 포인트 3 (최대 3개)</li>
  </ul>

  <h4>상호작용</h4>
  <p>질문·멈춤·데모 타이밍. 없으면 "없음" 명시.</p>

  <h4>Q&amp;A 대비</h4>
  <ul>
    <li>예상 질문 1 — 답변 요점</li>
    <li>예상 질문 2 — 답변 요점</li>
  </ul>

  <h4>소요 시간 ★</h4>
  <p>예상 {분}분 {초}초</p>
</aside>
```

**★ Lite 모드**: 요지, 핵심, 소요 시간 3개만 필수. 나머지 생략 허용.

---

## 2. 말투 규칙 (§6.2)

- **입말**로 쓴다. 발표자가 읽지 않고 훑는 속도로.
- 강조: `<strong>굵게</strong>`, 쉼: `//`, 긴 정지: `(pause 3s)`
- 포인트형 `<ul>` 선호. 긴 문단 금지.

---

## 3. 트랜지션 문장 은행 (§6.3)

| 상황 | 표준 문구 |
|------|---------|
| 원인 → 결과 | "그래서 벌어지는 일이…" |
| 대비·반전 | "그런데 여기서 반전이 있습니다" |
| 심화 | "조금 더 깊이 들어가면…" |
| 요약 → 다음 | "지금까지가 문제였습니다. 이제 해법입니다." |
| 클라이맥스 예고 | "오늘 가장 중요한 한 장입니다" |
| 데이터 제시 | "숫자로 보면 이렇게 나옵니다" |
| Q&A 유도 | "여기까지 듣고 궁금한 점이 생겼을 것 같습니다" |

---

## 4. aside CSS

`design-system.md` §7 MODULE: notes를 참조.

핵심 원칙:
- 기본: `display: none`
- `body.notes-visible` 클래스 추가 시 표시
- `@media print`에서 강제 표시 (`page-break-inside: avoid`)

---

## 5. 노트 토글 JS (30줄 이내)

정본 §7 MODULE: notes-js에 정의된 코드와 동일하다. 여기서는 참조용으로만 남긴다 — 실제 구현은 정본을 그대로 삽입한다.

```js
// design-system.md §7 MODULE: notes-js와 동일 (여기서는 참조용)
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
```

**단축키**: `Shift+N` (한국어 IME 단독 `N` 입력 충돌 방지)
**F키 바인딩과 동일 패턴**: `isComposing` + `input/textarea/contentEditable` 가드 포함

---

## 6. Mermaid·Chart.js 금지

`<aside class="slide-notes">` 내부에 Mermaid `<pre class="mermaid">` 또는 Chart.js `<canvas>`를 넣지 않는다. aside는 텍스트 노트 전용이다.

---

## 7. Redundancy 자기 점검 (§2.2)

노트 생성 후:
1. 노트의 각 문장이 슬라이드 본문(`.desc`, `h2`, 불릿)에 **동일 문장**으로 이미 있는지 확인
2. 동일 문장 발견 시 노트 문장을 재작성 (슬라이드 키워드 → 노트에서 서사로 확장)
3. "같은 개념을 다른 문장"으로 중복하는 것은 허용 (금지는 **동일 문자열 반복**만)

---

## 8. 발표자 보기 연동 (design-system.md §8)

`aside.slide-notes`는 인쇄·화면 토글용 노트일 뿐 아니라, **P 키로 여는 발표자 보기(presenter view) 별창의 대본 원본**이다. 정본 §8 presenter-js의 `notesOf(i)`가 각 슬라이드의 `aside.slide-notes`를 `querySelector`로 찾아 그 `innerHTML`을 그대로 발표자 창 `.pv-notes`에 렌더한다 — 별도 대본 데이터를 따로 작성하지 않는다.

이 승격된 역할이 노트 작성에 요구하는 것:

- **(a) 입말로 쓴다.** 발표자 창은 발표 중에 곁눈질로 읽는 화면이다. §2의 말투 규칙(입말, 짧은 문장, 훑어 읽는 속도)을 더 엄격히 지킨다 — 여기 적힌 문장이 곧 발표자가 소리 내어 말할 원고에 가장 가깝다.
- **(b) 5요소 헤딩(`h4`)을 유지한다.** `.pv-notes h4`가 발표자 창에서 accent 색 소제목으로 그대로 시각화되므로(§1 5요소 템플릿 구조 유지), 헤딩을 생략하거나 구조를 흩트리면 발표자 창의 가독성이 깨진다.
- **(c) `<strong>`/`<b>` 강조를 적극 활용한다.** `.pv-notes b, .pv-notes strong`이 `var(--accent-2)` 색으로 렌더되어 발표자가 한눈에 강조 포인트를 짚을 수 있다. 핵심 수치·키워드는 반드시 `<strong>`으로 감싼다.

발표자 보기는 메인 덱에서 `P` 키로 별창을 열며, 두 창은 `postMessage`로 현재 슬라이드 인덱스를 양방향 동기화한다(메인 덱이 이동하면 발표자 창도 따라가고, 발표자 창에서 방향키를 눌러도 메인 덱이 넘어간다). 자세한 구현은 정본 §8을 참조.
