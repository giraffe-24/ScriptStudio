import type { EnrichedCandidate } from "@/lib/types";
import type { OwnChannelEntry } from "../types";

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .split(/\s+/)
      .filter((t) => t.length > 1),
  );
}

function similarity(a: string, b: string): number {
  const ta = tokenize(a);
  const tb = tokenize(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let overlap = 0;
  for (const t of ta) {
    if (tb.has(t)) overlap += 1;
  }
  return overlap / Math.max(ta.size, tb.size);
}

function findBestMatch(
  title: string,
  ownTitles: OwnChannelEntry[],
): { entry: OwnChannelEntry; score: number } | null {
  let best: { entry: OwnChannelEntry; score: number } | null = null;
  for (const entry of ownTitles) {
    const score = similarity(title, entry.title);
    if (!best || score > best.score) best = { entry, score };
  }
  return best;
}

function downgradeScore(score: EnrichedCandidate["score"]): EnrichedCandidate["score"] {
  if (score === "high") return "medium";
  if (score === "medium") return "low";
  return "low";
}

function upgradeScore(score: EnrichedCandidate["score"]): EnrichedCandidate["score"] {
  if (score === "low") return "medium";
  return score;
}

export function applyOverlapPostProcessing(
  candidates: EnrichedCandidate[],
  ownChannel: OwnChannelEntry[],
): EnrichedCandidate[] {
  return candidates.map((c) => {
    const match = findBestMatch(c.title, ownChannel);
    if (!match || match.score < 0.35) {
      return { ...c, ownChannelRelation: c.ownChannelRelation ?? "new" };
    }

    const { entry, score: simScore } = match;
    const relation = c.ownChannelRelation;

    if (relation === "series" || (c.seriesPotential && simScore >= 0.35 && simScore < 0.65)) {
      return {
        ...c,
        ownChannelRelation: "series",
        seriesPotential:
          c.seriesPotential ??
          `「${entry.title}」(${entry.source}${entry.number ? ` #${entry.number}` : ""}) の続編・深掘り・最新版として展開可能`,
        score: upgradeScore(c.score),
      };
    }

    if (simScore >= 0.65 || relation === "near_duplicate") {
      return {
        ...c,
        ownChannelRelation: "near_duplicate",
        overlapWarning:
          c.overlapWarning ??
          `自チャンネル既出「${entry.title}」(${entry.source}) に近い。切り口の差別化が必要`,
        score: downgradeScore(c.score),
      };
    }

    if (simScore >= 0.45) {
      return {
        ...c,
        ownChannelRelation: "series",
        seriesPotential:
          c.seriesPotential ?? `「${entry.title}」に関連するシリーズ化の余地あり`,
      };
    }

    return { ...c, ownChannelRelation: "new" };
  });
}
