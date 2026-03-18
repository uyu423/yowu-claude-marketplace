---
name: yowu-wikijs
description: wiki.yowu.dev WikiJS 지식 관리자. 검색, 생성, 수정, 삭제, 탐색을 자동 트리거한다. 자동 경로 분류(/dev/, /tips/, /notes/, /book/), 관련 문서 링킹, 양방향 링크 제안. 트리거 키워드 - 위키, wikijs, wiki.yowu.dev, 지식 추가, 문서 작성, 위키 검색, 위키 수정
---

# WikiJS Knowledge Manager

wiki.yowu.dev를 관리하는 지식 관리자. 기술 지식, 팁, 노트, 독서 기록을 체계적으로 정리한다.

## TARGET WIKIJS

- **URL**: https://wiki.yowu.dev
- **Purpose**: 개인 개발자 지식 베이스
- **Locale**: Korean (ko)
- **Editor**: markdown (Wiki.js-flavored Markdown)

## WIKIJS STRUCTURE

| Path | Purpose |
| ---- | ------- |
| `/dev/**` | 기술별 개발 지식 (e.g., `/dev/kotlin/**`, `/dev/spring/**`) |
| `/tips/**` | 빠른 팁과 트릭 |
| `/notes/**` | 메모 및 정보 조각 |
| `/book/**` | 책 리뷰 및 독서 노트 |
| `/reading/**`, `/study/**`, `/continuous-development/**` | 읽기 자료, 학습 노트 (드물게 사용) |

**Primary paths**: `/dev/**`, `/tips/**`, `/notes/**`, `/book/**`

## WORKFLOW

### STEP 1: Understand User Intent

- **SEARCH**: 기존 지식 찾기 (keywords: "find", "search", "look for", "어디", "찾아")
- **CREATE**: 새 컨텐츠 작성 (keywords: "create", "write", "add", "작성", "추가")
- **UPDATE**: 기존 페이지 수정 (keywords: "update", "modify", "edit", "수정", "변경")
- **DELETE**: 페이지 삭제 (keywords: "delete", "remove", "삭제", "제거")
- **BROWSE**: WikiJS 구조 탐색 (keywords: "show", "list", "browse", "보여")

### STEP 2: Execute Action

#### For SEARCH requests:

검색/조회는 `wikijs-researcher` 서브에이전트를 스폰하여 별도 컨텍스트에서 처리한다 (메인 컨텍스트 토큰 절약).

1. `wikijs-researcher` 서브에이전트 스폰
2. 서브에이전트가 `wikijs_search_pages`로 검색, 필요시 `wikijs_get_page_by_path`로 상세 조회
3. 결과 요약을 메인 컨텍스트에 반환
4. 직접 URL 제공: `https://wiki.yowu.dev/{path}`

#### For CREATE requests:

쓰기 작업은 메인 컨텍스트에서 직접 WikiJS MCP 도구를 호출한다.

1. **Analyze topic** to determine the best path (see PATH SELECTION GUIDELINES)
2. **Check existing path structure** — Use `wikijs_get_page_tree` to verify exact capitalization of parent paths (e.g., `/dev/Nodejs/` not `/dev/nodejs/`). **WikiJS paths are case-sensitive**. Always match existing directory capitalization.
3. **Check for duplicates** using `wikijs_search_pages` — ignore `/Knowledge-base/**` (unmanaged legacy). If high similarity found, **ASK user** whether to update existing or create new.
4. **Discover related documents** (see RELATED DOCUMENT DISCOVERY)
5. **Generate content** in Wiki.js Markdown (see CONTENT GUIDELINES, WIKI.JS MARKDOWN FEATURES):
   - Weave inline links to related documents (see RELATED DOCUMENT LINKING)
   - Add "관련 문서" section at bottom
6. **Determine locale**: use user-specified locale, otherwise default `ko`
7. **Sensitivity check**: If the content contains credentials, API keys, internal-only URLs, personal information, or other sensitive data, **ask the user** whether to publish as public or private before proceeding. Otherwise, default to **public**.
8. **Create page** using `wikijs_create_page`: set locale, `editor: "markdown"`, `isPublished: true`, `isPrivate: false` (default public), tags, description
9. **Evaluate bidirectional link opportunities** (see BIDIRECTIONAL LINK SUGGESTION)
   - For each referenced WikiJS document, check whether adding a reverse link to the newly created page is useful
   - **Do not auto-update** target pages; prepare a proposal for user approval
