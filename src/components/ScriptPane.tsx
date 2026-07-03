"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  ScriptEditor,
  ScriptSpinner,
  type GenerationStatus,
  type SelectionRegeneratePayload,
} from "./ScriptEditor";
import { SnapshotCommitModal, type CommitDoc } from "./SnapshotCommitModal";
import { HistoryModal } from "./HistoryModal";
import { GitHistoryModal } from "./GitHistoryModal";
import { useGitMirrorStatus } from "@/lib/useGitMirrorStatus";
import { useReadOnly } from "@/lib/useViewerRole";
import { DEMO_AI_NOTICE, buildDemoScript, demoDelay } from "@/lib/demo-simulation";
import { toUserMessage } from "@/lib/error-message";
import {
  scriptBtnAbort,
  scriptBtnDisabled,
  scriptBtnPrimaryBlueFill,
  scriptBtnPrimaryOrange,
  scriptBtnSecondary,
} from "./script-toolbar-styles";
import { cn } from "@/lib/utils";
import type { ScriptMeta } from "@/lib/file-manager";
import type { EpisodePlan } from "@/lib/types";
import { planGenerationFingerprint } from "@/lib/plan-fingerprint";
import { sanitizePlanOutline } from "@/lib/plan-outline";
import type { PlanVersionsState } from "@/lib/usePlanVersions";
import {
  parsePlanSnapshotContent,
  planSnapshotContentToText,
} from "@/lib/plan-snapshot-text";
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
  /** 統合履歴モーダルから企画書の版を復元するときに使う（PlanningDoc と同じハンドラを渡す） */
  onPlanChange?: (plan: EpisodePlan) => void;
  onTitleChange?: (title: string) => void;
  /** 企画書スナップショットの状態（統合保存で企画書もまとめて記録するために使う） */
  planCommit?: PlanVersionsState;
  /** 統合保存モーダルの開閉通知（表示中は企画書の自動記録を止める） */
  onCommitOpenChange?: (open: boolean) => void;
}

