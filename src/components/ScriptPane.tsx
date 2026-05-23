"use client";

import { useEffect, useRef, useState } from "react";
import { ScriptEditor } from "./ScriptEditor";
import type { ScriptMeta } from "@/lib/file-manager";
import { planGenerationFingerprint } from "@/lib/plan-fingerprint";
import {
  extractScriptHeaders,
  isScriptOutlineInSync,
  syncScriptHeadersByIndex,
} from "@/lib/script-outline";

interface Plan {
  episodeTitle: string;
  youtubeGoal?: string;
  targetViewer?: string;
  pain?: string;
  promise?: string;
  keyPoints?: string[];
  outline?: { section: string; content: string }[];
  competitorAnalysis?: string;
  estimatedLength?: string;
}

interface Props {
  plan: Plan | null;
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
  const [scriptMeta, setScriptMeta] = useState<ScriptMeta | null>(null);
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

  // エピソード選択時のみディスクから読み込み
  useEffect(() => {
    const episodeKey = episodeNumber && episodeSlug ? `${episodeNumber}-${episodeSlug}` : "";
    if (!episodeKey) return;
    if (loadedEpisodeKeyRef.current === episodeKey) return;

    loadedEpisodeKeyRef.current = episodeKey;
    fetch(`/api/files?action=read&number=${episodeNumber}&slug=${episodeSlug}&filename=01-script-draft.md`)
      .then((r) => r.json())
      .then((d) => {
        if (d.content) {
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

  async function handleGenerate(options?: { fromPlan?: boolean }) {
    if (!plan || loading) return;

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

    const res = await fetch("/api/generate-script", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan,
        streaming: true,
        reconcile: needsReconcile,
        existingScript: needsReconcile ? script : undefined,
      }),
    });

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let full = "";
    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      full += decoder.decode(value, { stream: true });
      setScript(full);
    }
    const cleaned = cleanScript(full);
    setScript(cleaned);
    latestScriptRef.current = cleaned;
    setGenerated(true);
    prevOutlineRef.current = plan.outline?.map((o) => o.section) ?? [];
    setLoading(false);
    setReconciling(false);

    if (episodeNumber && episodeSlug && cleaned.trim()) {
      await handleSave(cleaned, "generation");
      onScriptCreated?.();
    }
  }

  async function handleSave(content: string, source: "generation" | "manual" = "manual") {
    if (!episodeNumber) return;
    latestScriptRef.current = content;
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
        planFingerprint: source === "generation" && plan ? planGenerationFingerprint(plan) : undefined,
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

  const currentPlanFingerprint = plan ? planGenerationFingerprint(plan) : "";
  const planChanged =
    !!scriptMeta?.planFingerprint && scriptMeta.planFingerprint !== currentPlanFingerprint;
  const canRegenerate = !generated || outOfSync || planChanged;
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
          <button
            onClick={() => handleGenerate()}
            disabled={regenerateDisabled}
            title={
              regenerateDisabled && generated && !loading
                ? "企画書に変更がないため再生成できません"
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
            {loading ? "生成中…" : outOfSync ? "構成を反映して再生成" : generated ? "再生成" : "台本を生成"}
          </button>
        </div>
      </div>

      {outOfSync && !loading && (
        <div className="bg-red-50 border-b border-red-100 px-4 py-2">
          <p className="text-xs text-red-600">
            更新されていません。再生成してください（新しい構成を反映して全体を書き直します）
          </p>
        </div>
      )}

      {loading && (
        <div className="bg-blue-50 border-b border-blue-100 px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            <span className="text-xs text-blue-600">
              {reconciling
                ? "最新の構成を反映して台本を再チェック・再出力中…"
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
    </div>
  );
}
