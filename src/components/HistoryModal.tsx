"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatDiffStats } from "@/lib/script-diff";
import type { ScriptSnapshot } from "@/lib/script-versions";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  episodeTitle: string;
  episodeNumber: number;
  episodeSlug: string;
  onRestore: (content: string) => Promise<void>;
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ja-JP", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function HistoryModal({
  open,
  onOpenChange,
  episodeTitle,
  episodeNumber,
  episodeSlug,
  onRestore,
}: Props) {
  const [snapshots, setSnapshots] = useState<ScriptSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError("");
    setConfirmId(null);

    fetch(
      `/api/script-versions?action=list&number=${episodeNumber}&slug=${encodeURIComponent(episodeSlug)}`,
    )
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "履歴の取得に失敗しました");
        setSnapshots(data.snapshots ?? []);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : String(err));
        setSnapshots([]);
      })
      .finally(() => setLoading(false));
  }, [open, episodeNumber, episodeSlug]);

  async function handleRestore(snapshot: ScriptSnapshot) {
    setRestoringId(snapshot.id);
    setError("");
    try {
      await onRestore(snapshot.content);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRestoringId(null);
      setConfirmId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>変更履歴</DialogTitle>
          <DialogDescription>{episodeTitle}</DialogDescription>
        </DialogHeader>

        <div className="max-h-80 space-y-3 overflow-y-auto">
          {loading && <p className="text-xs text-muted-foreground">読み込み中…</p>}
          {!loading && snapshots.length === 0 && (
            <p className="text-xs text-muted-foreground">まだ記録がありません。</p>
          )}
          {snapshots.map((snap, index) => (
            <div
              key={snap.id}
              className="rounded-lg border bg-card p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium">
                    [{snap.authorName}] {formatDate(snap.createdAt)}
                  </p>
                  {index === snapshots.length - 1 && (
                    <span className="mt-1 inline-block rounded bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-700">
                      初回記録
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-foreground">{snap.summary}</p>
              {snap.diffStats && (
                <p className="text-[10px] text-muted-foreground">
                  {formatDiffStats(snap.diffStats)}
                </p>
              )}
              {confirmId === snap.id ? (
                <div className="flex items-center gap-2 pt-1">
                  <p className="text-xs text-amber-700 flex-1">この版に戻しますか？</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setConfirmId(null)}
                    disabled={restoringId === snap.id}
                  >
                    取消
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => void handleRestore(snap)}
                    disabled={restoringId === snap.id}
                  >
                    {restoringId === snap.id ? "復元中…" : "確定"}
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setConfirmId(snap.id)}
                  disabled={!!restoringId}
                >
                  この版に戻す
                </Button>
              )}
            </div>
          ))}
        </div>

        {error ? (
          <p className="text-xs text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            閉じる
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
