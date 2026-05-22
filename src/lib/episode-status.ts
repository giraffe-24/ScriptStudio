export const EPISODE_STATUSES = ["considering", "scripting", "done"] as const;

export type EpisodeStatus = (typeof EPISODE_STATUSES)[number];

export const STATUS_LABEL: Record<EpisodeStatus, string> = {
  considering: "検討中",
  scripting: "執筆中",
  done: "完了",
};

export const STATUS_COLOR: Record<EpisodeStatus, string> = {
  considering: "bg-gray-100 text-gray-600",
  scripting: "bg-blue-100 text-blue-700",
  done: "bg-green-100 text-green-700",
};

/** manifest の旧ステータスを現行3種に正規化 */
export function normalizeEpisodeStatus(raw: string | undefined): EpisodeStatus {
  if (raw === "scripting" || raw === "done" || raw === "considering") return raw;
  if (raw === "planning" || raw === "review") return "considering";
  return "considering";
}
