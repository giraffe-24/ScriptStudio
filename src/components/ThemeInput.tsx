"use client";

import { useState } from "react";
import type { ThemeCandidate, ThemePattern } from "@/lib/types";

interface Props {
  pattern: ThemePattern;
  onSelect: (candidate: ThemeCandidate) => void;
}

const SCORE_BORDER = {
  high: "border-blue-300",
  medium: "border-yellow-300",
  low: "border-gray-200",
};

const SCORE_BG = {
  high: "bg-blue-50",
  medium: "bg-yellow-50",
  low: "bg-gray-50",
};

const SCORE_BADGE = {
  high: "bg-blue-100 text-blue-700 border-blue-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-gray-100 text-gray-500 border-gray-200",
};

// high: 積極的に採用を推奨 / medium: 標準的な候補 / low: 参考程度・再検討余地あり
const SCORE_LABEL = { high: "推奨", medium: "普通", low: "要検討" };

export function ThemeInput({ pattern, onSelect }: Props) {
  const [userTheme, setUserTheme] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<ThemeCandidate[]>([]);
  const [hasYouTubeData, setHasYouTubeData] = useState(false);

  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  // アコーディオンで開いている候補のインデックス（複数可）
  const [openIndexes, setOpenIndexes] = useState<Set<number>>(new Set());

  function toggleOpen(i: number) {
    setOpenIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  async function handleResearch() {
    setLoading(true);
    setCandidates([]);
    setPickedIndex(null);
    setOpenIndexes(new Set());
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
            const isOpen = openIndexes.has(i);
            return (
              <div
                key={i}
                className={`border-2 rounded-xl overflow-hidden transition-all ${
                  isPicked
                    ? `${SCORE_BORDER[c.score]} ${SCORE_BG[c.score]} shadow-sm`
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                {/* タイトル行：選択 + アコーディオン開閉 */}
                <div className="flex items-start gap-2 p-3">
                  <button
                    onClick={() => setPickedIndex(i)}
                    className="flex-1 text-left"
                  >
                    <span className="text-xs text-gray-700 leading-snug">
                      {c.title}
                    </span>
                  </button>
                  <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${
                        SCORE_BADGE[c.score]
                      }`}
                    >
                      {SCORE_LABEL[c.score]}
                    </span>
                    {/* アコーディオントグル */}
                    <button
                      onClick={() => toggleOpen(i)}
                      className="text-gray-400 hover:text-gray-600 text-xs leading-none w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
                      aria-label="詳細を表示"
                    >
                      <span className={`inline-block transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                        ▾
                      </span>
                    </button>
                  </div>
                </div>

                {/* アコーディオン本体 */}
                {isOpen && (
                  <div className="border-t border-gray-100 px-3 pb-3 pt-2 space-y-2.5 bg-white bg-opacity-60">
                    {/* フック（青） */}
                    <div>
                      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">
                        フック
                      </p>
                      <p className="text-xs text-blue-600 italic leading-relaxed">
                        「{c.hook}」
                      </p>
                    </div>
                    {/* 視聴者の悩み（黒） */}
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                        視聴者の悩み
                      </p>
                      <p className="text-xs text-gray-700 leading-relaxed">
                        {c.targetPain}
                      </p>
                    </div>
                    {/* 選定理由 */}
                    {c.reason && (
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                          選定理由
                        </p>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          {c.reason}
                        </p>
                      </div>
                    )}
                  </div>
                )}
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
