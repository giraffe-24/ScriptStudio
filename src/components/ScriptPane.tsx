"use client";

import { useEffect, useRef, useState } from "react";
import { ScriptEditor } from "./ScriptEditor";
import { SnapshotCommitModal } from "./SnapshotCommitModal";
import { HistoryModal } from "./HistoryModal";
import type { ScriptMeta } from "@/lib/file-manager";
import type { EpisodePlan } from "@/lib/types";
import { planGenerationFingerprint } from "@/lib/plan-fingerprint";
import {
  collectSectionIndicesToRegenerate,
  getRemovedSectionNames,
  parsePlanFingerprint,
} from "@/lib/plan-outline-diff";
import {
  buildScriptFromSections,
  replaceScriptSections,
  splitScriptIntoSections,
} from "@/lib/script-sections";
import { computeScriptDiff } from "@/lib/script-diff";
import {
  extractScriptHeaders,
  isScriptOutlineInSync,
  syncScriptHeadersByIndex,
} from "@/lib/script-outline";

interface Props {
  plan: EpisodePlan | null;
  episodeNumber: number | null;
  episodeSlug: string;
  generateKey?: number;
  onScriptSaved: () => void;
  onScriptCreated?: () => void;
  onRevisionEntered?: () => void;
  onRevisionCleared?: () => void;
}

