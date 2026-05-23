"use client";

import { useEffect, useState } from "react";
import type { Episode, EpisodeStatus } from "@/lib/types";
import {
  EPISODE_STATUSES,
  STATUS_COLOR,
  STATUS_LABEL,
  effectiveDisplayStatus,
  showUnrevisedBadge,
  UNREVISED_BADGE,
} from "@/lib/episode-status";
import { sortEpisodesByNumberDesc } from "@/lib/episode-sort";

interface Props {
  selectedId: string | null;
  selectedSlug?: string | null;
  titleOverride?: { slug: string; title: string };
  numberOverride?: { slug: string; number: number };
  statusOverride?: { slug: string; status: EpisodeStatus };
  onSelect: (episode: Episode) => void;
  onStatusChange?: (episode: Episode, status: EpisodeStatus) => void;
  refreshKey?: number;
}

export function EpisodeList({
  selectedId,
  selectedSlug,
  titleOverride,
  numberOverride,
  statusOverride,
  onSelect,
  onStatusChange,
  refreshKey,
}: Props) {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/files?action=list")
      .then((r) => r.json())
      .then((d) => setEpisodes(sortEpisodesByNumberDesc(d.episodes ?? [])))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  useEffect(() => {
    if (!numberOverride) return;
    setEpisodes((prev) =>
      sortEpisodesByNumberDesc(
        prev.map((ep) =>
          ep.slug === numberOverride.slug
            ? { ...ep, number: numberOverride.number, id: String(numberOverride.number) }
            : ep,
        ),
      ),
    );
  }, [numberOverride]);

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
            const isSelected = ep.id === selectedId || (!!selectedSlug && ep.slug === selectedSlug);

            const displayTitle =
              titleOverride?.slug === ep.slug ? titleOverride.title : ep.title;

            const displayNumber =
              numberOverride?.slug === ep.slug ? numberOverride.number : ep.number;

            const rawStatus =
              statusOverride?.slug === ep.slug ? statusOverride.status : ep.status;
            const hasRevision = ep.hasRevision ?? false;
            const displayStatus = effectiveDisplayStatus(rawStatus, hasRevision);
            const showUnrevised = showUnrevisedBadge(rawStatus, hasRevision);

            return (
              <div
                key={ep.slug}
                className={`border-l-2 transition-colors ${
                  isSelected
                    ? "border-blue-500 bg-blue-50"
                    : "border-transparent hover:bg-white"
                }`}
              >
                <button
                  onClick={() => onSelect(ep)}
                  className="w-full text-left px-3 py-2.5 transition-colors"
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`text-[10px] font-mono shrink-0 ${isSelected ? "text-blue-500" : "text-gray-400"}`}>
                      #{displayNumber}
                    </span>
                    {ep.createdAt && (
                      <span className="text-[10px] text-gray-300 shrink-0">{ep.createdAt}</span>
                    )}
                    <select
                      value={displayStatus}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        e.stopPropagation();
                        onStatusChange?.(ep, e.target.value as EpisodeStatus);
                      }}
                      aria-label="ステータスを変更"
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 border-0 cursor-pointer appearance-none text-center ${STATUS_COLOR[displayStatus]}`}
                    >
                      {EPISODE_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {STATUS_LABEL[status]}
                        </option>
                      ))}
                    </select>
                    {showUnrevised && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${UNREVISED_BADGE}`}
                      >
                        未推敲
                      </span>
                    )}
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
