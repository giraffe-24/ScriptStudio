"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
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
import { toUserMessage } from "@/lib/error-message";
import { DemoAiNotice } from "@/components/DemoAiNotice";
import {
  buildDemoCalibSummary,
  buildDemoStyleLearnings,
  demoDelay,
} from "@/lib/demo-simulation";

/**
 * 推敲開始モーダル。推敲（元原稿→確定稿）の変更内容は重要なため、
 * 必ずこのポップアップで①差分の確認 ②AI が提案する「あらきりらしさ」更新案の
 * 確認・修正 ③確定（保存）の3ステップを踏む。確定するまで何も保存されない。
 * demoMode（閲覧専用）では差分表示はそのまま動かし、更新案は定型サンプルに
 * 置き換え、「確定して保存」を押しても API には保存しない（疑似体験）。
 */

type Proposal = { summary: string; memo: string };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 元原稿（エディタ本文＝AI原稿） */
  originalText: string;
  /** 確定稿（推敲比較欄の貼り付け） */
  finalText: string;
  episodeTitle: string;
  /** 確定して保存が完了したとき（summary は今回学んだことの要約） */
  onCommitted: (summary: string) => void;
  /** 閲覧専用デモの疑似体験（AI・保存 API を呼ばない） */
  demoMode?: boolean;
};

