# システム運用・ワークフロー（非 SSOT）

ブランド・文体・品質の「正」は常に `config/*.md`。本ドキュメントはルーティングと手順の案内のみ。

---

## コマンド一覧

| コマンド | 説明 | 参照エージェント |
|----------|------|------------------|
| `/テーマ調査 [任意ヒント]` | テーマ候補の市場調査（選択メニュー→本調査→`00-discovery.md`） | agents/scout.md |
| `/企画 [テーマ]` | 切り口を3案提案 | agents/planner.md |
| `/構成` | 台本の骨組みを設計 | agents/architect.md |
| `/執筆` | 台本を執筆 | agents/writer.md |
| `/タイトル` | タイトル・サムネ案作成 | agents/titler.md |
| `/チェック` | 品質レビュー | agents/reviewer.md |
| `/推敲比較` | AI原稿と確定稿の比較・SSOT への改善提案 | agents/calibrator.md |
| `/全工程 [テーマ]` | 企画から完成まで一気通貫 | 全エージェント |

---

## ワークフロー図

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  /企画           /構成           /執筆           /タイトル       │
│  ┌─────┐        ┌─────┐        ┌─────┐        ┌─────┐          │
│  │切り口│   →   │構成案│   →   │台本 │   →   │タイトル│         │
│  │3案  │        │設計 │        │執筆 │        │サムネ │         │
│  └─────┘        └─────┘        └─────┘        └─────┘          │
│      │              │              │              │             │
│      ▼              ▼              ▼              ▼             │
│    承認            承認            完成          決定            │
│                                      │                          │
│                                      ▼                          │
│                                  /チェック                       │
│                                      │                          │
│                           ┌─────────┴─────────┐                │
│                           ▼                   ▼                 │
│                        合格               要修正                 │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

（任意の前段）`/テーマ調査` … メニューで A/B/C → `outputs/00-discovery.md` → `/企画`。

---

## フェーズ概要

- `/テーマ調査`：詳細は [agents/scout.md](../agents/scout.md)。保存先 `outputs/00-discovery.md`（衝突時はファイル名で区別）。
- `/企画`〜`/チェック`：各 `agents/*.md` に従う。
- `/推敲比較`：[config/calibration.md](../config/calibration.md) のマーカーで A/B。 [config/quality.md](../config/quality.md) の推敲比較ルール必須。[`.cursor/commands/推敲比較.md`](../.cursor/commands/推敲比較.md) で起動可。

---

## クイックスタート

```
/企画 Googleカレンダーの便利な使い方
/全工程 Gmailの整理術
/テーマ調査  （A/B/C 選択後）→ /企画 [採用テーマ]
```

---

## タイトルスタジオ・スクリプト HTML

1. `cp .env.example .env` にし `ANTHROPIC_API_KEY` を設定  
2. `npm install` と `npm run title-studio`  
3. http://127.0.0.1:3847/（[tools/title-studio/README.md](../tools/title-studio/README.md)）

```bash
npm run script-doc -- outputs/03-script.md
```

（`tools/script-to-doc/export-doc.mjs`）

---

## SSOT 参照ガイド

| 状況 | 参照ファイル |
|------|-------------|
| テーマ候補 | agents/scout.md → brand, audience |
| ブランド | config/brand.md |
| 視聴者 | config/audience.md |
| 文体 | config/voice.md |
| NG・事実・推敲方針 | config/quality.md |
| レビュー項目・減点 | agents/reviewer-rubric.md |
| 台本の型 | templates/structure-*.md |
| 推敲マーカー | config/calibration.md → agents/calibrator.md |

### config の行数目安

各 `config/*.md` は **500 行以下** とする。超える場合は**手続き・長いチェックリストを agents に移し**、config にはポリティとリンクのみを残す。

---

## outputs

`outputs/` 直下に `00-discovery.md` … `03-script.md` 等を置く。

台本 Markdown では `**` 太字を使わない（`config/quality.md` と `.cursor/rules/` 参照）。

---

## 運用（抜粋）

初回は [CLAUDE.md](../CLAUDE.md) を読み、`/テーマ調査` または `/企画` で開始。

マニュアル: `MANUAL.md` と `manual/index.html` の更新は、プロジェクトの `.cursor/rules/manual-stewardship.mdc` のとおり、利用者からの明示依頼がある場合に限る。

---

## 構成

```
├── CLAUDE.md
├── docs/orchestration.md   ← 本ファイル
├── config/
├── agents/                 （reviewer-rubric 含む）
├── templates/
└── outputs/
```

---

## 変更履歴（要約のみ・詳細は git）

| 日付 | 内容 |
|------|------|
| 2026-05-09 以降 | CLAUDE 入口の薄型化、`docs/orchestration.md`、品質チェックリストの reviewer-rubric 分離 |
