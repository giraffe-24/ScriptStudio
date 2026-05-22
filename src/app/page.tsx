"use client";

import { useRef, useState } from "react";
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
  const [inferringPlan, setInferringPlan] = useState(false);
  const [titleOverride, setTitleOverride] = useState<{ id: string; title: string } | undefined>(undefined);
  const titleSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      // plan.json を保存
      await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "write-plan",
          number: data.episode.number,
          slug: data.episode.slug,
          plan,
        }),
      });
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

  async function handleEpisodeSelect(ep: Episode) {
    setSelectedEpisode(ep);
    setNewEpisodeMode(false);
    setSelectedCandidate(null);
    setCurrentPlan(null);
    setTitleOverride(undefined);

    // plan.json を読み込む。なければ台本から推論して保存
    const planRes = await fetch(`/api/files?action=read-plan&number=${ep.number}&slug=${ep.slug}`);
    const planData = await planRes.json();
    if (planData.plan) {
      setCurrentPlan(planData.plan as Plan);
      return;
    }

    // plan.json が存在しない場合、台本から推論
    const scriptRes = await fetch(
      `/api/files?action=read&number=${ep.number}&slug=${ep.slug}&filename=01-script-draft.md`
    );
    const scriptData = await scriptRes.json();
    if (!scriptData.content) return;

    setInferringPlan(true);
    try {
      const inferRes = await fetch("/api/infer-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: scriptData.content, title: ep.title }),
      });
      const inferData = await inferRes.json();
      if (inferData.plan) {
        setCurrentPlan(inferData.plan as Plan);
        // 次回以降のためにキャッシュ保存
        await fetch("/api/files", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "write-plan",
            number: ep.number,
            slug: ep.slug,
            plan: inferData.plan,
          }),
        });
      }
    } finally {
      setInferringPlan(false);
    }
  }

  function handleScriptSaved() {
    setEpisodeRefreshKey((k) => k + 1);
  }

  function handleTitleChange(title: string) {
    // 企画書・台本ヘッダーを即時更新
    if (currentPlan) setCurrentPlan({ ...currentPlan, episodeTitle: title });

    // エピソード一覧をリアルタイム更新
    if (selectedEpisode) {
      setTitleOverride({ id: selectedEpisode.id, title });

      // manifest への書き込みは 800ms デバウンス
      if (titleSaveTimer.current) clearTimeout(titleSaveTimer.current);
      titleSaveTimer.current = setTimeout(async () => {
        await fetch("/api/files", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update-title",
            number: selectedEpisode.number,
            slug: selectedEpisode.slug,
            title,
          }),
        });
      }, 800);
    }
  }

  async function handleRegister() {
    // エピソードがまだ存在しない場合は新規作成
    if (!selectedEpisode) {
      const listRes = await fetch("/api/files?action=list");
      const listData = await listRes.json();
      const maxNumber = Math.max(0, ...listData.episodes.map((e: Episode) => e.number));
      const title = currentPlan?.episodeTitle ?? "untitled";
      const res = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          episode: {
            id: String(maxNumber + 1),
            number: maxNumber + 1,
            slug: title.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").slice(0, 30) || `episode-${maxNumber + 1}`,
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
    }
    setEpisodeRefreshKey((k) => k + 1);
  }

  const showWorkspace = newEpisodeMode || selectedEpisode;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 font-sans">
      {/* Pane 1: エピソード一覧 */}
      <div className="w-52 shrink-0 border-r border-gray-200 overflow-hidden flex flex-col">
        <EpisodeList
          selectedId={selectedEpisode?.id ?? null}
          titleOverride={titleOverride}
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
            <div className="h-[52px] px-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">テーマ選定</h2>
              <button
                onClick={handleNewEpisode}
                className="text-xs text-gray-400 hover:text-blue-500 border border-gray-200 hover:border-blue-300 px-2 py-1 rounded-md transition-colors"
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
            <div className="h-[52px] px-4 border-b border-gray-200 bg-white flex items-center gap-2 min-w-0">
              <h2 className="text-sm font-semibold text-gray-700 shrink-0">企画書</h2>
              {(selectedCandidate || currentPlan) && (
                <>
                  <span className="text-gray-300 text-sm shrink-0">/</span>
                  <p className="text-xs text-gray-400 truncate">
                    {selectedCandidate?.title ?? currentPlan?.episodeTitle ?? ""}
                  </p>
                </>
              )}
              {inferringPlan && (
                <span className="ml-auto text-xs text-blue-400 animate-pulse shrink-0">台本から企画書を復元中…</span>
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              {inferringPlan ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <div className="text-3xl mb-3 animate-pulse">📋</div>
                    <p className="text-sm">台本から企画書を復元しています…</p>
                  </div>
                </div>
              ) : (
                <PlanningDoc
                  candidate={selectedCandidate}
                  plan={currentPlan}
                  onPlanReady={handlePlanReady}
                  onTitleChange={handleTitleChange}
                />
              )}
            </div>
          </div>

          {/* Pane 4: 台本 */}
          <div className="flex-1 bg-white overflow-hidden flex flex-col">
            <ScriptPane
              plan={currentPlan}
              episodeNumber={selectedEpisode?.number ?? null}
              episodeSlug={selectedEpisode?.slug ?? ""}
              onScriptSaved={handleScriptSaved}
              onRegister={handleRegister}
            />
          </div>
        </div>
      )}
    </div>
  );
}
