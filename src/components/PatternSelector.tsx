"use client";

import type { ThemePattern } from "@/lib/types";

interface Props {
  pattern: ThemePattern;
  onChange: (pattern: ThemePattern) => void;
}

export function PatternSelector({ pattern, onChange }: Props) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onChange("market")}
        className={`flex-1 rounded-xl p-4 text-left border-2 transition-all ${
          pattern === "market"
            ? "border-blue-500 bg-blue-50"
            : "border-gray-200 bg-white hover:border-gray-300"
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">📊</span>
          <span className="font-semibold text-sm text-gray-800">パターン 1：市場起点</span>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          YouTube のトレンドを自動取得してチャンネルに合ったテーマを提案
        </p>
      </button>
      <button
        onClick={() => onChange("user-input")}
        className={`flex-1 rounded-xl p-4 text-left border-2 transition-all ${
          pattern === "user-input"
            ? "border-purple-500 bg-purple-50"
            : "border-gray-200 bg-white hover:border-gray-300"
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">✏️</span>
          <span className="font-semibold text-sm text-gray-800">パターン 2：テーマ起点</span>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          テーマを入力すると AI がチャンネルに最適な切り口に改変
        </p>
      </button>
    </div>
  );
}
