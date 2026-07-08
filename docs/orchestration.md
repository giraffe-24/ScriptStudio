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
| `/精密チェック [対象]` | サブエージェント3体並列の精密レビュー（採点・事実検証・視聴者視点） | .claude/commands/精密チェック.md |
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

## 精度支援（Claude Code サブエージェント・フック）

`agents/*.md` が「何をどう書くか」のプロンプトであるのに対し、`.claude/` はハーネス側の検査層。ポリシーの正は従来どおり `config/*.md`（ここを変えたら下記も追随させる）。

### サブエージェント（.claude/agents/）

| 名前 | 役割 | 使いどころ |
|------|------|-----------|
| script-reviewer | reviewer-rubric 41項目を独立コンテキストで全数採点（引用根拠つき） | `/チェック` の採点部分・`/精密チェック` |
| fact-checker | 製品・アプリの事実主張を公式ソース本文で検証（quality.md「製品の事実」の執行） | ツール依存の台本の執筆完了時 |
| audience-simulator | 40-60代ペルソナとして通読し離脱ポイント・無説明用語を検出 | 台本の仕上げ確認 |

3体を並列で回して統合レポートを得るのが `/精密チェック`。

### 自動リント（.claude/hooks/scriptstudio-lint.mjs + .claude/settings.json）

Write/Edit のたびに自動実行される決定論的チェック。

- 保存前（PreToolUse）: `outputs/` レイアウト違反（直下ファイル・`{NN}-{slug}` 命名違反）をブロック
- 保存後（PostToolUse）: `**` 太字、語彙で判定できる絶対NG（誇張・煽り・視聴者をさげるラベル）、台本の文字数（3001字未満/大幅超過）、固定フレーズ（自己紹介・定型締め）の不一致、manifest.json の形式崩れを検出して指摘

文脈依存のNG（マウント・競合批判・専門用語無説明）はリントでは誤検知するため対象外——サブエージェント側が意味判定する。定型フレーズ比較は括弧種のゆれ（「」『』｢｣）を正規化して語句のみ照合する。

---

## タイトルスタジオ・スクリプト HTML

1. `cp .env.example .env` にし `ANTHROPIC_API_KEY` を設定  
2. `npm install` と `npm run title-studio`  
3. http://127.0.0.1:3847/（[tools/title-studio/README.md](../tools/title-studio/README.md)）

```bash
npm run script-doc -- outputs/{NN}-{slug}/01-script-draft.md
```

（`tools/script-to-doc/export-doc.mjs` — 入力と同じフォルダに `.html` を出力）

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

1案件 = 1フォルダ。詳細は [`.cursor/rules/outputs-layout.mdc`](../.cursor/rules/outputs-layout.mdc)。

```
outputs/
├── 00-discovery.md          # テーマ調査のみ（直下・案件横断）
├── {NN}-{slug}/
│   ├── manifest.json        # 4ペインUI 用メタデータ
│   ├── 00-plan-and-structure.md
│   ├── 01-script-draft.md
│   ├── 02-line-template.md  （任意）
│   └── 03-article.md        （任意）
└── 没/{NN}-{slug}/          # 没案件も同じ構造
```

台本の印刷 HTML は `npm run script-doc -- outputs/{NN}-{slug}/01-script-draft.md` で同フォルダに出力。台本 Markdown では `**` 太字を使わない（`config/quality.md` と `.cursor/rules/` 参照）。

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
    ├── 00-discovery.md     （テーマ調査・案件横断）
    └── {NN}-{slug}/        （1案件1フォルダ）
        ├── manifest.json
        └── 00〜 役割別 .md
```

---

## ContentStudio（台本編集 UI）について

台本の段落編集・スライドテンプレート割り当て・共同推敲を行う Web アプリは、兄弟リポジトリ `../ContentStudio` で Next.js アプリとして開発中。

当面 `outputs/` の Markdown ファイルが台本の SSOT。各案件フォルダの `manifest.json` は将来 ContentStudio が import するためのメタデータとして保持する。

---

## 変更履歴（要約のみ・詳細は git）

| 日付 | 内容 |
|------|------|
| 2026-07-04 | 精度支援層を追加：.claude/agents（script-reviewer / fact-checker / audience-simulator）、.claude/hooks/scriptstudio-lint.mjs（outputs 自動リント）、`/精密チェック` |
| 2026-05-22 | ContentStudio を兄弟リポジトリとして分離。episode-studio を YT 側から削除 |
| 2026-05-19 | outputs フォルダ単位管理へ移行（1案件1フォルダ + manifest.json）、outputs-layout.mdc 追加 |
| 2026-05-09 以降 | CLAUDE 入口の薄型化、`docs/orchestration.md`、品質チェックリストの reviewer-rubric 分離 |
