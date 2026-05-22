"use client";

import { useEffect, useState } from "react";
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
}

export function ScriptPane({ plan, episodeNumber, episodeSlug, onScriptSaved }: Props) {
  const [script, setScript] = useState("");
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    if (!episodeNumber || !episodeSlug) return;
    fetch(`/api/files?action=read&number=${episodeNumber}&slug=${episodeSlug}&filename=01-script-draft.md`)
      .then((r) => r.json())
      .then((d) => {
        if (d.content) {
          setScript(d.content);
          setGenerated(true);
        }
      });
  }, [episodeNumber, episodeSlug]);

  async function handleGenerate() {
    if (!plan) return;
    setLoading(true);
    setScript("");
    setGenerated(false);

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
    setGenerated(true);
    setLoading(false);
  }

  async function handleSave(content: string) {
    if (!episodeNumber) return;
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
      <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center justify-between">
        <div>
          <h2 className="font-bold text-sm text-gray-700">台本</h2>
          <p className="text-xs text-gray-400 line-clamp-1">{plan.episodeTitle}</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className={`text-sm font-medium px-4 py-1.5 rounded-lg transition-colors ${
            loading
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : generated
              ? "bg-orange-500 text-white hover:bg-orange-600"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          {loading ? "生成中…" : generated ? "✨ 台本を再生成" : "✨ 台本を生成"}
        </button>
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
          <ScriptEditor script={script} onSave={handleSave} episodeTitle={plan.episodeTitle} />
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
