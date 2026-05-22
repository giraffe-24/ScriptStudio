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
  refreshKey?: number;
}

export function EpisodeList({ selectedId, onSelect, refreshKey }: Props) {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/files?action=list")
      .then((r) => r.json())
      .then((d) => setEpisodes(d.episodes ?? []))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  function toggleOpen(id: string) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="px-3 py-3 border-b border-gray-200">
        <h1 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          Episodes
        </h1>
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
            const isOpen = openId === ep.id;

            return (
              <div
                key={ep.id}
                className={`border-l-2 transition-colors ${
                  isSelected ? "border-blue-500 bg-white" : "border-transparent"
                }`}
              >
                {/* タイトル行（クリックで選択 + アコーディオン） */}
                <button
                  onClick={() => {
                    onSelect(ep);
                    toggleOpen(ep.id);
                  }}
                  className="w-full text-left px-3 py-2.5 flex items-start justify-between gap-2 hover:bg-white transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] text-gray-400 font-mono shrink-0">#{ep.number}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${
                          STATUS_COLOR[ep.status] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {STATUS_LABEL[ep.status] ?? ep.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-800 leading-snug line-clamp-2">
                      {ep.title}
                    </p>
                  </div>
                  <span className={`text-gray-400 text-[10px] mt-1 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                    ▾
                  </span>
                </button>

                {/* アコーディオン本体 */}
                {isOpen && (ep.hook || ep.targetPain || ep.reason) && (
                  <div className="px-3 pb-3 space-y-2 border-t border-gray-100 pt-2 bg-white">
                    {ep.hook && (
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">フック</p>
                        <p className="text-xs text-blue-600 italic leading-relaxed">「{ep.hook}」</p>
                      </div>
                    )}
                    {ep.targetPain && (
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">視聴者の悩み</p>
                        <p className="text-xs text-gray-600 leading-relaxed">{ep.targetPain}</p>
                      </div>
                    )}
                    {ep.reason && (
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">選定理由</p>
                        <p className="text-xs text-gray-500 leading-relaxed">{ep.reason}</p>
                      </div>
                    )}
                    {ep.createdAt && (
                      <p className="text-[10px] text-gray-300 pt-1">{ep.createdAt}</p>
                    )}
                  </div>
                )}

                {/* hook/pain/reason がない既存エピソードは日付だけ */}
                {isOpen && !ep.hook && !ep.targetPain && !ep.reason && (
                  <div className="px-3 pb-2 bg-white border-t border-gray-100 pt-2">
                    <p className="text-[10px] text-gray-400">
                      {ep.createdAt || "詳細情報なし"}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
