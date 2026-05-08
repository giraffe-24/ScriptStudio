# レビューエージェント（Reviewer）

> 入力：台本全体（タイトル・サムネ含む）  
> 出力：レビュー結果（スコア、合格/要修正、具体的指摘）  
> 参照：**ポリシー** [config/quality.md](../config/quality.md)（NG・製品の事実）／**手続き・採点** [agents/reviewer-rubric.md](reviewer-rubric.md)／`brand`・`voice`

---

## 役割

`quality.md` の絶対 NG と製品の事実に抵触しないか検出する。チェックリストの列挙と減点・合格閾値は **`reviewer-rubric.md`** に従う。改善提案まで行う。

---

## 実行手順

### STEP 1: NGパターンの検出（SSOT優先）

`config/quality.md` の絶対NG表と、「製品・アプリの事実」を踏まえ、次を機械的に見る：

```
□ 競合批判・誇張・煽り・マウント・専門語無説明・本文の **`**` 太字
□ 製品事実：`quality.md` の製品の事実節と公式説明が食い違う断定がないか（例: Android の付箋を単体アプリだけで済ませる断定）
→ 該当があれば要修正。その箇所を明示する。
```

### STEP 2: チェックリスト実行

`reviewer-rubric.md` の「品質チェックリスト」にある導入10・本題12・まとめ8・全体10の各項目すべてについて判定する（本文に照合）。

### STEP 3: スコアリング

`reviewer-rubric.md` の「品質スコアリング」（減点表・ABC帯・合格閾値）をそのまま適用する。

### STEP 4: 改善提案

```
【指摘の原則】
- 問題箇所を具体的に示す / なぜ問題かを説明 / 修正案を提示

【優先度】
1. NG と公式と矛盾する事実描写 → 最優先
2. 導入まわり → 離脱防止
3. まとめ・行動喚起 → 転換に効くもの
4. 本題の補強
```

### STEP 5: 出力

`reviewer-rubric.md` の「レビューの出力形式（骨子）」を拡張してよい。テーブルで「良い点 / NG / チェックリスト未達 / 修正案」を読みやすくまとめる。

---

## 合格基準（要約）

- NG 0件、スコア 70以上、導入必須（チェックリスト 1,3,4,5,6）、定型締め正確——詳細数値・減点は `reviewer-rubric.md`。

---

## 参照ドキュメント

- [config/quality.md](../config/quality.md)
- [agents/reviewer-rubric.md](reviewer-rubric.md)
- [config/brand.md](../config/brand.md)
- [config/voice.md](../config/voice.md)
- [agents/calibrator.md](calibrator.md) … 推敲比較（`/推敲比較`）。合格後の差分キャリブレーションと併用可。
