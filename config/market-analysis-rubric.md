# 市場分析スコアリング（SSOT）

> Studio `/api/market-research`、CLI `npm run market-research`、[`agents/scout.md`](../agents/scout.md) が参照。
> テーマ選定の根拠ルールは [theme-selection.md](theme-selection.md)。

---

## 1. 3軸分析

| 軸 | 内容 | データ源 |
|----|------|----------|
| 需要 | YouTube 上で再生・投稿があるか | 複数 YouTube クエリ（第一指標） |
| 切り口 | 同一テーマ内で既出/空白 | Stage1 切り口クラスタ |
| 自ch | 被り・シリーズ化余地 | outputs/ + 自ch YouTube 公開リスト |
| 競合ch | 主要 ch の直近動画との差 | config/competitors.md + 検索上位 ch |

---

## 2. テーマ種（A/B/C）

| モード | 意味 | 検索の重点 |
|--------|------|------------|
| A | 定番・エバーグリーン | 使い方・設定・まとめ系クエリ |
| B | 旬・ニュース | 新機能・アップデート系 + 公式サイト CSE |
| C | 半々 | 上記の混合 |

---

## 3. score 判定

| score | 条件（すべて満たす方向） |
|-------|--------------------------|
| high | YouTube 根拠が明確、差別化切り口あり、競合密度 low〜medium、自ch が new または series |
| medium | 需要はあるが競合密度 medium、または差別化が弱い |
| low | 競合密度 high、near_duplicate、YouTube 根拠が薄い |

- Google/X/公式は補助。YouTube 無しで high にしない
- API が返していない数値（検索ボリューム、CTR）を書かない

---

## 4. 自ch被り

| ownChannelRelation | 扱い |
|--------------------|------|
| new | 問題なし |
| series | 続編・深掘り・最新版としてプラス評価可 |
| near_duplicate | score 降格 + overlapWarning |

硬除外はしない。

---

## 5. EnrichedCandidate スキーマ

```json
{
  "title": "動画タイトル案",
  "hook": "フック文",
  "targetPain": "視聴者の悩み",
  "reason": "YouTube 引用必須",
  "score": "high | medium | low",
  "differentiationAngle": "あらきりの切り口",
  "competitionDensity": "low | medium | high",
  "ownChannelRelation": "new | series | near_duplicate",
  "seriesPotential": "任意",
  "titleAlternatives": ["代替タイトル"],
  "referencedVideos": [{"title": "", "url": "", "channel": "", "viewCount": ""}],
  "competitorNotes": "競合との差分",
  "overlapWarning": "任意",
  "themeModeFit": "evergreen | trendy | balanced"
}
```
