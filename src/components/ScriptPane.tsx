"use client";

import { useEffect, useRef, useState } from "react";
import { ScriptEditor } from "./ScriptEditor";

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
  onScriptSaved: () => void;
  onRegister: (content: string) => Promise<void>;
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

export function ScriptPane({ plan, episodeNumber, episodeSlug, onScriptSaved, onRegister }: Props) {
  const [script, setScript] = useState("");
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);
  const latestScriptRef = useRef<string>("");

  useEffect(() => {
    if (!episodeNumber || !episodeSlug) return;
    fetch(`/api/files?action=read&number=${episodeNumber}&slug=${episodeSlug}&filename=01-script-draft.md`)
      .then((r) => r.json())
      .then((d) => {
        if (d.content) {
          const cleaned = cleanScript(d.content);
          setScript(cleaned);
          latestScriptRef.current = cleaned;
          setGenerated(true);
        }
      });
  }, [episodeNumber, episodeSlug]);

  async function handleGenerate() {
    if (!plan) return;
    setLoading(true);
    setScript("");
    setGenerated(false);
    setRegistered(false);

    const res = await fetch("/api/generate-script", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, streaming: true }),
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
    setLoading(false);
  }

  async function handleSave(content: string) {
    if (!episodeNumber) return;
    latestScriptRef.current = content;
    await fetch("/api/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "write",
        number: episodeNumber,
        slug: episodeSlug,
        filename: "01-script-draft.md",
        content,
      }),
    });
    onScriptSaved();
  }

  async function handleRegister() {
    if (!generated || registering) return;
    setRegistering(true);
    // まず現在のスクリプトを保存してからエピソード登録
    await handleSave(latestScriptRef.current);
    await onRegister(latestScriptRef.current);
    setRegistered(true);
    setRegistering(false);
  }

  if (!plan) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-3">📝</div>
          <p className="text-sm">企画書を作成すると台本を生成できます</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* ヘッダー */}
      <div className="h-[52px] px-4 border-b border-gray-200 bg-white flex items-center gap-2 min-w-0">
        <h2 className="text-sm font-semibold text-gray-700 shrink-0">台本</h2>
        <span className="text-gray-300 text-sm shrink-0">/</span>
        <p className="text-xs text-gray-400 truncate flex-1 min-w-0">{plan.episodeTitle}</p>
        <div className="flex items-center gap-2 shrink-0">
          {/* 登録ボタン */}
          {generated && (
            <button
              onClick={handleRegister}
              disabled={registering || registered}
              className={`text-xs font-medium px-3 py-1 rounded-md border transition-all ${
                registered
                  ? "border-green-300 bg-green-50 text-green-700 cursor-default"
                  : registering
                  ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                  : "border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:text-gray-800 active:scale-[0.97]"
              }`}
            >
              {registered ? "✓ 登録済み" : registering ? "登録中…" : "登録"}
            </button>
          )}
          {/* 生成ボタン */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className={`text-xs font-medium px-3 py-1 rounded-md transition-colors ${
              loading
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : generated
                ? "bg-orange-500 text-white hover:bg-orange-600"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            {loading ? "生成中…" : generated ? "再生成" : "台本を生成"}
          </button>
        </div>
      </div>

      {loading && (
        <div className="bg-blue-50 border-b border-blue-100 px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            <span className="text-xs text-blue-600">AI が台本を執筆中…リアルタイムで表示されます</span>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {script || loading ? (
          <ScriptEditor
            script={script}
            episodeTitle={plan.episodeTitle}
            onSave={(content) => {
              latestScriptRef.current = content;
              handleSave(content);
            }}
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
