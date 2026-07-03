"use client";

import { useEffect, useRef, useState } from "react";
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

/**
 * 履歴の取得元（企画書・台本など）。複数指定すると 1 つのタイムラインに
 * 時系列で混ぜて表示し、各項目はラベルのバッジで見分ける。
 */
export type HistorySource = {
  key: string;
  /** list を提供する API（例: /api/plan-versions） */
  endpoint: string;
  /** バッジ・全文・確認文言に使うラベル（例: 企画書） */
  label: string;
  /** バッジの配色クラス */
  badgeClass: string;
  /** 保存 content を表示・差分用テキストへ変換（既定: そのまま。企画書は JSON→整形テキスト） */
  renderContent?: (raw: string) => string;
  onRestore: (content: string) => Promise<void>;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  episodeTitle: string;
  episodeNumber: number;
  episodeSlug: string;
  sources: HistorySource[];
};

/** 企画書スナップショットは diffStats を持たないため optional で受ける */
type HistoryEntry = Omit<ScriptSnapshot, "diffStats"> & {
  diffStats?: ScriptSnapshot["diffStats"] | null;
  sourceKey: string;
};

/** id はソースをまたぐと重複しうるため、ソースキーを含めて一意にする */
function entryId(entry: HistoryEntry): string {
  return `${entry.sourceKey}:${entry.id}`;
}

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
  entry,
  previousContent,
  isFirstRecord,
  renderContent,
  contentLabel,
}: {
  entry: HistoryEntry;
  previousContent: string;
  isFirstRecord: boolean;
  renderContent: (raw: string) => string;
  contentLabel: string;
}) {
  const [showFullContent, setShowFullContent] = useState(false);
  const currentText = renderContent(entry.content);

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
  sources,
}: Props) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // sources は呼び出し側で毎レンダー新しい配列になるため、取得エフェクトの
  // 依存に直接入れず ref 経由で参照する（無限リフェッチを防ぐ）。
  const sourcesRef = useRef(sources);
  useEffect(() => {
    sourcesRef.current = sources;
  });

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError("");
    setConfirmId(null);
    setExpandedId(null);

    let cancelled = false;
    void (async () => {
      const results = await Promise.allSettled(
        sourcesRef.current.map(async (source) => {
          const res = await fetch(
            `${source.endpoint}?action=list&number=${episodeNumber}&slug=${encodeURIComponent(episodeSlug)}`,
          );
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? `${source.label}の履歴の取得に失敗しました`);
          return ((data.snapshots ?? []) as ScriptSnapshot[]).map((snap) => ({
            ...snap,
            sourceKey: source.key,
          }));
        }),
      );
      if (cancelled) return;
      const loaded = results
        .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      setEntries(loaded);
      const failed = results.find((r) => r.status === "rejected");
      if (failed && failed.status === "rejected") setError(toUserMessage(failed.reason));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, episodeNumber, episodeSlug]);

  async function handleRestore(entry: HistoryEntry) {
    const source = sources.find((s) => s.key === entry.sourceKey);
    if (!source) return;
    setRestoringId(entryId(entry));
    setError("");
    try {
      await source.onRestore(entry.content);
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
          <DialogDescription>
            {episodeTitle}（{sources.map((s) => s.label).join("・")}の保存版を時系列で表示）
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[min(28rem,70vh)] space-y-3 overflow-y-auto">
          {loading && <p className="text-xs text-muted-foreground">読み込み中…</p>}
          {!loading && entries.length === 0 && (
            <p className="text-xs text-muted-foreground">まだ保存された版がありません。</p>
          )}
          {entries.map((entry, index) => {
            const id = entryId(entry);
            const source = sources.find((s) => s.key === entry.sourceKey);
            const label = source?.label ?? entry.sourceKey;
            const renderContent = source?.renderContent ?? ((raw: string) => raw);
            // 差分は「同じソースのひとつ前の版」と比較する
            const previous = entries
              .slice(index + 1)
              .find((e) => e.sourceKey === entry.sourceKey);
            const isFirstRecord = !previous;
            const isExpanded = expandedId === id;

            return (
              <div key={id} className="rounded-lg border bg-card p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium">
                      <span
                        className={`mr-1.5 inline-block rounded px-1.5 py-0.5 text-xs font-semibold ${
                          source?.badgeClass ?? "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        {label}
                      </span>
                      [{entry.authorName}] {formatDate(entry.createdAt)}
                    </p>
                    {isFirstRecord && (
                      <span className="mt-1 inline-block rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground">
                        初回記録
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-foreground">{entry.summary}</p>
                {entry.diffStats && (
                  <p className="text-xs text-muted-foreground">
                    {formatDiffStats(entry.diffStats)}
                  </p>
                )}

                <button
                  type="button"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => toggleDetail(id)}
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
                    entry={entry}
                    previousContent={previous?.content ?? ""}
                    isFirstRecord={isFirstRecord}
                    renderContent={renderContent}
                    contentLabel={label}
                  />
                ) : null}

                {confirmId === id ? (
                  <div className="flex items-center gap-2 pt-1">
                    <p className="text-xs text-destructive flex-1">
                      現在の{label}をこの版で置き換えます。よろしいですか？
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmId(null)}
                      disabled={restoringId === id}
                    >
                      取消
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => void handleRestore(entry)}
                      disabled={restoringId === id}
                    >
                      {restoringId === id ? "復元中…" : "確定"}
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setConfirmId(id)}
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
