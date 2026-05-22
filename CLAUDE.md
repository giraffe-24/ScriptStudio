# あらきりチャンネル YouTubeトークスクリプト作成システム

## このファイルの役割

エージェントは**最初に本ファイルだけ**読み、アーキテクチャと次に開くリンクを把握する。**ポリシー（SSOT）**は必ず `config/*.md`。**ワークフロー全文・ツール・SSOT一覧**は [docs/orchestration.md](docs/orchestration.md)。

---

## アーキテクチャ（責務分離）

```
CLAUDE.md（入口・この短文）
docs/orchestration.md（コマンド表・図・クイックスタート・運用ノート）

config/（SSOT：各ファイル 500 行以下を目標。長文化は agents へ）
├── brand audience voice quality calibration

templates/（structure-A/B/C）

agents/
├── scout planner architect writer titler reviewer calibrator
└── reviewer-rubric.md   ← `/チェック` のチェックリスト・採点表（policy は quality.md）

outputs/（1案件1フォルダ。直下は 00-discovery.md のみ。詳細: .cursor/rules/outputs-layout.mdc）
```

---

## コマンド早見（詳細・表は orchestration）

| コマンド | エージェント |
|----------|----------------|
| `/テーマ調査` | agents/scout.md |
| `/企画 [テーマ]` | agents/planner.md |
| `/構成` | agents/architect.md |
| `/執筆` | agents/writer.md |
| `/タイトル` | agents/titler.md |
| `/チェック` | agents/reviewer.md + reviewer-rubric.md |
| `/推敲比較` | agents/calibrator.md + config/calibration.md |
| `/全工程 [テーマ]` | 順にエージェント |

---

## クイックスタート

テーマ未定: `/テーマ調査` → `outputs/00-discovery.md` → `/企画 [テーマ]`。  
単発: `/企画 Gmailの整理術` または `/全工程 Gmailの整理術`。

---

## SSOT とサブエージェントの分け方（ベストプラクティス）

- **変わりにくい禁止事項・ブランド**：`config/quality.md`、`brand.md`、`voice.md` に短く書き、読み込みコストを下げる。  
- **手続き・長いリスト・レビューの減点表**：`agents/*.md`（例: `reviewer-rubric.md`）へ。  
- **推論・モデルへの指示のみ**：[docs/orchestration.md](docs/orchestration.md)。

---

詳細：[docs/orchestration.md](docs/orchestration.md)
