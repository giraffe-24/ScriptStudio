import type { DiffPreviewLine } from "@/lib/script-diff";
import { cn } from "@/lib/utils";

type Props = {
  lines: DiffPreviewLine[];
  maxHeightClass?: string;
};

export function ScriptDiffPreview({ lines, maxHeightClass = "max-h-48" }: Props) {
  const visible = lines.filter((l) => l.type !== "same").slice(0, 120);
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
    </div>
  );
}
