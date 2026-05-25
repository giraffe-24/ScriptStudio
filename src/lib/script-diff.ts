import { diffLines } from "diff";

export type DiffStats = {
  added: number;
  removed: number;
  changed: number;
  isFirstRecord: boolean;
};

export type DiffPreviewLine = {
  type: "add" | "remove" | "same";
  text: string;
};

export type ScriptDiffResult = {
  stats: DiffStats;
  previewLines: DiffPreviewLine[];
  diffExcerpt: string;
};

function countLines(value: string): number {
  if (!value) return 0;
  const parts = value.split("\n");
  if (value.endsWith("\n")) return Math.max(0, parts.length - 1);
  return parts.length;
}

export function computeScriptDiff(oldText: string, newText: string): ScriptDiffResult {
  const isFirstRecord = oldText.trim().length === 0;
  const parts = diffLines(oldText, newText);
  let added = 0;
  let removed = 0;
  const previewLines: DiffPreviewLine[] = [];
  const excerptLines: string[] = [];

  for (const part of parts) {
    const lines = part.value.split("\n");
    const endsWithNewline = part.value.endsWith("\n");
    const lineTexts =
      endsWithNewline && lines.length > 0 ? lines.slice(0, -1) : lines;

    if (part.added) {
      added += lineTexts.length;
      for (const text of lineTexts) {
        previewLines.push({ type: "add", text });
        if (excerptLines.length < 80) excerptLines.push(`+ ${text}`);
      }
    } else if (part.removed) {
      removed += lineTexts.length;
      for (const text of lineTexts) {
        previewLines.push({ type: "remove", text });
        if (excerptLines.length < 80) excerptLines.push(`- ${text}`);
      }
    } else {
      for (const text of lineTexts) {
        previewLines.push({ type: "same", text });
      }
    }
  }

  const changed = Math.min(added, removed);

  return {
    stats: { added, removed, changed, isFirstRecord },
    previewLines,
    diffExcerpt: excerptLines.join("\n"),
  };
}

export function formatDiffStats(stats: DiffStats): string {
  if (stats.isFirstRecord) return "初回記録";
  const parts: string[] = [];
  if (stats.changed > 0) parts.push(`修正 ${stats.changed} 行`);
  if (stats.added > stats.changed) parts.push(`追加 ${stats.added - stats.changed} 行`);
  if (stats.removed > stats.changed) parts.push(`削除 ${stats.removed - stats.changed} 行`);
  return parts.length > 0 ? parts.join(" / ") : "変更なし";
}
