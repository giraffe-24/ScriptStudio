# ScriptStudio（あらきりチャンネル YouTubeトークスクリプト作成システム）

## 概要

YouTubeトーク番組（あらきりチャンネル）の台本を、企画から執筆・品質チェックまで1画面で行う社内向けStudio（Next.js）。荒木（台本執筆・企画）と児玉（動画編集・スライド制作）が、台本とスライド構成を別タブで行き来せずに進められることを目指す。
テーマ調査→企画→構成→執筆→タイトル→品質チェックの各フェーズをAIエージェント（scout/planner/architect/writer/titler/reviewer等）が支援し、推敲内容や変更履歴をSupabase（本番）またはローカルファイル（開発）に記録する。

## 技術スタック

- フレームワーク: Next.js 16.2.6（React 19.2.4）、TypeScript 5
- スタイリング: Tailwind CSS 4、class-variance-authority、tailwind-merge、@base-ui/react
- AI: @anthropic-ai/sdk（Claude API）
- DB/永続化: @supabase/supabase-js（本番）。ローカルはファイルベース（`.plan-history/` `.script-history/` `config/voice-learnings.md`）
- その他ライブラリ: lucide-react、diff
- パッケージ管理: pnpm（`packageManager: pnpm@11.5.2`。README上のコマンド例はnpm表記）
- Lint: ESLint 9（eslint-config-next）
- デプロイ: Vercel（`vercel.json` に `/api/keep-alive` の日次cronあり）

## ディレクトリ構成

- `src/` — Next.jsアプリ本体（`app/`：ページ・APIルート、`components/`、`lib/`）
- `agents/` — AIエージェント定義（scout/planner/architect/writer/titler/reviewer/calibrator等）
- `config/` — ブランド・オーディエンス・文体・品質等のポリシーSSOT（`brand.md` `voice.md` `quality.md` 等）
- `templates/` — 台本構成テンプレート（structure-A/B/C）
- `docs/` — 運用ドキュメント（`orchestration.md` はコマンド表・ワークフロー図、`SPEC.md` は仕様書）
- `outputs/` — 案件ごとの成果物（1案件1フォルダ）
- `output/` — 静的アセット・図解HTML（favicon類、`history-store.html` 等）
- `scripts/` — 開発・運用スクリプト（`dev-studio.mjs`、Supabase用SQL等）
- `tools/` — 補助ツール（`title-studio/`、`script-to-doc/`）
- `.claude/` — Claude Codeハーネス設定（`agents/` サブエージェント、`hooks/` 自動リント、`commands/`）

## 開発コマンド

- `npm run studio` / `npm run dev` — 開発サーバー起動（`scripts/dev-studio.mjs`、port 3300固定）
- `npm run dev:clean` — `.next` を削除してから開発サーバー起動
- `npm run clean` — `.next` を削除
- `npm run build` — `next build`
- `npm run start` — `next start -p 3300`
- `npm run lint` — `eslint`
- `npm run market-research` — `scripts/market-research.ts` を実行
- `npm run title-studio` — `tools/title-studio/server.mjs` を起動
- `npm run script-doc` — `tools/script-to-doc/export-doc.mjs` を実行

## 運用・デプロイ

- デプロイ: `main` ブランチへのpushでVercelが自動デプロイ（HANDOFF.md記載）。本番URL: `https://script-studio.vercel.app`（HANDOFF.mdに記載。`/icon.svg` で反映確認を行う運用）
- 永続化: 本番はSupabase（`plan_snapshots` `script_snapshots` `keepalive` 等のテーブル）。ローカルは `.plan-history/` `.script-history/` `config/voice-learnings.md`
- 検証: `npx tsc --noEmit` と `npx eslint <files>` を使用（`next build`/`next dev` は稼働中の開発サーバーとポートが衝突するため使わない、HANDOFF.md記載）
- git remote: `nas`（`D_araki@nas:git/ScriptStudio.git`）と `origin`（`https://github.com/giraffe-24/ScriptStudio.git`）

## プロジェクト固有ルール

- このリポジトリはAIエージェント（Claude Code含む）による台本制作ワークフローを前提とした構成。ブランド・オーディエンス・文体・品質等のポリシーの**SSOTは必ず `config/*.md`**。
- ワークフロー全文・コマンド表・SSOT一覧は [docs/orchestration.md](docs/orchestration.md) を参照。
- コマンドとエージェントの対応:
  - `/テーマ調査` → `agents/scout.md`
  - `/企画 [テーマ]` → `agents/planner.md`
  - `/構成` → `agents/architect.md`
  - `/執筆` → `agents/writer.md`
  - `/タイトル` → `agents/titler.md`
  - `/チェック` → `agents/reviewer.md` + `agents/reviewer-rubric.md`
  - `/精密チェック` → `.claude/agents/` の3体（script-reviewer / fact-checker / audience-simulator）を並列実行
  - `/推敲比較` → `agents/calibrator.md` + `config/calibration.md`
  - `/全工程 [テーマ]` → 全エージェントを順に実行
- `outputs/` は1案件1フォルダ、直下は `00-discovery.md` のみ（詳細は `.cursor/rules/outputs-layout.mdc`）。`.claude/hooks/scriptstudio-lint.mjs` がWrite/Edit時に自動リントしてレイアウト逸脱を検知する。
- SSOTとサブエージェントの分け方: 変わりにくい禁止事項・ブランドは `config/quality.md` `brand.md` `voice.md` に短く書く。手続き・長いリスト・レビューの減点表は `agents/*.md`（例: `reviewer-rubric.md`）へ。推論・モデルへの指示のみを `docs/orchestration.md` に書く。

<!-- AUTO-STATUS:BEGIN このブロックはNASの自動バッチが書き換える。手動編集しない -->
## 現在の実装状況（自動更新）
- 最終更新: 2026-07-31
- 最終コミット: 2026-07-28 WIP保全コミット 2026-07-28（NASハブ移行時点の作業状態）

### 直近の実装内容
- 推敲確認フローの刷新: 「推敲開始」ボタン→差分確認→AI提案（あらきりらしさメモ）確認・修正→確定保存という2段階API（propose/commit）、その後「変更カード方式」へ再設計
- バグ修正: リネーム時のインデックス消失、番号入力とIMEの衝突、狭いペインでの削除モードUI崩れ・折り返し崩れなどを修正
- 機能追加: 企画書の自動保存（新規エピソード自動作成）、参考動画URLの検証・メタ取得の共通化、AI深掘り回答のワンクリック反映、⌘Enter送信対応
- 運用面: 台本自動保存にSupabase瞬断対策のリトライを追加、開発キャッシュ掃除用スクリプト（clean/dev:clean）を追加、ファビコンをモノトーングラデーションに刷新
- 直近コミットは2026-07-28の「WIP保全コミット（NASハブ移行時点の作業状態）」で、内容の整理は未確認

### 進行中・未完了
（HANDOFF.md 最終更新2026-07-04時点の記載から抽出。直近コミットとの整合は未確認）
- Supabaseに `style_learnings` テーブルが未作成（`scripts/supabase/style-learnings.sql` の実行が必要。未作成のままだと本番の推敲確定が保存エラーになる）
- 本番デプロイ完了の未確認（`/icon.svg` が新ファビコンになっているかの確認待ち）
- `output/history-store.html` 内の「台本と企画書で別々に履歴を持つ」という記述が実装と乖離。修正文言は提案済みだが未適用
- `POST /api/files` の過剰発火疑い（実害は小、未調査のまま持ち越し）
<!-- AUTO-STATUS:END -->
