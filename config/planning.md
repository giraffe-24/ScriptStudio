# 企画書・目次案（SSOT）

> 企画書 JSON の outline、Studio 企画書エディタ、台本 ## 見出しの正は本ファイル。
> NG 表現・台本品質は [quality.md](quality.md)。チェック手順は [agents/reviewer-rubric.md](../agents/reviewer-rubric.md)。
> Studio 向け API は `src/lib/plan-outline.ts` で後処理する。

---

## 1. 目的

目次案（outline.section）は、そのまま視聴者に見せるセクション見出しになる。
構成の骨格ラベル（本題・まとめ等）ではなく、視聴者が「この章で何を学ぶか」がわかる内容見出しだけを書く。

```
企画書 目次案 → 台本 ## 見出し → 視聴者が見る章タイトル
```

この連鎖を崩す表現は、生成段階・保存段階・UI 編集段階のいずれでも禁止する。

---

## 2. 目次案（outline.section）の絶対ルール

### 2.1 書くもの

- 視聴者向けの内容見出し（名詞句・短い文）
- 見出しだけ読めば、その章のトピックがわかること
- 企画意図は outline.content（詳細欄）に書く

### 2.2 書かないもの

| 禁止 | 例 | 理由 |
|------|-----|------|
| 構成ラベル単体 | 本題、まとめ、導入、付録 | 視聴者向け内容ではない |
| 構成ラベル接頭辞 | 本題 - 設定、導入：、まとめ｜ | 同上 |
| 括弧ラベル | 【本題】設定、【まとめ】 | 同上 |
| 時間・尺 | 0:00、5分、（3:00〜） | 尺は estimatedLength のみ |
| 番号だけ | 1.、STEP2、第3章 | 内容名を書く |
| 台本メタ | 注意点、メタ情報、本編 | 視聴者向けではない |

### 2.3 正しい例

```json
"outline": [
  { "section": "共有できないとき最初に疑う3か所", "content": "権限・リンク・フォルダ設定の確認順" },
  { "section": "Geminiに食事ログを送る習慣づくり", "content": "写真・メモのテンプレと声かけ例" },
  { "section": "3か月続けたときの振り返り方", "content": "体重・体調・続けやすさのチェック" }
]
```

### 2.4 NG 例（生成・保存前に必ず修正）

```json
{ "section": "本題 - 設定手順", "content": "..." }
{ "section": "まとめ", "content": "..." }
{ "section": "導入（0:00）", "content": "..." }
{ "section": "【本題】iPhone/Android", "content": "..." }
```

---

## 3. 詳細欄（outline.content）のルール

- その章で話す要点・手順・結論を 1〜3 行で書く
- 台本執筆時は詳細欄に沿って本文を書く（詳細にない別トピックへ逸脱しない）
- 詳細欄に構成ラベル（本題・まとめ等）を書かない
- 詳細欄は視聴者には直接見えないが、執筆 SSOT として扱う

---

## 4. 台本との同期（厳守）

1. 台本の `##` 見出しは、企画書 outline.section と一字一句一致させる
2. 企画書にない見出しを台本に追加しない（本題・まとめ・付録・注意点等）
3. `###` や `#` による追加見出しは禁止。見出しは `##` のみ
4. セクションの統合・分割・省略は禁止
5. 構成変更後は台本を再生成し、見出しを再同期する

実装：`src/lib/script-outline.ts`、`src/app/api/generate-script/route.ts`

---

## 5. 企画書 JSON 全体

| フィールド | 役割 |
|-----------|------|
| episodeTitle | 動画タイトル（30 文字目安、視聴者の言葉） |
| targetViewer | 想定視聴者 |
| pain | 視聴者の悩み |
| promise | 視聴者が得る価値 |
| keyPoints | コンテンツの核（3 点前後） |
| outline | 目次案 + 詳細（本 SSOT の中心） |
| competitorAnalysis | 差別化 |
| estimatedLength | 想定尺（ここだけに時間を書く） |

---

