"use client";

import { useEffect, useState } from "react";
import AppIcon from "@image/ScriptStudioIcon.svg";
import { Loader2, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { CompetitorSettingsDialog } from "@/components/CompetitorSettingsDialog";
import { EpisodeList } from "@/components/EpisodeList";
import { PatternSelector } from "@/components/PatternSelector";
import { ThemeInput } from "@/components/ThemeInput";
import { PlanningDoc } from "@/components/PlanningDoc";
import { ScriptPane } from "@/components/ScriptPane";
import { UnrecordedBadge } from "@/components/UnrecordedBadge";
import { UserMenu } from "@/components/UserMenu";
import type { StudioState } from "@/lib/useStudio";

/** テーマ→企画→台本 の流れの「今どのステップか」を示す番号バッジ */
function StepBadge({ n }: { n: number }) {
  return (
    <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
      {n}
    </span>
  );
}

/** 各ペインの開閉状態の記憶キー（"0" = たたむ） */
const EPISODE_PANE_KEY = "scriptstudio_episode_pane_open";
const THEME_PANE_KEY = "scriptstudio_theme_pane_open";

export function DesktopStudio({ studio }: { studio: StudioState }) {
  // ペインの開閉（ワンタップ切替・リロード後も維持）
  const [episodePaneOpen, setEpisodePaneOpen] = useState(true);
  const [themePaneOpen, setThemePaneOpen] = useState(true);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEpisodePaneOpen(localStorage.getItem(EPISODE_PANE_KEY) !== "0");
    setThemePaneOpen(localStorage.getItem(THEME_PANE_KEY) !== "0");
  }, []);
  const toggleEpisodePane = () => {
    setEpisodePaneOpen((prev) => {
      localStorage.setItem(EPISODE_PANE_KEY, prev ? "0" : "1");
      return !prev;
    });
  };
  const toggleThemePane = () => {
    setThemePaneOpen((prev) => {
      localStorage.setItem(THEME_PANE_KEY, prev ? "0" : "1");
      return !prev;
    });
  };

  const {
    selectedEpisode,
    pattern,
    setPattern,
    selectedCandidate,
    setSelectedCandidate,
    currentPlan,
    episodes,
    episodesLoading,
    loadEpisodes,
    inferringPlan,
    planLoading,
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
    handlePlanSave,
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
      {/* Pane 1: エピソード一覧（ワンタップで開閉。たたむと縦ラベルのレールになる） */}
      {!episodePaneOpen && (
        <button
          type="button"
          onClick={toggleEpisodePane}
          aria-expanded={false}
          aria-controls="episode-pane"
          title="エピソード一覧を開く"
          className="w-10 shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col items-center gap-3 pt-3 hover:bg-gray-100 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset"
        >
          <PanelLeftOpen className="size-4 text-gray-400" />
          <span className="text-xs font-semibold text-gray-500 [writing-mode:vertical-rl] tracking-widest">
            エピソード
          </span>
        </button>
      )}
      <div
        id="episode-pane"
        className={`shrink-0 overflow-hidden transition-[width,visibility] duration-200 ${
          episodePaneOpen ? "w-52 visible border-r border-gray-200" : "w-0 invisible"
        }`}
      >
        {/* 開閉アニメーション中も中身が潰れないよう、内側は固定幅で保持する */}
        <div className="w-52 h-full flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-hidden">
            <EpisodeList
              episodes={episodes}
              loading={episodesLoading}
              onRefresh={loadEpisodes}
              selectedId={selectedEpisode?.id ?? null}
              selectedSlug={selectedEpisode?.slug ?? null}
              titleOverride={titleOverride}
              numberOverride={numberOverride}
              statusOverride={statusOverride}
              onSelect={handleEpisodeSelect}
              onStatusChange={handleStatusChange}
              onDeleted={handleEpisodesDeleted}
              onCollapse={toggleEpisodePane}
            />
          </div>
          {/* アカウント：ログイン中のユーザー名とログアウト */}
          <div className="shrink-0 border-t border-gray-200 bg-gray-50 px-3 py-2">
            <UserMenu className="justify-between" />
          </div>
        </div>
      </div>

      {!showWorkspace ? (
        /* ウェルカム画面 */
        <div className="flex-1 flex items-center justify-center bg-white">
          <div className="text-center max-w-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={AppIcon.src}
              alt="ScriptStudio"
              width={214}
              height={48}
              className="mx-auto mb-5"
            />
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              企画から台本まで、ひとつの画面で
            </p>
            <button
              onClick={handleNewEpisode}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors font-medium text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2"
            >
              ＋ 新しい企画を始める
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Pane 2: テーマ選定（ワンタップで開閉。たたむと縦ラベルのレールになる） */}
          {!themePaneOpen && (
            <button
              type="button"
              onClick={toggleThemePane}
              aria-expanded={false}
              aria-controls="theme-pane"
              title="テーマ選定を開く"
              className="w-10 shrink-0 border-r border-gray-200 bg-white flex flex-col items-center gap-3 pt-3 hover:bg-gray-50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset"
            >
              <PanelLeftOpen className="size-4 text-gray-400" />
              <StepBadge n={1} />
              <span className="text-xs font-semibold text-gray-500 [writing-mode:vertical-rl] tracking-widest">
                テーマ選定
              </span>
            </button>
          )}
          <div
            id="theme-pane"
            className={`shrink-0 bg-white overflow-hidden transition-[width,visibility] duration-200 ${
              themePaneOpen ? "w-80 visible border-r border-gray-200" : "w-0 invisible"
            }`}
          >
            {/* 開閉アニメーション中も中身が潰れないよう、内側は固定幅で保持する */}
            <div className="w-80 h-full flex flex-col overflow-hidden">
              <div className="h-[52px] px-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  <StepBadge n={1} />
                  テーマ選定
                </h2>
                <div className="flex items-center gap-1.5">
                  <CompetitorSettingsDialog />
                  <button
                    onClick={handleNewEpisode}
                    className="text-xs text-gray-400 hover:text-blue-500 border border-gray-200 hover:border-blue-300 px-2 py-1 rounded-md transition-colors"
                  >
                    リセット
                  </button>
                  <button
                    type="button"
                    onClick={toggleThemePane}
                    aria-expanded={true}
                    aria-controls="theme-pane"
                    title="テーマ選定をたたむ"
                    aria-label="テーマ選定をたたむ"
                    className="text-gray-400 hover:text-gray-600 border border-gray-200 hover:border-gray-300 p-1 rounded-md transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    <PanelLeftClose className="size-3.5" />
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
          </div>

          {/* Pane 3: 企画書 */}
          <div className="flex-1 border-r border-gray-200 bg-gray-50 overflow-hidden flex flex-col">
            <div className="h-[52px] px-4 border-b border-gray-200 bg-white flex items-center gap-2 min-w-0">
              <h2 className="text-sm font-semibold text-gray-700 shrink-0 flex items-center gap-1.5">
                <StepBadge n={2} />
                企画書
              </h2>
              {(selectedCandidate || currentPlan) && (
                <>
                  <span className="text-gray-300 text-sm shrink-0">/</span>
                  <p className="text-xs text-gray-400 truncate">
                    {selectedCandidate?.title ?? currentPlan?.episodeTitle ?? ""}
                  </p>
                </>
              )}
              {planUnrecorded && <UnrecordedBadge />}
              {inferringPlan ? (
                <span className="ml-auto text-xs text-blue-400 animate-pulse shrink-0">台本から企画書を復元中…</span>
              ) : planLoading ? (
                <span className="ml-auto text-xs text-blue-400 animate-pulse shrink-0">読み込み中…</span>
              ) : null}
            </div>
            <div className="flex-1 overflow-hidden">
              {inferringPlan ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <div className="text-3xl mb-3 animate-pulse">📋</div>
                    <p className="text-sm">台本から企画書を復元しています…</p>
                  </div>
                </div>
              ) : planLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <Loader2 className="size-7 mb-3 mx-auto animate-spin text-blue-400" />
                    <p className="text-sm">企画書を読み込んでいます…</p>
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
                  onPlanSave={handlePlanSave}
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
