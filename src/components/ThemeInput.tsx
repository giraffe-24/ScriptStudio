"use client";

import { useState } from "react";
import type { ThemeCandidate, ThemePattern } from "@/lib/types";

interface Props {
  pattern: ThemePattern;
  onSelect: (candidate: ThemeCandidate) => void;
}

export function ThemeInput({ pattern, onSelect }: Props) {
  const [userTheme, setUserTheme] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<ThemeCandidate[]>([]);
  const [hasYouTubeData, setHasYouTubeData] = useState(false);

  async function handleResearch() {
    setLoading(true);
    setCandidates([]);
    try {
      if (pattern === "market") {
        const res = await fetch("/api/market-research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category }),
        });
        const data = await res.json();
        setCandidates(data.candidates ?? []);
        setHasYouTubeData(data.hasYouTubeData ?? false);
      } else {
        const res = await fetch("/api/adapt-theme", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ theme: userTheme }),
        });
        const data = await res.json();
        setCandidates(data.candidates ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  const SCORE_COLOR = {
    high: "bg-green-100 text-green-700 border-green-200",
    medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
    low: "bg-gray-100 text-gray-600 border-gray-200",
  };

  const SCORE_LABEL = { high: "刺さる", medium: "普通", low: "弱め" };

  return (
    <div className="space-y-4">
      {pattern === "market" ? (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            カテゴリ（空白でも OK）
          </label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="例：Gmail, Android, Google フォト"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            onKeyDown={(e) => e.key === "Enter" && handleResearch()}
          />
        </div>
      ) : (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            テーマを入力
          </label>
          <input
            type="text"
            value={userTheme}
            onChange={(e) => setUserTheme(e.target.value)}
            placeholder="例：LINEの通知をまとめて管理する方法"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            onKeyDown={(e) => e.key === "Enter" && handleResearch()}
          />
        </div>
      )}

      <button
        onClick={handleResearch}
        disabled={loading || (pattern === "user-input" && !userTheme.trim())}
        className={`w-full rounded-lg py-2.5 text-sm font-medium transition-all ${
          loading
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : pattern === "market"
            ? "bg-blue-500 text-white hover:bg-blue-600"
            : "bg-purple-500 text-white hover:bg-purple-600"
        }`}
      >
        {loading ? "AI が分析中…" : pattern === "market" ? "📊 トレンド分析する" : "✨ テーマを改変する"}
      </button>

      {candidates.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              テーマ候補
            </h3>
            {pattern === "market" && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${hasYouTubeData ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"}`}>
                {hasYouTubeData ? "YouTube API" : "AI 知識ベース"}
              </span>
            )}
          </div>
          {candidates.map((c, i) => (
            <div
              key={i}
              className="border border-gray-200 rounded-xl p-4 bg-white hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer group"
              onClick={() => onSelect(c)}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="text-sm font-semibold text-gray-800 leading-tight flex-1">
                  {c.title}
                </h4>
                <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full border font-medium ${SCORE_COLOR[c.score]}`}>
                  {SCORE_LABEL[c.score]}
                </span>
              </div>
              <p className="text-xs text-blue-600 italic mb-1 leading-relaxed">「{c.hook}」</p>
              <p className="text-xs text-gray-500 leading-relaxed">{c.targetPain}</p>
              <div className="mt-3 flex justify-end">
                <span className="text-xs text-blue-500 group-hover:text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  このテーマで企画書を作成 →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
