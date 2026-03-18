# yowu-slide-plugin

reveal.js 템플릿 기반 발표 슬라이드 생성 플러그인. 미리 디자인된 5개 고품질 레이아웃 템플릿을 내장하여, 주제만 전달하면 적합한 템플릿을 추천하고 콘텐츠를 채워 HTML 발표자료를 완성한다.

## 기능

- **템플릿 기반 슬라이드 생성**: 5개 고품질 reveal.js 템플릿에서 레이아웃 패턴을 취사선택·재조합
- **자동 템플릿 추천**: 콘텐츠/분위기/색상 톤에 맞는 템플릿 자동 추천
- **기존 슬라이드 수정**: 템플릿 기반 HTML 슬라이드 편집
- **PDF 변환**: decktape을 통한 PDF export 지원

## 설치

```
/plugin install yowu-slide-plugin@yowu-claude-marketplace
```

## 사용법

### 커맨드

| 커맨드 | 설명 |
|--------|------|
| `/yowu-slide:create-slide <주제>` | 발표 슬라이드 생성/수정 |

### 예시

```
/yowu-slide:create-slide "FastAPI 아키텍처 소개 12분 발표"
/yowu-slide:create-slide "우리 회사 신규 서비스 소개서 - 브랜드: ABC Corp"
/yowu-slide:create-slide "template-catalog-1 기반으로 신제품 소개 10장"
/yowu-slide:create-slide "기존 slides/presentation.html PDF로 변환해줘"
```

## 내장 템플릿

| 템플릿 | 색상 톤 | 특징 |
|--------|---------|------|
| template-blue-1 | 파란+흰색 | 좌우분할, 2단/3키워드/인과관계/4단 등 다양한 패턴 |
| template-blue-2 | 파란+흰색 | 통계카드, 프로세스타임라인, Before/After비교 |
| template-catalog-1 | 다크차콜+골드 | 타임라인, 인용문카드, 미디어플레이어, 13장 |
| template-modern-black-1 | 모노크롬 | 넘버블록, 카드, 체크리스트, 스텝계단, 16장 |
| template-modern-black-portpolio-1 | 블랙+핑크 | 벤다이어그램, 글로우서클, 비교테이블 |

## 기술 스택

- reveal.js 5.1.0 (CDN)
- NanumSquareNeo 웹폰트
- Font Awesome 6.5.1
- Chart.js (차트 포함 템플릿)
- 단일 HTML 파일 (CSS 내장, 빌드 불필요)
