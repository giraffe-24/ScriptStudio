import type { DiffPreviewLine } from "@/lib/script-diff";
import { cn } from "@/lib/utils";

type Props = {
  lines: DiffPreviewLine[];
  maxHeightClass?: string;
};

const DIFF_LINE_LIMIT = 120;

export function ScriptDiffPreview({ lines, maxHeightClass = "max-h-48" }: Props) {
  const changed = lines.filter((l) => l.type !== "same");
  const visible = changed.slice(0, DIFF_LINE_LIMIT);
  const hiddenCount = changed.length - visible.length;
  if (visible.length === 0) {
    return <p className="text-xs text-muted-foreground">変更行はありません。</p>;
  }
  return (
    <div
      className={cn(
        "overflow-y-auto rounded-md border bg-muted/30 p-2 font-mono text-xs leading-relaxed",
        maxHeightClass,
      )}
    >
      {visible.map((line, i) => (
        <div
          key={i}
          className={
            line.type === "add"
              ? "bg-green-50 text-green-800"
              : line.type === "remove"
                ? "bg-red-50 text-red-700 line-through"
                : "text-muted-foreground"
          }
        >
          {line.type === "add" ? "+ " : line.type === "remove" ? "- " : "  "}
          {line.text || " "}
        </div>
      ))}
      {hiddenCount > 0 && (
        <div className="mt-1 border-t pt-1 text-center font-sans text-muted-foreground">
          ほか {hiddenCount.toLocaleString()} 行の変更
        </div>
      )}
    </div>
  );
}
