import type {
  CompetitorSuggestion,
  DirectionAxis,
  EnrichedCandidate,
  EpisodePlan,
  PlanDirection,
  ThemeCandidate,
} from "@/lib/types";

/**
 * 閲覧専用（レビュアー）向けのデモ再生用データ。
 * テーマ選定・6本柱・企画書・台本生成の「画面の動き」を再現するためのサンプルで、
 * AI・YouTube API 等の外部サービスは一切呼ばない。内容はすべて架空。
 */

export const DEMO_AI_NOTICE =
  "デモ生成：AIは使用していません。実際の生成の動きを再現したサンプル表示です。";

export function demoDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const DEMO_CANDIDATES: EnrichedCandidate[] = [
  {
    title: "スマホの写真整理を全自動にする設定",
    hook: "何もしなくても写真が勝手に片付く設定、知っていますか？",
    targetPain: "写真が数千枚たまっていて、整理する気力が起きない",
    reason: "写真整理は検索需要が安定して高く、一度設定すれば終わる「仕組み化」ネタとして相性が良い（デモ用サンプル）",
    score: "high",
    searchVolume: "デモ値",
    differentiationAngle: "アプリを増やさず標準機能だけで完結させる切り口",
    competitionDensity: "medium",
    ownChannelRelation: "new",
    seriesPotential: "ストレージ整理シリーズへ展開可能",
    titleAlternatives: ["写真整理は設定1回で終わり", "スマホの写真、もう手で消さない"],
    referencedVideos: [],
    competitorNotes: "（デモ）競合は手作業の削除術が中心",
    themeModeFit: "evergreen",
  },
  {
    title: "無料ツールだけで会議メモを自動化",
    hook: "会議中にメモを取るの、もうやめませんか？",
    targetPain: "会議に集中するとメモが取れず、メモを取ると話を聞き逃す",
    reason: "議事録の自動化は関心が高い一方、有料ツール前提の解説が多く、無料構成に需要がある（デモ用サンプル）",
    score: "medium",
    searchVolume: "デモ値",
    differentiationAngle: "完全無料・登録最小限の構成に絞る",
    competitionDensity: "high",
    ownChannelRelation: "new",
    referencedVideos: [],
    themeModeFit: "balanced",
  },
  {
    title: "パソコンの起動を速くする10分メンテ",
    hook: "朝いちばんのパソコン待ち時間、累計すると年間◯時間です。",
    targetPain: "起動が遅いのを我慢して使い続けている",
    reason: "定番テーマだが、10分で終わる手順に絞った構成なら初心者の実行率が高い（デモ用サンプル）",
    score: "medium",
    searchVolume: "デモ値",
    differentiationAngle: "「捨てる判断」を代わりにしてあげるチェックリスト形式",
    competitionDensity: "medium",
    ownChannelRelation: "new",
    referencedVideos: [],
    themeModeFit: "evergreen",
  },
];

/**
 * テーマ分析後に出す「競合チャンネルの追加候補」のデモ。
 * チャンネルは実在のもの（ID 検証済み）を使う：リンク・登録者統計・承認保存が
 * 本物の競合管理 API（閲覧専用でも許可済み）でそのまま動き、設定からの削除も試せる。
 * videoCount のみデモ用の架空値。
 */
export const DEMO_COMPETITOR_SUGGESTIONS: CompetitorSuggestion[] = [
  {
    channelId: "UCutJqz56653xV2wwSvut_hQ",
    displayName: "東海オンエア",
    videoCount: 4,
    source: "dynamic",
  },
  {
    channelId: "UCsXVk37bltHxD1rDPwtNM8Q",
    displayName: "Kurzgesagt – In a Nutshell",
    videoCount: 3,
    source: "dynamic",
  },
  {
    channelId: "UCBJycsmduvYEL83R_U4JriQ",
    displayName: "Marques Brownlee",
    videoCount: 2,
    source: "dynamic",
  },
];

export const DEMO_DIRECTION_AXES: DirectionAxis[] = [
  {
    title: "設定は1回だけ、あとは自動",
    subtitle: "Set Once, Run Forever",
    description: "毎回がんばる方法ではなく、一度設定したら勝手に回り続ける仕組みだけを扱う。",
  },
  {
    title: "ズボラを前提に設計する",
    subtitle: "Lazy-Proof Design",
    description: "続ける意思力を要求しない。サボっても破綻しない手順だけを採用する。",
  },
  {
    title: "無料・標準機能を最優先",
    subtitle: "Free & Built-in First",
    description: "新しいアプリの導入は最終手段。まずは今ある標準機能でどこまでできるかを示す。",
  },
  {
    title: "手順は3ステップ以内",
    subtitle: "Three Steps Max",
    description: "1つの操作ブロックを3ステップ以内に収め、途中離脱を防ぐ。",
  },
  {
    title: "失敗しても元に戻せる",
    subtitle: "Always Reversible",
    description: "各手順に「戻し方」を添えて、視聴者の不安（壊したらどうしよう）を先回りで消す。",
  },
  {
    title: "今日から効果を体感できる",
    subtitle: "Same-Day Payoff",
    description: "動画を見たその日に変化が分かるものだけを扱い、行動につなげる。",
  },
];

