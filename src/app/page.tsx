"use client";

import { useEffect, useRef, useState } from "react";
import YouTubeIcon from "@image/YouTubeIcon.svg";
import { CompetitorSettingsDialog } from "@/components/CompetitorSettingsDialog";
import { EpisodeList } from "@/components/EpisodeList";
import { PatternSelector } from "@/components/PatternSelector";
import { ThemeInput } from "@/components/ThemeInput";
import { PlanningDoc } from "@/components/PlanningDoc";
import { ScriptPane } from "@/components/ScriptPane";
import type { Episode, EpisodeStatus, ThemeCandidate, ThemePattern } from "@/lib/types";

interface Plan {
  episodeTitle: string;
  targetViewer: string;
  pain: string;
  promise: string;
  keyPoints: string[];
  outline: { section: string; content: string }[];
  competitorAnalysis: string;
  estimatedLength: string;
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
  const [titleOverride, setTitleOverride] = useState<{ slug: string; title: string } | undefined>(undefined);
  const titleSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const numberSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [scriptGenerateKey, setScriptGenerateKey] = useState(0);
  const [nextEpisodeNumber, setNextEpisodeNumber] = useState<number | null>(null);
  const [numberOverride, setNumberOverride] = useState<{ slug: string; number: number } | undefined>(undefined);
  const [statusOverride, setStatusOverride] = useState<{ slug: string; status: EpisodeStatus } | undefined>(undefined);
  const [workspaceResetKey, setWorkspaceResetKey] = useState(0);
  const [planningScriptResetKey, setPlanningScriptResetKey] = useState(0);

  useEffect(() => {
    if (!newEpisodeMode || selectedEpisode) {
      setNextEpisodeNumber(null);
      return;
    }
    fetch("/api/files?action=list")
      .then((r) => r.json())
      .then((d) => {
        const max = Math.max(0, ...(d.episodes ?? []).map((e: Episode) => e.number));
        setNextEpisodeNumber(max + 1);
      })
      .catch(() => setNextEpisodeNumber(null));
  }, [newEpisodeMode, selectedEpisode]);

