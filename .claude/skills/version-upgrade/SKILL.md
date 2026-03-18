---
name: version-upgrade
description: yowu-claude-marketplace 마켓플레이스 및 하위 플러그인의 버전을 올린다. 플러그인 배포, 릴리즈, 버전 태깅, 버전 변경이 필요할 때 사용한다. 마지막 버전 커밋 이후 실제로 변경된 플러그인만 자동 감지하여 업그레이드한다.
---

# version-upgrade

마지막 버전 커밋 이후 변경된 플러그인을 자동 감지하고, 해당 플러그인의 버전만 올린다.

## 버전 관리 구조

```
.claude-plugin/marketplace.json
  └─ metadata.version          ← 마켓플레이스 자체 버전 (하나 이상의 플러그인이 업그레이드될 때 범프)
  └─ plugins[].version         ← 각 플러그인 항목 버전 (plugin.json과 항상 동기화)

plugins/{name}/.claude-plugin/plugin.json
  └─ version                   ← 플러그인 버전 (단일 출처)
```

## 입력 파싱

**대상 플러그인** (명시 없으면 `auto` — 변경된 플러그인 자동 감지)
- `auto` — git 변경 이력 기반 자동 감지 (기본값)
- `all` — 모든 플러그인 강제 업그레이드
- 특정 플러그인명 — 해당 플러그인만 강제 지정
- 복수 지정 가능 (예: "foo랑 bar")

**버전 범프 타입** (명시 없으면 `patch`)
- `patch` — 1.0.0 → 1.0.1
- `minor` — 1.0.0 → 1.1.0
- `major` — 1.0.0 → 2.0.0
- 명시 버전 — "1.2.3으로" 직접 지정

## 실행 절차

### Step 1: 플러그인 목록 확인

`.claude-plugin/marketplace.json`의 `plugins` 배열에서 등록된 플러그인 목록을 읽는다.
플러그인이 0개이면 "등록된 플러그인이 없습니다"로 종료.

### Step 2: 각 플러그인의 마지막 버전 커밋 찾기

각 플러그인의 `plugin.json`이 마지막으로 변경된 커밋 해시를 구한다:

```bash
git log -1 --format="%H" -- plugins/{name}/.claude-plugin/plugin.json
```

결과가 없으면 (신규 플러그인) → 변경 있음으로 간주.

### Step 3: 변경 여부 감지 (auto 모드일 때)

각 플러그인 디렉토리에서 마지막 버전 커밋 이후 변경된 파일이 있는지 확인:

```bash
# {LAST_VERSION_HASH} = Step 2에서 구한 커밋 해시
git diff --name-only {LAST_VERSION_HASH}..HEAD -- plugins/{name}/
```

출력이 비어 있으면 → 변경 없음 → 버전 업그레이드 대상 제외.

**예외**: 마지막 버전 커밋이 곧 `plugin.json` 자체만 변경한 버전 커밋이라면, 그 이후 다른 파일 변경이 없는 것이므로 정상적으로 "변경 없음"으로 처리.

### Step 4: 현재 버전 읽기

업그레이드 대상으로 선택된 플러그인의 현재 버전을 읽는다:
- `.claude-plugin/marketplace.json` → `metadata.version`, `plugins[].version`
- `plugins/{name}/.claude-plugin/plugin.json` → `version`

### Step 5: 새 버전 계산

SemVer 규칙 적용 (patch 기본):
- patch: Z+1 / minor: Y+1, Z=0 / major: X+1, Y=0, Z=0
- 명시 버전 사용 시 형식 검증 (`\d+\.\d+\.\d+`)
- 새 버전이 현재 버전보다 낮거나 같으면 경고 후 재확인 요청

### Step 6: 변경 예고 출력

```
버전 업그레이드 예고  [auto 감지 / patch]
────────────────────────────────────────────────────────
대상                  현재      →  새 버전   변경 여부
────────────────────────────────────────────────────────
marketplace           0.1.0     →  0.1.1    (플러그인 업그레이드에 따라)
{plugin-name}         1.0.0     →  1.0.1    ✓ 변경됨 (3 files)
────────────────────────────────────────────────────────
변경 파일:
  .claude-plugin/marketplace.json
  plugins/{name}/.claude-plugin/plugin.json

진행할까요? (y/n)
```

업그레이드 대상이 없으면 "모든 플러그인이 최신 버전입니다"로 종료.

### Step 7: 파일 업데이트

사용자 확인 후 적용:

**업그레이드 대상 플러그인마다:**
1. `plugins/{name}/.claude-plugin/plugin.json` → `version` 업데이트
2. `.claude-plugin/marketplace.json` → 해당 plugins 항목의 `version` 업데이트

**하나 이상의 플러그인이 업그레이드된 경우 추가로:**
3. `.claude-plugin/marketplace.json` → `metadata.version` 업데이트 (같은 범프 타입 적용)

JSON 수정 시 기존 들여쓰기(4 spaces)와 포맷 유지.

### Step 8: 커밋

```bash
git add .claude-plugin/marketplace.json plugins/{변경된 플러그인들}/.claude-plugin/plugin.json
git commit -m "chore(version): ..."
```

커밋 메시지 형식:
- 단일 플러그인: `chore(version): {plugin-name} 1.0.0 → 1.0.1`
- 복수: `chore(version): marketplace 0.1.0 → 0.1.1 ({name1}, {name2})`
- 전체: `chore(version): marketplace 0.1.0 → 0.1.1 (all plugins)`

**push는 하지 않는다** — 사용자가 직접 진행.

## 예시

```
# 자동 감지 (기본)
/version-upgrade                              → auto, patch
"버전 올려줘"                                  → auto, patch
"릴리즈해줘"                                   → auto, patch

# 범프 타입 지정
"minor로 올려줘"                               → auto, minor

# 강제 지정
"foo 플러그인만 올려줘"                         → foo, patch
"전체 다 1.1.0으로 올려줘"                     → all, 1.1.0
```

## 주의사항

- `plugin.json` 파일 자체의 변경(버전 숫자만 바뀐 것)은 "실제 변경"으로 보지 않는다 — 이미 버전 커밋된 상태이므로 이후 추가 변경이 없으면 skip.
- 마켓플레이스 `metadata.version`은 하나 이상의 플러그인이 업그레이드될 때만 범프.
