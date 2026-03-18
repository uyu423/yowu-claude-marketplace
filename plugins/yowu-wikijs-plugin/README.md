# yowu-wikijs-plugin

wiki.yowu.dev WikiJS 지식 관리 플러그인. WikiJS MCP(`@yowu-dev/requarks-wiki-mcp`)를 통한 검색, 생성, 수정, 삭제 + 자동 경로 분류, 관련 문서 링킹.

## 기능

- **WikiJS 검색/탐색**: 서브에이전트 격리로 메인 컨텍스트 토큰 절약
- **페이지 생성**: 자동 경로 분류 (`/dev/`, `/tips/`, `/notes/`, `/book/`)
- **관련 문서 발견**: 태그/키워드/형제 페이지 기반 자동 검색
- **양방향 링크 제안**: 역방향 링크 후보 평가 및 사용자 승인 후 반영
- **다국어 동기화**: ko/en/ja 로케일 간 자동 감지 및 번역 제안

## 설치

```
/plugin install yowu-wikijs-plugin@yowu-claude-marketplace
```

## 환경 설정

최초 사용 시 WikiJS API 토큰 설정이 필요합니다:

```
/yowu-wikijs:plugin-setup
```

또는 직접 환경변수를 설정:

```bash
export WIKI_API_TOKEN="your-wikijs-api-token"
export WIKI_BASE_URL="https://wiki.yowu.dev"  # 선택, 기본값
```

## 사용법

### 커맨드

| 커맨드 | 설명 |
|--------|------|
| `/yowu-wikijs:wikijs <action> [args]` | WikiJS 관리 (search, create, update, delete, browse) |
| `/yowu-wikijs:search <query>` | WikiJS 페이지 검색 |
| `/yowu-wikijs:plugin-setup` | 환경변수 설정 |

### 자동 트리거

위키 관련 키워드("위키에 추가해줘", "wikijs 검색", "wiki.yowu.dev" 등)를 감지하면 `yowu-wikijs` 스킬이 자동 활성화됩니다.

### 예시

```
/yowu-wikijs:search kotlin coroutine
/yowu-wikijs:wikijs create "Spring WebClient 타임아웃 가이드"
/yowu-wikijs:wikijs update /dev/kotlin/coroutines "withContext 주의사항 추가"
/yowu-wikijs:wikijs browse /dev
```

## 구성

| 컴포넌트 | 설명 |
|----------|------|
| WikiJS MCP 서버 | `@yowu-dev/requarks-wiki-mcp` (npx 실행) |
| `wikijs-researcher` 에이전트 | 읽기 전용 WikiJS 리서처 (서브에이전트) |
| `yowu-wikijs` 스킬 | WikiJS 지식 관리 자동 트리거 |
| `plugin-setup` 스킬 | 환경변수 설정 |
