# yowu-slide-plugin

HTML 스크롤텔링 기반 발표자료 생성 플러그인. 수직 스크롤 + scroll-snap으로 페이지 단위 전환되는 프레젠테이션을 단일 HTML 파일로 생성한다.

## 기능

- **스크롤텔링 프레젠테이션**: reveal.js 없이 순수 HTML+CSS로 깔끔한 발표자료 생성
- **테마 선택**: Dark / Light 테마 (콘텐츠 성격에 따라 자동 권장)
- **디자인 소스 선택**: frontend-design(화려) / 자체 디자인시스템(심플) / 사용자 커스텀
- **코드 하이라이팅**: highlight.js CDN 자동 통합
- **페이지 단위 스크롤**: `scroll-snap-type: y mandatory`로 스페이스/스크롤 시 정확한 페이지 이동
- **콘텐츠 품질 가드**: 환각 금지, 결론형 제목, 키워드 본문, 금지 문구 필터, 자기 검증 루브릭 (Strict 모드)
- **발표자 노트**: 각 슬라이드에 5요소 노트(요지/전환/핵심/상호작용/Q&A 대비/소요 시간) 자동 생성, Shift+N으로 토글
- **Strict/Lite 모드**: 기본 Strict (루브릭 전수 체크), "lite mode"·"빠른 초안" 입력으로 Lite 전환 가능

## 설치

```
/plugin install yowu-slide-plugin@yowu-claude-marketplace
```

## 사용법

### 스킬

| 스킬 | 설명 |
|------|------|
| `/yowu-slide:yowu-create-slides <주제>` | 발표자료 생성 |

### 예시

```
/yowu-slide:yowu-create-slides "FastAPI 아키텍처 소개 12분 발표"
/yowu-slide:yowu-create-slides "Q2 제품 전략 제안서"
/yowu-slide:yowu-create-slides works/planning/slide-outline.md 에 따른 발표자료
```

### 워크플로우

1. **콘텐츠 이해 + 입력 검증** — 청중/목표/소스 확인, 모드 판별 (Strict/Lite/Timed)
2. **사용자 컨펌** — 테마/디자인/슬라이드 구성/컬러 제안 (AskUserQuestion)
3. **서사 구조 선택** — SCQA(기본)/PAS/BAB/Pyramid 등
4. **아웃라인 + 개요 검증** — 결론형 제목, 훅·CTA 체크
5. **HTML 생성** — Skeleton → Append (발표자 노트 포함)
6. **자기 검증** — M1-M4 체크 (Strict 모드)
7. **Gemini 디자인 리뷰 + 메타 블록 출력** (선택)

## 기술 스택

- 나눔스퀘어 네오 웹폰트 (@font-face)
- highlight.js 11.9.0 (CDN)
- CSS scroll-snap (페이지 단위 스크롤)
- 단일 HTML 파일 (외부 의존성 없음)
