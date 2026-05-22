"use client";

import { useState } from "react";
import type { ThemeCandidate, ThemePattern } from "@/lib/types";

interface Props {
  pattern: ThemePattern;
  onSelect: (candidate: ThemeCandidate) => void;
}

const SCORE_BORDER = {
  high: "border-green-300",
  medium: "border-yellow-300",
  low: "border-gray-200",
};

const SCORE_BG = {
  high: "bg-green-50",
  medium: "bg-yellow-50",
  low: "bg-gray-50",
};

const SCORE_BADGE = {
  high: "bg-green-100 text-green-700 border-green-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-gray-100 text-gray-600 border-gray-200",
};

const SCORE_LABEL = { high: "刺さる", medium: "普通", low: "弱め" };

export function ThemeInput({ pattern, onSelect }: Props) {
  const [userTheme, setUserTheme] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<ThemeCandidate[]>([]);
  const [hasYouTubeData, setHasYouTubeData] = useState(false);

  // 「選択中」の候補（まだ確定していない）
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);

  async function handleResearch() {
    setLoading(true);
    setCandidates([]);
    setPickedIndex(null);
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

  function handleConfirm() {
    if (pickedIndex === null) return;
    onSelect(candidates[pickedIndex]);
  }

  return (
    <div className="space-y-4">
      {/* 入力エリア */}
      {pattern === "market" ? (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
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
          <label className="block text-xs font-medium text-gray-500 mb-1">
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
        {loading
          ? "AI が分析中…"
          : pattern === "market"
          ? "📊 トレンド分析する"
          : "✨ テーマを改変する"}
      </button>

      {/* 候補リスト */}
      {candidates.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              テーマ候補
            </h3>
            {pattern === "market" && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full ${
                  hasYouTubeData
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {hasYouTubeData ? "YouTube API" : "AI 知識ベース"}
              </span>
            )}
          </div>

          {candidates.map((c, i) => {
            const isPicked = pickedIndex === i;
            return (
              <div
                key={i}
                onClick={() => setPickedIndex(i)}
                className={`border-2 rounded-xl p-3 cursor-pointer transition-all ${
                  isPicked
                    ? `${SCORE_BORDER[c.score]} ${SCORE_BG[c.score]} shadow-sm`
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h4 className="text-sm font-semibold text-gray-800 leading-tight flex-1">
                    {c.title}
                  </h4>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${
                        SCORE_BADGE[c.score]
                      }`}
                    >
                      {SCORE_LABEL[c.score]}
                    </span>
                    {isPicked && (
                      <span className="text-blue-500 text-sm">✓</span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-blue-600 italic leading-relaxed mb-1">
                  「{c.hook}」
                </p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {c.targetPain}
                </p>
              </div>
            );
          })}

          {/* 確定ボタン */}
          <div className="pt-1">
            <button
              onClick={handleConfirm}
              disabled={pickedIndex === null}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                pickedIndex !== null
                  ? "bg-blue-500 text-white hover:bg-blue-600 shadow-sm active:scale-[0.98]"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              {pickedIndex !== null
                ? "企画書を作成する →"
                : "候補を選んでください"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
