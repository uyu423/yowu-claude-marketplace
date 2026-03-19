# yowu-slide-plugin

HTML 스크롤텔링 기반 발표자료 생성 플러그인. 수직 스크롤 + scroll-snap으로 페이지 단위 전환되는 프레젠테이션을 단일 HTML 파일로 생성한다.

## 기능

- **스크롤텔링 프레젠테이션**: reveal.js 없이 순수 HTML+CSS로 깔끔한 발표자료 생성
- **테마 선택**: Dark / Light 테마 (콘텐츠 성격에 따라 자동 권장)
- **디자인 소스 선택**: frontend-design(화려) / 자체 디자인시스템(심플) / 사용자 커스텀
- **코드 하이라이팅**: highlight.js CDN 자동 통합
- **페이지 단위 스크롤**: `scroll-snap-type: y mandatory`로 스페이스/스크롤 시 정확한 페이지 이동

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

1. **콘텐츠 이해** — 주제/아웃라인 분석
2. **테마 선택** — 콘텐츠에 맞는 Dark/Light 권장 후 사용자 확인
3. **디자인 소스 선택** — frontend-design(기본값) / 자체 심플 / 직접 제공
4. **슬라이드 구조 설계** — 8~12개 섹션 배정
5. **HTML 생성** — 단일 파일로 저장

## 기술 스택

- 나눔스퀘어 네오 웹폰트 (@font-face)
- highlight.js 11.9.0 (CDN)
- CSS scroll-snap (페이지 단위 스크롤)
- 단일 HTML 파일 (외부 의존성 없음)
