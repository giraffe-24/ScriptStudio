"use client";

import { useMemo, useState } from "react";
import { PanelLeftClose, RefreshCw } from "lucide-react";
import type { Episode, EpisodeStatus } from "@/lib/types";
import { useReadOnly } from "@/lib/useViewerRole";
import { toUserMessage } from "@/lib/error-message";
import {
  EPISODE_STATUSES,
  STATUS_COLOR,
  STATUS_LABEL,
  effectiveDisplayStatus,
  showUnrevisedBadge,
  UNREVISED_BADGE,
} from "@/lib/episode-status";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  episodes: Episode[];
  loading: boolean;
  onRefresh: () => void;
  selectedId: string | null;
  selectedSlug?: string | null;
  titleOverride?: { slug: string; title: string };
  numberOverride?: { slug: string; number: number };
  statusOverride?: { slug: string; status: EpisodeStatus };
  onSelect: (episode: Episode) => void;
  onStatusChange?: (episode: Episode, status: EpisodeStatus) => void;
  onDeleted?: (deletedSlugs: string[]) => void;
  /** 指定時、ヘッダーに「たたむ」ボタンを表示する（PC のペイン開閉用） */
  onCollapse?: () => void;
}

export function EpisodeList({
  episodes,
  loading,
  onRefresh,
  selectedId,
  selectedSlug,
  titleOverride,
  numberOverride,
  statusOverride,
  onSelect,
  onStatusChange,
  onDeleted,
  onCollapse,
}: Props) {
  // 閲覧専用ログインでは削除の導線を出さない（サーバー側でも 403 で遮断される）
  const viewerReadOnly = useReadOnly();
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  // 削除の部分失敗など、ダイアログを閉じた後に出す軽い通知（window.alert の置き換え）
  const [notice, setNotice] = useState("");

  const selectedEpisodes = useMemo(
    () => episodes.filter((ep) => selectedSlugs.has(ep.slug)),
    [episodes, selectedSlugs],
  );

  function exitDeleteMode() {
    setDeleteMode(false);
    setSelectedSlugs(new Set());
    setDeleteError("");
  }

  function toggleEpisodeSelection(slug: string) {
    setSelectedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  async function handleDeleteConfirmed() {
    if (selectedEpisodes.length === 0) return;

    setDeleting(true);
    setDeleteError("");

    try {
      const res = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          mode: "archive",
          episodes: selectedEpisodes.map((ep) => ({
            number: ep.number,
            slug: ep.slug,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "削除に失敗しました");

      const deletedSlugs = (data.deleted ?? []).map(
        (item: { slug: string }) => item.slug,
      );
      const errors = data.errors ?? [];

      if (deletedSlugs.length === 0) {
        const firstError = errors[0]?.error ?? "削除できませんでした";
        throw new Error(firstError);
      }

      onDeleted?.(deletedSlugs);
      setConfirmOpen(false);
      exitDeleteMode();

      if (errors.length > 0) {
        setNotice(
          `${deletedSlugs.length} 件を削除しました。${errors.length} 件は失敗しました。`,
        );
      }
    } catch (err) {
      setDeleteError(toUserMessage(err, "削除に失敗しました。少し時間をおいて、もう一度お試しください。"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="h-[52px] px-3 border-b border-gray-200 flex items-center justify-between gap-2">
        <h1 className="text-sm font-semibold text-gray-700 shrink-0">エピソード</h1>
        <div className="flex items-center gap-1.5 min-w-0">
          {onCollapse && (
            <button
              type="button"
              onClick={onCollapse}
              title="エピソード一覧をたたむ"
              aria-label="エピソード一覧をたたむ"
              aria-expanded={true}
              aria-controls="episode-pane"
              className="p-1 rounded-md border border-gray-200 bg-white text-gray-400 hover:text-gray-600 hover:bg-gray-50 outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <PanelLeftClose className="size-3.5" />
            </button>
          )}
          {deleteMode ? (
            <>
              <span className="text-[10px] text-gray-500 truncate">
                {selectedSlugs.size}件
              </span>
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                disabled={selectedSlugs.size === 0}
                className="shrink-0 whitespace-nowrap text-[10px] px-2 py-1 rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                削除する
              </button>
              <button
                type="button"
                onClick={exitDeleteMode}
                className="shrink-0 whitespace-nowrap text-[10px] px-2 py-1 rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              >
                取消
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onRefresh}
                disabled={loading}
                title="一覧を再読み込み"
                aria-label="一覧を再読み込み"
                className="p-1 rounded-md border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
              {episodes.length > 0 && !viewerReadOnly && (
                <button
                  type="button"
                  onClick={() => setDeleteMode(true)}
                  className="shrink-0 whitespace-nowrap text-[10px] px-2 py-1 rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                >
                  削除
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {notice ? (
        <div
          role="status"
          className="mx-2 mt-2 flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-2 py-1.5 text-xs text-amber-800"
        >
          <span className="min-w-0 flex-1">{notice}</span>
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="閉じる"
            className="shrink-0 text-amber-700 hover:text-amber-900 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded"
          >
            ×
          </button>
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto py-1">
        {loading && episodes.length === 0 ? (
          <div className="px-3 py-4 text-xs text-gray-400 animate-pulse">読み込み中…</div>
        ) : episodes.length === 0 ? (
          <div className="px-3 py-4 text-xs text-gray-400">
            まだエピソードがありません
          </div>
        ) : (
          episodes.map((ep) => {
            const isSelected = ep.id === selectedId || (!!selectedSlug && ep.slug === selectedSlug);
            const isChecked = selectedSlugs.has(ep.slug);

            const displayTitle =
              titleOverride?.slug === ep.slug ? titleOverride.title : ep.title;

            const displayNumber =
              numberOverride?.slug === ep.slug ? numberOverride.number : ep.number;

            const hasScriptDraft = ep.hasScriptDraft ?? false;
            const rawStatus =
              statusOverride?.slug === ep.slug ? statusOverride.status : ep.status;
            const hasRevision = ep.hasRevision ?? false;
            const displayStatus = effectiveDisplayStatus(rawStatus, hasRevision);
            const showUnrevised = showUnrevisedBadge(rawStatus, hasRevision);

            return (
              <div
                key={ep.slug}
                className={`border-l-2 transition-colors ${
                  !deleteMode && isSelected
                    ? "border-blue-500 bg-blue-50"
                    : deleteMode && isChecked
                      ? "border-red-400 bg-red-50/70"
                      : "border-transparent hover:bg-white"
                }`}
              >
                <div className="flex items-start">
                  {deleteMode && (
                    <label className="flex items-center px-2 py-3 shrink-0 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleEpisodeSelection(ep.slug)}
                        className="size-3.5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                        aria-label={`#${displayNumber} ${displayTitle} を削除対象にする`}
                      />
                    </label>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (deleteMode) {
                        toggleEpisodeSelection(ep.slug);
                        return;
                      }
                      onSelect(ep);
                    }}
                    className="flex-1 text-left px-3 py-2.5 transition-colors min-w-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset rounded-sm"
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span
                        className={`text-[10px] font-mono shrink-0 ${
                          !deleteMode && isSelected ? "text-blue-500" : "text-gray-400"
                        }`}
                      >
                        #{displayNumber}
                      </span>
                      {ep.createdAt && (
                        <span className="text-[10px] text-gray-500 shrink-0">{ep.createdAt}</span>
                      )}
                      {!deleteMode && (
                        <>
                          {hasScriptDraft ? (
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
                          ) : (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLOR.planning}`}
                            >
                              {STATUS_LABEL.planning}
                            </span>
                          )}
                          {showUnrevised && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${UNREVISED_BADGE}`}
                            >
                              未推敲
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    <p
                      className={`text-xs leading-snug line-clamp-2 ${
                        !deleteMode && isSelected
                          ? "text-blue-700 font-medium"
                          : "text-gray-800"
                      }`}
                    >
                      {displayTitle}
                    </p>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>エピソードを削除</DialogTitle>
            <DialogDescription>
              {selectedEpisodes.length} 件を没フォルダへ移動します。一覧からは非表示になります。
            </DialogDescription>
          </DialogHeader>

          <ul className="max-h-40 overflow-y-auto space-y-1 text-xs text-foreground">
            {selectedEpisodes.map((ep) => (
              <li key={ep.slug} className="rounded border bg-muted/30 px-2 py-1.5">
                <span className="font-mono text-muted-foreground">#{ep.number}</span>{" "}
                {titleOverride?.slug === ep.slug ? titleOverride.title : ep.title}
              </li>
            ))}
          </ul>

          {deleteError ? (
            <p className="text-xs text-red-600" role="alert">
              {deleteError}
            </p>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={deleting}>
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDeleteConfirmed()}
              disabled={deleting}
            >
              {deleting ? "削除中…" : "削除する"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
