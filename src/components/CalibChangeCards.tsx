"use client";

import { useState } from "react";
import { Pencil, Undo2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  CalibChangeBlock,
  CalibDecision,
  InlineSegment,
} from "@/lib/script-calib-blocks";

/**
 * 推敲確認モーダルの「変更カード」一覧。
 * 変更箇所ごとに「消える文（原文）」と「新しい文（確定稿）」を文脈つきで表示し、
 * カード単位で 修正（新しい文の書き換え）／取り消し（原文を残す） ができる。
 * ここでの操作は確定するまで一切保存されない。
 */

type Props = {
  blocks: CalibChangeBlock[];
  decisions: Record<number, CalibDecision | undefined>;
  onDecisionChange: (id: number, decision: CalibDecision | undefined) => void;
};

function SegmentedText({
  segments,
  fallback,
  changedClass,
}: {
  segments: InlineSegment[] | null;
  fallback: string;
  changedClass: string;
}) {
  if (!segments) return <>{fallback}</>;
  return (
    <>
      {segments.map((seg, i) =>
        seg.changed ? (
          <mark key={i} className={cn("rounded-[2px] bg-transparent", changedClass)}>
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  );
}

function ContextLines({ lines }: { lines: string[] }) {
  if (lines.length === 0) return null;
  return (
    <div className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground/80">
      {lines.join("\n")}
    </div>
  );
}

export function CalibChangeCards({ blocks, decisions, onDecisionChange }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);

  if (blocks.length === 0) {
    return <p className="text-xs text-muted-foreground">変更箇所はありません。</p>;
  }

  return (
    <div className="space-y-3">
      {blocks.map((block, index) => {
        const decision = decisions[block.id];
        const reverted = decision?.mode === "revert";
        const editing = editingId === block.id;
        const editedText = decision?.editedText ?? null;
        const newText = editedText ?? block.added.join("\n");
        // 空行しかない側は「無い」扱いにする（初回貼り付けで元原稿が空のときなど）
        const pureAddition = block.removed.every((l) => l.trim() === "");
        const pureRemoval = block.added.every((l) => l.trim() === "") && editedText == null;

        return (
          <section
            key={block.id}
            className={cn(
              "rounded-lg border bg-background p-3",
              reverted && "border-dashed bg-muted/40",
            )}
            aria-label={`変更 ${index + 1} / ${blocks.length}`}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-bold text-foreground">
                変更 {index + 1}/{blocks.length}
                {block.sectionLabel && (
                  <span className="ml-1.5 font-normal text-muted-foreground">
                    （{block.sectionLabel}）
                  </span>
                )}
              </p>
              {reverted ? (
                <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                  この変更はやめました — 原文を残します
                </span>
              ) : editedText != null ? (
                <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[11px] text-blue-700">
                  修正済み
                </span>
              ) : null}
            </div>

            <ContextLines lines={block.contextBefore} />

            {/* 消える文（原文側） */}
            {!pureAddition && (
              <div
                className={cn(
                  "my-1 rounded-md px-2 py-1.5 text-sm leading-relaxed whitespace-pre-wrap",
                  reverted ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-800/80",
                )}
              >
                <span className="mr-1 select-none text-[11px] font-bold">
                  {reverted ? "残す:" : "消える:"}
                </span>
                <span className={cn(!reverted && "line-through decoration-red-400")}>
                  <SegmentedText
                    segments={reverted ? null : block.removedSegments}
                    fallback={block.removed.join("\n")}
                    changedClass="bg-red-200/80 text-red-900"
                  />
                </span>
              </div>
            )}
            {pureAddition && !reverted && (
              <p className="my-1 text-[11px] text-muted-foreground">（新しく追加される段落です）</p>
            )}

            {/* 新しい文（確定稿側） */}
            {editing ? (
              <textarea
                value={newText}
                onChange={(e) =>
                  onDecisionChange(block.id, { mode: "accept", editedText: e.target.value })
                }
                rows={Math.min(10, Math.max(3, newText.split("\n").length + 1))}
                autoFocus
                aria-label="新しい文を修正"
                className="my-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm leading-relaxed outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                spellCheck={false}
              />
            ) : (
              !reverted &&
              (pureRemoval ? (
                <p className="my-1 text-[11px] text-muted-foreground">
                  （この段落は削除されます。復活させたい場合は「この変更をやめる」）
                </p>
              ) : (
                <div className="my-1 whitespace-pre-wrap rounded-md bg-emerald-50 px-2 py-1.5 text-sm leading-relaxed text-emerald-900">
                  <span className="mr-1 select-none text-[11px] font-bold">新しい:</span>
                  <SegmentedText
                    segments={editedText != null ? null : block.addedSegments}
                    fallback={newText}
                    changedClass="bg-emerald-200/90 text-emerald-950"
                  />
                </div>
              ))
            )}

            <ContextLines lines={block.contextAfter} />

            <div className="mt-2 flex items-center gap-2">
              {editing ? (
                <Button type="button" size="sm" variant="outline" onClick={() => setEditingId(null)}>
                  <Check className="size-3.5" aria-hidden />
                  修正を終える
                </Button>
              ) : reverted ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onDecisionChange(block.id, undefined)}
                >
                  <Undo2 className="size-3.5" aria-hidden />
                  やっぱりこの変更を使う
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingId(block.id)}
                  >
                    <Pencil className="size-3.5" aria-hidden />
                    新しい文を修正
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground"
                    onClick={() => {
                      setEditingId(null);
                      onDecisionChange(block.id, { mode: "revert", editedText: null });
                    }}
                  >
                    <Undo2 className="size-3.5" aria-hidden />
                    この変更をやめる
                  </Button>
                </>
              )}
              {!editing && editedText != null && !reverted && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground"
                  onClick={() => onDecisionChange(block.id, undefined)}
                >
                  修正を破棄
                </Button>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
