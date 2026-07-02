"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScriptDiffPreview } from "@/components/ScriptDiffPreview";
import { computeScriptDiff, formatDiffStats } from "@/lib/script-diff";
import type { ScriptSnapshot } from "@/lib/script-versions";
import { toUserMessage } from "@/lib/error-message";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  episodeTitle: string;
  episodeNumber: number;
  episodeSlug: string;
  onRestore: (content: string) => Promise<void>;
  /** 履歴 API のエンドポイント（既定: 台本） */
  endpoint?: string;
  /** 保存 content を表示・差分用テキストへ変換（既定: そのまま。企画書は JSON→整形テキスト） */
  renderContent?: (raw: string) => string;
  /** 全文・確認文言のラベル（既定: 台本） */
  contentLabel?: string;
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

function SnapshotDetail({
  snap,
  previousContent,
  isFirstRecord,
  renderContent,
  contentLabel,
}: {
  snap: ScriptSnapshot;
  previousContent: string;
  isFirstRecord: boolean;
  renderContent: (raw: string) => string;
  contentLabel: string;
}) {
  const [showFullContent, setShowFullContent] = useState(false);
  const currentText = renderContent(snap.content);

  if (isFirstRecord) {
    return (
      <div className="space-y-2 pt-1">
        <p className="text-xs text-muted-foreground">初回記録の{contentLabel}です。</p>
        <button
          type="button"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setShowFullContent((v) => !v)}
        >
          {showFullContent ? (
            <ChevronUp className="size-3.5" aria-hidden />
          ) : (
            <ChevronDown className="size-3.5" aria-hidden />
          )}
          {showFullContent ? `${contentLabel}全文を閉じる` : `${contentLabel}全文を見る`}
        </button>
        {showFullContent ? (
          <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-md border bg-muted/30 p-2 font-mono text-xs leading-relaxed">
            {currentText}
          </pre>
        ) : null}
      </div>
    );
  }

  const diff = computeScriptDiff(renderContent(previousContent), currentText);

  return (
    <div className="space-y-2 pt-1">
      <div className="space-y-1">
        <p className="text-xs font-medium text-foreground">この版での変更</p>
        <ScriptDiffPreview lines={diff.previewLines} maxHeightClass="max-h-56" />
      </div>
      <button
        type="button"
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        onClick={() => setShowFullContent((v) => !v)}
      >
        {showFullContent ? (
          <ChevronUp className="size-3.5" aria-hidden />
        ) : (
          <ChevronDown className="size-3.5" aria-hidden />
        )}
        {showFullContent ? `${contentLabel}全文を閉じる` : `${contentLabel}全文を見る`}
      </button>
      {showFullContent ? (
        <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-md border bg-muted/30 p-2 font-mono text-xs leading-relaxed">
          {currentText}
        </pre>
      ) : null}
    </div>
  );
}

export function HistoryModal({
  open,
  onOpenChange,
  episodeTitle,
  episodeNumber,
  episodeSlug,
  onRestore,
  endpoint = "/api/script-versions",
  renderContent = (raw) => raw,
  contentLabel = "台本",
}: Props) {
  const [snapshots, setSnapshots] = useState<ScriptSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError("");
    setConfirmId(null);
    setExpandedId(null);

    fetch(
      `${endpoint}?action=list&number=${episodeNumber}&slug=${encodeURIComponent(episodeSlug)}`,
    )
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "履歴の取得に失敗しました");
        setSnapshots(data.snapshots ?? []);
      })
      .catch((err) => {
        setError(toUserMessage(err));
        setSnapshots([]);
      })
      .finally(() => setLoading(false));
  }, [open, episodeNumber, episodeSlug, endpoint]);

  async function handleRestore(snapshot: ScriptSnapshot) {
    setRestoringId(snapshot.id);
    setError("");
    try {
      await onRestore(snapshot.content);
      onOpenChange(false);
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setRestoringId(null);
      setConfirmId(null);
    }
  }

  function toggleDetail(id: string) {
    setExpandedId((current) => (current === id ? null : id));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>変更履歴</DialogTitle>
          <DialogDescription>{episodeTitle}</DialogDescription>
        </DialogHeader>

        <div className="max-h-[min(28rem,70vh)] space-y-3 overflow-y-auto">
          {loading && <p className="text-xs text-muted-foreground">読み込み中…</p>}
          {!loading && snapshots.length === 0 && (
            <p className="text-xs text-muted-foreground">まだ保存された版がありません。</p>
          )}
          {snapshots.map((snap, index) => {
            const isFirstRecord = index === snapshots.length - 1;
            const isExpanded = expandedId === snap.id;
            const previousContent = snapshots[index + 1]?.content ?? "";

            return (
              <div
                key={snap.id}
                className="rounded-lg border bg-card p-3 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium">
                      [{snap.authorName}] {formatDate(snap.createdAt)}
                    </p>
                    {isFirstRecord && (
                      <span className="mt-1 inline-block rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground">
                        初回記録
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-foreground">{snap.summary}</p>
                {snap.diffStats && (
                  <p className="text-xs text-muted-foreground">
                    {formatDiffStats(snap.diffStats)}
                  </p>
                )}

                <button
                  type="button"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => toggleDetail(snap.id)}
                  aria-expanded={isExpanded}
                >
                  {isExpanded ? (
                    <ChevronUp className="size-3.5" aria-hidden />
                  ) : (
                    <ChevronDown className="size-3.5" aria-hidden />
                  )}
                  {isExpanded ? "詳細を閉じる" : "詳細を見る"}
                </button>

                {isExpanded ? (
                  <SnapshotDetail
                    snap={snap}
                    previousContent={previousContent}
                    isFirstRecord={isFirstRecord}
                    renderContent={renderContent}
                    contentLabel={contentLabel}
                  />
                ) : null}

                {confirmId === snap.id ? (
                  <div className="flex items-center gap-2 pt-1">
                    <p className="text-xs text-destructive flex-1">
                      現在の内容をこの版で置き換えます。よろしいですか？
                    </p>
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
            );
          })}
        </div>

        {error ? (
          <p className="text-xs text-destructive" role="alert">
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