/** 選ばれた候補と6本柱から、デモ用の企画書をその場で組み立てる（AI不使用） */
export function buildDemoPlan(
  candidate: ThemeCandidate,
  direction?: PlanDirection,
): EpisodePlan {
  const axes = direction?.axes?.length ? direction.axes : DEMO_DIRECTION_AXES;
  return {
    episodeTitle: candidate.title,
    youtubeGoal: "",
    targetViewer:
      "（デモ）新しいツールにやや抵抗があるが、日々の小さな面倒を減らしたいと思っている視聴者。難しい説明より「この順番でやれば終わる」という結論を求めている。",
    pain: candidate.targetPain || "（デモ）毎日の小さな手間が積み重なってストレスになっている。",
    promise:
      "（デモ）動画を見終わる頃には、今日から使える設定・手順が分かり、同じ悩みに時間を使わなくてよくなる。",
    keyPoints: axes.slice(0, 3).map((a) => a.title),
    outline: [
      {
        section: "導入：その手間、仕組みで消せます",
        content: `（デモ）${candidate.hook || "身近な例で問題を提示し、今日やることを予告する。"}`,
      },
      {
        section: "全体像：やることは3つだけ",
        content: "（デモ）手順の全体像を先に見せて、視聴のゴールを共有する。",
      },
      {
        section: "手順①：まずは現状を確認する",
        content: "（デモ）操作画面を見せながら、最初のステップを丁寧に案内する。",
      },
      {
        section: "手順②：自動化の設定を入れる",
        content: "（デモ）核となる設定を入れる。戻し方もあわせて説明して不安を消す。",
      },
      {
        section: "手順③：動いているか確かめる",
        content: "（デモ）設定が効いていることを確認し、達成感を作る。",
      },
      {
        section: "まとめ：設定は1回、効果はずっと",
        content: "（デモ）要点を3つで振り返り、今日やる最初の一歩を提案して締める。",
      },
    ],
    competitorAnalysis:
      "（デモ）競合は機能紹介の羅列が中心。本企画は「やる順番」と「戻し方」に絞って差別化する。※この企画書はデモ生成で、AIは使用していません。",
    estimatedLength: "8〜10分",
  };
}

/** 推敲モーダル用：差分統計から定型の学習要約を作る（AI不使用） */
export function buildDemoCalibSummary(stats: { added: number; removed: number }): string {
  return `（デモ）追加 ${stats.added}行・削除 ${stats.removed}行の手直しから、言い回しとトーンの傾向を反映しました。`;
}

/** 推敲モーダル用：「あらきりらしさメモ」更新案のデモ（AI不使用・固定サンプル） */
export function buildDemoStyleLearnings(): string {
  return [
    "# あらきりらしさメモ（デモ）",
    "",
    "## 言い回し",
    "- 冒頭は「『楽』を極めて最大の結果を出す、効率化オタクの管理人です。」で入る",
    "- テーマ提示は「今回のテーマは「〇〇」。」と短く切り、前置きを引き延ばさない",
    "- 「結論から言うと」で先に答えを出してから理由を話す",
    "",
    "## 構成・リズム",
    "- 1文を短く区切り、テンポよく進める",
    "- 手順は3ステップ以内にまとめ、先に全体像を見せる",
    "",
    "## 語彙",
    "- 「非常に」「大幅に」などの硬い強調語より、「地味」「サボる」など日常語を使う",
    "- 効果は「10分で終わる」のように具体的な数字で言い切る",
    "",
    "## トーン",
    "- 頑張らせない。「一度設定すれば明日からは何もしなくていい」と安心させる",
    "",
    "## NG（避ける表現）",
    "- 「みなさんこんにちは」などの汎用的な挨拶",
    "- 効果や手間をあいまいにぼかす言い回し",
    "",
    "※このメモはデモ表示のサンプルです。AIは使用しておらず、確定しても保存されません。",
  ].join("\n");
}

/** デモ用の台本を企画書から組み立てる（AI不使用・タイプライター再生用） */
export function buildDemoScript(plan: EpisodePlan): string {
  const lines: string[] = [];
  lines.push("## 導入");
  lines.push("");
  lines.push("「楽」を極めて最大の結果を出す、効率化オタクの管理人です。");
  lines.push("");
  lines.push(
    `今回のテーマは「${plan.episodeTitle}」。${plan.pain ? plan.pain.replace(/^（デモ）/, "") : "毎日の小さな手間"}――これ、実は仕組みで解決できます。`,
  );
  lines.push("");
  lines.push("結論から言うと、やることは3つだけです。順番にやれば10分で終わります。");
  lines.push("");
  for (const item of plan.outline.slice(1)) {
    lines.push(`## ${item.section}`);
    lines.push("");
    lines.push(item.content.replace(/^（デモ）/, ""));
    lines.push("");
    lines.push(
      "ここでのポイントは、頑張らないこと。一度設定してしまえば、明日からは何もしなくて大丈夫です。",
    );
    lines.push("");
  }
  lines.push("## まとめ");
  lines.push("");
  lines.push(
    `今回は「${plan.episodeTitle}」を紹介しました。${plan.keyPoints.length ? `ポイントは、${plan.keyPoints.join("・")}の3つです。` : ""}まずは手順①だけ、今日試してみてください。`,
  );
  lines.push("");
  lines.push("それでは、また次の動画でお会いしましょう。");
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("※この台本はデモ生成です。AIは使用しておらず、画面の動きを再現するためのサンプルです。");
  return lines.join("\n");
}
