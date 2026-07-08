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
import { toUserMessage } from "@/lib/error-message";
import { useReadOnly } from "@/lib/useViewerRole";
import { sortEpisodesByNumberDesc } from "@/lib/episode-sort";
import { usePlanVersions } from "@/lib/usePlanVersions";

/**
 * 企画〜台本ワークスペースの状態・ハンドラを集約した共有フック。
 * デスクトップ版・スマホ版の双方が同じ state / ハンドラを使い回す。
 */
export function useStudio() {
  // 閲覧専用ログインでは保存系をスキップし、デモ生成の経路につなぐ
  const viewerReadOnly = useReadOnly();
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [pattern, setPattern] = useState<ThemePattern | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<ThemeCandidate | null>(null);
  const [currentPlan, setCurrentPlan] = useState<EpisodePlan | null>(null);
  // エピソード一覧の単一の真実源。初回1回だけ読み込み、以降は
  // 「リフレッシュ／エピソード追加／台本執筆」の3トリガーでのみ再取得する。
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [episodesLoading, setEpisodesLoading] = useState(true);
  const didInitialLoadRef = useRef(false);
  // 起動直後からワークスペース（4ペイン）を表示する。
  // ウェルカム画面は出さず、未選択でも 企画書/台本 は空状態のプレースホルダを見せる。
  const [newEpisodeMode, setNewEpisodeMode] = useState(true);
  const [inferringPlan, setInferringPlan] = useState(false);
  // エピソード選択後、企画書（plan.json）を読み込み中かどうか。
  const [planLoading, setPlanLoading] = useState(false);
  const [titleOverride, setTitleOverride] = useState<{ slug: string; title: string } | undefined>(undefined);
  const titleSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const numberSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const planSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [scriptGenerateKey, setScriptGenerateKey] = useState(0);
  // 新規エピソードで番号を手入力したときの上書き値（未指定なら一覧から導出）。
  const [customNewNumber, setCustomNewNumber] = useState<number | null>(null);
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
  // デバウンス済みタイマーのコールバックは古いクロージャで実行されるため、
  // 作成時に参照する値は ref 経由で最新を読む。
  const customNewNumberRef = useRef<number | null>(null);
  const creatingEpisodeRef = useRef(false);
  // 統合保存モーダル（企画書＋台本）の表示中フラグ。表示中は企画書の自動記録を止め、
  // 手動保存と自動記録が同じ内容を二重に記録しないようにする。
  const [snapshotCommitOpen, setSnapshotCommitOpen] = useState(false);
  const planVersions = usePlanVersions({
    plan: currentPlan,
    episodeNumber: selectedEpisode?.number ?? null,
    episodeSlug: selectedEpisode?.slug,
    pauseAutoRecord: planLoading || inferringPlan || snapshotCommitOpen,
  });

  useEffect(() => {
    currentPlanRef.current = currentPlan;
  }, [currentPlan]);

  useEffect(() => {
    selectedEpisodeRef.current = selectedEpisode;
  }, [selectedEpisode]);

  useEffect(() => {
    customNewNumberRef.current = customNewNumber;
  }, [customNewNumber]);

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

  // エピソード一覧を取得する唯一の経路。3トリガー（初回・リフレッシュ・
  // エピソード追加・台本執筆）からのみ呼ぶ。
  const loadEpisodes = useCallback(() => {
    setEpisodesLoading(true);
    return fetch("/api/files?action=list")
      .then((r) => r.json())
      .then((d) => setEpisodes(sortEpisodesByNumberDesc(d.episodes ?? [])))
      .catch(() => {})
      .finally(() => setEpisodesLoading(false));
  }, []);

  // 初回アクセス時に1回だけ読み込む。
  useEffect(() => {
    if (didInitialLoadRef.current) return;
    didInitialLoadRef.current = true;
    void loadEpisodes();
  }, [loadEpisodes]);

  // 次のエピソード番号は一覧から導出（追加の fetch をしない）。手入力があれば優先。
  const nextEpisodeNumber = useMemo(
    () => customNewNumber ?? Math.max(0, ...episodes.map((e) => e.number)) + 1,
    [customNewNumber, episodes],
  );

  // エピソードを（未作成なら）作成し、企画書を保存して selectedEpisode を返す。
  // 台本生成は行わない。失敗時は例外を投げる。
  async function saveEpisodeAndPlan(
    plan: EpisodePlan,
    title: string,
  ): Promise<Episode | null> {
    let episode = selectedEpisode;

    if (!episode && !creatingEpisodeRef.current) {
      creatingEpisodeRef.current = true;
      try {
        const listRes = await fetch("/api/files?action=list");
        const listData = await listRes.json();
        const maxNumber = Math.max(0, ...listData.episodes.map((e: Episode) => e.number));
        const assignNumber = customNewNumberRef.current ?? maxNumber + 1;

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
        setCustomNewNumber(null);
        customNewNumberRef.current = null;
      } finally {
        creatingEpisodeRef.current = false;
      }
    }

    if (episode) {
      await postFilesAction({
        action: "write-plan",
        number: episode.number,
        slug: episode.slug,
        plan,
      });
    }

    return episode;
  }

  // 「台本を作成する」: 企画書を保存し、台本生成を開始する
  async function handlePlanReady(plan: EpisodePlan, title: string) {
    if (viewerReadOnly) {
      // 閲覧専用: エピソード作成・保存はせず、台本のデモ生成だけ動かす。
      // エピソード未選択のため newEpisodeMode は下ろさない（下ろすと
      // showWorkspace が偽になりウェルカム画面に戻ってしまう）
      setCurrentPlan(plan);
      setScriptGenerateKey((k) => k + 1);
      return;
    }
    try {
      const episode = await saveEpisodeAndPlan(plan, title);
      if (!episode) return;
      setCurrentPlan(plan);
      setNewEpisodeMode(false);
      setScriptGenerateKey((k) => k + 1);
      void loadEpisodes(); // 台本執筆トリガー
    } catch (error) {
      window.alert(toUserMessage(error, "保存に失敗しました。少し時間をおいて、もう一度お試しください。"));
    }
  }

  // 「エピソードに追加」: 企画段階のまま保存し、一覧に追加する（台本生成はしない）
  async function handlePlanSave(plan: EpisodePlan, title: string) {
    if (viewerReadOnly) {
      window.alert("閲覧専用アカウントのため、エピソードの追加はできません。");
      return;
    }
    try {
      const episode = await saveEpisodeAndPlan(plan, title);
      if (!episode) return;
      setCurrentPlan(plan);
      setNewEpisodeMode(false);
      void loadEpisodes(); // エピソード追加トリガー
    } catch (error) {
      window.alert(toUserMessage(error, "保存に失敗しました。少し時間をおいて、もう一度お試しください。"));
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
    setCustomNewNumber(null);
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
    setPlanLoading(true);

    try {
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

      // 推論は時間がかかるので専用インジケータ（inferringPlan）に切り替える
      setPlanLoading(false);
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
            window.alert(toUserMessage(error, "保存に失敗しました。少し時間をおいて、もう一度お試しください。"));
          }
        }
      } finally {
        if (isActiveEpisodeSelection(requestId, ep)) {
          setInferringPlan(false);
        }
      }
    } finally {
      if (isActiveEpisodeSelection(requestId, ep)) {
        setPlanLoading(false);
      }
    }
  }

  // 自動保存ごとに発火する。一覧の再取得はしない（再取得ループの原因だった）。
  function handleScriptSaved() {}

  // 台本が初めて作成されたとき。再取得せず、選択中エピソードの行だけ
  // ローカルに「下書きあり」へ更新する。
  function handleScriptCreated() {
    const ep = selectedEpisodeRef.current;
    if (!ep) return;
    setEpisodes((prev) =>
      prev.map((e) =>
        e.slug === ep.slug
          ? {
              ...e,
              hasScriptDraft: true,
              status: e.status === "planning" ? "scripting" : e.status,
            }
          : e,
      ),
    );
  }

  function handleEpisodesDeleted(deletedSlugs: string[]) {
    // 再取得せずローカルから除外する。
    setEpisodes((prev) => prev.filter((e) => !deletedSlugs.includes(e.slug)));

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
  }

  async function handleRevisionCleared() {
    if (!selectedEpisode) return;
    if (selectedEpisode.status === "scripting") return;
    await handleStatusChange(selectedEpisode, "scripting");
  }

  function handlePlanChange(plan: EpisodePlan) {
    setCurrentPlan(plan);
    currentPlanRef.current = plan;

    const episode = selectedEpisodeRef.current;

    if (planSaveTimer.current) clearTimeout(planSaveTimer.current);

    if (!episode) {
      // 未作成（新規）エピソードも自動保存する:「エピソードに追加」を押さなくても、
      // タイトルが入っていれば編集停止から一拍おいてエピソード作成＋企画書保存まで行う。
      if (viewerReadOnly) return;
      if (!plan.episodeTitle?.trim()) return;
      planSaveTimer.current = setTimeout(async () => {
        const latest = currentPlanRef.current;
        const latestTitle = latest?.episodeTitle?.trim();
        if (!latest || !latestTitle || selectedEpisodeRef.current) return;
        try {
          const created = await saveEpisodeAndPlan(latest, latestTitle);
          if (created) {
            setNewEpisodeMode(false);
            void loadEpisodes(); // エピソード追加トリガー
          }
        } catch (error) {
          window.alert(toUserMessage(error, "保存に失敗しました。少し時間をおいて、もう一度お試しください。"));
        }
      }, 1500);
      return;
    }

    const savePlan = async () => {
      try {
        await postFilesAction({
          action: "write-plan",
          number: episode.number,
          slug: episode.slug,
          plan: currentPlanRef.current,
        });
      } catch (error) {
        window.alert(toUserMessage(error, "保存に失敗しました。少し時間をおいて、もう一度お試しください。"));
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
          // 一覧（SSOT）も再取得せずローカル更新する。
          setEpisodes((prev) =>
            prev.map((e) => (e.slug === selectedEpisode.slug ? { ...e, title } : e)),
          );
        } catch (error) {
          setTitleOverride(undefined);
          window.alert(toUserMessage(error, "保存に失敗しました。少し時間をおいて、もう一度お試しください。"));
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
          window.alert(toUserMessage(err, "番号の更新に失敗しました。"));
          setSelectedEpisode({ ...selectedEpisode, id: String(oldNumber), number: oldNumber });
          setNumberOverride(undefined);
          return;
        }
        const data = await res.json();
        setSelectedEpisode(data.episode);
        // 一覧（SSOT）も再取得せずローカル更新する。
        setEpisodes((prev) =>
          sortEpisodesByNumberDesc(
            prev.map((e) =>
              e.slug === slug ? { ...e, number: newNumber, id: String(newNumber) } : e,
            ),
          ),
        );
        setNumberOverride(undefined);
      }, 800);
      return;
    }

    // 新規エピソード（未作成）の番号を手入力で上書き。
    setCustomNewNumber(newNumber);
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
      // 一覧（SSOT）も再取得せずローカル更新する。
      setEpisodes((prev) =>
        prev.map((e) => (e.slug === ep.slug ? { ...e, status: resolved } : e)),
      );
      if (selectedEpisode?.slug === ep.slug) {
        setSelectedEpisode({ ...selectedEpisode, status: resolved });
      }
    } catch (error) {
      window.alert(toUserMessage(error, "保存に失敗しました。少し時間をおいて、もう一度お試しください。"));
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
    episodes,
    episodesLoading,
    newEpisodeMode,
    inferringPlan,
    planLoading,
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
    // 企画書スナップショット（統合保存用）
    planVersions,
    setSnapshotCommitOpen,
    // handlers
    loadEpisodes,
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
  };
}

export type StudioState = ReturnType<typeof useStudio>;
