# ContentStudio — 仕様書

社内向けYouTube台本管理ツール。  
モックアップ: `docs/prototype/mockup.html`（ブラウザで直接開いて動作確認可能）

---

## 1. 目的・背景

### 解決する課題

- 台本とスライドが別タブ（Googleドキュメント）にあり、行き来が手間
- 推敲のたびに「何を変えたか」「誰が変えたか」が追いづらい
- 撮影担当（荒木）と編集担当（児玉）のイメージ共有が口頭頼りになりがち

### 目指す状態

1画面で「台本を書きながら、その段落にどのスライドテンプレートを使うか」が決められる。  
変更のたびにスナップショットを記録し、誰が何を直したかを段落単位で追跡できる。

### 利用者

| 名前 | 役割 |
|------|------|
| 荒木 | 台本執筆・企画 |
| 児玉 | 動画編集・スライド制作 |

---

## 2. 技術スタック

| 項目 | 採用技術 |
|------|---------|
| フレームワーク | Next.js（App Router） |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS |
| UIコンポーネント | shadcn/ui |
| データベース | Supabase（PostgreSQL） |
| ファイルストレージ | Supabase Storage（スライドテンプレート画像） |
| 差分計算 | npm `diff`（`diffLines`） |
| AI要約 | Claude API（`@anthropic-ai/sdk`、既存依存） |
| 配置場所 | `tools/content-studio/`（ローカルサーバー起動、`title-studio` と同方式） |

---

## 3. 画面構成（4ペイン）

```
┌────────────────────────────────────────────────────────────────────────┐
│ ContentStudio  ›  Windowsの付箋とOneNote同期               [トップバー] │
├──────────┬──────────────┬──────────────────────────┬───────────────────┤
│エピソード │セクション構成│       台本エディタ        │  スライド選択     │
│一覧      │              │                          │                   │
│ (160px)  │   (210px)    │       (flex: 1)          │    (256px)        │
└──────────┴──────────────┴──────────────────────────┴───────────────────┘
```

---

## 4. 各ペイン仕様

### 4-1. エピソード一覧（左端）

- Notionサイドバー風のテキストリスト
- 各エピソードを `#NN エピソード名` 形式で表示
- 選択中エピソードは青い左ボーダー＋青文字
- `＋ 追加` ボタン：エピソード名を入力して追加（MVP は手動追加のみ。AI企画生成は Phase 1b）

### 4-2. セクション構成（左から2番目）

- セクション一覧（番号・名前・目安時間）
- セクションをクリック → 台本エディタがそのセクションの段落だけに絞り込まれる
- セクション名はインライン編集可能（クリックして直接入力）
- 前回記録から変更があるセクションには緑の左ボーダーを表示
- `👁 全体を確認` ボタン → 全セクション通し読みプレビューモーダル
- `＋ セクション追加` ボタン → 名前入力してセクション追加

### 4-3. 台本エディタ（中央）

#### ツールバー

```
[パンくずリスト: エピソード名 › セクション名]  [前回との比較 ⬤] [記録] [履歴]
```

#### 段落ブロック構造

```
┌─── ¶1 ──────────────────────────────────────────────────────┐
│  🖥 スライドメモを追加…（クリックで入力できるテキストフィールド）    │
├──────────────────────────────────────────────────────────────┤
│  テキスト本文（contenteditable）                            99字│
└──────────────────────────────────────────────────────────────┘
```

- `¶N` マーカー：左端に縦ライン付きで表示（通常: 青、変更あり: 緑）
- `Enter` キー：新しい段落を直下に追加
- 行頭 `Backspace`：上の段落と結合
- 文字数：右下にリアルタイム表示（全角・半角ともに1字カウント）
- スライドメモ欄：段落上部にある1行テキスト。撮影・編集担当への指示メモ用
- スライド割り当て済みの場合：メモ欄左にテンプレートのミニサムネ＋名前を表示

#### 差分表示モード（「前回との比較」ON時）

変更があった段落：

```
┌─── ¶2 ──────────────────────────────────────────────────────┐（緑ボーダー）
│  🖥 スライドメモ                                              │
├──────────────────────────────────────────────────────────────┤
│  ~~旧テキスト~~（赤文字・打ち消し線・薄い赤背景）              │
│  ─────── ↓ 修正後 ──────────────────────────────────────── │
│  新テキスト（黒文字・薄い緑背景）                           94字│
└──────────────────────────────────────────────────────────────┘
```

