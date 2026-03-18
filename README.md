# yowu-claude-marketplace

yowu의 개인 Claude Code 플러그인 마켓플레이스.

## 설치

### 1. 마켓플레이스 등록

Claude Code에서 아래 명령어로 마켓플레이스를 등록합니다:

```
/plugin marketplace add https://github.com/uyu423/yowu-claude-marketplace.git
```

또는 `.claude/settings.json`에 사전 등록할 수 있습니다 (팀 공유용):

```json
{
  "extraKnownMarketplaces": {
    "yowu-claude-marketplace": {
      "source": {
        "source": "git",
        "url": "https://github.com/uyu423/yowu-claude-marketplace.git"
      }
    }
  }
}
```

### 2. 플러그인 선택 설치

마켓플레이스 등록 후, `/plugin` 명령 실행 → Discover 탭에서 플러그인을 선택하여 설치합니다.

---

## 플러그인 추가 방법

`plugins/{plugin-name}/` 디렉토리를 생성하고 다음 구조를 따릅니다:

```
plugins/{plugin-name}/
├── .claude-plugin/
│   └── plugin.json     # 플러그인 메타데이터 + MCP 서버 설정
├── agents/             # 서브에이전트 정의 (선택)
├── skills/             # 스킬 정의 (선택)
└── commands/           # 커맨드 정의 (선택)
```

플러그인 추가 후 `.claude-plugin/marketplace.json`의 `plugins` 배열에 항목을 등록합니다.
