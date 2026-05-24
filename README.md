# ScriptStudio

YouTube トーク台本の企画・執筆を一画面で行うローカル Studio（Next.js）。

## 起動

```bash
cp .env.example .env   # API キーを設定
npm install
npm run studio         # http://localhost:3001
```

## 関連ドキュメント

- エージェント・CLI ワークフロー: [CLAUDE.md](CLAUDE.md)、[docs/orchestration.md](docs/orchestration.md)
- 手順書: [MANUAL.md](MANUAL.md)
- タイトル案 UI: `npm run title-studio`（[tools/title-studio/README.md](tools/title-studio/README.md)）
