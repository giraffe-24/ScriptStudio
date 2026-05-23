export interface PlanFingerprintInput {
  episodeTitle: string;
  youtubeGoal?: string;
  targetViewer?: string;
  pain?: string;
  promise?: string;
  keyPoints?: string[];
  outline?: { section: string; content: string }[];
  competitorAnalysis?: string;
  estimatedLength?: string;
}

/** 台本生成の根拠になった企画内容の指紋 */
export function planGenerationFingerprint(plan: PlanFingerprintInput): string {
  return JSON.stringify({
    episodeTitle: plan.episodeTitle,
    youtubeGoal: plan.youtubeGoal ?? "",
    targetViewer: plan.targetViewer ?? "",
    pain: plan.pain ?? "",
    promise: plan.promise ?? "",
    keyPoints: plan.keyPoints ?? [],
    outline: plan.outline ?? [],
    competitorAnalysis: plan.competitorAnalysis ?? "",
    estimatedLength: plan.estimatedLength ?? "",
  });
}
