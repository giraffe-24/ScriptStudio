# あらきりチャンネル YouTubeトークスクリプト作成システム

## 概要

このシステムは「効率化オタクのあらきり」チャンネルのYouTube台本を、企画からサムネイルまで一気通貫で作成します。

---

## アーキテクチャ

```
CLAUDE.md（このファイル）
    │
    ├── config/（SSOT：設定・基準）
    │   ├── brand.md      ← ブランド定義
    │   ├── audience.md   ← 視聴者ペルソナ
    │   ├── voice.md      ← 文体・トーン
    │   ├── quality.md    ← 品質基準・NG
    │   └── calibration.md ← 推敲比較マーカー（A/B境界のSSOT）
    │
    ├── templates/（台本の型）
    │   ├── structure-A.md ← ツール活用型
    │   ├── structure-B.md ← 機能紹介型
    │   └── structure-C.md ← まとめ紹介型
    │
    ├── agents/（サブエージェント）
    │   ├── scout.md       ← 市場調査・テーマ候補（/テーマ調査）
    │   ├── planner.md    ← 企画
    │   ├── architect.md  ← 構成
    │   ├── writer.md     ← 執筆
    │   ├── titler.md     ← タイトル・サムネ
    │   ├── reviewer.md   ← レビュー
    │   └── calibrator.md ← 推敲比較（A/B読み比べ・SSOT提案）
    │
    └── outputs/（成果物・この直下に Markdown/HTML などを置く）
```

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
| `/推敲比較` | 同一ファイル内の AI原稿と確定稿の比較・再現性のための SSOT 提案（詳細は [agents/calibrator.md](agents/calibrator.md)） | agents/calibrator.md |
| `/全工程 [テーマ]` | 企画から完成まで一気通貫 | 全エージェント |

---

## ワークフロー

（任意の前段）`/テーマ調査` … メニューで A/B/C を選んでもらい → 候補を整理して `outputs/00-discovery.md` に保存 → 続けて `/企画` へ。

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
│                                  ┌─────┐                        │
│                                  │品質 │                        │
│                                  │レビュー│                      │
│                                  └─────┘                        │
│                                      │                          │
│                           ┌─────────┴─────────┐                │
│                           ▼                   ▼                 │
│                        合格               要修正                 │
│                           │                   │                 │
│                           ▼                   ▼                 │
│                        完成              修正→再チェック         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## クイックスタート

### 1. テーマから始める場合

```
/企画 Googleカレンダーの便利な使い方
```

### 2. 一気通貫で作成する場合

```
/全工程 Gmailの整理術
```

### 3. テーマがまだ決まっていない場合（任意）

```
/テーマ調査
（A/B/C を選ぶ → 調査結果を確認 → 採用テーマで /企画）
```

---

## 各フェーズの詳細

### /テーマ調査

入力: コマンドと任意の焦点ヒント（例：`/テーマ調査 Gmail`）。最初の返答は常に「モード選択メニュー」のみ（詳細は [agents/scout.md](agents/scout.md)）。

出力: テーマ候補3〜6件（質優先）、および `outputs/00-discovery.md` への保存（別案件と混ざるときはファイル名に日付などを足してよい）。

```
実行内容：
1. アスキーアート等で A＝定番・B＝ニュース旬・C＝半々 を提示し、ユーザーの選択を待つ
2. SSOT（brand / audience / quality）に照らして本調査
3. 根拠は「検証可能な事実」と「推論」を混同しない
4. `outputs/00-discovery.md` を書き出す（手順は scout.md）
5. 次は /企画 [テーマ] へ
```

### /企画

入力: テーマ（自然言語）
出力: 企画書（切り口3案、競合分析、差別化ポイント）

```
実行内容：
1. テーマの本質を把握
2. 競合分析
3. 3つの切り口を提案
4. 推奨案の選定
```

### /構成

入力: 承認された切り口
出力: 構成案（台本タイプ、セクション設計、要点整理）

```
実行内容：
1. 台本タイプの選定（A/B/C）
2. 導入の設計
3. 本題のセクション設計
4. まとめの設計
5. 時間配分の確認
```

### /執筆

入力: 承認された構成案
出力: 台本（導入・本題・まとめ）

```
実行内容：
1. 導入部の執筆
2. 本題の執筆（3層構造）
3. まとめの執筆
4. 全体の調整
```

### /タイトル

入力: 完成した台本
出力: タイトル5案、サムネテキスト3案

```
実行内容：
1. 台本の価値抽出
2. タイトル案作成
3. サムネテキスト案作成
4. 推奨案の選定
```

### /チェック

入力: 台本全体
出力: レビュー結果（スコア、合格/要修正、改善提案）

