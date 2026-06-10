"use client";

import YouTubeIcon from "@image/YouTubeIcon.svg";
import { CompetitorSettingsDialog } from "@/components/CompetitorSettingsDialog";
import { EpisodeList } from "@/components/EpisodeList";
import { PatternSelector } from "@/components/PatternSelector";
import { ThemeInput } from "@/components/ThemeInput";
import { PlanningDoc } from "@/components/PlanningDoc";
import { ScriptPane } from "@/components/ScriptPane";
import { UnrecordedBadge } from "@/components/UnrecordedBadge";
import type { StudioState } from "@/lib/useStudio";

export function DesktopStudio({ studio }: { studio: StudioState }) {
  const {
    selectedEpisode,
    pattern,
    setPattern,
    selectedCandidate,
    setSelectedCandidate,
    currentPlan,
    episodeRefreshKey,
    inferringPlan,
    titleOverride,
    numberOverride,
    statusOverride,
    scriptGenerateKey,
    nextEpisodeNumber,
    workspaceResetKey,
    planningScriptResetKey,
    planUnrecorded,
    showWorkspace,
    handlePlanReady,
    handleNewEpisode,
    handleAnalysisStart,
    handleRecordStateChange,
    handleEpisodeSelect,
    handleScriptSaved,
    handleScriptCreated,
    handleEpisodesDeleted,
    handleRevisionEntered,
    handleRevisionCleared,
    handlePlanChange,
    handleTitleChange,
    handleEpisodeNumberChange,
    handleStatusChange,
  } = studio;

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
          onDeleted={handleEpisodesDeleted}
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
              alt="ScriptStudio"
              width={80}
              height={68}
              className="mx-auto mb-6"
            />
            <h2 className="text-xl font-bold text-gray-700 mb-2">ScriptStudio</h2>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              企画から台本まで、ひとつの画面で
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
              {planUnrecorded && <UnrecordedBadge />}
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
                  episodeSlug={selectedEpisode?.slug}
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
              key={
                selectedEpisode
                  ? `${selectedEpisode.number}-${selectedEpisode.slug}`
                  : `new-${planningScriptResetKey}`
              }
              plan={currentPlan}
              episodeNumber={selectedEpisode?.number ?? nextEpisodeNumber}
              episodeSlug={selectedEpisode?.slug ?? ""}
              generateKey={scriptGenerateKey}
              onScriptSaved={handleScriptSaved}
              onScriptCreated={handleScriptCreated}
              onRevisionEntered={handleRevisionEntered}
              onRevisionCleared={handleRevisionCleared}
              onRecordStateChange={handleRecordStateChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}