変更がない段落：通常の青ボーダーで表示。  
新規追加段落：緑ボーダー＋「✦ 新規追加」バッジ。  
削除された段落：赤打ち消し線のみの幽霊表示。

### 4-4. スライド選択（右端）

- 上部：選択中の段落プレビュー（`¶2　テキスト冒頭…`）
- カテゴリタブ：すべて / 表紙・タイトル / 図解 / コンテンツ / 主張
- 2列グリッドでテンプレートサムネを表示
- クリックで選択中の段落に紐付け（緑チェックバッジ）
- 再クリックで解除
- テンプレート画像：Figmaで作成し PNG で書き出し → `assets/` に配置して手動登録

---

## 5. バージョン管理（スナップショット）仕様

### ユーザー識別

- ログイン不要。初回アクセス時に名前を入力（`AuthorSetupModal`）
- 入力した名前を `localStorage` に保存し、以降は自動入力
- 現在の利用者：荒木（執筆）、児玉（編集）

### 記録フロー

```
① 段落を編集する
   → 変更した段落の ¶ マーカーが青 → 緑に変わる
   → 変更があるセクションにも緑インジケーター表示

② 「記録」ボタンをクリック
   → SnapshotCommitModal が開く
      - 変更統計: 修正N段落 / 追加N段落 / 削除N段落 / 総段落数
      - AI要約（Claude APIが差分から自動生成、編集可）
      - 著者名（localStorageから自動入力、編集可）
      - 日時（自動）

③ 「記録を確定」ボタン
   → Supabase に保存
   → 緑インジケーターがリセット

④ 「前回との比較」トグル ON
   → 前回の記録との差分を段落内にインライン表示（打ち消し線）
```

### 履歴確認

「履歴」ボタン → `HistoryModal` が開く

```
変更履歴 — Windowsの付箋とOneNote同期
──────────────────────────────────────
[荒木] 2026-05-19 13:42
  導入セクションの表現を視聴者に親しみやすいトーンに修正。
  [2段落 修正]

[児玉] 2026-05-18 10:20
  Windows側セクションに段落を追加。収録前の確認手順を明確にした。
  [1段落 追加]

[荒木] 2026-05-17 21:05
  初稿を記録。8セクション・17段落で構成。
  [初回記録]
```

---

## 6. データモデル（Supabase）

```sql
-- エピソード
episodes
  id          uuid PK DEFAULT gen_random_uuid()
  slug        text NOT NULL           -- 例: sticky-windows-android
  number      int NOT NULL            -- 管理番号（54, 56, 57…）
  title       text NOT NULL
  status      text DEFAULT 'draft'    -- draft / review / done
  created_at  timestamptz DEFAULT now()

-- セクション
sections
  id          uuid PK DEFAULT gen_random_uuid()
  episode_id  uuid FK → episodes.id
  name        text NOT NULL
  order       int NOT NULL
  created_at  timestamptz DEFAULT now()

-- 段落
paragraphs
  id          uuid PK DEFAULT gen_random_uuid()
  section_id  uuid FK → sections.id
  episode_id  uuid FK → episodes.id
  content     text DEFAULT ''
  slide_memo  text DEFAULT ''         -- スライドメモ
  template_id uuid FK → slide_templates.id NULLABLE
  order       int NOT NULL
  created_at  timestamptz DEFAULT now()
  updated_at  timestamptz DEFAULT now()

-- スライドテンプレート
slide_templates
  id          uuid PK DEFAULT gen_random_uuid()
  label       text NOT NULL           -- 例: フロー図
  category    text NOT NULL           -- title / diagram / content / claim
  image_url   text                    -- Supabase Storage URL
  created_at  timestamptz DEFAULT now()

-- スナップショット（記録単位）
snapshots
  id          uuid PK DEFAULT gen_random_uuid()
  episode_id  uuid FK → episodes.id
  author_name text NOT NULL           -- localStorageから（例: 荒木）
  summary     text NOT NULL           -- AI生成の変更要約
  created_at  timestamptz DEFAULT now()

-- スナップショット内の段落データ
snapshot_paragraphs
  id          uuid PK DEFAULT gen_random_uuid()
  snapshot_id uuid FK → snapshots.id
  paragraph_id uuid FK → paragraphs.id
  section_id  uuid FK → sections.id
  content     text NOT NULL           -- 記録時点の本文
  order       int NOT NULL
```

---

