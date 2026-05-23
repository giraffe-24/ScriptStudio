# テーマ選定（SSOT）

> Studio の「市場分析」「テーマ分析」、API `/api/market-research`・`/api/adapt-theme` の正。
> ブランド・品質は [brand.md](brand.md)、[audience.md](audience.md)、[quality.md](quality.md)。
> CLI の `/テーマ調査` は [agents/scout.md](../agents/scout.md)（本 SSOT の原則を共有）。

---

## 1. 目的

テーマ候補は、検索で取得した公開情報に根拠を置く。
推測で「今刺さる」「検索ボリュームが高い」等を書かない。
ネット上に存在しない情報は候補に含めない。

---

## 2. 検索ソースと優先順位

| 優先度 | ソース | 役割 |
|--------|--------|------|
| 第一指標 | YouTube | 候補の主根拠。`reason` 必須引用。`score: high` の基準 |
| 補助 | Google 検索 | 話題の補足・文脈。YouTube 単独では弱い候補の検証 |
| 補助 | X（SNS） | 話題の補足・文脈。YouTube 単独では弱い候補の検証 |

- 3 ソースを毎回並列検索する（キャッシュ禁止）
- YouTube 結果が 0 件のときは §3.3 の救済フローで候補を必ず返す（エラーにしない）
- Google / X は API 未設定時スキップ可。YouTube は必須

---

## 3. 検索の原則（毎回最新）

### 3.1 必須

- 分析ボタンのたびに外部 API を新規呼び出し（`cache: no-store`）
- YouTube：`publishedAfter` で直近 12 か月
- Google Custom Search：`dateRestrict=m12`、日本語向け
- X：X API v2 recent search（未設定時は Google `site:x.com` フォールバック）

### 3.2 環境変数

| 変数 | 必須 | 用途 |
|------|------|------|
| `YOUTUBE_DATA_API_KEY` | 必須 | YouTube Data API v3 |
| `GOOGLE_CSE_CX` | 推奨 | Programmable Search Engine ID |
| `GOOGLE_CSE_API_KEY` | 任意 | 未設定時は `YOUTUBE_DATA_API_KEY` を流用可 |
| `X_BEARER_TOKEN` | 任意 | X API v2。未設定時は Google site 検索で X 相当 |

### 3.3 候補の guaranteed delivery（Studio）

Studio では「候補を生成できませんでした」「YouTube 0 件」等の検索失敗をユーザーに出さない。
候補は必ず 6 件以上返す（`YOUTUBE_DATA_API_KEY` 未設定など環境エラーは除く）。

| 段階 | 条件 | 動作 |
|------|------|------|
| 1 | 通常 | `planSearchQueries` / 入力テーマ由来クエリ |
| 2 | YouTube 0 件 | `GUARANTEED_RESCUE_QUERIES`（救済クエリ）で再検索 |
| 3 | まだ 0 件 | 競合 ch 直近動画を YouTube 根拠に変換 |
| 4 | まだ 0 件 | 自 ch 公開動画を根拠源に変換 |
| 5 | LLM 候補 0 件 | 取得済み YouTube 動画から根拠付きフォールバック候補を生成 |

救済クエリ（SSOT・`src/lib/market-analysis/guaranteed-search.ts` と同期）:

- スマホ 便利 使い方 設定 無料
- Google アプリ 使い方 初心者
- Android 設定 効率化
- Gmail 整理 方法
- iPhone 便利機能 まとめ

フォールバック候補も reason に実在する YouTube 動画タイトルを必須引用。捏造禁止（§4）は維持。

### 3.4 Google / X 0 件

- Google / X 0 件 → 警告なしで YouTube のみで続行

---

## 4. ハルシネーション禁止（厳守）

### 4.1 書いてよいこと

- 各検索結果に含まれるタイトル・本文・URL・API が返した数値
- YouTube から読み取れる切り口・視聴者の悩みの推論
- Google / X を補足として reason に触れること（YouTube 引用は必須のまま）

### 4.2 書いてはいけないこと

| 禁止 | 例 |
|------|-----|
| いずれの検索結果にもない話題 | リスト外アプリを「話題」とする |
| 未確認の数値 | 検索ボリューム、CTR |
| YouTube 無しで high | Google/X だけを根拠にした推奨 |
| 学習データのみのトレンド | API 未実行時の「今流行り」 |
| 存在しない URL・出典 | 確認していないリンク |

### 4.3 reason 欄

- 必ず YouTube 動画タイトルを 1 件以上含める
- Google / X は補足可。YouTube 引用を置き換えない

---

## 5. 実装との対応

| 層 | ファイル |
|----|---------|
| SSOT | 本ファイル、[market-analysis-rubric.md](market-analysis-rubric.md)、[competitors.md](competitors.md) |
| 分析エンジン | `src/lib/market-analysis/`（`guaranteed-search.ts` が救済・フォールバック） |
| 検索統合 | `src/lib/theme-search.ts` |
| 市場分析 API | `src/app/api/market-research/route.ts` |
| 競合 ch API | `src/app/api/competitors/route.ts` |
| テーマ分析 API | `src/app/api/adapt-theme/route.ts` |
| UI | `src/components/ThemeInput.tsx` |
| CLI | `npm run market-research` |

---

## 6. 市場分析（3軸）

Studio の市場分析は次の 3 軸で「勝てる候補」を優先する。

1. 需要（YouTube 複数クエリ・第一指標）
2. 切り口（同一テーマ内の既出/空白）
3. 自 ch / 競合 ch（outputs/ + 公開動画 + config/competitors.md）

分析前にテーマ種 A/B/C（定番 / 旬 / 半々）を選ぶ。詳細は [market-analysis-rubric.md](market-analysis-rubric.md)。

出力は `EnrichedCandidate`（差別化切り口・参照動画・競合密度・自 ch 関係など）。ハルシネーション禁止は §4 を維持。

---

## 7. クイック判定

1. YouTube リストと対応しているか（第一指標）
2. reason の YouTube 引用はリスト内か
3. Google/X だけの根拠で high にしていないか
4. 数字・日付を出典なしで書いていないか
