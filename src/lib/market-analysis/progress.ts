import type { ProgressStep, ProgressStepId } from "./types";

export const PROGRESS_STEPS: { id: ProgressStepId; label: string }[] = [
  { id: "search", label: "検索データ収集中" },
  { id: "competitors", label: "競合チャンネル分析中" },
  { id: "own_channel", label: "自チャンネル履歴照合中" },
  { id: "angle_cluster", label: "切り口を整理中" },
  { id: "candidates", label: "候補を生成中" },
  { id: "overlap", label: "被り・シリーズ判定中" },
];

export function createProgressLog(): ProgressStep[] {
  return PROGRESS_STEPS.map((s) => ({ ...s, status: "pending" as const }));
}

export function markStep(
  log: ProgressStep[],
  id: ProgressStepId,
  status: ProgressStep["status"],
): ProgressStep[] {
  return log.map((s) => (s.id === id ? { ...s, status } : s));
}