```
実行内容：
1. NGパターンの検出
2. チェックリストの確認
3. スコアリング
4. 改善提案
```

### /推敲比較

入力: `@台本.md` の指定、またはパス1本。台本ファイルは [config/calibration.md](config/calibration.md) のマーカー行より上を AI原稿（A）、より下を手元の確定稿（B）とみなす。`@` なしでパスだけ渡してもよい。

出力: チャット上の分析（言葉づかい・リズム・構成・削りすぎ候補）と、差分の本質に応じた SSOT／エージェント指示への改善案。`config/voice.md` だけに閉じず、brand / audience / quality / templates / 各 agents のどれをどう変えると再現性が上がるかを指名する。編集は自動では行わない。

```
実行内容：
1. config/quality.md「推敲比較時の絶対ルール」に準拠（推測で埋めず、不足時は必ず質問）
2. config/calibration.md のマーカーで A/B を分割。B が空なら貼り付けを促す
3. agents/calibrator.md の手順で比較と提案を行う
4. outputs/ へのレポート保存は利用者が明示したときのみ（例: 06-calibration.md）
```

Cursor のプロジェクトコマンドとして [`.cursor/commands/推敲比較.md`](.cursor/commands/推敲比較.md) から `/推敲比較` を呼べる。

---

## タイトル案（Anthropic API・ローカル）

台本を貼り、APIでタイトル・サムネ案を JSON 取得する場合:

1. ルートで `cp .env.example .env` にし `ANTHROPIC_API_KEY` を設定
2. `npm install` のあと `npm run title-studio`
3. ブラウザで http://127.0.0.1:3847/（詳細: [tools/title-studio/README.md](tools/title-studio/README.md)）
   - テーマだけで 企画→タイトル一気通貫 は UI の上部ボタン、または `POST /api/pipeline`。

チャットの `/タイトル` と併用可。

### 台本のドキュメントHTML（印刷・PDF向け）

トークスクリプト（例: `outputs/03-script.md`、`outputs/54-03-*.md`）ができたら、同じ `outputs/` に単体HTMLを置ける。

```bash
npm run script-doc -- outputs/03-script.md
```

- 出力: 入力と同じフォルダに、拡張子 `.html` の同名ファイル（例: `03-script.html`）
- ブラウザで開き、「印刷 → PDFに保存」でダウンロード用に使う
- 実装: `tools/script-to-doc/export-doc.mjs`（引数は複数可）

---

## SSOT参照ガイド

### いつ何を参照するか

| 状況 | 参照ファイル |
|------|-------------|
| テーマ候補・市場観点の洗い出し | agents/scout.md → config/brand.md, config/audience.md |
| ブランドに沿っているか確認 | config/brand.md |
| 視聴者に響くか確認 | config/audience.md |
| 文体・トーンの確認 | config/voice.md |
| 品質基準・NG確認 | config/quality.md |
| アプリ・製品の名称・経路など事実確認 | config/quality.md（「製品・アプリの事実」／公式ヘルプで裏取りしてから書く） |
| 台本の型を確認 | templates/structure-*.md |
| AI原稿と確定稿の推敲比較・マーカー運用 | config/calibration.md → agents/calibrator.md、補助として config/quality.md（推敲比較の絶対ルール） |

---

## 品質基準（概要）

### 合格条件

```
□ NGパターン該当が0件
□ スコア70点以上
□ 導入の必須項目がすべて達成
□ 定型締めが正確
```

### NGパターン（即不合格）

```
❌ 競合批判
❌ 誇張表現（神、やばい、最強）
❌ 不安煽り
❌ マウント
❌ 専門用語無説明
```

詳細は [config/quality.md](config/quality.md) を参照（含む: 製品・アプリ記述の公式確認ルール）。

---

## 台本タイプ

### A: ツール活用型

```
・1つのツールを深掘り
・STEP形式で手順説明
・例：Gmail整理術、Googleカレンダー活用
→ templates/structure-A.md
```

### B: 機能紹介型

```
・新機能/知られていない機能
・始め方→設定→使い方→注意点
・例：Find Hub、セキュリティ設定
→ templates/structure-B.md
```

### C: まとめ紹介型

```
・複数項目を網羅的に紹介
・「〇選」形式
・例：Amazonプライム特典8選
→ templates/structure-C.md
```

---

## 成果物の保存

各台本の成果物は以下の形式で保存されます：

```
outputs/
├── 00-discovery.md      ← テーマ調査メモ（/テーマ調査／任意。案件が重なる場合は名前に日付などを含めてよい）
├── 01-plan.md           ← 企画書
├── 02-structure.md      ← 構成案
├── 03-script.md         ← 台本
├── 04-title.md          ← タイトル・サムネ案
├── 05-review.md         ← レビュー結果
└── 06-calibration.md    ← 推敲比較メモ（利用者が明示した場合のみ）
```

