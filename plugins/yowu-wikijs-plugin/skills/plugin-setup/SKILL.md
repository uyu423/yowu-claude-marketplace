---
name: yowu-wikijs-plugin:plugin-setup
description: yowu-wikijs-plugin 환경 설정. WikiJS API 토큰 환경변수를 대화형으로 ~/.zshrc에 추가한다. 트리거 - '/yowu-wikijs:plugin-setup', 'wikijs plugin setup', 'WikiJS API 토큰 설정', 'WikiJS MCP 설정'
---

# plugin-setup: WikiJS API 토큰 환경 설정

yowu-wikijs-plugin을 처음 사용할 때 필요한 WikiJS API 토큰 설정 스킬.

## 워크플로우

### Step 1: 셸 RC 파일 결정

```bash
basename "$SHELL"
```

- `zsh` → `~/.zshrc`
- `bash` → `~/.bashrc`
- 기타 → AskUserQuestion으로 RC 파일 경로 직접 입력

### Step 2: 환경변수 대화형 설정

#### 2-1: 현재 상태 점검

아래 변수들의 설정 여부를 점검 (값은 출력하지 않음):

```bash
[ -n "${VAR_NAME:-}" ] && echo "SET" || echo "UNSET"
```

| 환경변수 | 용도 | 필수 여부 |
|----------|------|:---------:|
| `WIKI_API_TOKEN` | WikiJS API 토큰 (JWT) | 필수 |
| `WIKI_BASE_URL` | WikiJS 서버 URL | 선택 (기본: https://wiki.yowu.dev) |

점검 결과 출력:

```
환경변수 점검:
- WIKI_API_TOKEN:  ✅ 설정됨 (또는 ❌ 미설정)
- WIKI_BASE_URL:   ✅ 설정됨 (또는 ❌ 미설정, 기본값 사용)
```

모든 필수 변수가 설정됨 → Step 3으로 자동 진행.

#### 2-2: 미설정 변수 대화형 입력

미설정 변수가 있으면, 각 변수마다 AskUserQuestion으로 값을 입력받는다.

순서: 필수 변수 먼저, 선택 변수 나중. 질문 형식:

> `WIKI_API_TOKEN`을 입력하세요.
> (WikiJS 관리자 > API Access에서 API Key 발급)
> (Enter = 건너뛰기):

- 값 입력 시 → 저장 대기열에 추가
- Enter(빈 입력) → 해당 변수 건너뛰기

#### 2-3: RC 파일에 일괄 추가

입력받은 변수들을 RC 파일 끝에 마커 블록으로 추가:

1. RC 파일에 기존 마커 블록(`# -- yowu-wikijs-plugin --`)이 있으면 해당 블록 제거
2. 새 블록 추가:

```bash
# -- yowu-wikijs-plugin --
export WIKI_API_TOKEN="입력값"
export WIKI_BASE_URL="https://wiki.yowu.dev"
# -- yowu-wikijs-plugin end --
```

3. 추가한 변수들의 설정 여부 재점검

#### 2-4: 보안 경고

```
⚠️ 토큰은 절대 Git에 커밋하지 마세요.
```

### Step 3: 완료 보고

```
✅ yowu-wikijs-plugin 환경 설정 완료!

환경변수: WIKI_API_TOKEN 설정됨

⚠️ Claude Code를 재시작해야 환경변수가 MCP 서버에 적용됩니다.
   Claude Code를 종료한 후, 터미널에서 다시 시작해주세요.
```

## 주의사항

- 환경변수 값은 AskUserQuestion 입력 시에만 취급하고, 점검 시에는 설정 여부(SET/UNSET)만 확인
- 입력받은 토큰을 로그, 출력, 파일(RC 파일 제외)에 노출하지 않음
- 마커 블록으로 감싸서 재실행 시 중복 방지
- AskUserQuestion은 한 번에 하나씩만 사용
