"use client";

import { useState } from "react";
import { EpisodeList } from "@/components/EpisodeList";
import { PatternSelector } from "@/components/PatternSelector";
import { ThemeInput } from "@/components/ThemeInput";
import { PlanningDoc } from "@/components/PlanningDoc";
import { ScriptPane } from "@/components/ScriptPane";
import type { Episode, ThemeCandidate, ThemePattern } from "@/lib/types";

interface Plan {
  episodeTitle: string;
  targetViewer?: string;
  pain?: string;
  promise?: string;
  keyPoints?: string[];
  outline?: { section: string; content: string }[];
  competitorAnalysis?: string;
  estimatedLength?: string;
}

export default function Home() {
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [pattern, setPattern] = useState<ThemePattern>("market");
  const [selectedCandidate, setSelectedCandidate] = useState<ThemeCandidate | null>(null);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [episodeRefreshKey, setEpisodeRefreshKey] = useState(0);
  const [newEpisodeMode, setNewEpisodeMode] = useState(false);
  const [creatingEpisode, setCreatingEpisode] = useState(false);

  async function handlePlanReady(plan: Plan, title: string) {
    if (!selectedEpisode && !creatingEpisode) {
      setCreatingEpisode(true);
      const listRes = await fetch("/api/files?action=list");
      const listData = await listRes.json();
      const maxNumber = Math.max(0, ...listData.episodes.map((e: Episode) => e.number));

      const res = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          episode: {
            id: String(maxNumber + 1),
            number: maxNumber + 1,
            slug:
              title
                .toLowerCase()
                .replace(/[^\w\s-]/g, "")
                .replace(/\s+/g, "-")
                .slice(0, 30) || `episode-${maxNumber + 1}`,
            title,
            status: "scripting",
            themePattern: pattern,
            hook: selectedCandidate?.hook,
            targetPain: selectedCandidate?.targetPain,
            reason: selectedCandidate?.reason,
          },
        }),
      });
      const data = await res.json();
      setSelectedEpisode(data.episode);
      setEpisodeRefreshKey((k) => k + 1);
      setCreatingEpisode(false);
    }
    setCurrentPlan(plan);
    setNewEpisodeMode(false);
  }

  function handleNewEpisode() {
    setSelectedEpisode(null);
    setSelectedCandidate(null);
    setCurrentPlan(null);
    setNewEpisodeMode(true);
  }

  function handleEpisodeSelect(ep: Episode) {
    setSelectedEpisode(ep);
    setNewEpisodeMode(false);
    setSelectedCandidate(null);
    setCurrentPlan(null);
  }

  function handleScriptSaved() {
    setEpisodeRefreshKey((k) => k + 1);
  }

  const showWorkspace = newEpisodeMode || selectedEpisode;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 font-sans">
      {/* Pane 1: エピソード一覧 */}
      <div className="w-52 shrink-0 border-r border-gray-200 overflow-hidden flex flex-col">
        <EpisodeList
          selectedId={selectedEpisode?.id ?? null}
          onSelect={handleEpisodeSelect}
          refreshKey={episodeRefreshKey}
        />
      </div>

      {!showWorkspace ? (
        /* ウェルカム画面 */
        <div className="flex-1 flex items-center justify-center bg-white">
          <div className="text-center max-w-sm">
            <div className="text-6xl mb-6">🎬</div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">YT_TalkScript Studio</h2>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              企画からトークスクリプトまでを
              <br />
              AI と一緒に作成できます
            </p>
            <button
              onClick={handleNewEpisode}
              className="bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition-colors font-medium text-sm"
            >
              ＋ 新しい企画を始める
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Pane 2: テーマ選定 */}
          <div className="w-80 shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-bold text-sm text-gray-700">テーマ選定</h2>
              <button
                onClick={handleNewEpisode}
                className="text-[11px] text-gray-400 hover:text-blue-500 border border-gray-200 hover:border-blue-300 px-2 py-0.5 rounded-full transition-colors"
              >
                ＋ 新規
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <PatternSelector
                pattern={pattern}
                onChange={(p) => {
                  setPattern(p);
                  setSelectedCandidate(null);
                }}
              />
              <ThemeInput pattern={pattern} onSelect={(c) => setSelectedCandidate(c)} />
            </div>
          </div>

          {/* Pane 3: 企画書 */}
          <div className="flex-1 border-r border-gray-200 bg-gray-50 overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 bg-white">
              <h2 className="font-bold text-sm text-gray-700">企画書</h2>
              {selectedCandidate && (
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{selectedCandidate.title}</p>
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <PlanningDoc candidate={selectedCandidate} onPlanReady={handlePlanReady} />
            </div>
          </div>

          {/* Pane 4: 台本 */}
          <div className="flex-1 bg-white overflow-hidden flex flex-col">
            <ScriptPane
              plan={currentPlan}
              episodeNumber={selectedEpisode?.number ?? null}
              episodeSlug={selectedEpisode?.slug ?? ""}
              onScriptSaved={handleScriptSaved}
            />
          </div>
        </div>
      )}
    </div>
  );
}
