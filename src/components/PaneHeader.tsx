import { cn } from "@/lib/utils";

interface Props {
  title: string;
  className?: string;
  action?: React.ReactNode;
}

export function PaneHeader({ title, className, action }: Props) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-between border-b border-border px-3 py-2.5",
        className
      )}
    >
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {title}
      </span>
      {action}
    </div>
  );
}
