import type { EpisodePlan } from "./types";

/**
 * 企画書スナップショットの保存・表示ヘルパー。
 *
 * スナップショットの content には企画書の JSON 文字列を保存する（復元用）。
 * 一方、履歴の差分表示・AI 要約には人が読める整形テキストを使うため、
 * JSON ⇄ 整形テキストの変換をここに集約する。
 */

/** 企画書を人が読める整形テキストに変換（差分・要約表示用）。 */
export function planToSnapshotText(plan: EpisodePlan): string {
  const lines: string[] = [];
  lines.push(`# ${plan.episodeTitle || "（無題）"}`);
  lines.push("");
  lines.push("## 想定視聴者");
  lines.push(plan.targetViewer?.trim() || "（未記入）");
  lines.push("");
  lines.push("## 視聴者の悩み");
  lines.push(plan.pain?.trim() || "（未記入）");
  lines.push("");
  lines.push("## 動画で提供する価値");
  lines.push(plan.promise?.trim() || "（未記入）");
  lines.push("");
  lines.push("## コンテンツの核");
  if (plan.keyPoints?.length) {
    for (const point of plan.keyPoints) {
      lines.push(`- ${point}`);
    }
  } else {
    lines.push("（未記入）");
  }
  lines.push("");
  lines.push("## 構成");
  if (plan.outline?.length) {
    plan.outline.forEach((item, index) => {
      lines.push(`${index + 1}. ${item.section || "（無題）"}`);
      if (item.content?.trim()) {
        lines.push(`   ${item.content.trim()}`);
      }
    });
  } else {
    lines.push("（未記入）");
  }
  lines.push("");
  lines.push("## 競合との差別化");
  lines.push(plan.competitorAnalysis?.trim() || "（未記入）");
  lines.push("");
  lines.push("## 想定尺");
  lines.push(plan.estimatedLength?.trim() || "（未記入）");
  if (plan.youtubeGoal?.trim()) {
    lines.push("");
    lines.push("## YouTube 上のゴール");
    lines.push(plan.youtubeGoal.trim());
  }
  return lines.join("\n").trim();
}

/** スナップショットの content（企画書 JSON 文字列）をパースする。失敗時は null。 */
export function parsePlanSnapshotContent(raw: string): EpisodePlan | null {
  try {
    const parsed = JSON.parse(raw) as EpisodePlan;
    if (parsed && typeof parsed === "object" && typeof parsed.episodeTitle === "string") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/** content が JSON なら整形テキストへ、そうでなければそのまま返す（差分表示用）。 */
export function planSnapshotContentToText(raw: string): string {
  const parsed = parsePlanSnapshotContent(raw);
  return parsed ? planToSnapshotText(parsed) : raw;
}