/** 企画書/台本の種別バッジ配色（統合履歴・統合保存モーダルで共通） */
const PLAN_BADGE = "bg-blue-100 text-blue-700";
const SCRIPT_BADGE = "bg-amber-100 text-amber-700";

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
  onPlanChange,
  onTitleChange,
  planCommit,
  onCommitOpenChange,
}: Props) {
  // 閲覧専用ログインでは保存・生成系の導線を出さない（サーバー側でも 403 で遮断される）
  const viewerReadOnly = useReadOnly();
  const [script, setScript] = useState("");
  const [loading, setLoading] = useState(false);
  // エピソード切替時にディスクから台本を読み込み中かどうか。
  const [scriptLoading, setScriptLoading] = useState(false);
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
  const [gitHistoryOpen, setGitHistoryOpen] = useState(false);
  const gitMirrorConfigured = useGitMirrorStatus();
  // 統合保存モーダルに渡す保存対象（開くたびに未保存の doc だけを組み立てる）
  const [commitDocs, setCommitDocs] = useState<CommitDoc[]>([]);
  const latestScriptRef = useRef<string>("");
  const prevOutlineRef = useRef<string[] | null>(null);
  const alertedOutlineRef = useRef<string>("");
  const confirmedPlanFingerprintRef = useRef<string | null>(null);
  const lastGenerateKeyRef = useRef(0);
  const generationAbortRef = useRef<AbortController | null>(null);
  // 生成系の失敗・通知をインライン表示するバナー（window.alert の置き換え）
  const [genAlert, setGenAlert] = useState<{
    message: string;
    tone: "error" | "info";
    retry?: () => void;
  } | null>(null);

  function episodeKey(number: number | null, slug: string): string {
    return number && slug ? `${number}-${slug}` : "";
  }

  function abortActiveGeneration() {
    generationAbortRef.current?.abort();
    generationAbortRef.current = null;
  }

  function handleAbortGeneration() {
    abortActiveGeneration();
    setLoading(false);
    setReconciling(false);
    setUpdatingSections([]);
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshVersionsStatus();
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (generated) void refreshVersionsStatus();
  }, [generated]);

  useEffect(() => {
    if (!versionsEnabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

  function setCommitModalOpen(open: boolean) {
    setCommitOpen(open);
    onCommitOpenChange?.(open); // 表示中は企画書の自動記録を止める
  }

  // 統合保存：企画書・台本のうち未保存のものだけを 1 つのモーダルでまとめて記録する
  async function openCommitModal() {
    if (!episodeNumber || !episodeSlug) return;
    const docs: CommitDoc[] = [];

    // 企画書 → 台本 の順（ペインの並び・ワークフロー順に合わせる）
    if (planCommit?.enabled && planCommit.unrecorded && plan) {
      docs.push({
        key: "plan",
        label: "企画書",
        badgeClass: PLAN_BADGE,
        endpoint: "/api/plan-versions",
        currentContent: planCommit.planText,
        previousContent: planCommit.recordedPlanText,
        contentToStore: JSON.stringify(plan, null, 2),
        onCommitted: () => void planCommit.refresh(),
      });
    }

    if (generated && scriptUnrecorded && latestScriptRef.current.trim()) {
      const res = await fetch(
        `/api/script-versions?action=latest&number=${episodeNumber}&slug=${encodeURIComponent(episodeSlug)}`,
      );
      const data = await res.json();
      if (!res.ok) {
        setGenAlert({ message: toUserMessage(data.error, "最新の記録を取得できませんでした。"), tone: "error" });
        return;
      }
      docs.push({
        key: "script",
        label: "台本",
        badgeClass: SCRIPT_BADGE,
        endpoint: "/api/script-versions",
        currentContent: latestScriptRef.current,
        previousContent: data.snapshot?.content ?? "",
        planFingerprint: plan ? planGenerationFingerprint(plan) : undefined,
        onCommitted: (result) =>
          void refreshRecordBaseline({
            recordedContent: result.recordedContent,
            scriptMeta: result.scriptMeta,
            planFingerprint: result.planFingerprint,
            savePlan: plan,
          }),
      });
    }

    if (docs.length === 0) return;
    setCommitDocs(docs);
    setCommitModalOpen(true);
  }

  async function handleRestoreSnapshot(content: string) {
    if (!episodeNumber) throw new Error("エピソードが選択されていません");
    const displayContent = cleanScript(content);
    setScript(displayContent);
    latestScriptRef.current = content;
    // 統合履歴は台本生成前でも開けるため、復元した台本が編集画面に出るようにする
    if (displayContent.trim()) setGenerated(true);
    await handleSave(content);
    await refreshRecordBaseline();
  }

  // 統合履歴モーダルからの企画書復元（PlanningDoc の復元処理と同じ変換を通す）
  async function handleRestorePlanSnapshot(content: string) {
    const parsed = parsePlanSnapshotContent(content);
    if (!parsed) throw new Error("保存された企画データを読み込めませんでした");
    const restored = sanitizePlanOutline(parsed) ?? parsed;
    onPlanChange?.(restored);
    onTitleChange?.(restored.episodeTitle);
  }

  // エピソード切替時: 状態をリセットしてディスクから読み込み
  useEffect(() => {
    abortActiveGeneration();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(false);
    setReconciling(false);
    setUpdatingSections([]);
    setGenAlert(null);
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
      setScriptLoading(false);
      return;
    }

    let cancelled = false;
    setScriptLoading(true);

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
      })
      .finally(() => {
        if (!cancelled) setScriptLoading(false);
      });

    void loadScriptMeta().then((meta) => {
      if (meta?.planFingerprint) {
        confirmedPlanFingerprintRef.current = meta.planFingerprint;
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setScript(updated);
        latestScriptRef.current = updated;
      }
    }

    prevOutlineRef.current = sections;
  }, [plan?.outline, script, loading]);

  // 構成と台本の不一致を検知（手動で反映済みの企画指紋は確定扱い）
  useEffect(() => {
    if (!plan?.outline || !generated || loading || !script) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error((data as { error?: string }).error ?? "台本の保存に失敗しました");
    }
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
    setGenAlert(null);
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
        const fallback = `台本の生成に失敗しました。少し時間をおいて、もう一度お試しください。`;
        let raw = "";
        try {
          const data = JSON.parse(errText) as { error?: string };
          raw = data.error ?? "";
        } catch {
          if (errText && !looksLikeHtmlErrorPage(errText)) raw = errText;
        }
        setGenAlert({
          message: toUserMessage(raw, fallback),
          tone: "error",
          retry: () => void runFullGeneration(options),
        });
        restorePreviousScript();
        return;
      }

      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("text/plain")) {
        if (!signal.aborted) {
          setGenAlert({
            message: "台本生成の応答形式が不正です。しばらく待ってから再試行してください。",
            tone: "error",
            retry: () => void runFullGeneration(options),
          });
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
        setGenAlert({
          message:
            "台本生成中にサーバーエラーが発生しました。Vercel の ANTHROPIC_API_KEY 設定と Redeploy を確認してください。",
          tone: "error",
          retry: () => void runFullGeneration(options),
        });
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
    } catch {
      if (signal.aborted) return;
      setGenAlert({
        message: "台本生成中に通信エラーが発生しました。ネットワークを確認して再試行してください。",
        tone: "error",
        retry: () => void runFullGeneration(options),
      });
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

    setGenAlert(null);

    const targetNumber = episodeNumber;
    const targetSlug = episodeSlug;
    const targetPlan = plan;
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
        setGenAlert({
          message: "構成（目次案と詳細）に変更がないため、更新対象がありません。",
          tone: "info",
        });
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
        setGenAlert({
          message: toUserMessage(data.error, "セクションの更新に失敗しました。少し時間をおいて、もう一度お試しください。"),
          tone: "error",
          retry: () => void runIncrementalUpdate(forcedIndices),
        });
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
    } catch {
      if (signal.aborted) return;
      setGenAlert({
        message: "セクション更新中に通信エラーが発生しました。",
        tone: "error",
        retry: () => void runIncrementalUpdate(forcedIndices),
      });
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

    if (viewerReadOnly) {
      // 閲覧専用: AI は呼ばず、デモ台本をタイプライター表示で再現する（保存もしない）
      await runDemoGeneration(plan);
      return;
    }

    const fromPlan = options?.fromPlan ?? false;
    const hasExistingScript = generated && !!script.trim();

    if (fromPlan || !hasExistingScript) {
      await runFullGeneration(options);
      return;
    }

    await runIncrementalUpdate();
  }

  /** デモ生成: サンプル台本を少しずつ流し込み、生成の動きだけ再現する（AI・保存なし） */
  async function runDemoGeneration(targetPlan: EpisodePlan) {
    const signal = beginGenerationSession();
    setLoading(true);
    setReconciling(false);
    setUpdatingSections([]);
    setScript("");
    setGenerated(false);
    setGenAlert({ message: DEMO_AI_NOTICE, tone: "info" });

    const full = buildDemoScript(targetPlan);
    const CHUNK = 18;
    for (let i = CHUNK; i < full.length + CHUNK; i += CHUNK) {
      if (signal.aborted) break;
      setScript(full.slice(0, i));
      await demoDelay(35);
    }
    if (!signal.aborted) {
      setScript(full);
      latestScriptRef.current = full;
      setGenerated(true);
    }
    setLoading(false);
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
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? "企画と台本の反映に失敗しました");
      }
      await refreshRecordBaseline({
        scriptMeta: ((data as { scriptMeta?: ScriptMeta | null }).scriptMeta ?? null) as ScriptMeta | null,
        planFingerprint: planGenerationFingerprint(plan),
        savePlan: plan,
      });
    }
    confirmPlanScriptBaseline(plan);
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
          <h2 className="text-sm font-semibold text-gray-700 shrink-0 flex items-center gap-1.5">
            <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
              3
            </span>
            台本
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
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

  const generateLabel = loading
    ? updatingSections.length > 0
      ? `再生成中（${updatingSections.length}件）…`
      : script.trim()
      ? "執筆中…"
      : "生成中…"
    : needsPlanRegenerate
    ? `再生成（${pendingSectionUpdates.length || 1}セクション）`
    : generated
    ? "再生成"
    : "台本を生成";

  const generateClassName = regenerateDisabled
    ? scriptBtnDisabled
    : needsPlanRegenerate
    ? scriptBtnPrimaryOrange
    : generated
    ? scriptBtnPrimaryOrange
    : scriptBtnPrimaryBlueFill;

  const generateTitle =
    regenerateDisabled && generated && !loading
      ? "構成（目次案と詳細）に変更がないため再生成できません"
      : undefined;

  // 閲覧専用: 生成ボタンはデモ再生（AI不使用）として常に押せるようにする
  const genButtonLabel = viewerReadOnly
    ? loading
      ? "デモ生成中…"
      : "デモ生成（AI不使用）"
    : generateLabel;
  const genButtonDisabled = viewerReadOnly ? loading : regenerateDisabled;
  const genButtonClassName = viewerReadOnly
    ? loading
      ? scriptBtnDisabled
      : scriptBtnPrimaryBlueFill
    : generateClassName;
  const genButtonTitle = viewerReadOnly
    ? "画面の動きを再現するデモ生成です。AIは使用しません"
    : generateTitle;

  // 統合保存（企画書＋台本）。企画ペインの保存ボタンを撤去したため、
  // 台本生成前でも企画書だけ保存できるよう generated を条件にしない
  const planSnapshotUnrecorded = Boolean(planCommit?.enabled && planCommit.unrecorded);
  const anySaveUnrecorded = scriptUnrecorded || planSnapshotUnrecorded;
  const unsavedDocsLabel = [
    planSnapshotUnrecorded ? "企画書" : null,
    scriptUnrecorded ? "台本" : null,
  ]
    .filter(Boolean)
    .join("・");
  const showRecordActions =
    !viewerReadOnly &&
    (versionsEnabled || Boolean(planCommit?.enabled)) &&
    Boolean(episodeNumber) &&
    Boolean(episodeSlug);
  // 統合履歴（企画書＋台本）は台本生成前でも企画書の履歴を見られるよう generated を条件にしない
  const showHistory = versionsEnabled && Boolean(episodeNumber) && Boolean(episodeSlug);
  const showGitHistory = generated && gitMirrorConfigured && Boolean(episodeNumber) && Boolean(episodeSlug);
  const showManualSync = !viewerReadOnly && generated && showOutlineNotice && !loading;

  return (
    <div className="flex flex-col h-full">
      {/* ヘッダー */}
      <div className="h-[52px] px-4 border-b border-gray-200 bg-white flex items-center gap-2 min-w-0">
        <h2 className="text-sm font-semibold text-gray-700 shrink-0">台本</h2>
        <span className="text-gray-300 text-sm shrink-0">/</span>
        <p className="text-xs text-gray-400 truncate flex-1 min-w-0">{plan.episodeTitle}</p>
        {/* md以上: 操作を横並び表示 */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {scriptMeta && generated && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {scriptMeta.updatedBy} · {formatUpdatedAt(scriptMeta.updatedAt)}
            </span>
          )}
          {showRecordActions && (
            <button
              type="button"
              onClick={() => void openCommitModal()}
              disabled={loading || !anySaveUnrecorded}
              className={anySaveUnrecorded ? scriptBtnRecordPending : scriptBtnSecondary}
              title={
                anySaveUnrecorded
                  ? `未保存: ${unsavedDocsLabel}。クリックしてまとめて保存（履歴に記録）`
                  : "前回の保存から変更はありません"
              }
            >
              保存{anySaveUnrecorded ? "（未保存）" : ""}
            </button>
          )}
          {showHistory && (
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              disabled={loading}
              className={scriptBtnSecondary}
              title="企画書・台本の変更履歴をまとめて見る・以前の版に戻す"
            >
              履歴
            </button>
          )}
          {showGitHistory && (
            <button
              type="button"
              onClick={() => setGitHistoryOpen(true)}
              disabled={loading}
              className={scriptBtnSecondary}
              title="Git に記録された過去の版を確認・復元"
            >
              Git履歴
            </button>
          )}
          {showManualSync && (
            <button
              type="button"
              onClick={() => void handleManualPlanSync()}
              className={scriptBtnSecondary}
              title="台本を手直し済みとして、目次案と詳細とのズレ通知を消す"
            >
              手直し済みにする
            </button>
          )}
          {loading ? (
            <button type="button" onClick={handleAbortGeneration} className={scriptBtnAbort}>
              中止
            </button>
          ) : (
            <button
              onClick={() => handleGenerate()}
              disabled={genButtonDisabled}
              title={genButtonTitle}
              className={genButtonClassName}
            >
              {genButtonLabel}
            </button>
          )}
        </div>

      </div>

      {/* スマホ: 操作バー（タブ） */}
      <div className="md:hidden flex items-center gap-2 px-3 py-2 border-b border-gray-200 bg-white overflow-x-auto">
        {loading ? (
          <button
            type="button"
            onClick={handleAbortGeneration}
            className={`${scriptBtnAbort} shrink-0 whitespace-nowrap`}
          >
            中止
          </button>
        ) : (
          <button
            onClick={() => handleGenerate()}
            disabled={genButtonDisabled}
            title={genButtonTitle}
            className={`${genButtonClassName} shrink-0 whitespace-nowrap`}
          >
            {genButtonLabel}
          </button>
        )}
        {showManualSync && (
          <button
            type="button"
            onClick={() => void handleManualPlanSync()}
            className={`${scriptBtnSecondary} shrink-0 whitespace-nowrap`}
          >
            手直し済みにする
          </button>
        )}
        {showRecordActions && (
          <button
            type="button"
            onClick={() => void openCommitModal()}
            disabled={loading || !anySaveUnrecorded}
            className={`${anySaveUnrecorded ? scriptBtnRecordPending : scriptBtnSecondary} shrink-0 whitespace-nowrap`}
            title={anySaveUnrecorded ? `未保存: ${unsavedDocsLabel}` : "前回の保存から変更はありません"}
          >
            保存{anySaveUnrecorded ? "（未保存）" : ""}
          </button>
        )}
        {showHistory && (
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            disabled={loading}
            className={`${scriptBtnSecondary} shrink-0 whitespace-nowrap`}
            title="企画書・台本の変更履歴をまとめて見る・以前の版に戻す"
          >
            履歴
          </button>
        )}
        {showGitHistory && (
          <button
            type="button"
            onClick={() => setGitHistoryOpen(true)}
            disabled={loading}
            className={`${scriptBtnSecondary} shrink-0 whitespace-nowrap`}
            title="Git に記録された過去の版を確認・復元"
          >
            Git履歴
          </button>
        )}
        {scriptMeta && generated && (
          <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap pl-1">
            {scriptMeta.updatedBy} · {formatUpdatedAt(scriptMeta.updatedAt)}
          </span>
        )}
      </div>

      {genAlert && (
        <div
          role={genAlert.tone === "error" ? "alert" : "status"}
          aria-live="polite"
          className={cn(
            "border-b px-4 py-2 flex items-start gap-2",
            genAlert.tone === "error"
              ? "bg-destructive/10 border-destructive/20 text-destructive"
              : "bg-muted border-border text-foreground",
          )}
        >
          <p className="text-xs leading-relaxed flex-1 min-w-0">{genAlert.message}</p>
          {genAlert.retry && (
            <button
              type="button"
              onClick={() => {
                const retry = genAlert.retry;
                setGenAlert(null);
                retry?.();
              }}
              className="shrink-0 text-xs font-medium underline underline-offset-2 hover:no-underline focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-ring outline-none rounded"
            >
              再試行
            </button>
          )}
          <button
            type="button"
            onClick={() => setGenAlert(null)}
            aria-label="通知を閉じる"
            className="shrink-0 w-8 h-8 -my-1 flex items-center justify-center rounded-md hover:bg-foreground/10 text-lg leading-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-ring outline-none"
          >
            ×
          </button>
        </div>
      )}

      {generated && !versionsEnabled && versionsHint && !loading && (
        <div className="bg-amber-50 border-b border-amber-100 px-4 py-2">
          <p className="text-xs text-amber-700">{versionsHint}</p>
        </div>
      )}

      {loading && (
        <div
          className="analysis-loading-panel bg-blue-50 border-b border-blue-100 px-4 py-2"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-2">
            <ScriptSpinner className="size-3.5 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-blue-800 analysis-loading-text">{loadingBannerTitle}</p>
              {loadingBannerDetail && (
                <p className="text-xs text-blue-700 mt-0.5 truncate">{loadingBannerDetail}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {scriptLoading && !script && !loading ? (
          <div className="h-full flex items-center justify-center" role="status" aria-live="polite">
            <div className="text-center text-gray-500">
              <ScriptSpinner className="size-7 mb-3 mx-auto" />
              <p className="text-sm">台本を読み込んでいます…</p>
            </div>
          </div>
        ) : script || loading ? (
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
              return handleSave(content);
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
          {/* 統合保存：企画書・台本の未保存分をまとめて記録 */}
          <SnapshotCommitModal
            open={commitOpen}
            onOpenChange={setCommitModalOpen}
            episodeTitle={plan.episodeTitle}
            episodeNumber={episodeNumber}
            episodeSlug={episodeSlug}
            docs={commitDocs}
          />
          {/* 企画書と台本の履歴を 1 つのタイムラインで表示（復元は項目ごと） */}
          <HistoryModal
            open={historyOpen}
            onOpenChange={setHistoryOpen}
            episodeTitle={plan.episodeTitle}
            episodeNumber={episodeNumber}
            episodeSlug={episodeSlug}
            sources={[
              {
                key: "plan",
                endpoint: "/api/plan-versions",
                label: "企画書",
                badgeClass: PLAN_BADGE,
                renderContent: planSnapshotContentToText,
                onRestore: handleRestorePlanSnapshot,
              },
              {
                key: "script",
                endpoint: "/api/script-versions",
                label: "台本",
                badgeClass: SCRIPT_BADGE,
                onRestore: handleRestoreSnapshot,
              },
            ]}
          />
          <GitHistoryModal
            open={gitHistoryOpen}
            onOpenChange={setGitHistoryOpen}
            episodeNumber={episodeNumber}
            episodeSlug={episodeSlug}
            filename="01-script-draft.md"
            label="台本"
            onRestore={handleRestoreSnapshot}
          />
        </>
      )}
    </div>
  );
}