## 6. 生成 API への適用

### generate-plan

- システムプロンプトに本ファイル（planning.md）を含める
- JSON 例に「本題 -」「まとめ」を含めない
- レスポンスは `sanitizePlanOutline()` を必ず通す

### infer-plan

- 台本 `##` 見出しから section を抽出するときも構成ラベルを除去
- レスポンスは `sanitizePlanOutline()` を必ず通す

### generate-script

- outline.section をそのまま `##` に使う
- 構成ラベル見出しの追加を禁止（[quality.md](quality.md) と併用）

---

## 7. Studio UI（企画書エディタ）

### 7.1 テキストエリアの表示

- 入力内容は常に全文が見えること（見切れ禁止）
- テキストエリア内スクロール禁止
- クリック・フォーカスで高さが変わる／隠れていた文が現れる挙動禁止
- 実装：`AutoResizeTextarea` が value 変更・マウント時に高さを `scrollHeight` に合わせる

### 7.2 目次案の手入力

- section 入力時も `sanitizeSectionName()` を適用
- 構成ラベルのみの行は、詳細欄の先頭行からフォールバック見出しを補う

### 7.3 動画管理番号

- タイトル直上に `#57` 形式の番号を表示（エピソード number）

---

## 8. CLI エージェントとの関係

| エージェント | 本 SSOT との関係 |
|-------------|-----------------|
| planner | 企画書作成時、目次案は §2 に従う |
| architect | 構成案のセクション名も §2 と同じ基準（本題/まとめラベル禁止） |
| writer | 台本 ## は outline.section をそのまま使う（§4） |
| reviewer | 目次案と台本見出しの一致、構成ラベル混入を指摘 |

長いチェック表は [agents/planner-outline-rubric.md](../agents/planner-outline-rubric.md)。

---

## 9. これまでの厳守事項（参照）

本ファイルは目次案・企画書に特化する。以下は従来どおり厳守する。

### 9.1 品質（quality.md）

- Markdown 太字 `**` 禁止（台本・企画書・成果物本文）
- 競合批判・誇張・不安煽り・マウント禁止
- 視聴者の能力を下げるラベル禁止
- 専門用語は噛み砕く
- 製品・アプリの事実は公式確認後に書く

### 9.2 ブランド・文体

- [brand.md](brand.md) — あらきりチャンネルの軸
- [audience.md](audience.md) — 40〜60 代・ズボラ向け
- [voice.md](voice.md) — 文体

### 9.3 出力レイアウト

- 1 案件 1 フォルダ（`.cursor/rules/outputs-layout.mdc`）
- 企画・構成は `outputs/{NN}-{slug}/00-plan-and-structure.md`

### 9.4 推敲・チェック

- 推敲比較ルールは quality.md § 推敲比較
- 採点表は agents/reviewer-rubric.md

---

## 10. 変更時の手順

1. 本ファイル（planning.md）を先に更新する
2. `src/lib/plan-outline.ts` の正規表現・禁止集合を同期する
3. `generate-plan` / `infer-plan` / `generate-script` のプロンプト例を確認する
4. agents/planner.md、architect.md、writer.md の参照を確認する
5. Studio UI の挙動（§7）に影響があれば `PlanningDoc.tsx` を更新する

---

## 11. クイック判定（人間・AI 共通）

目次案の各行について、次をすべて Yes にできなければ修正する。

1. 「本題」「まとめ」「導入」だけのラベルになっていないか
2. 時間・タイムコードが含まれていないか
3. 見出しだけ読んで、その章の内容が想像できるか
4. 台本 ## にそのまま出して違和感がないか

---

## 12. 後処理（コード SSOT）

`src/lib/plan-outline.ts` が実行時の正。

- `stripTimeFromSection()` — 時間表記除去
- `sanitizeSectionName()` — 構成ラベル除去 + フォールバック
- `sanitizeOutline()` / `sanitizePlanOutline()` — 企画書 JSON 全体へ適用

プロンプトで漏れても、保存前に必ず後処理する。
