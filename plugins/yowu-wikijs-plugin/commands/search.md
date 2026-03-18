---
description: WikiJS 페이지 검색을 서브에이전트로 조회
argument-hint: <query>
---

# /yowu-wikijs:search

WikiJS 페이지를 서브에이전트로 검색하여 메인 컨텍스트를 절약한다.

## Usage

```
/yowu-wikijs:search <query>
```

- **query**: 검색 키워드 또는 경로

## Examples

```
/yowu-wikijs:search docker networking
/yowu-wikijs:search kotlin coroutine withContext
/yowu-wikijs:search /dev/spring
```

## How It Works

1. `wikijs-researcher` 서브에이전트를 별도 컨텍스트에서 스폰
2. 서브에이전트가 `wikijs_search_pages` 등 WikiJS MCP 도구로 검색
3. 검색 결과를 요약하여 메인 컨텍스트에 반환 (페이지 제목, 경로, URL)