複数案件を並行するときは、`54-03-…-draft.md` のように **投稿管理番号やテーマをファイル名で区別**する。

Markdown で保存するときは、強調に `**`（太字）記法は使わない（`config/quality.md`・`.cursor/rules/no-markdown-bold-output.mdc` 参照）。見出し・箇条書き・言い換えで構造化する。

---

## 運用ルール

### 初回実行時

1. このCLAUDE.mdを読み込む
2. テーマ未定なら `/テーマ調査`、決まっていれば `/企画 [テーマ]` または `/全工程 [テーマ]` でスタート
3. 各フェーズで承認を得ながら進める

### 継続的な改善

```
・視聴維持率が高かった台本 → examples/ に追加
・新しいNGパターン発見 → config/quality.md に追加
・成功フレーズ発見 → config/voice.md に追加
・推敲比較で再現したい差分が brand・構成・企画方針に関わる → 該当する config/* や agents/*・templates/* を人間が承認のうえ更新（/推敲比較の提案を参照）
```

### マニュアル類の扱い

- `MANUAL.md` と `manual/index.html`（使い方の案内）は、利用者から「マニュアルを更新して」等の明示的な指示があるまで編集しない。
- `CLAUDE.md`・`config/`・`agents/` などの変更だけを理由に、マニュアルを勝手に追従させない。
- 迷ったら「詳細仕様が知りたい」と利用者へ案内すべき既定の入口は、この `CLAUDE.md` と `config/` である。

---

## ファイル構成

```
YT_TalkScript/
├── .cursor/
│   └── commands/
│       └── 推敲比較.md     ← `/推敲比較` プロンプト（任意）
├── CLAUDE.md              ← このファイル（エントリーポイント）
├── package.json           ← Node（タイトルスタジオ用）
├── .env.example           ← ANTHROPIC_API_KEY テンプレ（要コピーで .env）
├── MANUAL.md              ← 使い方（Markdown／更新は明示指示時のみ）
├── manual/
│   └── index.html         ← 使い方（ブラウザ向け／同じく明示指示時のみ更新）
├── tools/
│   ├── title-studio/     ← ローカルでタイトル案API（npm run title-studio）
│   └── script-to-doc/    ← 台本.md → ドキュメントHTML（npm run script-doc）
├── config/
│   ├── brand.md           ← ブランド定義
│   ├── audience.md        ← 視聴者ペルソナ
│   ├── voice.md           ← 文体・トーン
│   ├── quality.md         ← 品質基準
│   └── calibration.md     ← 推敲比較マーカー（A/B境界）
├── templates/
│   ├── structure-A.md     ← ツール活用型
│   ├── structure-B.md     ← 機能紹介型
│   └── structure-C.md     ← まとめ紹介型
├── agents/
│   ├── scout.md           ← 市場調査・テーマ候補
│   ├── planner.md         ← 企画エージェント
│   ├── architect.md       ← 構成エージェント
│   ├── writer.md          ← 執筆エージェント
│   ├── titler.md          ← タイトル・サムネエージェント
│   ├── reviewer.md        ← レビューエージェント
│   └── calibrator.md      ← 推敲比較エージェント
├── examples/              ← 成功台本サンプル（今後追加）
└── outputs/               ← 成果物出力先
```

---

## 変更履歴

| 日付 | 変更内容 |
|------|----------|
| 2025-05-02 | 初版作成 |
| 2025-05-02 | SSOT・サブエージェント設計に再構築 |
| 2026-05-02 | マニュアル（MANUAL・manual/index）の保全ポリシーを運用ルールに追記 |
| 2026-05-02 | `/テーマ調査`・agents/scout.md（市場調査スカウト）を追加 |
| 2026-05-03 | 台本の文字数基準（3001字以上・目安〜4200字）を brand/quality/agents/templates に反映 |
| 2026-05-03 | `tools/title-studio`（Anthropic API・ローカル）、`package.json`・`.env.example` 追加 |
| 2026-05-07 | `tools/script-to-doc`・`npm run script-doc`（台本.md→ドキュメントHTMLをoutputsへ） |
| 2026-05-07 | `/推敲比較`・agents/calibrator.md・config/calibration.md（同一ファイル内A/B・Writer末尾ブロック・再執筆時のマーカー下維持） |
| 2026-05-08 | `.cursor/commands/推敲比較.md`。`outputs/` を日付別サブフォルダなしの直下運用に変更（scout・MANUAL・manual/index と整合） |
| 2026-05-09 | config/quality「製品・アプリの事実」、reviewer/writer と台本 54（Android の付箋は主に OneNote 経由等の公式準拠） |
