"use client";

import { useEffect, useRef, useState } from "react";
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
import { DemoAiNotice } from "@/components/DemoAiNotice";
import { demoDelay } from "@/lib/demo-simulation";

/**
 * 保存対象のドキュメント（企画書・台本など）。複数渡すと 1 つのモーダルで
 * まとめて記録する（差分と要約は doc ごと、記録者は共通）。
 */
export type CommitDoc = {
  key: string;
  /** バッジ・要約文言に使うラベル（例: 企画書） */
  label: string;
  /** バッジの配色クラス（統合履歴モーダルと同じものを使う） */
  badgeClass: string;
  /** 記録 API のエンドポイント（例: /api/plan-versions） */
  endpoint: string;
  /** 差分・AI 要約に使う「現在」のテキスト表現 */
  currentContent: string;
  /** 差分・AI 要約に使う「前回記録」のテキスト表現 */
  previousContent: string;
  /**
   * 実際に保存する content（未指定なら currentContent を保存）。
   * 企画書のように「差分表示はテキスト・保存は JSON」を分けたい場合に使う。
   */
  contentToStore?: string;
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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  episodeTitle: string;
  episodeNumber: number;
  episodeSlug: string;
  docs: CommitDoc[];
  /**
   * 閲覧専用（レビュアー）向けの疑似保存。差分表示はそのまま動かし、
   * AI 要約は定型文に置き換え、「保存する」を押しても API には記録しない。
   */
  demoMode?: boolean;
};

/** デモ用の定型要約（実運用ではここを AI が生成する） */
function buildDemoSummary(label: string, stats: DiffStats, episodeTitle: string): string {
  if (stats.isFirstRecord) return `${label}の初稿を記録：${episodeTitle}`;
  return `${label}を更新（追加 ${stats.added}行・削除 ${stats.removed}行）。`;
}

type DocDraft = {
  summary: string;
  stats: DiffStats | null;
  previewLines: DiffPreviewLine[];
  loadingSummary: boolean;
  notice: string | null;
  /** 部分失敗からの再試行時に成功済み doc を二重記録しないためのフラグ */
  saved: boolean;
};

function emptyDraft(): DocDraft {
  return {
    summary: "",
    stats: null,
    previewLines: [],
    loadingSummary: false,
    notice: null,
    saved: false,
  };
}

