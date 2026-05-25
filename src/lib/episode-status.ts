export const EPISODE_STATUSES = ["considering", "planning", "scripting", "done"] as const;

export type EpisodeStatus = (typeof EPISODE_STATUSES)[number];

export const STATUS_LABEL: Record<EpisodeStatus, string> = {
  considering: "検討中",
  planning: "企画中",
  scripting: "執筆中",
  done: "完了",
};

export const STATUS_COLOR: Record<EpisodeStatus, string> = {
  considering: "bg-gray-100 text-gray-600",
  planning: "bg-amber-100 text-amber-800",
  scripting: "bg-blue-100 text-blue-700",
  done: "bg-green-100 text-green-700",
};

export const UNREVISED_BADGE = "bg-amber-100 text-amber-700";

/** 推敲比較が空のときに未推敲バッジを表示 */
export function showUnrevisedBadge(status: EpisodeStatus, hasRevision: boolean): boolean {
  if (hasRevision || status === "considering" || status === "planning") return false;
  return true;
}

/** 一覧表示用。未推敲のときは完了ラベルを出さない */
export function effectiveDisplayStatus(status: EpisodeStatus, hasRevision: boolean): EpisodeStatus {
  if (status === "done" && !hasRevision) return "scripting";
  return status;
}

/** manifest の旧ステータスを現行4種に正規化 */
export function normalizeEpisodeStatus(raw: string | undefined): EpisodeStatus {
  if (
    raw === "scripting" ||
    raw === "done" ||
    raw === "considering" ||
    raw === "planning"
  ) {
    return raw;
  }
  if (raw === "review") return "considering";
  return "considering";
}

/** 台本未生成のエピソードは常に企画中 */
export function resolveEpisodeStatus(
  stored: EpisodeStatus,
  hasScriptDraft: boolean,
): EpisodeStatus {
  if (!hasScriptDraft) return "planning";
  return stored;
}
