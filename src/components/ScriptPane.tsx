"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  ScriptEditor,
  type GenerationStatus,
  type SelectionRegeneratePayload,
} from "./ScriptEditor";
import { SnapshotCommitModal } from "./SnapshotCommitModal";
import { HistoryModal } from "./HistoryModal";
import {
  scriptBtnDisabled,
  scriptBtnPrimaryBlueFill,
  scriptBtnPrimaryOrange,
  scriptBtnPrimaryRed,
  scriptBtnSecondary,
} from "./script-toolbar-styles";
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
import { hasScriptChangesSinceRecord } from "@/lib/record-state";
import { scriptBtnRecordPending } from "@/components/UnrecordedBadge";
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
  onRecordStateChange?: (state: {
    scriptUnrecorded: boolean;
    recordedPlanFingerprint?: string;
    planFingerprintFallback?: string;
    versionsEnabled: boolean;
  }) => void;
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
  onRecordStateChange,
}: Props) {
  const [script, setScript] = useState("");
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [outOfSync, setOutOfSync] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  const [updatingSections, setUpdatingSections] = useState<number[]>([]);
  const [scriptMeta, setScriptMeta] = useState<ScriptMeta | null>(null);
  const [latestSnapshotContent, setLatestSnapshotContent] = useState<string | null>(null);
  const [snapshotCheckReady, setSnapshotCheckReady] = useState(false);
  const [draftRevision, setDraftRevision] = useState(0);
  const [versionsEnabled, setVersionsEnabled] = useState(false);
  const [versionsHint, setVersionsHint] = useState("");
  const [commitOpen, setCommitOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [previousSnapshotContent, setPreviousSnapshotContent] = useState("");
  const [commitCurrentContent, setCommitCurrentContent] = useState("");
  const latestScriptRef = useRef<string>("");
  const prevOutlineRef = useRef<string[] | null>(null);
  const alertedOutlineRef = useRef<string>("");
  const confirmedPlanFingerprintRef = useRef<string | null>(null);
  const lastGenerateKeyRef = useRef(0);
  const generationAbortRef = useRef<AbortController | null>(null);

  function episodeKey(number: number | null, slug: string): string {
    return number && slug ? `${number}-${slug}` : "";
  }

  function abortActiveGeneration() {
    generationAbortRef.current?.abort();
    generationAbortRef.current = null;
  }

  function beginGenerationSession(): AbortSignal {
    abortActiveGeneration();
    const controller = new AbortController();
    generationAbortRef.current = controller;
    return controller.signal;
  }

  function isGenerationSessionActive(
    signal: AbortSignal,
    targetNumber: number | null,
    targetSlug: string,
  ): boolean {
    return (
      !signal.aborted &&
      episodeKey(episodeNumber, episodeSlug) === episodeKey(targetNumber, targetSlug)
    );
  }

  async function loadScriptMeta() {
    if (!episodeNumber || !episodeSlug) {
      setScriptMeta(null);
      return null;
    }
    const res = await fetch(
      `/api/files?action=read-script-meta&number=${episodeNumber}&slug=${episodeSlug}`,
    );
    const data = await res.json();
    const meta = (data.scriptMeta ?? null) as ScriptMeta | null;
    setScriptMeta(meta);
    return meta;
  }

  function confirmPlanScriptBaseline(savePlan: EpisodePlan) {
    const fingerprint = planGenerationFingerprint(savePlan);
    confirmedPlanFingerprintRef.current = fingerprint;
    prevOutlineRef.current = savePlan.outline?.map((o) => o.section) ?? [];
    setOutOfSync(false);
    alertedOutlineRef.current = "";
  }

  function applyRecordedState(options: {
    recordedContent?: string | null;
    scriptMeta?: ScriptMeta | null;
    planFingerprint?: string;
    savePlan?: EpisodePlan | null;
  }) {
    if (typeof options.recordedContent === "string") {
      setLatestSnapshotContent(options.recordedContent);
      setSnapshotCheckReady(true);
    }
    if (options.scriptMeta) {
      setScriptMeta(options.scriptMeta);
    }
    if (!options.planFingerprint) return;
    if (
      options.savePlan &&
      planGenerationFingerprint(options.savePlan) === options.planFingerprint
    ) {
      confirmPlanScriptBaseline(options.savePlan);
      return;
    }
    confirmedPlanFingerprintRef.current = options.planFingerprint;
    setOutOfSync(false);
    alertedOutlineRef.current = "";
  }

  async function refreshLatestSnapshot() {
    if (!episodeNumber || !episodeSlug || !versionsEnabled) {
      setLatestSnapshotContent(null);
      setSnapshotCheckReady(true);
      return;
    }

    setSnapshotCheckReady(false);
    try {
      const res = await fetch(
        `/api/script-versions?action=latest&number=${episodeNumber}&slug=${encodeURIComponent(episodeSlug)}`,
      );
      const data = await res.json();
      if (!res.ok) {
        setLatestSnapshotContent(null);
        return;
      }
      setLatestSnapshotContent(data.snapshot?.content ?? null);
    } catch {
      setLatestSnapshotContent(null);
    } finally {
      setSnapshotCheckReady(true);
    }
  }

  async function refreshRecordBaseline(options?: {
    recordedContent?: string | null;
    scriptMeta?: ScriptMeta | null;
    planFingerprint?: string;
    savePlan?: EpisodePlan | null;
  }) {
    const meta = options?.scriptMeta ?? (await loadScriptMeta());
    applyRecordedState({
      recordedContent: options?.recordedContent,
      scriptMeta: meta,
      planFingerprint: options?.planFingerprint,
      savePlan: options?.savePlan,
    });
    if (typeof options?.recordedContent === "string") return;
    await refreshLatestSnapshot();
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

  useEffect(() => {
    if (!versionsEnabled) {
      setLatestSnapshotContent(null);
      setSnapshotCheckReady(true);
      return;
    }
    void refreshLatestSnapshot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episodeNumber, episodeSlug, versionsEnabled]);

  const scriptUnrecorded =
    versionsEnabled &&
    snapshotCheckReady &&
    generated &&
    !loading &&
    hasScriptChangesSinceRecord(latestScriptRef.current, latestSnapshotContent);

  useEffect(() => {
    onRecordStateChange?.({
      scriptUnrecorded,
      recordedPlanFingerprint: scriptMeta?.recordedPlanFingerprint,
      planFingerprintFallback: scriptMeta?.planFingerprint,
      versionsEnabled,
    });
  }, [
    scriptUnrecorded,
    scriptMeta?.recordedPlanFingerprint,
    scriptMeta?.planFingerprint,
    versionsEnabled,
    onRecordStateChange,
    draftRevision,
  ]);

  const handleDraftChange = useCallback(() => {
    setDraftRevision((value) => value + 1);
  }, []);

  async function openCommitModal() {
    if (!episodeNumber || !episodeSlug || !latestScriptRef.current.trim()) return;
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
    await refreshRecordBaseline();
  }

  // エピソード切替時: 状態をリセットしてディスクから読み込み
  useEffect(() => {
    abortActiveGeneration();
    setLoading(false);
    setReconciling(false);
    setUpdatingSections([]);
    prevOutlineRef.current = null;
    alertedOutlineRef.current = "";
    setOutOfSync(false);
    setScriptMeta(null);
    confirmedPlanFingerprintRef.current = null;
    setLatestSnapshotContent(null);
    setSnapshotCheckReady(false);
    lastGenerateKeyRef.current = 0;

    const key = episodeKey(episodeNumber, episodeSlug);
    if (!key) {
      setScript("");
      latestScriptRef.current = "";
      setGenerated(false);
      return;
    }

    let cancelled = false;

    fetch(`/api/files?action=read&number=${episodeNumber}&slug=${episodeSlug}&filename=01-script-draft.md`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.content && !looksLikeHtmlErrorPage(d.content)) {
          const cleaned = cleanScript(d.content);
          setScript(cleaned);
          latestScriptRef.current = cleaned;
          setGenerated(true);
        } else {
          setScript("");
          latestScriptRef.current = "";
          setGenerated(false);
        }
      });

    void loadScriptMeta().then((meta) => {
      if (meta?.planFingerprint) {
        confirmedPlanFingerprintRef.current = meta.planFingerprint;
      }
    });

    return () => {
      cancelled = true;
    };
  }, [episodeNumber, episodeSlug]);

  // 企画書「台本を作成する」→ 状態に関係なく新規生成開始（ディスクは上書きしない）
  useEffect(() => {
    if (!generateKey || generateKey === lastGenerateKeyRef.current || !plan) return;
    lastGenerateKeyRef.current = generateKey;
    void handleGenerate({ fromPlan: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generateKey, plan]);

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

  // 構成と台本の不一致を検知（手動で反映済みの企画指紋は確定扱い）
  useEffect(() => {
    if (!plan?.outline || !generated || loading || !script) {
      setOutOfSync(false);
      return;
    }

    const planFingerprint = planGenerationFingerprint(plan);
    const confirmed = confirmedPlanFingerprintRef.current === planFingerprint;
    const inSync = isScriptOutlineInSync(script, plan.outline);
    setOutOfSync(!inSync && !confirmed);

    if (inSync || confirmed) {
      alertedOutlineRef.current = "";
      return;
    }

    const alertKey = JSON.stringify(plan.outline.map((o) => ({ s: o.section, c: o.content })));
    alertedOutlineRef.current = alertKey;
  }, [plan, script, generated, loading]);

  async function autoRecordSnapshot(beforeContent: string, afterContent: string) {
    if (!episodeNumber || !episodeSlug || !plan) return;
    await autoRecordSnapshotForEpisode(
      episodeNumber,
      episodeSlug,
      plan,
      beforeContent,
      afterContent,
    );
  }

  async function autoRecordSnapshotForEpisode(
    number: number,
    slug: string,
    savePlan: EpisodePlan,
    beforeContent: string,
    afterContent: string,
  ) {
    if (!versionsEnabled || beforeContent.trim() === afterContent.trim()) return;

    try {
      const diff = computeScriptDiff(beforeContent, afterContent);
      let summary = "台本を更新しました。";

      const sumRes = await fetch("/api/summarize-diff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          episodeTitle: savePlan.episodeTitle,
          oldText: beforeContent,
          newText: afterContent,
        }),
      });
      if (sumRes.ok) {
        const sumData = await sumRes.json();
        if (sumData.summary) summary = sumData.summary;
      }

      const recordRes = await fetch("/api/script-versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          episodeNumber: number,
          episodeSlug: slug,
          summary,
          content: afterContent,
          diffStats: diff.stats,
          planFingerprint: planGenerationFingerprint(savePlan),
        }),
      });
      const recordData = await recordRes
        .json()
        .catch(() => ({ error: "記録レスポンスの解析に失敗しました" }));
      if (!recordRes.ok) {
        throw new Error(recordData.error ?? "台本の自動記録に失敗しました");
      }
      await refreshRecordBaseline({
        recordedContent: recordData.snapshot?.content ?? afterContent,
        scriptMeta: (recordData.scriptMeta ?? null) as ScriptMeta | null,
        planFingerprint: planGenerationFingerprint(savePlan),
        savePlan,
      });
    } catch {
      // 履歴保存失敗は生成自体を止めない
    }
  }

  async function persistEpisodeScript(
    number: number,
    slug: string,
    savePlan: EpisodePlan | null,
    content: string,
    source: "generation" | "manual",
    options?: { syncPlanFingerprint?: boolean },
  ) {
    const shouldSyncPlan =
      (source === "generation" || options?.syncPlanFingerprint) && savePlan;
    const res = await fetch("/api/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "write",
        number,
        slug,
        filename: "01-script-draft.md",
        content,
        scriptSaveSource: source,
        planFingerprint: shouldSyncPlan ? planGenerationFingerprint(savePlan) : undefined,
      }),
    });
    const data = await res.json();
    if (episodeKey(episodeNumber, episodeSlug) === episodeKey(number, slug)) {
      latestScriptRef.current = content;
      if (data.scriptMeta) {
        setScriptMeta(data.scriptMeta);
      }
      if (shouldSyncPlan && savePlan) {
        confirmPlanScriptBaseline(savePlan);
      }
      onScriptSaved();
    }
  }

  async function runFullGeneration(options?: { fromPlan?: boolean }) {
    if (!plan) return;

    const targetNumber = episodeNumber;
    const targetSlug = episodeSlug;
    const targetPlan = plan;
    const sessionKey = episodeKey(targetNumber, targetSlug);
    const signal = beginGenerationSession();
    const isActive = () =>
      !signal.aborted && episodeKey(episodeNumber, episodeSlug) === sessionKey;

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
    if (isActive()) {
      setScript("");
      setGenerated(false);
      setOutOfSync(false);
      alertedOutlineRef.current = "";
    }
    setReconciling(needsReconcile);
    setUpdatingSections([]);

    function restorePreviousScript() {
      if (!isActive()) return;
      setScript(previousScript);
      latestScriptRef.current = previousScript;
      setGenerated(previousGenerated);
    }

    try {
      const res = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal,
        body: JSON.stringify({
          plan: targetPlan,
          streaming: true,
          reconcile: needsReconcile,
          existingScript: needsReconcile ? previousScript : undefined,
        }),
      });

      if (!res.ok) {
        if (signal.aborted) return;
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
        if (!signal.aborted) {
          window.alert("台本生成の応答形式が不正です。しばらく待ってから再試行してください。");
          restorePreviousScript();
        }
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let full = "";
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        if (signal.aborted) break;
        full += decoder.decode(value, { stream: true });
        if (!looksLikeHtmlErrorPage(full) && isActive()) {
          setScript(full);
        }
      }

      if (signal.aborted) return;

      if (!full.trim() || looksLikeHtmlErrorPage(full)) {
        window.alert(
          "台本生成中にサーバーエラーが発生しました。Vercel の ANTHROPIC_API_KEY 設定と Redeploy を確認してください。",
        );
        restorePreviousScript();
        return;
      }

      const cleaned = cleanScript(full);
      if (isActive()) {
        setScript(cleaned);
        latestScriptRef.current = cleaned;
        setGenerated(true);
        prevOutlineRef.current = targetPlan.outline?.map((o) => o.section) ?? [];
      }

      if (targetNumber && targetSlug && cleaned.trim()) {
        await persistEpisodeScript(
          targetNumber,
          targetSlug,
          targetPlan,
          cleaned,
          "generation",
        );
        await autoRecordSnapshotForEpisode(
          targetNumber,
          targetSlug,
          targetPlan,
          previousScript,
          cleaned,
        );
        onScriptCreated?.();
      }
    } catch (err) {
      if (signal.aborted) return;
      window.alert("台本生成中に通信エラーが発生しました。ネットワークを確認して再試行してください。");
      restorePreviousScript();
    } finally {
      if (isActive()) {
        setLoading(false);
        setReconciling(false);
        setUpdatingSections([]);
      }
    }
  }

  async function runIncrementalUpdate(forcedIndices?: number[]) {
    if (!plan?.outline?.length || !script.trim()) return;

    const targetNumber = episodeNumber;
    const targetSlug = episodeSlug;
    const targetPlan = plan;
    const sessionKey = episodeKey(targetNumber, targetSlug);
    const signal = beginGenerationSession();
    const isActive = () => isGenerationSessionActive(signal, targetNumber, targetSlug);

    const previousScript = script;
    const previousPlan = parsePlanFingerprint(scriptMeta?.planFingerprint);
    const previousOutline = previousPlan?.outline;
    const removedNames = getRemovedSectionNames(previousOutline, targetPlan.outline);
    const indices =
      forcedIndices ??
      collectSectionIndicesToRegenerate(previousOutline, targetPlan.outline);

    let workingScript = script;
    if (removedNames.length) {
      workingScript = buildScriptFromSections(
        targetPlan.outline,
        splitScriptIntoSections(workingScript, targetPlan.outline),
      );
    }

    if (!isScriptOutlineInSync(workingScript, targetPlan.outline)) {
      workingScript = syncScriptHeadersByIndex(workingScript, targetPlan.outline);
    }

    if (!indices.length) {
      if (workingScript !== previousScript) {
        const cleaned = cleanScript(workingScript);
        if (isActive()) {
          setScript(cleaned);
          latestScriptRef.current = cleaned;
        }
        if (targetNumber && targetSlug) {
          await persistEpisodeScript(targetNumber, targetSlug, targetPlan, cleaned, "generation");
          await autoRecordSnapshotForEpisode(
            targetNumber,
            targetSlug,
            targetPlan,
            previousScript,
            cleaned,
          );
          onScriptCreated?.();
        }
      } else {
        window.alert("構成（目次案と詳細）に変更がないため、更新対象がありません。");
      }
      return;
    }

    setLoading(true);
    setReconciling(true);
    setUpdatingSections(indices);
    const interim = cleanScript(workingScript);
    if (isActive()) {
      setScript(interim);
      latestScriptRef.current = interim;
    }

    try {
      const currentSections = splitScriptIntoSections(workingScript, targetPlan.outline);
      const sectionBodies: Record<string, string> = {};
      currentSections.forEach((section, index) => {
        sectionBodies[String(index)] = section.body;
      });

      const res = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal,
        body: JSON.stringify({
          mode: "sections",
          plan: targetPlan,
          sectionIndices: indices,
          sectionBodies,
          scriptHeaders: extractScriptHeaders(workingScript),
        }),
      });

      if (signal.aborted) return;

      const data = await res.json();
      if (!res.ok) {
        window.alert(data.error ?? "セクション更新に失敗しました");
        return;
      }

      const updates = new Map<number, string>();
      for (const [index, body] of Object.entries(data.sections ?? {})) {
        updates.set(Number(index), String(body));
      }

      let merged = replaceScriptSections(workingScript, targetPlan.outline, updates);
      merged = cleanScript(merged);
      if (isActive()) {
        setScript(merged);
        latestScriptRef.current = merged;
        setGenerated(true);
        prevOutlineRef.current = targetPlan.outline.map((o) => o.section);
      }

      if (targetNumber && targetSlug) {
        await persistEpisodeScript(targetNumber, targetSlug, targetPlan, merged, "generation");
        await autoRecordSnapshotForEpisode(
          targetNumber,
          targetSlug,
          targetPlan,
          previousScript,
          merged,
        );
        onScriptCreated?.();
      }
    } catch (err) {
      if (signal.aborted) return;
      window.alert("セクション更新中に通信エラーが発生しました。");
    } finally {
      if (isActive()) {
        setLoading(false);
        setReconciling(false);
        setUpdatingSections([]);
      }
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

  async function handleRegenerateSelection(payload: SelectionRegeneratePayload): Promise<string> {
    if (!plan) throw new Error("企画書がありません");

    const res = await fetch("/api/generate-script", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "selection",
        plan,
        selection: payload.selection,
        before: payload.before,
        after: payload.after,
        sectionHeading: payload.sectionHeading,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error ?? "選択部分の再生成に失敗しました");
    }

    const replacement = String(data.replacement ?? "").trim();
    if (!replacement) {
      throw new Error("再生成結果が空でした");
    }
    return replacement;
  }

  async function handleSelectionRegenerated(beforeContent: string, afterContent: string) {
    setScript(cleanScript(afterContent));
    latestScriptRef.current = afterContent;
    setGenerated(true);
    if (episodeNumber && episodeSlug) {
      await handleSave(afterContent, "manual");
      await autoRecordSnapshot(beforeContent, afterContent);
    }
  }

  async function handleManualPlanSync() {
    const content = latestScriptRef.current;
    if (!content.trim() || !plan) return;
    confirmPlanScriptBaseline(plan);

    if (versionsEnabled && episodeNumber && episodeSlug) {
      const res = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-recorded-plan",
          number: episodeNumber,
          slug: episodeSlug,
          planFingerprint: planGenerationFingerprint(plan),
        }),
      }).catch(() => null);
      const data = res ? await res.json().catch(() => ({})) : {};
      await refreshRecordBaseline({
        scriptMeta: ((data as { scriptMeta?: ScriptMeta | null }).scriptMeta ?? null) as ScriptMeta | null,
        planFingerprint: planGenerationFingerprint(plan),
        savePlan: plan,
      });
    }
  }

  async function handleSave(
    content: string,
    source: "generation" | "manual" = "manual",
    options?: { syncPlanFingerprint?: boolean },
  ) {
    if (!episodeNumber) return;
    await persistEpisodeScript(episodeNumber, episodeSlug, plan, content, source, options);
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
  const needsPlanRegenerate =
    pendingSectionUpdates.length > 0 || pendingRemovals.length > 0;
  const showOutlineNotice = needsPlanRegenerate || outOfSync;
  const canRegenerate = !generated || needsPlanRegenerate;
  const regenerateDisabled = loading || (generated && !canRegenerate);

  const updatingSectionLabels = updatingSections
    .map((index) => plan.outline[index]?.section)
    .filter(Boolean);

  const generationStatus: GenerationStatus | undefined = loading
    ? {
        active: true,
        kind: updatingSections.length > 0 ? "sections" : "full",
        title:
          updatingSections.length > 0
            ? `セクションを再生成中（${updatingSections.length}件）`
            : script.trim()
            ? "AIが台本を執筆中"
            : "台本を生成中",
        detail:
          updatingSections.length > 0
            ? updatingSectionLabels.join("、")
            : script.trim()
            ? "本文がリアルタイムで反映されています。完了までそのままお待ちください。"
            : "構成に沿って執筆しています。しばらくお待ちください。",
        streaming: updatingSections.length === 0 && !!script.trim(),
      }
    : undefined;

  const loadingBannerTitle =
    updatingSections.length > 0
      ? `変更セクション（${updatingSections.length}件）を再生成中`
      : script.trim()
      ? "AIが台本を執筆中（リアルタイム反映）"
      : reconciling
      ? "構成の変更を反映中"
      : "台本を生成中";

  const loadingBannerDetail =
    updatingSections.length > 0
      ? updatingSectionLabels.join("、")
      : script.trim()
      ? "完了するまで編集は一時停止されます"
      : "AIが企画書から台本を書いています";

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
                className={scriptUnrecorded ? scriptBtnRecordPending : scriptBtnSecondary}
                title={
                  scriptUnrecorded
                    ? "前回の記録から変更があります。クリックして記録してください"
                    : "現在の台本をバージョンとして記録"
                }
              >
                記録{scriptUnrecorded ? " *" : ""}
              </button>
              <button
                type="button"
                onClick={() => setHistoryOpen(true)}
                disabled={loading}
                className={scriptBtnSecondary}
              >
                履歴
              </button>
            </>
          )}
          {generated && showOutlineNotice && !loading && (
            <button
              type="button"
              onClick={() => void handleManualPlanSync()}
              className={scriptBtnSecondary}
              title="台本を手直し済みとして、目次案と詳細とのズレ通知を消す"
            >
              手動で反映
            </button>
          )}
          <button
            onClick={() => handleGenerate()}
            disabled={regenerateDisabled}
            title={
              regenerateDisabled && generated && !loading
                ? "構成（目次案と詳細）に変更がないため再生成できません"
                : undefined
            }
            className={
              regenerateDisabled
                ? scriptBtnDisabled
                : needsPlanRegenerate
                ? scriptBtnPrimaryOrange
                : generated
                ? scriptBtnPrimaryOrange
                : scriptBtnPrimaryBlueFill
            }
          >
            {loading
              ? updatingSections.length > 0
                ? `再生成中（${updatingSections.length}件）…`
                : script.trim()
                ? "執筆中…"
                : "生成中…"
              : needsPlanRegenerate
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

      {loading && (
        <div className="analysis-loading-panel bg-blue-50 border-b border-blue-100 px-4 py-2.5">
          <div className="flex items-start gap-2.5">
            <div className="script-loading-spinner w-3.5 h-3.5 rounded-full border-2 border-blue-200 border-t-blue-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-blue-800 analysis-loading-text">{loadingBannerTitle}</p>
              {loadingBannerDetail && (
                <p className="text-[10px] text-blue-600 mt-0.5 truncate">{loadingBannerDetail}</p>
              )}
            </div>
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
            generationStatus={generationStatus}
            onRegenerateSelection={
              generated && !loading ? handleRegenerateSelection : undefined
            }
            onSelectionRegenerated={(before, after) => void handleSelectionRegenerated(before, after)}
            onSave={(content) => {
              latestScriptRef.current = content;
              handleSave(content);
            }}
            onRevisionEntered={onRevisionEntered}
            onRevisionCleared={onRevisionCleared}
            onDraftChange={handleDraftChange}
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
            planFingerprint={plan ? planGenerationFingerprint(plan) : undefined}
            onCommitted={(result) =>
              void refreshRecordBaseline({
                recordedContent: result.recordedContent,
                scriptMeta: result.scriptMeta,
                planFingerprint: result.planFingerprint,
                savePlan: plan,
              })
            }
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