function cleanScript(text: string): string {
  const lines = text.split("\n");

  let start = 0;
  while (start < lines.length && /^#\s/.test(lines[start])) start++;
  while (start < lines.length && /^>/.test(lines[start])) start++;
  while (start < lines.length && lines[start].trim() === "") start++;

  const body = lines.slice(start);

  const cleaned = body
    .filter((line) => !/^---+$/.test(line.trim()))
    .map((line) => (/^##\s*【定型締め】/.test(line) ? "" : line));

  const result: string[] = [];
  let prevBlank = false;
  for (const line of cleaned) {
    const isBlank = line.trim() === "";
    if (isBlank && prevBlank) continue;
    result.push(line);
    prevBlank = isBlank;
  }

  return result.join("\n").trim();
}

function looksLikeHtmlErrorPage(text: string): boolean {
  const t = text.trimStart();
  return (
    t.startsWith("<!DOCTYPE") ||
    t.startsWith("<html") ||
    t.includes("__next_error__") ||
    t.includes("This page couldn't be rendered")
  );
}

function formatUpdatedAt(iso: string): string {
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

export function ScriptPane({
  plan,
  episodeNumber,
  episodeSlug,
  generateKey = 0,
  onScriptSaved,
  onScriptCreated,
  onRevisionEntered,
  onRevisionCleared,
}: Props) {
  const [script, setScript] = useState("");
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [outOfSync, setOutOfSync] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  const [updatingSections, setUpdatingSections] = useState<number[]>([]);
  const [scriptMeta, setScriptMeta] = useState<ScriptMeta | null>(null);
  const [versionsEnabled, setVersionsEnabled] = useState(false);
  const [versionsHint, setVersionsHint] = useState("");
  const [commitOpen, setCommitOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [previousSnapshotContent, setPreviousSnapshotContent] = useState("");
  const [commitCurrentContent, setCommitCurrentContent] = useState("");
  const latestScriptRef = useRef<string>("");
  const prevOutlineRef = useRef<string[] | null>(null);
  const alertedOutlineRef = useRef<string>("");
  const lastGenerateKeyRef = useRef(0);
  const loadedEpisodeKeyRef = useRef("");

  async function loadScriptMeta() {
    if (!episodeNumber || !episodeSlug) {
      setScriptMeta(null);
      return;
    }
    const res = await fetch(
      `/api/files?action=read-script-meta&number=${episodeNumber}&slug=${episodeSlug}`,
    );
    const data = await res.json();
    setScriptMeta(data.scriptMeta ?? null);
  }

  async function refreshVersionsStatus() {
    try {
      const res = await fetch("/api/script-versions?action=status");
      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) return;
      const data = (await res.json()) as { configured?: boolean; hint?: string | null };
      setVersionsEnabled(Boolean(data.configured));
      setVersionsHint(data.hint ?? "");
    } catch {
      setVersionsEnabled(false);
    }
  }

  useEffect(() => {
    void refreshVersionsStatus();
  }, []);

  useEffect(() => {
    if (generated) void refreshVersionsStatus();
  }, [generated]);

  async function openCommitModal() {
    if (!episodeNumber || !episodeSlug || !latestScriptRef.current.trim()) return;
    await handleSave(latestScriptRef.current);
    const res = await fetch(
      `/api/script-versions?action=latest&number=${episodeNumber}&slug=${encodeURIComponent(episodeSlug)}`,
    );
    const data = await res.json();
    if (!res.ok) {
      window.alert(data.error ?? "最新の記録を取得できませんでした");
      return;
    }
    setPreviousSnapshotContent(data.snapshot?.content ?? "");
    setCommitCurrentContent(latestScriptRef.current);
    setCommitOpen(true);
  }

  async function handleRestoreSnapshot(content: string) {
    if (!episodeNumber) throw new Error("エピソードが選択されていません");
    const displayContent = cleanScript(content);
    setScript(displayContent);
    latestScriptRef.current = content;
    await handleSave(content);
    await loadScriptMeta();
  }

  // エピソード選択時のみディスクから読み込み
  useEffect(() => {
    const episodeKey = episodeNumber && episodeSlug ? `${episodeNumber}-${episodeSlug}` : "";
    if (!episodeKey) return;
    if (loadedEpisodeKeyRef.current === episodeKey) return;

    loadedEpisodeKeyRef.current = episodeKey;
    fetch(`/api/files?action=read&number=${episodeNumber}&slug=${episodeSlug}&filename=01-script-draft.md`)
      .then((r) => r.json())
      .then((d) => {
        if (d.content && !looksLikeHtmlErrorPage(d.content)) {
          const cleaned = cleanScript(d.content);
          setScript(cleaned);
          latestScriptRef.current = cleaned;
          setGenerated(true);
        } else if (d.content && looksLikeHtmlErrorPage(d.content)) {
          setScript("");
          latestScriptRef.current = "";
          setGenerated(false);
        } else {
          setScript("");
          latestScriptRef.current = "";
          setGenerated(false);
        }
      });
    void loadScriptMeta();
  }, [episodeNumber, episodeSlug]);

  // 企画書「台本を作成する」→ 状態に関係なく新規生成開始（ディスクは上書きしない）
  useEffect(() => {
    if (!generateKey || generateKey === lastGenerateKeyRef.current || !plan) return;
    lastGenerateKeyRef.current = generateKey;
    if (episodeNumber && episodeSlug) {
      loadedEpisodeKeyRef.current = `${episodeNumber}-${episodeSlug}`;
    }
    void handleGenerate({ fromPlan: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generateKey, plan]);

  useEffect(() => {
    prevOutlineRef.current = null;
    alertedOutlineRef.current = "";
    setOutOfSync(false);
    setScriptMeta(null);
    lastGenerateKeyRef.current = 0;
    loadedEpisodeKeyRef.current = "";
  }, [episodeNumber, episodeSlug]);

  // 目次案のリネームのみ自動同期（件数が同じ場合）
  useEffect(() => {
    if (!plan?.outline || loading) return;
    const sections = plan.outline.map((o) => o.section);

    if (prevOutlineRef.current === null) {
      prevOutlineRef.current = sections;
      return;
    }

    if (sections.join("\0") === prevOutlineRef.current.join("\0")) return;
    if (!script) {
      prevOutlineRef.current = sections;
      return;
    }

    const headers = extractScriptHeaders(script);
    if (sections.length === headers.length) {
      const updated = syncScriptHeadersByIndex(script, plan.outline);
      if (updated !== script) {
        setScript(updated);
        latestScriptRef.current = updated;
      }
    }

    prevOutlineRef.current = sections;
  }, [plan?.outline, script, loading]);

  // 構成と台本の不一致を検知
  useEffect(() => {
    if (!plan?.outline || !generated || loading || !script) {
      setOutOfSync(false);
      return;
    }

    const inSync = isScriptOutlineInSync(script, plan.outline);
    setOutOfSync(!inSync);

    if (inSync) {
      alertedOutlineRef.current = "";
      return;
    }

    const alertKey = JSON.stringify(plan.outline.map((o) => ({ s: o.section, c: o.content })));
    alertedOutlineRef.current = alertKey;
  }, [plan?.outline, script, generated, loading]);

  async function autoRecordSnapshot(beforeContent: string, afterContent: string) {
    if (!versionsEnabled || !episodeNumber || !episodeSlug || !plan) return;
    if (beforeContent.trim() === afterContent.trim()) return;

    try {
      const diff = computeScriptDiff(beforeContent, afterContent);
      let summary = "台本を更新しました。";

      const sumRes = await fetch("/api/summarize-diff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          episodeTitle: plan.episodeTitle,
          oldText: beforeContent,
          newText: afterContent,
        }),
      });
      if (sumRes.ok) {
        const sumData = await sumRes.json();
        if (sumData.summary) summary = sumData.summary;
      }

      await fetch("/api/script-versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          episodeNumber,
          episodeSlug,
          summary,
          content: afterContent,
          diffStats: diff.stats,
        }),
      });
    } catch {
      // 履歴保存失敗は生成自体を止めない
    }
  }

  async function runFullGeneration(options?: { fromPlan?: boolean }) {
    if (!plan) return;

    const previousScript = script;
    const previousGenerated = generated;
    const fromPlan = options?.fromPlan ?? false;
    const needsReconcile =
      !fromPlan &&
      generated &&
      !!script &&
      !!plan.outline &&
      !isScriptOutlineInSync(script, plan.outline);

    setLoading(true);
    setScript("");
    setGenerated(false);
    setOutOfSync(false);
    alertedOutlineRef.current = "";
    setReconciling(needsReconcile);
    setUpdatingSections([]);

    function restorePreviousScript() {
      setScript(previousScript);
      latestScriptRef.current = previousScript;
      setGenerated(previousGenerated);
    }

    try {
      const res = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          streaming: true,
          reconcile: needsReconcile,
          existingScript: needsReconcile ? previousScript : undefined,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        let message = `台本生成に失敗しました（${res.status}）`;
        try {
          const data = JSON.parse(errText) as { error?: string };
          if (data.error) message = data.error;
        } catch {
          if (errText && !looksLikeHtmlErrorPage(errText)) message = errText.slice(0, 200);
        }
        window.alert(message);
        restorePreviousScript();
        return;
      }

      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("text/plain")) {
        window.alert("台本生成の応答形式が不正です。しばらく待ってから再試行してください。");
        restorePreviousScript();
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let full = "";
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        if (!looksLikeHtmlErrorPage(full)) {
          setScript(full);
        }
      }

      if (!full.trim() || looksLikeHtmlErrorPage(full)) {
        window.alert(
          "台本生成中にサーバーエラーが発生しました。Vercel の ANTHROPIC_API_KEY 設定と Redeploy を確認してください。",
        );
        restorePreviousScript();
        return;
      }

      const cleaned = cleanScript(full);
      setScript(cleaned);
      latestScriptRef.current = cleaned;
      setGenerated(true);
      prevOutlineRef.current = plan.outline?.map((o) => o.section) ?? [];

      if (episodeNumber && episodeSlug && cleaned.trim()) {
        await handleSave(cleaned, "generation");
        await autoRecordSnapshot(previousScript, cleaned);
        onScriptCreated?.();
      }
    } catch {
      window.alert("台本生成中に通信エラーが発生しました。ネットワークを確認して再試行してください。");
      restorePreviousScript();
    } finally {
      setLoading(false);
      setReconciling(false);
      setUpdatingSections([]);
    }
  }

  async function runIncrementalUpdate(forcedIndices?: number[]) {
    if (!plan?.outline?.length || !script.trim()) return;

    const previousScript = script;
    const previousPlan = parsePlanFingerprint(scriptMeta?.planFingerprint);
    const previousOutline = previousPlan?.outline;
    const removedNames = getRemovedSectionNames(previousOutline, plan.outline);
    const indices =
      forcedIndices ??
      collectSectionIndicesToRegenerate(previousOutline, plan.outline);

    let workingScript = script;
    if (removedNames.length) {
      workingScript = buildScriptFromSections(
        plan.outline,
        splitScriptIntoSections(workingScript, plan.outline),
      );
    }

    if (!isScriptOutlineInSync(workingScript, plan.outline)) {
      workingScript = syncScriptHeadersByIndex(workingScript, plan.outline);
    }

    if (!indices.length) {
      if (workingScript !== previousScript) {
        const cleaned = cleanScript(workingScript);
        setScript(cleaned);
        latestScriptRef.current = cleaned;
        await handleSave(cleaned, "generation");
        await autoRecordSnapshot(previousScript, cleaned);
      } else {
        window.alert("構成（目次案）に変更がないため、更新対象がありません。");
      }
      return;
    }

    setLoading(true);
    setReconciling(true);
    setUpdatingSections(indices);
    const interim = cleanScript(workingScript);
    setScript(interim);
    latestScriptRef.current = interim;

    try {
      const currentSections = splitScriptIntoSections(workingScript, plan.outline);
      const sectionBodies: Record<string, string> = {};
      currentSections.forEach((section, index) => {
        sectionBodies[String(index)] = section.body;
      });

      const res = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "sections",
          plan,
          sectionIndices: indices,
          sectionBodies,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        window.alert(data.error ?? "セクション更新に失敗しました");
        return;
      }

      const updates = new Map<number, string>();
      for (const [index, body] of Object.entries(data.sections ?? {})) {
        updates.set(Number(index), String(body));
      }

      let merged = replaceScriptSections(workingScript, plan.outline, updates);
      merged = cleanScript(merged);
      setScript(merged);
      latestScriptRef.current = merged;
      setGenerated(true);
      prevOutlineRef.current = plan.outline.map((o) => o.section);

      if (episodeNumber && episodeSlug) {
        await handleSave(merged, "generation");
        await autoRecordSnapshot(previousScript, merged);
        onScriptCreated?.();
      }
    } catch {
      window.alert("セクション更新中に通信エラーが発生しました。");
    } finally {
      setLoading(false);
      setReconciling(false);
      setUpdatingSections([]);
    }
  }

  async function handleGenerate(options?: { fromPlan?: boolean }) {
    if (!plan || loading) return;

    const fromPlan = options?.fromPlan ?? false;
    const hasExistingScript = generated && !!script.trim();

    if (fromPlan || !hasExistingScript) {
      await runFullGeneration(options);
      return;
    }

    await runIncrementalUpdate();
  }

  async function handleRegenerateSection(index: number) {
    if (!plan?.outline?.length || loading) return;
    await runIncrementalUpdate([index]);
  }

  async function handleManualPlanSync() {
    const content = latestScriptRef.current;
    if (!content.trim() || !plan) return;
    await handleSave(content, "manual", { syncPlanFingerprint: true });
  }

  async function handleSave(
    content: string,
    source: "generation" | "manual" = "manual",
    options?: { syncPlanFingerprint?: boolean },
  ) {
    if (!episodeNumber) return;
    latestScriptRef.current = content;
    const shouldSyncPlan =
      (source === "generation" || options?.syncPlanFingerprint) && plan;
    const res = await fetch("/api/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "write",
        number: episodeNumber,
        slug: episodeSlug,
        filename: "01-script-draft.md",
        content,
        scriptSaveSource: source,
        planFingerprint: shouldSyncPlan ? planGenerationFingerprint(plan) : undefined,
      }),
    });
    const data = await res.json();
    if (data.scriptMeta) {
      setScriptMeta(data.scriptMeta);
    }
    onScriptSaved();
  }

  if (!plan) {
    return (
      <div className="flex flex-col h-full">
        <div className="h-[52px] px-4 border-b border-gray-200 bg-white flex items-center gap-2 min-w-0">
          <h2 className="text-sm font-semibold text-gray-700 shrink-0">台本</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <div className="text-4xl mb-3">📝</div>
            <p className="text-sm">企画書を作成すると台本を生成できます</p>
          </div>
        </div>
      </div>
    );
  }

  const storedPlan = parsePlanFingerprint(scriptMeta?.planFingerprint);
  const pendingSectionUpdates = plan?.outline
    ? collectSectionIndicesToRegenerate(storedPlan?.outline, plan.outline)
    : [];
  const pendingRemovals = plan?.outline
    ? getRemovedSectionNames(storedPlan?.outline, plan.outline)
    : [];
  const needsOutlineUpdate =
    outOfSync || pendingSectionUpdates.length > 0 || pendingRemovals.length > 0;
  const canRegenerate = !generated || needsOutlineUpdate;
  const regenerateDisabled = loading || (generated && !canRegenerate);

  return (
    <div className="flex flex-col h-full">
      {/* ヘッダー */}
      <div className="h-[52px] px-4 border-b border-gray-200 bg-white flex items-center gap-2 min-w-0">
        <h2 className="text-sm font-semibold text-gray-700 shrink-0">台本</h2>
        <span className="text-gray-300 text-sm shrink-0">/</span>
        <p className="text-xs text-gray-400 truncate flex-1 min-w-0">{plan.episodeTitle}</p>
        <div className="flex items-center gap-2 shrink-0">
          {scriptMeta && generated && (
            <span className="text-[10px] text-gray-400 whitespace-nowrap">
              {scriptMeta.updatedBy} · {formatUpdatedAt(scriptMeta.updatedAt)}
            </span>
          )}
          {generated && versionsEnabled && episodeNumber && episodeSlug && (
            <>
              <button
                type="button"
                onClick={() => void openCommitModal()}
                disabled={loading || !latestScriptRef.current.trim()}
                className="text-xs font-medium px-2.5 py-1 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                記録
              </button>
              <button
                type="button"
                onClick={() => setHistoryOpen(true)}
                disabled={loading}
                className="text-xs font-medium px-2.5 py-1 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                履歴
              </button>
            </>
          )}
          <button
            onClick={() => handleGenerate()}
            disabled={regenerateDisabled}
            title={
              regenerateDisabled && generated && !loading
                ? "構成（目次案）に変更がないため再生成できません"
                : undefined
            }
            className={`text-xs font-medium px-3 py-1 rounded-md transition-colors ${
              regenerateDisabled
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : outOfSync
                ? "bg-red-500 text-white hover:bg-red-600"
                : generated
                ? "bg-orange-500 text-white hover:bg-orange-600"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            {loading
              ? "更新中…"
              : outOfSync || needsOutlineUpdate
              ? `再生成（${pendingSectionUpdates.length || 1}セクション）`
              : generated
              ? "再生成"
              : "台本を生成"}
          </button>
        </div>
      </div>

      {generated && !versionsEnabled && versionsHint && !loading && (
        <div className="bg-amber-50 border-b border-amber-100 px-4 py-2">
          <p className="text-xs text-amber-700">{versionsHint}</p>
        </div>
      )}

      {needsOutlineUpdate && !loading && (
        <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-center justify-between gap-3">
          <p className="text-xs text-amber-800 flex-1">
            構成（目次案）に変更があります。軽い修正は下の台本を直接編集し「手動で反映」を。大幅な変更は「再生成」で AI 更新（変更セクションのみ）。
          </p>
          <button
            type="button"
            onClick={() => void handleManualPlanSync()}
            className="text-xs font-medium px-2.5 py-1 rounded-md border border-amber-300 bg-white text-amber-800 hover:bg-amber-100 shrink-0"
          >
            手動で反映
          </button>
        </div>
      )}

      {loading && (
        <div className="bg-blue-50 border-b border-blue-100 px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            <span className="text-xs text-blue-600">
              {reconciling && updatingSections.length > 0
                ? `変更セクション（${updatingSections.length}件）を更新中…`
                : reconciling
                ? "構成の変更を反映中…"
                : "AI が台本を執筆中…リアルタイムで表示されます"}
            </span>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {script || loading ? (
          <ScriptEditor
            script={script}
            episodeTitle={plan.episodeTitle}
            outline={plan.outline}
            latestContentRef={latestScriptRef}
            regeneratingSectionIndices={updatingSections}
            onRegenerateSection={generated ? (index) => void handleRegenerateSection(index) : undefined}
            onSave={(content) => {
              latestScriptRef.current = content;
              handleSave(content);
            }}
            onRevisionEntered={onRevisionEntered}
            onRevisionCleared={onRevisionCleared}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl mb-4">🎬</div>
              <p className="text-sm text-gray-500 mb-1">「台本を生成」ボタンで</p>
              <p className="text-sm text-gray-500">企画書から自動で台本を作成します</p>
              <p className="text-xs text-gray-400 mt-2">目標 4,000〜6,000 字、約 30 秒</p>
            </div>
          </div>
        )}
      </div>

      {episodeNumber && episodeSlug && (
        <>
          <SnapshotCommitModal
            open={commitOpen}
            onOpenChange={setCommitOpen}
            episodeTitle={plan.episodeTitle}
            episodeNumber={episodeNumber}
            episodeSlug={episodeSlug}
            currentContent={commitCurrentContent}
            previousContent={previousSnapshotContent}
            onCommitted={() => void loadScriptMeta()}
          />
          <HistoryModal
            open={historyOpen}
            onOpenChange={setHistoryOpen}
            episodeTitle={plan.episodeTitle}
            episodeNumber={episodeNumber}
            episodeSlug={episodeSlug}
            onRestore={handleRestoreSnapshot}
          />
        </>
      )}
    </div>
  );
}
