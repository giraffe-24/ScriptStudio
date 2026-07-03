"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EpisodePlan } from "@/lib/types";
import {
  planToSnapshotText,
  planSnapshotContentToText,
} from "@/lib/plan-snapshot-text";

/** 企画書の自動記録：最後の記録との差分がこの時間続いたらスナップショットを作る */
const AUTO_RECORD_DELAY_MS = 30_000;

export type PlanVersionsState = {
  /** バージョン保存が使えるか（ストア設定済み＋保存済みエピソード選択中） */
  enabled: boolean;
  /** 前回の保存版から企画書に変更があるか */
  unrecorded: boolean;
  /** 差分・AI 要約に使う現在の企画書テキスト */
  planText: string;
  /** 前回保存版のテキスト表現 */
  recordedPlanText: string;
  /** 保存後に最新スナップショットを取り直す */
  refresh: () => Promise<void>;
};

/**
 * 企画書スナップショット（保存版）の状態と自動記録。
 * もとは PlanningDoc 内にあったが、手動保存を台本ペインの統合保存
 * （企画書＋台本を 1 モーダルで記録）へ一本化したため、
 * 両ペインから参照できるよう studio レベルに引き上げた。
 */
export function usePlanVersions({
  plan,
  episodeNumber,
  episodeSlug,
  pauseAutoRecord,
}: {
  plan: EpisodePlan | null;
  episodeNumber: number | null;
  episodeSlug: string | undefined;
  /** 統合保存モーダル表示中・企画書の読み込み中は自動記録を止める */
  pauseAutoRecord: boolean;
}): PlanVersionsState {
  const [storeConfigured, setStoreConfigured] = useState(false);
  const [latestPlanContent, setLatestPlanContent] = useState<string | null>(null);
  // 「最新スナップショットの取得が完了したか」。未取得のまま自動記録すると
  // 既存履歴があるのに初稿として誤記録するため、完了を確認してから動かす。
  const [latestPlanLoaded, setLatestPlanLoaded] = useState(false);
  const autoRecordingRef = useRef(false);

  // 企画書バージョン履歴が使えるか（セッション内で 1 回だけ確認）
  useEffect(() => {
    let cancelled = false;
    fetch("/api/plan-versions?action=status")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setStoreConfigured(Boolean(d?.configured));
      })
      .catch(() => {
        if (!cancelled) setStoreConfigured(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!storeConfigured || episodeNumber == null || !episodeSlug) {
      setLatestPlanContent(null);
      setLatestPlanLoaded(false);
      return;
    }
    setLatestPlanLoaded(false);
    try {
      const res = await fetch(
        `/api/plan-versions?action=latest&number=${episodeNumber}&slug=${encodeURIComponent(episodeSlug)}`,
      );
      const data = await res.json();
      setLatestPlanContent(res.ok ? (data.snapshot?.content ?? null) : null);
      setLatestPlanLoaded(res.ok);
    } catch {
      setLatestPlanContent(null);
      setLatestPlanLoaded(false);
    }
  }, [storeConfigured, episodeNumber, episodeSlug]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  // 企画書の自動記録（台本の autoRecordSnapshot と体験を揃える）。
  // イベント駆動ではなく状態差分ベース：最後の記録と現在の企画書が異なる状態が
  // AUTO_RECORD_DELAY_MS 続いたら自動でスナップショット＋AI要約を作る。
  // 編集・AI復元・エピソード切替による中断など、どの経路の変更でも取りこぼさない。
  useEffect(() => {
    if (!storeConfigured || episodeNumber == null || !episodeSlug) return;
    if (!latestPlanLoaded) return; // 既存履歴の取得前に初稿と誤認しない
    if (!plan || pauseAutoRecord) return; // 読み込み中・手動保存中は待つ

    const currentText = planToSnapshotText(plan);
    const recordedText = latestPlanContent ? planSnapshotContentToText(latestPlanContent) : "";
    if (!currentText.trim() || currentText === recordedText) return;

    const targetPlan = plan;
    const targetNumber = episodeNumber;
    const targetSlug = episodeSlug;
    const timer = setTimeout(() => {
      void (async () => {
        if (autoRecordingRef.current) return;
        autoRecordingRef.current = true;
        try {
          // AI要約（失敗しても定型文で記録は続行＝台本の自動記録と同じ方針）
          let summary = "企画書を更新しました。";
          try {
            const sumRes = await fetch("/api/summarize-diff", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                episodeTitle: targetPlan.episodeTitle,
                oldText: recordedText,
                newText: currentText,
                docLabel: "企画書",
              }),
            });
            if (sumRes.ok) {
              const sumData = await sumRes.json();
              if (sumData.summary) summary = sumData.summary;
            }
          } catch {
            // 要約失敗は記録を止めない
          }
          const res = await fetch("/api/plan-versions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              episodeNumber: targetNumber,
              episodeSlug: targetSlug,
              summary,
              content: JSON.stringify(targetPlan, null, 2),
            }),
          });
          if (res.ok) await refresh();
        } finally {
          autoRecordingRef.current = false;
        }
      })();
    }, AUTO_RECORD_DELAY_MS);
    return () => clearTimeout(timer);
  }, [
    plan,
    latestPlanContent,
    latestPlanLoaded,
    storeConfigured,
    episodeNumber,
    episodeSlug,
    pauseAutoRecord,
    refresh,
  ]);

  const enabled = storeConfigured && episodeNumber != null && !!episodeSlug;
  const planText = plan ? planToSnapshotText(plan) : "";
  const recordedPlanText = latestPlanContent
    ? planSnapshotContentToText(latestPlanContent)
    : "";
  const unrecorded =
    enabled && latestPlanLoaded && !!planText.trim() && planText !== recordedPlanText;

  return { enabled, unrecorded, planText, recordedPlanText, refresh };
}
