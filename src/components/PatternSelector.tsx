"use client";

import type { ThemePattern } from "@/lib/types";

interface Props {
  pattern: ThemePattern | null;
  onChange: (pattern: ThemePattern) => void;
}

const PATTERNS: {
  id: ThemePattern;
  icon: string;
  title: string;
  description: string;
}[] = [
  {
    id: "market",
    icon: "📊",
    title: "市場分析",
    description: "トレンドから今のネタを探す",
  },
  {
    id: "user-input",
    icon: "✏️",
    title: "テーマ分析",
    description: "決めたテーマを深掘りする",
  },
];

export function PatternSelector({ pattern, onChange }: Props) {
  return (
    <div role="radiogroup" aria-label="分析モードを選択" className="flex gap-2">
      {PATTERNS.map((p) => {
        const selected = pattern === p.id;
        return (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(p.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 rounded-lg py-2.5 px-2 text-center border-2 transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-ring ${
              selected
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-background text-muted-foreground hover:border-foreground/30"
            }`}
          >
            <span className="flex items-center gap-1.5 text-sm font-medium">
              <span aria-hidden>{p.icon}</span>
              <span>{p.title}</span>
            </span>
            <span className="text-xs text-muted-foreground leading-snug">
              {p.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