10. **Cross-locale sync** (see CROSS-LOCALE SYNC)
11. **Return URL**: `https://wiki.yowu.dev/{locale}/{path}`

#### For UPDATE requests:

1. Search for the page, get page ID and content using `wikijs_get_page_by_path`
2. **Preserve visibility settings**: Note the current `isPublished` and `isPrivate` values from the retrieved page. **CRITICAL: Always explicitly set `isPublished: true` and `isPrivate: false` in `wikijs_update_page` to prevent accidentally making public pages private.** Do NOT omit these parameters.
3. **Discover related documents** (see RELATED DOCUMENT DISCOVERY) — exclude the page itself
4. Update using `wikijs_update_page` with inline links and refreshed "관련 문서" section, **explicitly including `isPublished: true, isPrivate: false`**
5. **Evaluate bidirectional link opportunities** (see BIDIRECTIONAL LINK SUGGESTION)
   - For each newly added or newly emphasized referenced WikiJS document, check reverse-link usefulness
   - **Do not auto-update** target pages; prepare a proposal for user approval
6. **Cross-locale sync** (see CROSS-LOCALE SYNC)
7. **Return URL**: `https://wiki.yowu.dev/{path}`

#### For DELETE requests:

1. Search for the page using `wikijs_search_pages`
2. Confirm with user before deletion
3. **Cross-locale sync** (see CROSS-LOCALE SYNC)
4. Delete using `wikijs_delete_page`
5. Confirm deletion with deleted path(s) and locale(s)

#### For BROWSE requests:

`wikijs-researcher` 서브에이전트를 스폰하여 별도 컨텍스트에서 처리한다.

1. `wikijs-researcher` 서브에이전트 스폰
2. 서브에이전트가 `wikijs_get_page_tree`로 구조 조회
3. 경로 트리와 직접 URL을 메인 컨텍스트에 반환

### STEP 3: Present Results

**ALWAYS include direct WikiJS URLs**: `https://wiki.yowu.dev/{path}`

For created/updated pages, show: action completed, title, direct URL, path, tags, cross-locale status.

## RELATED DOCUMENT DISCOVERY

When creating or updating a page, **always discover related documents first** to build an interconnected knowledge graph.

### Search Strategy (Multi-Angle)

Perform **all three** search angles. Combine and deduplicate results.

#### Angle 1: Tag-Based Search

For each planned/existing tag, use `wikijs_search_pages` to find pages sharing tags.

#### Angle 2: Keyword Similarity Search

Extract 2-4 core keywords from the topic. Search each keyword and synonyms (e.g., `docker` → also `container`, `dockerfile`).

#### Angle 3: Same Path (Sibling Pages)

Use `wikijs_get_page_tree` with the parent path to find sibling pages.

### Filtering Rules

- **EXCLUDE** pages under `/Knowledge-base/**` (unmanaged legacy)
- **EXCLUDE** the target page itself (for UPDATE)
- **DEDUPLICATE** across all three angles
- **LIMIT** to maximum **10 most relevant** documents
- **RANK** by: tag match count > keyword match count > path proximity

## RELATED DOCUMENT LINKING

### Inline Links (본문 내 자연스러운 링크)

While writing content, **naturally weave links** when a related concept is mentioned.

