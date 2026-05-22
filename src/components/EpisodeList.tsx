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
  onSelect: (episode: Episode) => void;
  onNew: () => void;
  refreshKey?: number;
}

export function EpisodeList({ selectedId, onSelect, onNew, refreshKey }: Props) {
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
      <div className="px-3 py-3 border-b border-gray-200">
        <h1 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
          YT_TALKSCRIPT
        </h1>
        <button
          onClick={onNew}
          className="w-full text-sm bg-blue-500 text-white rounded-lg py-2 hover:bg-blue-600 transition-colors font-medium"
        >
          ＋ 新しい企画
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {loading ? (
          <div className="px-3 py-4 text-xs text-gray-400 animate-pulse">読み込み中…</div>
        ) : episodes.length === 0 ? (
          <div className="px-3 py-4 text-xs text-gray-400">
            まだエピソードがありません
          </div>
        ) : (
          episodes.map((ep) => (
            <button
              key={ep.id}
              onClick={() => onSelect(ep)}
              className={`w-full text-left px-3 py-3 border-l-2 transition-colors ${
                ep.id === selectedId
                  ? "border-blue-500 bg-white"
                  : "border-transparent hover:bg-white"
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="text-xs text-gray-400 font-mono">#{ep.number}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    STATUS_COLOR[ep.status] ?? "bg-gray-100 text-gray-600"
                  }`}
                >
                  {STATUS_LABEL[ep.status] ?? ep.status}
                </span>
              </div>
              <div className="text-sm text-gray-800 leading-tight line-clamp-2">
                {ep.title}
              </div>
              {ep.createdAt && (
                <div className="text-xs text-gray-400 mt-1">{ep.createdAt}</div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