## 7. コンポーネント構成

```
src/
├── app/
│   ├── page.tsx                    メイン画面（4ペインレイアウト）
│   └── api/
│       └── summarize-diff/
│           └── route.ts            POST: 差分テキスト → Claude APIで自然文要約
├── components/
│   ├── EpisodeList.tsx             左ペイン: エピソード一覧
│   ├── SectionNav.tsx              左2ペイン: セクション構成
│   ├── ScriptEditor.tsx            中央ペイン: 台本エディタ（段落ブロック管理）
│   ├── ParagraphBlock.tsx          段落1ブロック（スライドメモ + 本文 + 文字数）
│   ├── DiffParagraph.tsx           差分表示ブロック（打ち消し線 + 新テキスト）
│   ├── SlideTemplatePicker.tsx     右ペイン: スライド選択
│   ├── FullPreviewModal.tsx        全体プレビューモーダル
│   ├── AuthorSetupModal.tsx        初回名前入力モーダル
│   ├── SnapshotCommitModal.tsx     記録確定モーダル（AI要約 + 著者確認）
│   └── HistoryModal.tsx            変更履歴一覧モーダル
└── lib/
    ├── supabase.ts                 Supabaseクライアント
    ├── diff.ts                     段落単位のテキスト差分計算（npm `diff` を使用）
    └── types.ts                    共通型定義（Episode / Section / Paragraph / Snapshot）
```

---

## 8. AI要約の仕組み

```
記録ボタン押下
  → 変更があった段落の（旧テキスト, 新テキスト）ペアを収集
  → POST /api/summarize-diff に送信
      { diffs: [{ paraNum, oldText, newText, sectionName }], episodeTitle }
  → Claude API に以下を渡す:
      「台本の変更内容を1〜2文で自然に要約してください。
        変更点: {diffs}」
  → 返ってきた要約をコミットモーダルの textarea に自動入力（編集可）
```

使用モデル：`claude-haiku-3`（軽量・低コスト、要約タスクに十分）

---

## 9. 実装フェーズ

### Phase 1（MVP）— 本実装対象

| # | タスク |
|---|--------|
| 1 | Supabase テーブル作成（episodes / sections / paragraphs / slide_templates） |
| 2 | Next.js + Tailwind + shadcn/ui プロジェクト作成、Supabase接続確認 |
| 3 | 左ペイン: エピソード一覧（Supabase取得・追加） |
| 4 | 左2ペイン: セクション構成（選択・名前編集・追加） |
| 5 | 中央ペイン: 段落ブロック（Enter/Backspace/文字数・Supabase保存） |
| 6 | スライドメモ欄（インライン入力） |
| 7 | 右ペイン: スライドテンプレートピッカー（カテゴリタブ・グリッド・紐付け） |
| 8 | Supabase テーブル追加（snapshots / snapshot_paragraphs） |
| 9 | 著者名入力モーダル（初回・localStorage） |
| 10 | 記録ボタン → AI要約取得 → コミットモーダル → Supabase保存 |
| 11 | 差分表示モード（前回との比較トグル・緑ライン・打ち消し線） |
| 12 | 履歴モーダル（スナップショット一覧） |
| 13 | 全体プレビューモーダル |

### Phase 1b（MVP直後）

- `＋ 追加` ボタンからAIで企画生成 → エピソード追加フロー
- エピソードの `status`（draft / review / done）管理UI

### Phase 2（将来）

- 特定バージョンへの巻き戻し
- 差分フィードをAI学習素材として蓄積（推敲ログのRAG活用）
- スライドテンプレートのSupabase Storage管理画面

---

## 10. 環境変数

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
ANTHROPIC_API_KEY=...          # AI要約用（既存 .env.example に記載済み）
```

---

## 11. 起動方法（実装後）

```bash
# tools/content-studio/ に Next.js プロジェクトを作成後
cd tools/content-studio
npm run dev
# → http://localhost:3300 で起動
```

または `package.json` のルートスクリプトに追加:

```json
"scripts": {
  "content-studio": "cd tools/content-studio && npm run dev"
}
```

---

## 12. 参考・モックアップ

- インタラクティブモックアップ: `docs/prototype/mockup.html`（ブラウザで直接開く）
- 参考UI: `docs/prototype/mockup.html`（ContentStudio モック）
- 台本データ例（ScriptStudio 兄弟リポジトリ）: `outputs/54-sticky-windows-android/01-script-draft.md`
