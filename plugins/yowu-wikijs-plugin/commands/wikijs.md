---
description: WikiJS 지식 관리 (검색, 생성, 수정, 삭제, 탐색)
argument-hint: <action> [args]
---

# /yowu-wikijs:wikijs

wiki.yowu.dev WikiJS를 관리한다. 검색/조회 시 서브에이전트로 컨텍스트를 절약하고, 쓰기 작업은 메인 컨텍스트에서 직접 수행한다.

## Usage

```
/yowu-wikijs:wikijs <action> [args]
```

- **action**: search, create, update, delete, browse
- **args**: 액션별 인자

## Actions

### search
```
/yowu-wikijs:wikijs search <query>
```
WikiJS 페이지 검색. `wikijs-researcher` 서브에이전트가 검색 결과를 요약하여 반환.

### create
```
/yowu-wikijs:wikijs create <topic>
```
새 WikiJS 페이지 생성. 자동 경로 분류, 관련 문서 발견, 양방향 링크 제안.

### update
```
/yowu-wikijs:wikijs update <path-or-title> [changes]
```
기존 WikiJS 페이지 수정. 관련 문서 링크 갱신, 양방향 링크 제안.

### delete
```
/yowu-wikijs:wikijs delete <path-or-title>
```
WikiJS 페이지 삭제. 사용자 확인 필수.

### browse
```
/yowu-wikijs:wikijs browse [path]
```
WikiJS 페이지 구조 탐색. 경로 트리를 서브에이전트가 요약하여 반환.

## Examples

```
/yowu-wikijs:wikijs search kotlin coroutine
/yowu-wikijs:wikijs create "Spring WebClient 타임아웃 설정 가이드"
/yowu-wikijs:wikijs update /dev/kotlin/coroutines "withContext 주의사항 추가"
/yowu-wikijs:wikijs delete /notes/temp-investigation
/yowu-wikijs:wikijs browse /dev/kotlin
```

## How It Works

1. **search/browse**: `wikijs-researcher` 서브에이전트를 스폰하여 별도 컨텍스트에서 WikiJS 조회 → 요약만 반환
2. **create/update/delete**: `yowu-wikijs` 스킬의 워크플로우를 트리거하여 메인 컨텍스트에서 직접 WikiJS MCP 호출
