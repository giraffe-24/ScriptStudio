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
import { toUserMessage } from "@/lib/error-message";
import {
  computeScriptDiff,
  formatDiffStats,
  type DiffPreviewLine,
  type DiffStats,
} from "@/lib/script-diff";
import { ScriptDiffPreview } from "@/components/ScriptDiffPreview";
import { resolveStudioAuthorName } from "@/lib/studio-author";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  episodeTitle: string;
  episodeNumber: number;
  episodeSlug: string;
  currentContent: string;
  previousContent: string;
  planFingerprint?: string;
  onCommitted: (result: {
    recordedContent: string;
    scriptMeta: {
      updatedAt: string;
      updatedBy: string;
      planFingerprint?: string;
      recordedPlanFingerprint?: string;
    } | null;
    planFingerprint?: string;
  }) => void | Promise<void>;
};

export function SnapshotCommitModal({
  open,
  onOpenChange,
  episodeTitle,
  episodeNumber,
  episodeSlug,
  currentContent,
  previousContent,
  planFingerprint,
  onCommitted,
}: Props) {
  const [authorName, setAuthorName] = useState("");
  const [authorFromLogin, setAuthorFromLogin] = useState(false);
  const [summary, setSummary] = useState("");
  const [stats, setStats] = useState<DiffStats | null>(null);
  const [previewLines, setPreviewLines] = useState<DiffPreviewLine[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [summaryNotice, setSummaryNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError("");
    setSummaryNotice(null);

    void resolveStudioAuthorName().then((name) => {
      setAuthorName(name);
      setAuthorFromLogin(Boolean(name));
    });

    const diff = computeScriptDiff(previousContent, currentContent);
    setStats(diff.stats);
    setPreviewLines(diff.previewLines);
    setSummary("");
    setLoadingSummary(true);

    fetch("/api/summarize-diff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        episodeTitle,
        oldText: previousContent,
        newText: currentContent,
      }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "要約の取得に失敗しました");
        setSummary(data.summary ?? "");
        if (data.stats) setStats(data.stats);
      })
      .catch(() => {
        // AI 要約の取得に失敗してもエラー扱いにはせず、
        // 自動の下書きを入れたうえで控えめに編集を促す。
        setSummary(diff.stats.isFirstRecord ? `初稿を記録。${episodeTitle}` : "台本を更新しました。");
        setSummaryNotice(
          "AI 要約を取得できなかったため、自動の下書きを入れました。必要に応じて編集してください。",
        );
      })
      .finally(() => setLoadingSummary(false));
  }, [open, previousContent, currentContent, episodeTitle]);

  async function handleCommit() {
    const name = authorName.trim();
    const text = summary.trim();
    if (!name) {
      setError("著者名を入力してください");
      return;
    }
    if (!text) {
      setError("要約を入力してください");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/script-versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          episodeNumber,
          episodeSlug,
          authorName: name,
          summary: text,
          content: currentContent,
          diffStats: stats,
          planFingerprint,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "記録に失敗しました");
      await onCommitted({
        recordedContent: data.snapshot?.content ?? currentContent,
        scriptMeta: data.scriptMeta ?? null,
        planFingerprint,
      });
      onOpenChange(false);
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>バージョンを記録</DialogTitle>
          <DialogDescription>{episodeTitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {stats && (
            <p className="text-xs text-muted-foreground">{formatDiffStats(stats)}</p>
          )}

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-foreground">変更内容</p>
            <ScriptDiffPreview lines={previewLines} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="snapshot-summary" className="block text-xs font-medium">
              要約
            </label>
            <textarea
              id="snapshot-summary"
              className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring/50"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              disabled={loadingSummary || saving}
              placeholder={loadingSummary ? "AI が要約を生成中…" : ""}
            />
            {summaryNotice ? (
              <p className="text-xs text-muted-foreground">{summaryNotice}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="snapshot-author" className="block text-xs font-medium">
              記録者
            </label>
            {authorFromLogin ? (
              <p
                id="snapshot-author"
                className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-foreground"
              >
                {authorName}
              </p>
            ) : (
              <input
                id="snapshot-author"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                disabled={saving}
                placeholder="ログイン ID または名前"
              />
            )}
          </div>

          {error ? (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            キャンセル
          </Button>
          <Button onClick={() => void handleCommit()} disabled={saving || loadingSummary}>
            {saving ? "保存中…" : "記録を確定"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
