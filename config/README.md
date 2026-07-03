# config/（SSOT）について

このディレクトリはブランド・品質・校正マーカーなど**チャンネルの正（SSOT）**を置く。

## 運用ルール

- `config/*.md` はファイルごとに **500 行以下** を上限とする。長いチェックリスト・採点手順は `agents/`（例: `reviewer-rubric.md`）に移し、ここには概要とリンクのみ残す。
- 詳細なシステム運用は [docs/orchestration.md](../docs/orchestration.md)。

## ファイル

| ファイル | 内容 |
|---------|------|
| brand.md | ブランド |
| audience.md | ペルソナ |
| voice.md | 文体 |
| quality.md | NG・事実・推敲方針 |
| planning.md | 企画書・目次案（Studio / 台本 ## 見出し） |
| theme-selection.md | テーマ選定（検索・ハルシネーション禁止） |
| calibration.md | A/B マーカー |
| voice-learnings.md | あらきりらしさ（Studio「らしさを学習」が推敲差分から自動更新する文体メモ。ローカル保存先。本番は Supabase `style_learnings`） |