export function CalibReviewModal({
  open,
  onOpenChange,
  originalText,
  finalText,
  episodeTitle,
  onCommitted,
  demoMode = false,
}: Props) {
  const [proposing, setProposing] = useState(false);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [proposeError, setProposeError] = useState<string | null>(null);
  const [memoDraft, setMemoDraft] = useState("");
  const [committing, setCommitting] = useState(false);
  const [commitError, setCommitError] = useState<string | null>(null);
  const requestRef = useRef(0);

  const diff = useMemo(
    () => (open ? computeScriptDiff(originalText, finalText) : null),
    [open, originalText, finalText],
  );
  const hasChanges = Boolean(diff && (diff.stats.added > 0 || diff.stats.removed > 0));

  const propose = useCallback(async () => {
    const requestId = ++requestRef.current;
    setProposing(true);
    setProposeError(null);
    setProposal(null);
    if (demoMode) {
      // 疑似体験：AI は呼ばず、分析の流れ（分析中…→更新案）だけ再現する
      await demoDelay(900);
      if (requestRef.current !== requestId) return;
      const stats = diff?.stats ?? { added: 0, removed: 0 };
      setProposal({ summary: buildDemoCalibSummary(stats), memo: buildDemoStyleLearnings() });
      setMemoDraft(buildDemoStyleLearnings());
      setProposing(false);
      return;
    }
    try {
      const res = await fetch("/api/style-learnings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "propose",
          originalText,
          finalText,
          episodeTitle,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        summary?: string;
        learnings?: string;
        error?: string;
      };
      if (requestRef.current !== requestId) return;
      if (!res.ok || !data.learnings) {
        throw new Error(data.error || "変更内容の分析に失敗しました");
      }
      setProposal({ summary: data.summary ?? "", memo: data.learnings });
      setMemoDraft(data.learnings);
    } catch (error) {
      if (requestRef.current !== requestId) return;
      setProposeError(
        toUserMessage(error, "変更内容の分析に失敗しました。もう一度お試しください。"),
      );
    } finally {
      if (requestRef.current === requestId) setProposing(false);
    }
  }, [originalText, finalText, episodeTitle, demoMode, diff]);

  // モーダルを開いたら状態をリセットし、差分があれば AI 分析を開始する
  useEffect(() => {
    if (!open) {
      requestRef.current += 1;
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProposal(null);
    setProposeError(null);
    setMemoDraft("");
    setCommitError(null);
    setCommitting(false);
    if (hasChanges) void propose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleCommit = useCallback(async () => {
    const content = memoDraft.trim();
    if (!content || committing) return;
    const requestId = ++requestRef.current;
    setCommitting(true);
    setCommitError(null);
    if (demoMode) {
      // 疑似保存：API には保存せず、保存の流れだけ再現する
      await demoDelay(600);
      if (requestRef.current !== requestId) return;
      setCommitting(false);
      onCommitted(proposal?.summary ?? "");
      onOpenChange(false);
      return;
    }
    try {
      const res = await fetch("/api/style-learnings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "commit",
          content,
          summary: proposal?.summary,
          episodeTitle,
          diffStats: diff?.stats ?? null,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        summary?: string;
        error?: string;
      };
      if (requestRef.current !== requestId) return;
      if (!res.ok) throw new Error(data.error || "保存に失敗しました");
      onCommitted(data.summary ?? proposal?.summary ?? "");
      onOpenChange(false);
    } catch (error) {
      if (requestRef.current !== requestId) return;
      setCommitError(toUserMessage(error, "保存に失敗しました。もう一度お試しください。"));
    } finally {
      if (requestRef.current === requestId) setCommitting(false);
    }
  }, [memoDraft, committing, demoMode, proposal, episodeTitle, diff, onCommitted, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={(v) => !committing && onOpenChange(v)}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>推敲 — 変更内容の確認</DialogTitle>
          <DialogDescription>{episodeTitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {demoMode && (
            <DemoAiNotice>
              推敲の疑似体験です。差分表示はそのまま動きますが、更新案はサンプルで、
              「確定して保存」を押しても実際には保存されません。
            </DemoAiNotice>
          )}
          <section>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-sm font-medium">元原稿 → 確定稿の差分</p>
              {diff && (
                <span className="text-xs text-muted-foreground">
                  {formatDiffStats(diff.stats)}
                </span>
              )}
            </div>
            {diff && <ScriptDiffPreview lines={diff.previewLines} maxHeightClass="max-h-52" />}
          </section>

          {!hasChanges ? (
            <p className="text-sm text-muted-foreground">
              元原稿と確定稿に差分がないため、学習する変更内容がありません。
            </p>
          ) : (
            <section>
              <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                <Sparkles className="size-4 text-amber-600" aria-hidden />
                あらきりらしさの更新案（{demoMode ? "デモ" : "AI"}）
              </p>
              {proposing ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-4 text-sm text-muted-foreground"
                >
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  変更内容を分析しています…
                </div>
              ) : proposeError ? (
                <div className="space-y-2">
                  <p className="text-sm text-destructive">{proposeError}</p>
                  <Button type="button" variant="outline" size="sm" onClick={() => void propose()}>
                    再試行
                  </Button>
                </div>
              ) : proposal ? (
                <div className="space-y-2">
                  {proposal.summary && (
                    <p className="rounded-md bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
                      今回の学習ポイント：{proposal.summary}
                    </p>
                  )}
                  <textarea
                    value={memoDraft}
                    onChange={(e) => setMemoDraft(e.target.value)}
                    rows={12}
                    aria-label="あらきりらしさメモ（確認・修正して確定）"
                    className="w-full rounded-md border bg-background px-3 py-2 font-mono text-xs leading-relaxed focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-ring outline-none"
                    spellCheck={false}
                  />
                  <p className="text-xs text-muted-foreground">
                    {demoMode
                      ? "内容の確認・修正まで体験できます。「確定して保存（デモ）」を押しても実際には保存されません。"
                      : "内容を確認・修正してから「確定して保存」を押してください。保存後は執筆・修正時に AI がこのメモを参照します。"}
                  </p>
                </div>
              ) : null}
            </section>
          )}

          {commitError && <p className="text-sm text-destructive">{commitError}</p>}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={committing}
          >
            キャンセル
          </Button>
          <Button
            type="button"
            onClick={() => void handleCommit()}
            disabled={committing || proposing || !hasChanges || !memoDraft.trim()}
          >
            {committing ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                保存中…
              </>
            ) : demoMode ? (
              "確定して保存（デモ）"
            ) : (
              "確定して保存"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
