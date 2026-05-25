import { computeScriptDiff } from "@/lib/script-diff";

/** 台本が最後の記録から変わっているか */
export function hasScriptChangesSinceRecord(
  current: string,
  recorded: string | null | undefined,
): boolean {
  if (!current.trim()) return false;
  if (!recorded?.trim()) return true;
  const diff = computeScriptDiff(recorded, current);
  return diff.stats.added > 0 || diff.stats.removed > 0 || diff.stats.changed > 0;
}

/** 企画が最後の記録時点から変わっているか */
export function hasPlanChangesSinceRecord(
  currentFingerprint: string,
  recordedFingerprint: string | null | undefined,
  fallbackFingerprint?: string,
): boolean {
  const baseline = recordedFingerprint ?? fallbackFingerprint;
  if (!baseline) return false;
  return currentFingerprint !== baseline;
}
