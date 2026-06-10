"use client";

import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import type {
  Episode,
  EpisodePlan,
  EpisodeStatus,
  ThemeCandidate,
  ThemePattern,
} from "@/lib/types";
import { planGenerationFingerprint } from "@/lib/plan-fingerprint";
import { hasPlanChangesSinceRecord } from "@/lib/record-state";

/**
 * 企画〜台本ワークスペースの状態・ハンドラを集約した共有フック。
 * デスクトップ版・スマホ版の双方が同じ state / ハンドラを使い回す。
 */
export function useStudio() {
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [pattern, setPattern] = useState<ThemePattern | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<ThemeCandidate | null>(null);
  const [currentPlan, setCurrentPlan] = useState<EpisodePlan | null>(null);
  const [episodeRefreshKey, setEpisodeRefreshKey] = useState(0);
  const [newEpisodeMode, setNewEpisodeMode] = useState(false);
  const [creatingEpisode, setCreatingEpisode] = useState(false);
  const [inferringPlan, setInferringPlan] = useState(false);
  const [titleOverride, setTitleOverride] = useState<{ slug: string; title: string } | undefined>(undefined);
  const titleSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const numberSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const planSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [scriptGenerateKey, setScriptGenerateKey] = useState(0);
  const [nextEpisodeNumber, setNextEpisodeNumber] = useState<number | null>(null);
  const [numberOverride, setNumberOverride] = useState<{ slug: string; number: number } | undefined>(undefined);
  const [statusOverride, setStatusOverride] = useState<{ slug: string; status: EpisodeStatus } | undefined>(undefined);
  const [workspaceResetKey, setWorkspaceResetKey] = useState(0);
  const [planningScriptResetKey, setPlanningScriptResetKey] = useState(0);
  const [recordState, setRecordState] = useState({
    scriptUnrecorded: false,
    recordedPlanFingerprint: undefined as string | undefined,
    planFingerprintFallback: undefined as string | undefined,
    versionsEnabled: false,
  });
  const currentPlanRef = useRef<EpisodePlan | null>(null);
  const selectedEpisodeRef = useRef<Episode | null>(null);
  const selectionRequestRef = useRef(0);

  useEffect(() => {
    currentPlanRef.current = currentPlan;
  }, [currentPlan]);

  useEffect(() => {
    selectedEpisodeRef.current = selectedEpisode;
  }, [selectedEpisode]);

  async function postFilesAction<T = unknown>(body: Record<string, unknown>): Promise<T> {
    const res = await fetch("/api/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error((data as { error?: string }).error ?? "保存に失敗しました");
    }
    return data as T;
  }

  function isActiveEpisodeSelection(requestId: number, episode: Pick<Episode, "number" | "slug">) {
    return (
      selectionRequestRef.current === requestId &&
      selectedEpisodeRef.current?.number === episode.number &&
      selectedEpisodeRef.current?.slug === episode.slug
    );
  }

  useEffect(() => {
    if (!newEpisodeMode || selectedEpisode) return;
    fetch("/api/files?action=list")
      .then((r) => r.json())
      .then((d) => {
        const max = Math.max(0, ...(d.episodes ?? []).map((e: Episode) => e.number));
        setNextEpisodeNumber(max + 1);
      })
      .catch(() => setNextEpisodeNumber(null));
  }, [newEpisodeMode, selectedEpisode]);

  async function handlePlanReady(plan: EpisodePlan, title: string) {
    let episode = selectedEpisode;

    try {
      if (!episode && !creatingEpisode) {
        setCreatingEpisode(true);
        const listRes = await fetch("/api/files?action=list");
        const listData = await listRes.json();
        const maxNumber = Math.max(0, ...listData.episodes.map((e: Episode) => e.number));
        const assignNumber = nextEpisodeNumber ?? maxNumber + 1;

        const data = await postFilesAction<{ episode: Episode }>({
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
            status: "planning",
            themePattern: pattern ?? "market",
            hook: selectedCandidate?.hook,
            targetPain: selectedCandidate?.targetPain,
            reason: selectedCandidate?.reason,
          },
        });
        episode = data.episode;
        setSelectedEpisode(episode);
        setEpisodeRefreshKey((k) => k + 1);
      }

      if (episode) {
        await postFilesAction({
          action: "write-plan",
          number: episode.number,
          slug: episode.slug,
          plan,
        });
      }

      setCurrentPlan(plan);
      setNewEpisodeMode(false);
      setScriptGenerateKey((k) => k + 1);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : String(error));
    } finally {
      setCreatingEpisode(false);
    }
  }

  function resetPlanningAndScript() {
    selectionRequestRef.current += 1;
    setSelectedCandidate(null);
    setCurrentPlan(null);
    currentPlanRef.current = null;
    setScriptGenerateKey(0);
    selectedEpisodeRef.current = null;
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
    setPattern(null);
    setWorkspaceResetKey((k) => k + 1);
  }

  function handleAnalysisStart() {
    resetPlanningAndScript();
  }

  const handleRecordStateChange = useCallback(
    (state: {
      scriptUnrecorded: boolean;
      recordedPlanFingerprint?: string;
      planFingerprintFallback?: string;
      versionsEnabled: boolean;
    }) => {
      setRecordState({
        scriptUnrecorded: state.scriptUnrecorded,
        recordedPlanFingerprint: state.recordedPlanFingerprint,
        planFingerprintFallback: state.planFingerprintFallback,
        versionsEnabled: state.versionsEnabled,
      });
    },
    [],
  );

  const planUnrecorded = useMemo(() => {
    if (!currentPlan || !recordState.versionsEnabled) return false;
    return hasPlanChangesSinceRecord(
      planGenerationFingerprint(currentPlan),
      recordState.recordedPlanFingerprint,
      recordState.planFingerprintFallback,
    );
  }, [currentPlan, recordState]);

  async function handleEpisodeSelect(ep: Episode) {
    const requestId = ++selectionRequestRef.current;
    setRecordState({
      scriptUnrecorded: false,
      recordedPlanFingerprint: undefined,
      planFingerprintFallback: undefined,
      versionsEnabled: false,
    });
    selectedEpisodeRef.current = ep;
    setSelectedEpisode(ep);
    setNewEpisodeMode(false);
    setSelectedCandidate(null);
    setCurrentPlan(null);
    currentPlanRef.current = null;
    setTitleOverride(undefined);
    setNumberOverride(undefined);
    setStatusOverride(undefined);

    // plan.json を読み込む。なければ台本から推論して保存
    const planRes = await fetch(`/api/files?action=read-plan&number=${ep.number}&slug=${ep.slug}`);
    const planData = await planRes.json();
    if (!isActiveEpisodeSelection(requestId, ep)) return;
    if (planData.plan) {
      setCurrentPlan(planData.plan as EpisodePlan);
      return;
    }

    // plan.json が存在しない場合、台本から推論
    const scriptRes = await fetch(
      `/api/files?action=read&number=${ep.number}&slug=${ep.slug}&filename=01-script-draft.md`
    );
    const scriptData = await scriptRes.json();
    if (!isActiveEpisodeSelection(requestId, ep)) return;
    if (!scriptData.content) return;

    setInferringPlan(true);
    try {
      const inferRes = await fetch("/api/infer-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: scriptData.content, title: ep.title }),
      });
      const inferData = await inferRes.json();
      if (!isActiveEpisodeSelection(requestId, ep)) return;
      if (inferData.plan) {
        setCurrentPlan(inferData.plan as EpisodePlan);
        // 次回以降のためにキャッシュ保存
        try {
          await postFilesAction({
            action: "write-plan",
            number: ep.number,
            slug: ep.slug,
            plan: inferData.plan,
          });
        } catch (error) {
          window.alert(error instanceof Error ? error.message : String(error));
        }
      }
    } finally {
      if (isActiveEpisodeSelection(requestId, ep)) {
        setInferringPlan(false);
      }
    }
  }

  function handleScriptSaved() {
    setEpisodeRefreshKey((k) => k + 1);
  }

  function handleScriptCreated() {
    setEpisodeRefreshKey((k) => k + 1);
  }

  function handleEpisodesDeleted(deletedSlugs: string[]) {
    setEpisodeRefreshKey((k) => k + 1);

    if (selectedEpisode && deletedSlugs.includes(selectedEpisode.slug)) {
      selectionRequestRef.current += 1;
      if (titleSaveTimer.current) clearTimeout(titleSaveTimer.current);
      if (numberSaveTimer.current) clearTimeout(numberSaveTimer.current);
      if (planSaveTimer.current) clearTimeout(planSaveTimer.current);
      selectedEpisodeRef.current = null;
      setSelectedEpisode(null);
      setNewEpisodeMode(false);
      setSelectedCandidate(null);
      setCurrentPlan(null);
      currentPlanRef.current = null;
      setTitleOverride(undefined);
      setNumberOverride(undefined);
      setStatusOverride(undefined);
      setScriptGenerateKey(0);
      setPlanningScriptResetKey((k) => k + 1);
    }
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

  function handlePlanChange(plan: EpisodePlan) {
    setCurrentPlan(plan);
    currentPlanRef.current = plan;

    const episode = selectedEpisodeRef.current;
    if (!episode) return;

    if (planSaveTimer.current) clearTimeout(planSaveTimer.current);

    const savePlan = async () => {
      try {
        await postFilesAction({
          action: "write-plan",
          number: episode.number,
          slug: episode.slug,
          plan: currentPlanRef.current,
        });
      } catch (error) {
        window.alert(error instanceof Error ? error.message : String(error));
      }
    };

    // 目次を空にしたときは即保存（デバウンス待ちで元に戻るのを防ぐ）
    if (!plan.outline?.length) {
      void savePlan();
      return;
    }

    planSaveTimer.current = setTimeout(() => void savePlan(), 800);
  }

  function handleTitleChange(title: string) {
    setCurrentPlan((prev) => (prev ? { ...prev, episodeTitle: title } : null));

    // エピソード一覧をリアルタイム更新
    if (selectedEpisode) {
      setTitleOverride({ slug: selectedEpisode.slug, title });

      // manifest への書き込みは 800ms デバウンス
      if (titleSaveTimer.current) clearTimeout(titleSaveTimer.current);
      titleSaveTimer.current = setTimeout(async () => {
        try {
          await postFilesAction({
            action: "update-title",
            number: selectedEpisode.number,
            slug: selectedEpisode.slug,
            title,
          });
        } catch (error) {
          setTitleOverride(undefined);
          window.alert(error instanceof Error ? error.message : String(error));
        }
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
    try {
      const data = await postFilesAction<{ status?: EpisodeStatus }>({
        action: "update-status",
        number: ep.number,
        slug: ep.slug,
        status,
      });
      const resolved = (data.status ?? status) as EpisodeStatus;
      setStatusOverride({ slug: ep.slug, status: resolved });
      if (selectedEpisode?.slug === ep.slug) {
        setSelectedEpisode({ ...selectedEpisode, status: resolved });
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : String(error));
    }
  }

  const showWorkspace = newEpisodeMode || selectedEpisode;

  return {
    // state
    selectedEpisode,
    pattern,
    setPattern,
    selectedCandidate,
    setSelectedCandidate,
    currentPlan,
    episodeRefreshKey,
    newEpisodeMode,
    inferringPlan,
    titleOverride,
    numberOverride,
    statusOverride,
    scriptGenerateKey,
    nextEpisodeNumber,
    workspaceResetKey,
    planningScriptResetKey,
    // derived
    planUnrecorded,
    showWorkspace,
    // handlers
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
  };
}

export type StudioState = ReturnType<typeof useStudio>;