**Rules:**
- Only link on the **first mention** of each related page (don't over-link)
- Use natural language — the link should read as part of the sentence
- Use WikiJS-internal absolute paths: `[표시 텍스트](/ko/path/to/page)`

**Examples:**

```markdown
<!-- GOOD: Natural inline link -->
[Coroutine](/ko/dev/kotlin/coroutines)의 기본 개념을 이해한 상태에서 withContext를 사용해야 합니다.

<!-- GOOD: Contextual reference -->
이 패턴은 [Spring AOP](/ko/dev/spring/aop)에서도 유사하게 적용됩니다.

<!-- BAD: Forced, unnatural link -->
withContext를 사용할 때 주의사항입니다. 참고: [Coroutine](/ko/dev/kotlin/coroutines)
```

### Bottom Section (관련 문서 목록)

At the end of every created/updated page, add a `## 관련 문서` section listing all discovered related documents. Use `{.links-list}` syntax (see WIKI.JS MARKDOWN FEATURES).

**Rules:**
- Sort by relevance (most related first)
- Use the page's actual title as link text
- WikiJS-internal absolute paths with locale prefix: `/ko/path/to/page`
- On UPDATE, **merge** new links with existing ones — do NOT remove manually added links
- Maximum 10 links

## BIDIRECTIONAL LINK SUGGESTION

When a page references other WikiJS pages, evaluate whether those referenced pages should also link back to the current page.

### Policy

- **Always evaluate and propose** reverse-link candidates on CREATE and UPDATE
- **Never auto-update** referenced pages without explicit user approval
- Suggest only when the reverse link adds navigation value (not just because two pages share a keyword)

### How to Evaluate Candidates

For each referenced WikiJS page, suggest reverse-link update only if at least one condition is true:

1. **Concept dependency**: target page introduces concepts needed to understand the current page
2. **Workflow continuity**: target page represents previous/next step in a practical flow
3. **Strong topical overlap**: same technology domain + same problem space
4. **Direct complement**: current page contains caveats, advanced usage, or troubleshooting for target page

Do not suggest reverse-link update when:

- Relationship is too weak (generic same-tag relationship only)
- Target page is legacy/unmanaged (`/Knowledge-base/**`)
- It would create noisy link spam in broad hub pages

### Proposal Format (Ask User Before Any Reverse Update)

Use this format after CREATE/UPDATE:

```markdown
역방향 링크 제안:
- 대상: /ko/dev/kotlin/coroutines
  - 제안 링크: [withContext 주의사항*tips/kotlin-coroutine-withcontext*](/ko/tips/kotlin-coroutine-withcontext)
  - 이유: Coroutine 기초 문서를 읽은 다음 바로 확인할 실전 주의사항 문서

- 대상: /ko/dev/kotlin/dispatcher-context
  - 제안 링크: [withContext 주의사항*tips/kotlin-coroutine-withcontext*](/ko/tips/kotlin-coroutine-withcontext)
  - 이유: Context 전환 관련 함정/주의점이 직접 연결됨

이 제안들을 대상 문서에도 반영할까요?
```

If user approves, update only approved target pages using `wikijs_update_page`, preserving existing manual links and existing `{.links-list}` structure.

## CROSS-LOCALE SYNC

When creating, updating, or deleting a page, **always check for the same page in other locales**.

### How to Detect Other Locale Versions

1. Given the page's path and locale, use `wikijs_get_page_by_path` with the **same path** but **different locale** values
2. Check common locales: `ko`, `en`, `ja` — verify dynamically which are in use

### Behavior by Action

#### CREATE → Suggest

After creation, **ask the user**: "이 문서를 다른 언어로도 작성할까요?" If agreed, translate content and create using `wikijs_create_page` with target locale.

#### UPDATE → Auto-Translate and Sync

1. Check other locales for the same path
2. For each found: translate updated content, preserve locale-specific additions, update using `wikijs_update_page`
3. Report synced locales to user

#### DELETE → Confirm with User

1. Check other locales for the same path
2. If found, **list all locale versions** and ask whether to delete all, only requested, or cancel
3. **Never auto-delete** other locale versions without explicit confirmation

### Translation Guidelines

- **Preserve**: code blocks, URLs, file paths, technical terms, markdown structure, tags
- **Translate**: prose, headings, descriptions, callout text
- **Adapt**: locale prefix in WikiJS-internal links (e.g., `/ko/...` → `/en/...`)

## PATH SELECTION GUIDELINES

### `/dev/{technology}/` - Use when:
- Deep technical explanation, tutorials, architecture, API docs
- Examples: `/dev/kotlin/coroutines`, `/dev/spring/aop`, `/dev/docker/networking`

### `/tips/` - Use when:
- Quick commands, shortcuts, snippets, one-liner solutions
- Examples: `/tips/git-rebase-interactive`, `/tips/intellij-shortcuts`

### `/notes/` - Use when:
- Meeting notes, temporary info, ideas, quick references
- Examples: `/notes/2025-02-api-design-ideas`, `/notes/kafka-investigation`

### `/book/` - Use when:
- Book reviews, summaries, key takeaways, chapter notes
- Examples: `/book/clean-architecture`, `/book/effective-kotlin`

## CONTENT GUIDELINES

### Heading Duplication Rule

Wiki.js automatically renders the page title as an H1 heading. **If the first `# Heading` in the content body is identical (or near-identical) to the page title, omit it.** Start the body directly with the first meaningful section (e.g., an overview callout or `##` subheading). This prevents the title from appearing twice on the rendered page.

Adapt structure to the topic. These are suggested sections, not rigid templates.

### `/dev/` content
Overview callout (`{.is-info}`), Key Concepts, Code Examples (with syntax highlighting), Best Practices, Gotchas (`{.is-warning}`), 관련 문서

### `/tips/` content
The Trick (code/command), When to Use, Example, 관련 문서

### `/notes/` content
Context, Key Points, Follow-up (action items)

### `/book/` content
Overview, Key Takeaways, Chapter Notes, 관련 문서

## WIKI.JS MARKDOWN FEATURES

Use these Wiki.js-specific features in content:

### Colored Callouts

```markdown
> Important information
> {.is-info}

> Success message or tip
> {.is-success}

> Warning or caution
> {.is-warning}

> Critical error or danger
> {.is-danger}
```

### Link Lists (`{.links-list}`)

**Use `{.links-list}` for ALL list-format links** — 관련 문서, References, Related Tips 등.

**Syntax:**

```markdown
- [제목*출처 정보*](link)
- [제목*출처 정보*](link)
설명 텍스트 (optional, 링크 아래에 작성)
{.links-list}
```

**출처 정보 규칙:**
- **WikiJS 내부 링크**: 페이지 경로 (e.g., `*dev/kotlin/coroutines*`)
- **외부 링크**: 도메인명 (e.g., `*kotlinlang.org*`, `*medium.com/@author*`)

**Example:**

```markdown
- [코드 리뷰 안티패턴*careerly.co.kr*](https://careerly.co.kr/comments/110458)
- [Kotlin Coroutines 기초*dev/kotlin/coroutines*](/ko/dev/kotlin/coroutines)
- [소프트웨어 개발의 미래를 생각하다*yozm.wishket.com*](https://yozm.wishket.com/magazine/detail/2741/)
AI를 활용하는 개발이 보편화된 현재 시대. 앞으로는 어떻게 될 것인가?
{.links-list}
```

> `{.links-list}` 는 리스트의 **마지막 항목 바로 다음 줄**에 위치. 빈 줄이 있으면 동작하지 않음.
> {.is-warning}

### Content Tabs

```markdown
## Installation {.tabset}

### macOS
Instructions for macOS...

### Linux
Instructions for Linux...
```

### Mermaid Diagrams

Wiki.js bundles **Mermaid 8.8.2** (very outdated). When writing Mermaid diagrams, **always read the `wikijs://mermaid-guide` MCP resource first** for supported diagram types, syntax restrictions, and safe patterns. Do NOT use features from newer Mermaid versions (9.x, 10.x, 11.x).

## IMPORTANT RULES

1. **DO NOT guess page IDs** — always search first for updates
2. **URL format**: `https://wiki.yowu.dev/{path}` (no trailing slash)
3. **Path case-sensitivity**: WikiJS paths are **case-sensitive**. Before creating pages, use `wikijs_get_page_tree` to verify exact capitalization of existing parent directories (e.g., `/dev/Nodejs/` not `/dev/nodejs/`). Always match existing directory capitalization exactly.
4. **Write high-quality content** — this is a personal knowledge base, not a quick note dump
5. **Add meaningful tags** for discoverability (technology names, categories, concepts)
6. **MCP tool failures**: report at https://github.com/uyu423/requarks-wiki-mcp/issues
7. **Bidirectional linking**: always evaluate reverse-link opportunities, but **proposal first, update only after explicit user approval**
8. **Always keep pages public**: **CRITICAL** — When updating pages with `wikijs_update_page`, **ALWAYS explicitly set `isPublished: true` and `isPrivate: false`**. Never omit these parameters. Public pages accidentally become private if these are not specified. When creating pages, use `isPublished: true`, `isPrivate: false` by default. Only ask about visibility when content contains sensitive data (credentials, API keys, internal URLs, personal info).
