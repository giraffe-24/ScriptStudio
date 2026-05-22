"use client";

import { useEffect, useState } from "react";
import type { Episode } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  planning: "企画中",
  scripting: "執筆中",
  review: "確認中",
  done: "完了",
};

const STATUS_COLOR: Record<string, string> = {
  planning: "bg-yellow-100 text-yellow-700",
  scripting: "bg-blue-100 text-blue-700",
  review: "bg-purple-100 text-purple-700",
  done: "bg-green-100 text-green-700",
};

interface Props {
  selectedId: string | null;
  titleOverride?: { id: string; title: string };
  onSelect: (episode: Episode) => void;
  refreshKey?: number;
}

export function EpisodeList({ selectedId, titleOverride, onSelect, refreshKey }: Props) {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/files?action=list")
      .then((r) => r.json())
      .then((d) => setEpisodes(d.episodes ?? []))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="h-[52px] px-4 border-b border-gray-200 flex items-center">
        <h1 className="text-sm font-semibold text-gray-700">エピソード</h1>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {loading ? (
          <div className="px-3 py-4 text-xs text-gray-400 animate-pulse">読み込み中…</div>
        ) : episodes.length === 0 ? (
          <div className="px-3 py-4 text-xs text-gray-400">
            まだエピソードがありません
          </div>
        ) : (
          episodes.map((ep) => {
            const isSelected = ep.id === selectedId;

            const displayTitle =
              titleOverride?.id === ep.id ? titleOverride.title : ep.title;

            return (
              <div
                key={ep.id}
                className={`border-l-2 transition-colors ${
                  isSelected
                    ? "border-blue-500 bg-blue-50"
                    : "border-transparent hover:bg-white"
                }`}
              >
                {/* タイトル行 */}
                <button
                  onClick={() => onSelect(ep)}
                  className="w-full text-left px-3 py-2.5 transition-colors"
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`text-[10px] font-mono shrink-0 ${isSelected ? "text-blue-500" : "text-gray-400"}`}>
                      #{ep.number}
                    </span>
                    {ep.createdAt && (
                      <span className="text-[10px] text-gray-300 shrink-0">{ep.createdAt}</span>
                    )}
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${
                        STATUS_COLOR[ep.status] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {STATUS_LABEL[ep.status] ?? ep.status}
                    </span>
                  </div>
                  <p className={`text-xs leading-snug line-clamp-2 ${isSelected ? "text-blue-700 font-medium" : "text-gray-800"}`}>
                    {displayTitle}
                  </p>
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
