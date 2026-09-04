# ScriptStudio（あらきりチャンネル YouTubeトークスクリプト作成システム）

## 概要

YouTubeトーク番組（あらきりチャンネル）の台本を、企画から執筆・品質チェックまで1画面で行う社内向けStudio（Next.js）。荒木（台本執筆・企画）と児玉（動画編集・スライド制作）が、台本とスライド構成を別タブで行き来せずに進められることを目指す。
テーマ調査→企画→構成→執筆→タイトル→品質チェックの各フェーズをAIエージェント（scout/planner/architect/writer/titler/reviewer等）が支援し、推敲内容や変更履歴をファイル（`outputs/` と履歴フォルダ）に記録する。

## 技術スタック

- フレームワーク: Next.js 16.2.6（React 19.2.4）、TypeScript 5
- スタイリング: Tailwind CSS 4、class-variance-authority、tailwind-merge、@base-ui/react
- AI: @anthropic-ai/sdk（Claude API）
- DB/永続化: ファイルベース（`outputs/` `.plan-history/` `.script-history/` `config/voice-learnings.md`）。旧Supabase連携コード（@supabase/supabase-js）は残存するが未使用（`VERCEL` 環境変数がある場合のみ有効になる切替が `src/lib/runtime-persistence.ts`）
- その他ライブラリ: lucide-react、diff
- パッケージ管理: pnpm（`packageManager: pnpm@11.5.2`。README上のコマンド例はnpm表記）
- Lint: ESLint 9（eslint-config-next）
- デプロイ: NAS Docker（triage経由。手順は「運用・デプロイ」参照）

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

- `npm run studio` / `npm run dev` — 開発サーバー起動（`scripts/dev-studio.mjs`、port 3500固定。2026-09-04にローカルポート台帳との競合解消のため3300から変更）
- `npm run dev:clean` — `.next` を削除してから開発サーバー起動
- `npm run clean` — `.next` を削除
- `npm run build` — `next build`
- `npm run start` — `next start -p 3500`
- `npm run lint` — `eslint`
- `npm run market-research` — `scripts/market-research.ts` を実行
- `npm run title-studio` — `tools/title-studio/server.mjs` を起動
- `npm run script-doc` — `tools/script-to-doc/export-doc.mjs` を実行

## 運用・デプロイ

- 本番URL: `https://scriptstudio.aiwa-engineering.co.jp`（NAS Docker。2026-09-04にVercelから移行）
- 本番反映: NAS Docker（`/volume1/docker/scriptstudio/`、port 4900）。手順は「commit→`git push nas`→NASで `node /home/D_araki/div/bargle/triage/triage.mjs --deploy-app ScriptStudio`」。実行時データは `/volume1/docker/scriptstudio/data/`（outputs / plan-history / script-history / config系3ファイル）をvolumeマウントしており、`app/` はデプロイごとにgit mainへリセットされる。data/ は毎日03:45に自動バックアップ（scriptstudio-backup.timer、30世代）
- 旧Vercel（`script-studio-tan.vercel.app`）: 2026-09-04に封鎖（ログイン無効化）。2週間並走ののち2026-09-18頃にSupabaseともども削除予定。削除まではorigin/mainへのpushでVercelの自動デプロイも動き続ける点に注意
- 永続化: ファイルベース一本（本番はNASの `data/` ボリューム、開発はリポジトリ直下の `.plan-history/` `.script-history/` `config/voice-learnings.md`）
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
- 最終更新: 2026-09-04
- 最終コミット: 2026-09-04 chore: Vercel卒業の掃除（keep-alive・vercel.json削除、docsをNAS本番へ全面更新）

### 直近の実装内容
- 本番環境をVercel（Supabase）からNAS Docker運用へ全面移行（Dockerfile整備、/api/health公開、Supabaseエクスポータ作成、実行時データをファイル形式へ移行）
- 移行に伴いkeep-alive・vercel.jsonなど旧Vercel関連の設定を削除し、CLAUDE.mdをNAS本番のデプロイ手順・データマウント構成に合わせて全面更新
- Docker除外対象からImage/を外し、@imageエイリアスでのimportが正しく動くよう修正
- ローカル開発ポートをポート台帳との競合解消のため3300から3500へ変更
- 出力コンテンツとしてエピソード64「GoogleマップとAppleマップを10項目でガチ比較」を追加

### 進行中・未完了
なし
<!-- AUTO-STATUS:END -->
