"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import AppIcon from "@image/ScriptStudioIcon.svg";
import { CompetitorSettingsDialog } from "@/components/CompetitorSettingsDialog";
import { EpisodeList } from "@/components/EpisodeList";
import { PatternSelector } from "@/components/PatternSelector";
import { ThemeInput } from "@/components/ThemeInput";
import { PlanningDoc } from "@/components/PlanningDoc";
import { ScriptPane } from "@/components/ScriptPane";
import { UnrecordedBadge } from "@/components/UnrecordedBadge";
import { UserMenu } from "@/components/UserMenu";
import type { Episode } from "@/lib/types";
import type { StudioState } from "@/lib/useStudio";

type MobileTab = "list" | "theme" | "plan" | "script";

const TABS: { key: MobileTab; icon: string; label: string }[] = [
  { key: "list", icon: "📋", label: "一覧" },
  { key: "theme", icon: "💡", label: "テーマ" },
  { key: "plan", icon: "📝", label: "企画" },
  { key: "script", icon: "🎬", label: "台本" },
];

export function MobileStudio({ studio }: { studio: StudioState }) {
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

  const [tab, setTab] = useState<MobileTab>("list");

  // 作業対象が無くなったら一覧へ戻す
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!showWorkspace && tab !== "list") setTab("list");
  }, [showWorkspace, tab]);

  function onSelectEpisode(ep: Episode) {
    handleEpisodeSelect(ep);
    setTab("plan");
  }

  function onStartNew() {
    handleNewEpisode();
    setTab("theme");
  }

  const episodeTitle =
    titleOverride?.title ?? currentPlan?.episodeTitle ?? selectedCandidate?.title ?? selectedEpisode?.title ?? null;
  const episodeNumber = selectedEpisode?.number ?? nextEpisodeNumber;

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-gray-100 font-sans">
      {/* 上部バー */}
      <header className="h-12 shrink-0 px-3 border-b border-gray-200 bg-white flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={AppIcon.src} alt="ScriptStudio" width={98} height={22} className="shrink-0" />
        {episodeNumber != null && (
          <span className="text-xs text-gray-400 shrink-0">#{episodeNumber}</span>
        )}
        {episodeTitle && (
          <span className="text-xs text-gray-500 truncate min-w-0">/ {episodeTitle}</span>
        )}
        {planUnrecorded && <UnrecordedBadge />}
        <UserMenu compact className="ml-auto pl-1" />
      </header>

      {/* メイン */}
      <main className="flex-1 min-h-0 overflow-hidden">
        {/* 一覧 */}
        {tab === "list" && (
          <div className="h-full flex flex-col bg-white">
            <div className="p-3 border-b border-gray-200 shrink-0">
              <button
                onClick={onStartNew}
                className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl active:bg-primary/90 transition-colors font-medium text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                ＋ 新しい企画を始める
              </button>
            </div>
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
                onSelect={onSelectEpisode}
                onStatusChange={handleStatusChange}
                onDeleted={handleEpisodesDeleted}
              />
            </div>
          </div>
        )}

        {/* テーマ */}
        {tab === "theme" &&
          (showWorkspace ? (
            <div className="h-full flex flex-col bg-white">
              <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-700">テーマ選定</h2>
                  <div className="flex items-center gap-1.5">
                    <CompetitorSettingsDialog />
                    <button
                      onClick={onStartNew}
                      className="text-xs text-gray-400 active:text-blue-500 border border-gray-200 px-2 py-1 rounded-md transition-colors"
                    >
                      リセット
                    </button>
                  </div>
                </div>
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
              <NextBar label="次へ：企画書 →" onClick={() => setTab("plan")} />
            </div>
          ) : (
            <EmptyWorkspace onStart={onStartNew} />
          ))}

        {/* 企画書 */}
        {tab === "plan" &&
          (showWorkspace ? (
            <div className="h-full flex flex-col bg-gray-50">
              <div className="flex-1 min-h-0 overflow-hidden">
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
              <NextBar label="次へ：台本 →" onClick={() => setTab("script")} />
            </div>
          ) : (
            <EmptyWorkspace onStart={onStartNew} />
          ))}

        {/* 台本 */}
        {tab === "script" &&
          (showWorkspace ? (
            <div className="h-full flex flex-col bg-white">
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
          ) : (
            <EmptyWorkspace onStart={onStartNew} />
          ))}
      </main>

      {/* 下部タブ */}
      <nav className="shrink-0 border-t border-gray-200 bg-white flex pb-[env(safe-area-inset-bottom)]">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 flex flex-col items-center gap-0.5 transition-colors ${
                active ? "text-blue-600" : "text-gray-400 active:text-gray-600"
              }`}
            >
              <span className="text-lg leading-none">{t.icon}</span>
              <span className="text-[10px] font-medium">{t.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function NextBar({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div className="shrink-0 p-3 border-t border-gray-200 bg-white">
      <button
        onClick={onClick}
        className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl active:bg-primary/90 transition-colors font-medium text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        {label}
      </button>
    </div>
  );
}

function EmptyWorkspace({ onStart }: { onStart: () => void }) {
  return (
    <div className="h-full flex items-center justify-center bg-white px-8">
      <div className="text-center">
        <div className="text-3xl mb-3">💡</div>
        <p className="text-sm text-gray-400 mb-5 leading-relaxed">
          企画を始めると、ここに表示されます
        </p>
        <button
          onClick={onStart}
          className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl active:bg-primary/90 transition-colors font-medium text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          ＋ 新しい企画を始める
        </button>
      </div>
    </div>
  );
}
