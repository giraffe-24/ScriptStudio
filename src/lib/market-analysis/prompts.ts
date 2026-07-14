import fs from "fs/promises";
import path from "path";

const ROOT = process.cwd();

export async function loadMarketAnalysisRubric(): Promise<string> {
  return fs.readFile(path.join(ROOT, "config", "market-analysis-rubric.md"), "utf-8").catch(() => "");
}

export function buildAngleClusterPrompt(data: {
  queries: string[];
  youtubeSummary: string;
  googleSummary: string;
  xSummary: string;
  officialSummary: string;
  competitorSummary: string;
  ownChannelSummary: string;
  themeModeLabel: string;
  rubric: string;
  referenceSummary?: string;
}): string {
  return `${data.rubric}

=== Stage1: 切り口整理 ===
テーマ種: ${data.themeModeLabel}
検索クエリ: ${data.queries.join(" / ")}
${data.referenceSummary ? `\n${data.referenceSummary}\n` : ""}
以下のデータのみを根拠に、切り口クラスタ・既出切り口・空白（差別化余地）を整理してください。
JSON 以外の説明文は不要です。

${data.youtubeSummary}

${data.googleSummary}

${data.xSummary}

${data.officialSummary}

${data.competitorSummary}

${data.ownChannelSummary}

以下の JSON オブジェクトのみで回答:
{
  "angleClusters": [{"label": "切り口名", "examples": ["動画タイトル例"], "saturation": "low|medium|high"}],
  "gaps": ["まだ少ない切り口や空白"],
  "overusedAngles": ["既に多い切り口"],
  "competitorInsights": "競合チャンネルから読み取れる傾向（2-3行）",
  "ownChannelNotes": "自チャンネル履歴からの注意点（シリーズ化余地含む）"
}`;
}

export function buildCandidateGeneratePrompt(data: {
  angleAnalysis: string;
  youtubeSummary: string;
  googleSummary: string;
  xSummary: string;
  officialSummary: string;
  competitorSummary: string;
  ownChannelSummary: string;
  themeModeLabel: string;
  themeModeFit: string;
  rubric: string;
  referenceSummary?: string;
}): string {
  return `${data.rubric}

=== Stage2: 候補生成（3軸スコア） ===
テーマ種: ${data.themeModeLabel}
themeModeFit: ${data.themeModeFit}
${data.referenceSummary ? `\n${data.referenceSummary}\n` : ""}
Stage1 の切り口整理:
${data.angleAnalysis}

根拠データ:
${data.youtubeSummary}
${data.googleSummary}
${data.xSummary}
${data.officialSummary}
${data.competitorSummary}
${data.ownChannelSummary}

チャンネル「効率化オタクのあらきり」の視聴者（40〜60代、IT初〜中級、Google系・無料ツール好き）向けに、
需要は YouTube で裏付けつつ、あらきりの切り口で勝てる候補を 6〜10 件提案してください。

以下の JSON 配列のみで回答:
[
  {
    "title": "動画タイトル案",
    "hook": "最初の30秒のフック文",
    "targetPain": "視聴者の悩み（1〜2行）",
    "reason": "参照 YouTube 動画タイトルを必ず含め、なぜ刺さるか（2〜3行）",
    "score": "high | medium | low",
    "differentiationAngle": "あらきりならではの切り口（1行）",
    "competitionDensity": "low | medium | high",
    "ownChannelRelation": "new | series | near_duplicate",
    "seriesPotential": "シリーズ向きなら理由（任意）",
    "titleAlternatives": ["代替タイトル案"],
    "referencedVideos": [{"title": "...", "url": "...", "channel": "...", "viewCount": "..."}],
    "competitorNotes": "競合との差分（1-2行）",
    "overlapWarning": "被りが強い場合の警告（任意）",
    "themeModeFit": "evergreen | trendy | balanced"
  }
]`;
}
