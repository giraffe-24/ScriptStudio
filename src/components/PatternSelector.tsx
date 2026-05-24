"use client";

import type { ThemePattern } from "@/lib/types";

interface Props {
  pattern: ThemePattern | null;
  onChange: (pattern: ThemePattern) => void;
}

export function PatternSelector({ pattern, onChange }: Props) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onChange("market")}
        className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium border-2 transition-all ${
          pattern === "market"
            ? "border-blue-500 bg-blue-50 text-blue-700"
            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
        }`}
      >
        <span>📊</span>
        <span>市場分析</span>
      </button>
      <button
        onClick={() => onChange("user-input")}
        className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium border-2 transition-all ${
          pattern === "user-input"
            ? "border-purple-500 bg-purple-50 text-purple-700"
            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
        }`}
      >
        <span>✏️</span>
        <span>テーマ分析</span>
      </button>
    </div>
  );
}