export function SnapshotCommitModal({
  open,
  onOpenChange,
  episodeTitle,
  episodeNumber,
  episodeSlug,
  docs,
  demoMode = false,
}: Props) {
  const [authorName, setAuthorName] = useState("");
  const [authorFromLogin, setAuthorFromLogin] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, DocDraft>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // docs は開くたびに呼び出し側で組み立て直されるため、
  // 初期化エフェクトの依存には open のみを使い、最新値は ref で参照する。
  const docsRef = useRef(docs);
  useEffect(() => {
    docsRef.current = docs;
  });

  function updateDraft(key: string, patch: Partial<DocDraft>) {
    setDrafts((prev) => ({ ...prev, [key]: { ...(prev[key] ?? emptyDraft()), ...patch } }));
  }

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError("");
    setSaving(false);

    void resolveStudioAuthor().then(({ name, fromLogin }) => {
      setAuthorName(name);
      setAuthorFromLogin(fromLogin);
    });

    const initial: Record<string, DocDraft> = {};
    for (const doc of docsRef.current) {
      const diff = computeScriptDiff(doc.previousContent, doc.currentContent);
      initial[doc.key] = {
        ...emptyDraft(),
        stats: diff.stats,
        previewLines: diff.previewLines,
        loadingSummary: !demoMode,
        // デモは AI を呼ばず、差分統計からの定型文を要約欄に入れる
        summary: demoMode ? buildDemoSummary(doc.label, diff.stats, episodeTitle) : "",
      };
    }
    setDrafts(initial);
    if (demoMode) return;

    for (const doc of docsRef.current) {
      const diffStats = initial[doc.key].stats;
      fetch("/api/summarize-diff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          episodeTitle,
          oldText: doc.previousContent,
          newText: doc.currentContent,
          docLabel: doc.label,
        }),
      })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "要約の取得に失敗しました");
          updateDraft(doc.key, {
            summary: data.summary ?? "",
            stats: data.stats ?? diffStats,
            loadingSummary: false,
            // AI 生成に失敗して定型文が返ったときは、静かに流さずユーザーに知らせる
            notice: data.warning
              ? `AI 要約を生成できなかったため、定型文を入れています。必要に応じて編集してください。（${data.warning}）`
              : null,
          });
        })
        .catch(() => {
          // AI 要約の取得に失敗してもエラー扱いにはせず、
          // 自動の下書きを入れたうえで控えめに編集を促す。
          updateDraft(doc.key, {
            summary: diffStats?.isFirstRecord
              ? `初稿を記録。${episodeTitle}`
              : `${doc.label}を更新しました。`,
            loadingSummary: false,
            notice:
              "AI 要約を取得できなかったため、自動の下書きを入れました。必要に応じて編集してください。",
          });
        });
    }
  }, [open, episodeTitle, demoMode]);

  async function handleCommit() {
    const name = authorName.trim();
    if (!demoMode && !name) {
      setError("記録者名を入力してください");
      return;
    }
    for (const doc of docs) {
      if (!drafts[doc.key]?.saved && !drafts[doc.key]?.summary.trim()) {
        setError(`${doc.label}の要約を入力してください`);
        return;
      }
    }

    setSaving(true);
    setError("");

    if (demoMode) {
      // 疑似保存：API には記録せず、保存の流れ（保存中…→保存済み✓）だけ再現する
      await demoDelay(600);
      for (const doc of docs) {
        if (drafts[doc.key]?.saved) continue;
        updateDraft(doc.key, { saved: true });
        await doc.onCommitted({
          recordedContent: doc.contentToStore ?? doc.currentContent,
          scriptMeta: null,
        });
      }
      setSaving(false);
      onOpenChange(false);
      return;
    }

    try {
      // 保存済み doc を飛ばして順に記録（部分失敗後の再試行でも二重記録しない）
      for (const doc of docs) {
        const draft = drafts[doc.key];
        if (!draft || draft.saved) continue;
        const storedContent = doc.contentToStore ?? doc.currentContent;
        let data: { error?: string; snapshot?: { content?: string }; scriptMeta?: unknown };
        try {
          const res = await fetch(doc.endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              episodeNumber,
              episodeSlug,
              authorName: name,
              summary: draft.summary.trim(),
              content: storedContent,
              diffStats: draft.stats,
              planFingerprint: doc.planFingerprint,
            }),
          });
          data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "保存に失敗しました");
        } catch (err) {
          throw new Error(`${doc.label}の保存に失敗しました: ${toUserMessage(err)}`);
        }
        updateDraft(doc.key, { saved: true });
        await doc.onCommitted({
          recordedContent: data.snapshot?.content ?? storedContent,
          scriptMeta: (data.scriptMeta ?? null) as Parameters<
            CommitDoc["onCommitted"]
          >[0]["scriptMeta"],
          planFingerprint: doc.planFingerprint,
        });
      }
      // 未ログイン（手入力）のときだけ、次回の初期値として記憶する
      if (!authorFromLogin) setStudioAuthorName(name);
      onOpenChange(false);
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const anyLoadingSummary = docs.some((d) => drafts[d.key]?.loadingSummary);
  const allSaved = docs.length > 0 && docs.every((d) => drafts[d.key]?.saved);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>この版を保存</DialogTitle>
          <DialogDescription>{episodeTitle}</DialogDescription>
        </DialogHeader>

        <div className="max-h-[min(30rem,70vh)] space-y-5 overflow-y-auto">
          {demoMode ? (
            <DemoAiNotice>
              保存の流れを再現する疑似体験です。「保存する」を押しても実際には記録されません。
              下の要約は定型文で、実際の保存では AI が変更内容を読み取って自動生成します。
            </DemoAiNotice>
          ) : null}
          {docs.map((doc) => {
            const draft = drafts[doc.key] ?? emptyDraft();
            return (
              <section key={doc.key} className="space-y-3" aria-label={doc.label}>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block rounded px-1.5 py-0.5 text-xs font-semibold ${doc.badgeClass}`}
                  >
                    {doc.label}
                  </span>
                  {draft.stats && (
                    <span className="text-xs text-muted-foreground">
                      {formatDiffStats(draft.stats)}
                    </span>
                  )}
                  {draft.saved && (
                    <span className="text-xs font-medium text-green-700">保存済み ✓</span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-foreground">変更内容</p>
                  <ScriptDiffPreview lines={draft.previewLines} />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor={`snapshot-summary-${doc.key}`}
                    className="block text-xs font-medium"
                  >
                    {doc.label}の要約
                  </label>
                  <textarea
                    id={`snapshot-summary-${doc.key}`}
                    className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring/50"
                    value={draft.summary}
                    onChange={(e) => updateDraft(doc.key, { summary: e.target.value })}
                    disabled={draft.loadingSummary || saving || draft.saved}
                    placeholder={draft.loadingSummary ? "AI が要約を生成中…" : ""}
                  />
                  {draft.notice ? (
                    <p className="text-xs text-muted-foreground">{draft.notice}</p>
                  ) : null}
                </div>
              </section>
            );
          })}

          {/* ログイン時はサーバー（session）が記録者を決めるため入力欄は出さない。
              未ログイン（ローカル等）のときだけ記録者名を入力してもらう。
              デモ（疑似保存）では記録しないため入力欄も出さない。 */}
          {!authorFromLogin && !demoMode ? (
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
          {demoMode ? (
            <p className="self-center text-xs text-violet-700 sm:mr-auto">
              🎭 デモ：実際には保存されません
            </p>
          ) : authorFromLogin && authorName ? (
            <p className="self-center text-xs text-muted-foreground sm:mr-auto">
              <span className="font-medium text-foreground">{authorName}</span> として記録
            </p>
          ) : null}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            キャンセル
          </Button>
          <Button
            onClick={() => void handleCommit()}
            disabled={saving || anyLoadingSummary || allSaved}
          >
            {saving ? "保存中…" : demoMode ? "保存する（デモ）" : "保存する"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
