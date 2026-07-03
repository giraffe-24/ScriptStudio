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
import { resolveStudioAuthor, setStudioAuthorName } from "@/lib/studio-author";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  episodeTitle: string;
  episodeNumber: number;
  episodeSlug: string;
  /** 差分・AI 要約に使う「現在」のテキスト表現 */
  currentContent: string;
  /** 差分・AI 要約に使う「前回記録」のテキスト表現 */
  previousContent: string;
  planFingerprint?: string;
  /** 記録 API のエンドポイント（既定: 台本） */
  endpoint?: string;
  /** ドキュメント種別ラベル（要約文言に使用。既定: 台本） */
  docLabel?: string;
  /**
   * 実際に保存する content（未指定なら currentContent を保存）。
   * 企画書のように「差分表示はテキスト・保存は JSON」を分けたい場合に使う。
   */
  contentToStore?: string;
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
  endpoint = "/api/script-versions",
  docLabel = "台本",
  contentToStore,
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

    void resolveStudioAuthor().then(({ name, fromLogin }) => {
      setAuthorName(name);
      setAuthorFromLogin(fromLogin);
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
        docLabel,
      }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "要約の取得に失敗しました");
        setSummary(data.summary ?? "");
        if (data.stats) setStats(data.stats);
        // AI 生成に失敗して定型文が返ったときは、静かに流さずユーザーに知らせる
        if (data.warning) {
          setSummaryNotice(
            `AI 要約を生成できなかったため、定型文を入れています。必要に応じて編集してください。（${data.warning}）`,
          );
        }
      })
      .catch(() => {
        // AI 要約の取得に失敗してもエラー扱いにはせず、
        // 自動の下書きを入れたうえで控えめに編集を促す。
        setSummary(diff.stats.isFirstRecord ? `初稿を記録。${episodeTitle}` : `${docLabel}を更新しました。`);
        setSummaryNotice(
          "AI 要約を取得できなかったため、自動の下書きを入れました。必要に応じて編集してください。",
        );
      })
      .finally(() => setLoadingSummary(false));
  }, [open, previousContent, currentContent, episodeTitle, docLabel]);

  async function handleCommit() {
    const name = authorName.trim();
    const text = summary.trim();
    if (!name) {
      setError("記録者名を入力してください");
      return;
    }
    if (!text) {
      setError("要約を入力してください");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const storedContent = contentToStore ?? currentContent;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          episodeNumber,
          episodeSlug,
          authorName: name,
          summary: text,
          content: storedContent,
          diffStats: stats,
          planFingerprint,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "保存に失敗しました");
      // 未ログイン（手入力）のときだけ、次回の初期値として記憶する
      if (!authorFromLogin) setStudioAuthorName(name);
      await onCommitted({
        recordedContent: data.snapshot?.content ?? storedContent,
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
          <DialogTitle>この版を保存</DialogTitle>
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

          {/* ログイン時はサーバー（session）が記録者を決めるため入力欄は出さない。
              未ログイン（ローカル等）のときだけ記録者名を入力してもらう。 */}
          {!authorFromLogin ? (
            <div className="space-y-1.5">
              <label htmlFor="snapshot-author" className="block text-xs font-medium">
                記録者
              </label>
              <input
                id="snapshot-author"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                disabled={saving}
                placeholder="ログイン ID または名前"
              />
            </div>
          ) : null}

          {error ? (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          {authorFromLogin && authorName ? (
            <p className="self-center text-xs text-muted-foreground sm:mr-auto">
              <span className="font-medium text-foreground">{authorName}</span> として記録
            </p>
          ) : null}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            キャンセル
          </Button>
          <Button onClick={() => void handleCommit()} disabled={saving || loadingSummary}>
            {saving ? "保存中…" : "保存する"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