  async function handlePlanReady(plan: Plan, title: string) {
    let episode = selectedEpisode;

    if (!episode && !creatingEpisode) {
      setCreatingEpisode(true);
      const listRes = await fetch("/api/files?action=list");
      const listData = await listRes.json();
      const maxNumber = Math.max(0, ...listData.episodes.map((e: Episode) => e.number));
      const assignNumber = nextEpisodeNumber ?? maxNumber + 1;

      const res = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          episode: {
            id: String(assignNumber),
            number: assignNumber,
            slug:
              title
                .toLowerCase()
                .replace(/[^\w\s-]/g, "")
                .replace(/\s+/g, "-")
                .slice(0, 30) || `episode-${assignNumber}`,
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
      episode = data.episode;
      setSelectedEpisode(episode);
      setEpisodeRefreshKey((k) => k + 1);
      setCreatingEpisode(false);
    }

    if (episode) {
      await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "write-plan",
          number: episode.number,
          slug: episode.slug,
          plan,
        }),
      });
    }

    setCurrentPlan(plan);
    setNewEpisodeMode(false);
    setScriptGenerateKey((k) => k + 1);
  }

  function resetPlanningAndScript() {
    setSelectedCandidate(null);
    setCurrentPlan(null);
    setScriptGenerateKey(0);
    setSelectedEpisode(null);
    setNewEpisodeMode(true);
    setInferringPlan(false);
    setTitleOverride(undefined);
    setNumberOverride(undefined);
    setStatusOverride(undefined);
    setPlanningScriptResetKey((k) => k + 1);
  }

  function handleNewEpisode() {
    if (titleSaveTimer.current) clearTimeout(titleSaveTimer.current);
    if (numberSaveTimer.current) clearTimeout(numberSaveTimer.current);
    resetPlanningAndScript();
    setWorkspaceResetKey((k) => k + 1);
  }

  function handleAnalysisStart() {
    resetPlanningAndScript();
  }

  async function handleEpisodeSelect(ep: Episode) {
    setSelectedEpisode(ep);
    setNewEpisodeMode(false);
    setSelectedCandidate(null);
    setCurrentPlan(null);
    setTitleOverride(undefined);
    setNumberOverride(undefined);
    setStatusOverride(undefined);

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

  function handleScriptCreated() {
    setEpisodeRefreshKey((k) => k + 1);
  }

  async function handleRevisionEntered() {
    if (!selectedEpisode) return;
    if (selectedEpisode.status === "done") return;
    await handleStatusChange(selectedEpisode, "done");
    setEpisodeRefreshKey((k) => k + 1);
  }

  async function handleRevisionCleared() {
    if (!selectedEpisode) return;
    if (selectedEpisode.status === "scripting") return;
    await handleStatusChange(selectedEpisode, "scripting");
    setEpisodeRefreshKey((k) => k + 1);
  }

  function handlePlanChange(plan: Plan) {
    setCurrentPlan(plan);
  }

  function handleTitleChange(title: string) {
    // 企画書・台本ヘッダーを即時更新
    if (currentPlan) setCurrentPlan({ ...currentPlan, episodeTitle: title });

    // エピソード一覧をリアルタイム更新
    if (selectedEpisode) {
      setTitleOverride({ slug: selectedEpisode.slug, title });

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

  function handleEpisodeNumberChange(newNumber: number) {
    if (selectedEpisode) {
      const slug = selectedEpisode.slug;
      const oldNumber = selectedEpisode.number;

      setSelectedEpisode({ ...selectedEpisode, id: String(newNumber), number: newNumber });
      setNumberOverride({ slug, number: newNumber });

      if (numberSaveTimer.current) clearTimeout(numberSaveTimer.current);
      numberSaveTimer.current = setTimeout(async () => {
        const res = await fetch("/api/files", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update-number",
            oldNumber,
            slug,
            newNumber,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: res.statusText }));
          alert(err.error ?? "番号の更新に失敗しました");
          setSelectedEpisode({ ...selectedEpisode, id: String(oldNumber), number: oldNumber });
          setNumberOverride(undefined);
          return;
        }
        const data = await res.json();
        setSelectedEpisode(data.episode);
        setNumberOverride(undefined);
        setEpisodeRefreshKey((k) => k + 1);
      }, 800);
      return;
    }

    setNextEpisodeNumber(newNumber);
  }

  async function handleStatusChange(ep: Episode, status: EpisodeStatus) {
    setStatusOverride({ slug: ep.slug, status });
    if (selectedEpisode?.slug === ep.slug) {
      setSelectedEpisode({ ...selectedEpisode, status });
    }

    await fetch("/api/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update-status",
        number: ep.number,
        slug: ep.slug,
        status,
      }),
    });
  }

  const showWorkspace = newEpisodeMode || selectedEpisode;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 font-sans">
      {/* Pane 1: エピソード一覧 */}
      <div className="w-52 shrink-0 border-r border-gray-200 overflow-hidden flex flex-col">
        <EpisodeList
          selectedId={selectedEpisode?.id ?? null}
          selectedSlug={selectedEpisode?.slug ?? null}
          titleOverride={titleOverride}
          numberOverride={numberOverride}
          statusOverride={statusOverride}
          onSelect={handleEpisodeSelect}
          onStatusChange={handleStatusChange}
          refreshKey={episodeRefreshKey}
        />
      </div>

      {!showWorkspace ? (
        /* ウェルカム画面 */
        <div className="flex-1 flex items-center justify-center bg-white">
          <div className="text-center max-w-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={YouTubeIcon.src}
              alt="YT_TalkScript Studio"
              width={80}
              height={68}
              className="mx-auto mb-6"
            />
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
              <div className="flex items-center gap-1.5">
                <CompetitorSettingsDialog />
                <button
                  onClick={handleNewEpisode}
                  className="text-xs text-gray-400 hover:text-blue-500 border border-gray-200 hover:border-blue-300 px-2 py-1 rounded-md transition-colors"
                >
                  リセット
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <PatternSelector
                pattern={pattern}
                onChange={(p) => {
                  setPattern(p);
                  setSelectedCandidate(null);
                }}
              />
              <ThemeInput
                key={workspaceResetKey}
                pattern={pattern}
                onSelect={(c) => setSelectedCandidate(c)}
                onAnalysisStart={handleAnalysisStart}
              />
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
                  key={planningScriptResetKey}
                  candidate={selectedCandidate}
                  plan={currentPlan}
                  episodeNumber={selectedEpisode?.number ?? nextEpisodeNumber}
                  onPlanReady={handlePlanReady}
                  onTitleChange={handleTitleChange}
                  onEpisodeNumberChange={handleEpisodeNumberChange}
                  onPlanChange={handlePlanChange}
                />
              )}
            </div>
          </div>

          {/* Pane 4: 台本 */}
          <div className="flex-1 bg-white overflow-hidden flex flex-col">
            <ScriptPane
              key={planningScriptResetKey}
              plan={currentPlan}
              episodeNumber={selectedEpisode?.number ?? nextEpisodeNumber}
              episodeSlug={selectedEpisode?.slug ?? ""}
              generateKey={scriptGenerateKey}
              onScriptSaved={handleScriptSaved}
              onScriptCreated={handleScriptCreated}
              onRevisionEntered={handleRevisionEntered}
              onRevisionCleared={handleRevisionCleared}
            />
          </div>
        </div>
      )}
    </div>
  );
}
