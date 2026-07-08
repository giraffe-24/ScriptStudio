import { diffArrays, diffChars } from "diff";

/**
 * 推敲確認モーダル（CalibReviewModal）の「変更カード」用の差分エンジン。
 *
 * - 元原稿→確定稿の行差分を、前後の文脈つき「変更ブロック」にまとめる
 * - 対になる削除/追加は文字単位で比較し、変わった語句だけ強調できるようにする
 * - カードごとの「修正」「この変更をやめる（原文を残す）」の決定から、
 *   確定時に反映する確定稿全文を再構成する
 */

export type InlineSegment = { text: string; changed: boolean };

export type CalibChangeBlock = {
  id: number;
  /** 直前の見出し（## など）。位置の手がかり用 */
  sectionLabel: string | null;
  contextBefore: string[];
  /** 消える行（原文側） */
  removed: string[];
  /** 新しい行（確定稿側） */
  added: string[];
  contextAfter: string[];
  /** 文字単位の強調。削除/追加が対になり、差が読み取れる場合のみ */
  removedSegments: InlineSegment[] | null;
  addedSegments: InlineSegment[] | null;
};

export type CalibDecision = {
  mode: "accept" | "revert";
  /** 「新しい文を修正」した結果。null なら確定稿のまま */
  editedText: string | null;
};

type Op = { type: "same" | "remove" | "add"; lines: string[] };

export type CalibBlocksResult = {
  blocks: CalibChangeBlock[];
  /** 再構成用の内部表現 */
  ops: Op[];
  /** blocks[i] が ops のどの範囲か（start..end の半開区間） */
  blockOpRanges: Array<{ start: number; end: number }>;
  /** 空白を除いた追加・削除の文字数（表示用） */
  charStats: { added: number; removed: number };
};

const CONTEXT_LINES = 2;
/** これを超える長文ペアは文字単位比較をしない（表示が煩雑になるだけのため） */
const INLINE_DIFF_MAX_CHARS = 1200;
/** 変更率がこれを超えるペアは「ほぼ書き直し」として全体強調にする */
const INLINE_DIFF_MAX_CHANGED_RATIO = 0.75;

function countChars(lines: string[]): number {
  return lines.join("").replace(/\s/g, "").length;
}

function findSectionLabel(ops: Op[], blockStart: number): string | null {
  for (let i = blockStart - 1; i >= 0; i--) {
    for (let j = ops[i].lines.length - 1; j >= 0; j--) {
      const line = ops[i].lines[j];
      const m = line.match(/^#{1,4}\s*(.+)$/);
      if (m) return m[1].trim();
    }
  }
  return null;
}

function computeInlineSegments(
  removed: string[],
  added: string[],
): { removedSegments: InlineSegment[]; addedSegments: InlineSegment[] } | null {
  if (removed.length === 0 || added.length === 0) return null;
  const oldText = removed.join("\n");
  const newText = added.join("\n");
  if (oldText.length > INLINE_DIFF_MAX_CHARS || newText.length > INLINE_DIFF_MAX_CHARS) {
    return null;
  }
  const parts = diffChars(oldText, newText);
  const removedSegments: InlineSegment[] = [];
  const addedSegments: InlineSegment[] = [];
  let changedOld = 0;
  let changedNew = 0;
  for (const part of parts) {
    if (part.added) {
      addedSegments.push({ text: part.value, changed: true });
      changedNew += part.value.length;
    } else if (part.removed) {
      removedSegments.push({ text: part.value, changed: true });
      changedOld += part.value.length;
    } else {
      removedSegments.push({ text: part.value, changed: false });
      addedSegments.push({ text: part.value, changed: false });
    }
  }
  const ratio = Math.max(
    oldText.length > 0 ? changedOld / oldText.length : 1,
    newText.length > 0 ? changedNew / newText.length : 1,
  );
  if (ratio > INLINE_DIFF_MAX_CHANGED_RATIO) return null;
  return { removedSegments, addedSegments };
}

export function computeCalibBlocks(originalText: string, finalText: string): CalibBlocksResult {
  const oldLines = originalText.split("\n");
  const newLines = finalText.split("\n");
  const parts = diffArrays(oldLines, newLines);

  const ops: Op[] = parts.map((part) => ({
    type: part.added ? "add" : part.removed ? "remove" : "same",
    lines: [...part.value],
  }));

  const blocks: CalibChangeBlock[] = [];
  const blockOpRanges: Array<{ start: number; end: number }> = [];
  let addedChars = 0;
  let removedChars = 0;

  let i = 0;
  while (i < ops.length) {
    if (ops[i].type === "same") {
      i++;
      continue;
    }
    // 連続する remove/add をひとつの変更ブロックにまとめる
    const start = i;
    const removed: string[] = [];
    const added: string[] = [];
    while (i < ops.length && ops[i].type !== "same") {
      if (ops[i].type === "remove") removed.push(...ops[i].lines);
      else added.push(...ops[i].lines);
      i++;
    }
    const end = i;

    const prevSame = start > 0 ? ops[start - 1].lines : [];
    const nextSame = end < ops.length ? ops[end].lines : [];
    const contextBefore = prevSame.slice(-CONTEXT_LINES).filter((l) => l.trim() !== "");
    const contextAfter = nextSame.slice(0, CONTEXT_LINES).filter((l) => l.trim() !== "");

    const inline = computeInlineSegments(removed, added);
    blocks.push({
      id: blocks.length,
      sectionLabel: findSectionLabel(ops, start),
      contextBefore,
      removed,
      added,
      contextAfter,
      removedSegments: inline?.removedSegments ?? null,
      addedSegments: inline?.addedSegments ?? null,
    });
    blockOpRanges.push({ start, end });
    addedChars += countChars(added);
    removedChars += countChars(removed);
  }

  return { blocks, ops, blockOpRanges, charStats: { added: addedChars, removed: removedChars } };
}

/**
 * カードごとの決定（そのまま／修正／取り消し）を適用した確定稿全文を再構成する。
 */
export function reconstructFinalText(
  result: CalibBlocksResult,
  decisions: Record<number, CalibDecision | undefined>,
): string {
  const out: string[] = [];
  let blockIndex = 0;
  let i = 0;
  while (i < result.ops.length) {
    const range = result.blockOpRanges[blockIndex];
    if (range && i === range.start) {
      const block = result.blocks[blockIndex];
      const decision = decisions[block.id];
      if (decision?.mode === "revert") {
        // 原文を残す
        out.push(...block.removed);
      } else if (decision?.editedText != null) {
        // 修正済みテキスト。空にした場合は「この段落を削除」の意図として何も出さない
        if (decision.editedText.trim() !== "") out.push(...decision.editedText.split("\n"));
      } else {
        out.push(...block.added);
      }
      i = range.end;
      blockIndex++;
      continue;
    }
    out.push(...result.ops[i].lines);
    i++;
  }
  return out.join("\n");
}
