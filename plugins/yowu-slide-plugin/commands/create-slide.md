---
description: reveal.js 템플릿 기반 발표 슬라이드 생성/수정
argument-hint: "발표 주제나 목적을 입력하세요"
---

# /yowu-slide:create-slide

reveal.js 템플릿 기반으로 발표 슬라이드를 생성하거나 수정한다. 5개 고품질 레이아웃 템플릿 내장.

## Usage

```
/yowu-slide:create-slide <주제 또는 요청>
```

## Examples

```
/yowu-slide:create-slide "FastAPI 아키텍처 소개 12분 발표"
/yowu-slide:create-slide "우리 회사 신규 서비스 소개서 - 브랜드: ABC Corp"
/yowu-slide:create-slide "template-catalog-1 기반으로 신제품 소개 10장"
/yowu-slide:create-slide "기존 slides/presentation.html PDF로 변환해줘"
```

## How It Works

`yowu-create-slide` 스킬의 워크플로를 트리거한다:

1. **콘텐츠 분석**: 주제, 청중, 톤, 슬라이드 수 파악
2. **템플릿 추천**: 5개 템플릿 중 적합한 1~2개 추천 (사용자가 지정한 경우 생략)
3. **사용자 확인**: 템플릿 선택 확정
4. **슬라이드 구성**: 레이아웃 패턴 취사선택·재조합
5. **HTML 생성**: 단일 HTML 파일로 완성
