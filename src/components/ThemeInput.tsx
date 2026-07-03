"use client";

import { useEffect, useState } from "react";
import type {
  CompetitorSuggestion,
  EnrichedCandidate,
  ThemeCandidate,
  ThemeMode,
  ThemePattern,
} from "@/lib/types";
import { toUserMessage } from "@/lib/error-message";
import { useReadOnly } from "@/lib/useViewerRole";
import {
  DEMO_CANDIDATES,
  DEMO_COMPETITOR_SUGGESTIONS,
  demoDelay,
} from "@/lib/demo-simulation";
import { DemoAiNotice } from "@/components/DemoAiNotice";
import type { ChannelSubscriberStats } from "@/lib/market-analysis/subscriber-history";
import { youtubeChannelUrl } from "@/lib/youtube-channel-url";
import type { ApiErrorCode } from "@/lib/api-error";
import { CompetitorSubscriberStats } from "@/components/CompetitorSubscriberStats";
import { CompetitorChannelAvatar } from "@/components/CompetitorChannelAvatar";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  pattern: ThemePattern | null;
  onSelect: (candidate: ThemeCandidate) => void;
  onAnalysisStart?: () => void;
}

const SCORE_BORDER = {
  high: "border-blue-300",
  medium: "border-yellow-300",
  low: "border-gray-200",
};

const SCORE_BG = {
  high: "bg-blue-50",
  medium: "bg-yellow-50",
  low: "bg-gray-50",
};

const SCORE_BADGE = {
  high: "bg-blue-100 text-blue-700 border-blue-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-gray-100 text-gray-500 border-gray-200",
};

const SCORE_LABEL = { high: "推奨", medium: "普通", low: "要検討" };

const DENSITY_LABEL = { low: "競合少", medium: "競合中", high: "競合多" };

const RELATION_BADGE = {
  new: "bg-green-100 text-green-700 border-green-200",
  series: "bg-purple-100 text-purple-700 border-purple-200",
  near_duplicate: "bg-orange-100 text-orange-700 border-orange-200",
};

const RELATION_LABEL = {
  new: "新規",
  series: "シリーズ向き",
  near_duplicate: "要差別化",
};

const THEME_MODES: {
  id: ThemeMode;
  title: string;
  description: string;
  example: string;
}[] = [
  {
    id: "A",
    title: "定番ネタ",
    description: "いつ見られても困らない「使い方・設定」のテーマ",
    example: "例：Gmailの整理、Androidの便利設定",
  },
  {
    id: "B",
    title: "今話題のネタ",
    description: "新機能や最近のアップデートなど「今」のテーマ",
    example: "例：アプリの新機能、最新アップデート",
  },
  {
    id: "C",
    title: "両方まぜる",
    description: "定番と今話題を半分ずつ混ぜて候補を出す",
    example: "迷ったらこちら（おすすめ）",
  },
];

const PROGRESS_LABELS = [
  "検索データ収集中",
  "競合チャンネル分析中",
  "自チャンネル履歴照合中",
  "切り口を整理中",
  "候補を生成中",
  "被り・シリーズ判定中",
];

export function ThemeInput({ pattern, onSelect, onAnalysisStart }: Props) {
  // 閲覧専用ログインでは AI・外部 API を呼ばず、デモ再生（サンプル結果）に切り替える
  const viewerReadOnly = useReadOnly();
  const [userTheme, setUserTheme] = useState("");
  const [category, setCategory] = useState("");
  const [themeMode, setThemeMode] = useState<ThemeMode | null>(null);
  const [loading, setLoading] = useState(false);
  const [progressIndex, setProgressIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<ApiErrorCode | undefined>(undefined);
  const [errorDetail, setErrorDetail] = useState<string | undefined>(undefined);
  const [candidates, setCandidates] = useState<EnrichedCandidate[]>([]);
  const [competitorSuggestions, setCompetitorSuggestions] = useState<CompetitorSuggestion[]>([]);
  const [showCompetitorModal, setShowCompetitorModal] = useState(false);
  const [selectedCompetitors, setSelectedCompetitors] = useState<Set<string>>(new Set());
  const [savingCompetitors, setSavingCompetitors] = useState(false);
  const [competitorError, setCompetitorError] = useState<string | null>(null);
  const [competitorStats, setCompetitorStats] = useState<Record<string, ChannelSubscriberStats>>({});
  const [analyzed, setAnalyzed] = useState(false);

  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const [openIndexes, setOpenIndexes] = useState<Set<number>>(new Set());
  const [themeModeLocked, setThemeModeLocked] = useState(false);

  function resetResults() {
    setCandidates([]);
    setPickedIndex(null);
    setOpenIndexes(new Set());
    setCompetitorSuggestions([]);
    setShowCompetitorModal(false);
    setSelectedCompetitors(new Set());
    setCompetitorStats({});
    setCompetitorError(null);
    setAnalyzed(false);
    setError(null);
    setErrorCode(undefined);
    setErrorDetail(undefined);
    setProgressIndex(0);
  }

  useEffect(() => {
    if (!pattern) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    resetResults();
    setThemeModeLocked(false);
    setThemeMode(null);
    setCategory("");
    setUserTheme("");
  }, [pattern]);

  useEffect(() => {
    if (!loading) return;
    const timer = setInterval(() => {
      setProgressIndex((i) => (i < PROGRESS_LABELS.length - 1 ? i + 1 : i));
    }, 12000);
    return () => clearInterval(timer);
  }, [loading]);

  useEffect(() => {
    if (!showCompetitorModal || competitorSuggestions.length === 0) return;
    const ids = competitorSuggestions.map((s) => s.channelId);
    fetch("/api/competitors/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelIds: ids }),
    })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          throw new Error((data as { error?: string }).error ?? "競合統計の取得に失敗しました");
        }
        setCompetitorStats((data as { stats?: Record<string, ChannelSubscriberStats> }).stats ?? {});
      })
      .catch(() => setCompetitorStats({}));
  }, [showCompetitorModal, competitorSuggestions]);

  function toggleOpen(i: number) {
    setOpenIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  async function handleResearch() {
    onAnalysisStart?.();
    setLoading(true);
    setProgressIndex(0);
    resetResults();
    if (pattern === "market") {
      setThemeModeLocked(true);
    }
    try {
      if (viewerReadOnly) {
        // デモ再生: 進行表示だけ本物と同じテンポ感で流し、サンプル候補を表示する
        for (let step = 0; step < 3; step++) {
          await demoDelay(1100);
          setProgressIndex((i) => Math.min(i + 1, PROGRESS_LABELS.length - 1));
        }
        setAnalyzed(true);
        setCandidates(DEMO_CANDIDATES);
        // 競合チャンネルの追加候補も本物と同じ流れで提示する。
        // 候補リストだけデモ定義で、統計取得・承認保存は閲覧専用でも許可された実 API を使う
        setCompetitorSuggestions(DEMO_COMPETITOR_SUGGESTIONS);
        setSelectedCompetitors(
          new Set(DEMO_COMPETITOR_SUGGESTIONS.map((s) => s.channelId)),
        );
        setShowCompetitorModal(true);
        return;
      }

      const endpoint = pattern === "market" ? "/api/market-research" : "/api/adapt-theme";
      const body =
        pattern === "market"
          ? { category, themeMode: themeMode ?? "C" }
          : { theme: userTheme };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(toUserMessage(data.error, "分析に失敗しました。しばらくしてから再試行してください。"));
        setErrorCode(data.code as ApiErrorCode | undefined);
        setErrorDetail(data.detail as string | undefined);
        return;
      }

      const results: EnrichedCandidate[] = data.candidates ?? [];
      setAnalyzed(true);
      setCandidates(results);

      const suggestions: CompetitorSuggestion[] = data.competitorSuggestions ?? [];
      if (suggestions.length > 0) {
        setCompetitorSuggestions(suggestions);
        setSelectedCompetitors(new Set(suggestions.map((s) => s.channelId)));
        setShowCompetitorModal(true);
      }
    } catch (e) {
      console.error("ThemeInput fetch error:", e);
      setError("通信エラーが発生しました。ネットワークを確認して再試行してください。");
      setErrorCode("upstream");
      setErrorDetail(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
      setProgressIndex(PROGRESS_LABELS.length - 1);
    }
  }

  async function handleApproveCompetitors() {
    const toSave = competitorSuggestions.filter((s) => selectedCompetitors.has(s.channelId));
    if (toSave.length === 0) {
      setShowCompetitorModal(false);
      return;
    }
    setSavingCompetitors(true);
    setCompetitorError(null);
    try {
      const res = await fetch("/api/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channels: toSave.map((s) => ({
            channelId: s.channelId,
            displayName: s.displayName,
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? "競合チャンネルの保存に失敗しました");
      }
      setShowCompetitorModal(false);
    } catch (e) {
      console.error("competitors save error:", e);
      setCompetitorError(
        toUserMessage(e, "競合チャンネルの保存に失敗しました。少し時間をおいて、もう一度お試しください。"),
      );
    } finally {
      setSavingCompetitors(false);
    }
  }

  function handleConfirm() {
    if (pickedIndex === null) return;
    onSelect(candidates[pickedIndex]);
  }

  const canAnalyze =
    !!pattern &&
    !loading &&
    (pattern === "market" ? themeMode != null : userTheme.trim().length > 0);

  return (
    <div className="space-y-4">
      {!pattern ? (
        <p className="text-xs text-muted-foreground text-center py-6 leading-relaxed">
          市場分析またはテーマ分析を選んでください
        </p>
      ) : pattern === "market" ? (
        <>
          <div>
            <label
              htmlFor="theme-category"
              className="block text-xs font-medium text-gray-500 mb-1"
            >
              カテゴリ（空白でも OK）
            </label>
            <input
              id="theme-category"
              type="text"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                resetResults();
              }}
              placeholder="例：Gmail, Android, Google フォト"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 bg-white outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-ring"
            />
          </div>

          <div>
            <span
              id="theme-mode-label"
              className="block text-xs font-medium text-gray-700 mb-1"
            >
              どんなネタを探しますか？
            </span>
            {!themeModeLocked && (
              <p className="text-xs text-gray-500 mb-2.5 leading-relaxed">
                探したい動画のタイプを1つ選んでください。
              </p>
            )}
            <div
              role="radiogroup"
              aria-labelledby="theme-mode-label"
              className="space-y-2"
            >
              {(themeModeLocked && themeMode
                ? THEME_MODES.filter((m) => m.id === themeMode)
                : THEME_MODES
              ).map(
                (m) => {
                const selected = themeMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => {
                      if (themeModeLocked) return;
                      setThemeMode(m.id);
                      resetResults();
                    }}
                    disabled={themeModeLocked}
                    className={`w-full flex items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-ring ${
                      themeModeLocked
                        ? "border-blue-300 bg-blue-50 cursor-default"
                        : selected
                        ? "border-blue-400 bg-blue-50 ring-1 ring-blue-200"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <span
                      className={`mt-0.5 w-4 h-4 shrink-0 rounded-full border-2 flex items-center justify-center ${
                        selected ? "border-blue-500" : "border-gray-300"
                      }`}
                      aria-hidden
                    >
                      {selected && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-gray-800 leading-snug">
                        {m.title}
                      </span>
                      <span className="block text-xs text-gray-600 mt-1 leading-relaxed">
                        {m.description}
                      </span>
                      <span className="block text-xs text-gray-400 mt-1 leading-relaxed">
                        {m.example}
                      </span>
                    </span>
                  </button>
                );
              },
              )}
            </div>
          </div>
        </>
      ) : (
        <div>
          <label
            htmlFor="user-theme"
            className="block text-xs font-medium text-gray-500 mb-1"
          >
            テーマを入力
          </label>
          <input
            id="user-theme"
            type="text"
            value={userTheme}
            onChange={(e) => {
              setUserTheme(e.target.value);
              resetResults();
            }}
            placeholder="例：LINEの通知をまとめて管理する方法"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 bg-white outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-ring"
          />
        </div>
      )}

      {pattern && (
      <Button
        onClick={handleResearch}
        disabled={!canAnalyze}
        size="lg"
        aria-busy={loading}
        className="w-full py-2.5"
      >
        {loading
          ? "AI が分析中…"
          : pattern === "market"
          ? "📊 市場分析する"
          : "✨ テーマ分析する"}
      </Button>
      )}

      {loading && (
        <div
          role="status"
          aria-live="polite"
          aria-label="AI が分析中"
          className="analysis-loading-panel bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 space-y-1.5"
        >
          {PROGRESS_LABELS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  i < progressIndex
                    ? "bg-blue-500"
                    : i === progressIndex
                    ? "bg-blue-500 analysis-loading-dot"
                    : "bg-gray-300"
                }`}
              />
              <span
                className={`text-xs ${
                  i <= progressIndex ? "text-blue-700" : "text-gray-400"
                } ${i === progressIndex ? "analysis-loading-text" : ""}`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      )}

      {error && (
        <ErrorBox
          error={error}
          code={errorCode}
          detail={errorDetail}
          onRetry={handleResearch}
          retrying={loading}
          retryDisabled={!canAnalyze}
        />
      )}

      {analyzed && !loading && !error && candidates.length === 0 && (
        <div
          role="status"
          className="text-center bg-muted/40 border border-border rounded-lg px-3 py-6 space-y-3"
        >
          <p className="text-xs text-muted-foreground leading-relaxed">
            候補が見つかりませんでした。条件を変えて再試行してください。
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResearch}
            disabled={!canAnalyze}
          >
            再試行
          </Button>
        </div>
      )}

      {candidates.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              テーマ候補
            </h3>
          </div>
          {viewerReadOnly && <DemoAiNotice />}

          {candidates.map((c, i) => {
            const isPicked = pickedIndex === i;
            const isOpen = openIndexes.has(i);
            return (
              <div
                key={i}
                className={`border-2 rounded-xl overflow-hidden transition-all ${
                  isPicked
                    ? `${SCORE_BORDER[c.score]} ${SCORE_BG[c.score]} shadow-sm`
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-start gap-2 p-3">
                  <button onClick={() => setPickedIndex(i)} className="flex-1 text-left">
                    <span className="text-xs text-gray-700 leading-snug">{c.title}</span>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {c.ownChannelRelation && (
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded-full border font-medium ${
                            RELATION_BADGE[c.ownChannelRelation]
                          }`}
                        >
                          {RELATION_LABEL[c.ownChannelRelation]}
                        </span>
                      )}
                      {c.competitionDensity && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full border border-gray-200 bg-gray-50 text-gray-500">
                          {DENSITY_LABEL[c.competitionDensity]}
                        </span>
                      )}
                    </div>
                  </button>
                  <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full border font-medium ${
                        SCORE_BADGE[c.score]
                      }`}
                    >
                      {SCORE_LABEL[c.score]}
                    </span>
                    <button
                      onClick={() => toggleOpen(i)}
                      className="text-gray-500 hover:text-gray-700 text-xs leading-none w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                      aria-label={isOpen ? "詳細を隠す" : "詳細を表示"}
                      aria-expanded={isOpen}
                      aria-controls={`candidate-detail-${i}`}
                    >
                      <span
                        className={`inline-block transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                      >
                        ▾
                      </span>
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div
                    id={`candidate-detail-${i}`}
                    className="border-t border-gray-100 px-3 pb-3 pt-2 space-y-2.5 bg-white bg-opacity-60"
                  >
                    {c.differentiationAngle && (
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                          差別化切り口
                        </p>
                        <p className="text-xs text-gray-700 leading-relaxed">
                          {c.differentiationAngle}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
                        フック
                      </p>
                      <p className="text-xs text-blue-600 italic leading-relaxed">
                        「{c.hook}」
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                        視聴者の悩み
                      </p>
                      <p className="text-xs text-gray-700 leading-relaxed">{c.targetPain}</p>
                    </div>
                    {c.reason && (
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                          選定理由
                        </p>
                        <p className="text-xs text-gray-500 leading-relaxed">{c.reason}</p>
                      </div>
                    )}
                    {c.competitorNotes && (
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                          競合との差分
                        </p>
                        <p className="text-xs text-gray-500 leading-relaxed">{c.competitorNotes}</p>
                      </div>
                    )}
                    {c.seriesPotential && (
                      <div>
                        <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">
                          シリーズ化
                        </p>
                        <p className="text-xs text-purple-600 leading-relaxed">
                          {c.seriesPotential}
                        </p>
                      </div>
                    )}
                    {c.overlapWarning && (
                      <div>
                        <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">
                          被り注意
                        </p>
                        <p className="text-xs text-orange-600 leading-relaxed">
                          {c.overlapWarning}
                        </p>
                      </div>
                    )}
                    {c.referencedVideos && c.referencedVideos.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                          参照動画
                        </p>
                        <ul className="space-y-1">
                          {c.referencedVideos.map((v, vi) => (
                            <li key={vi}>
                              <a
                                href={v.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline leading-relaxed"
                              >
                                {v.title}
                              </a>
                              <span className="text-xs text-gray-400 ml-1">
                                ({v.channel}
                                {v.viewCount
                                  ? `, ${Number(v.viewCount).toLocaleString()}回`
                                  : ""}
                                )
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {c.titleAlternatives && c.titleAlternatives.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                          代替タイトル
                        </p>
                        <ul className="list-disc list-inside text-xs text-gray-500 space-y-0.5">
                          {c.titleAlternatives.map((t, ti) => (
                            <li key={ti}>{t}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <div className="pt-1">
            <Button
              onClick={handleConfirm}
              disabled={pickedIndex === null}
              size="lg"
              className="w-full py-2.5 rounded-xl font-semibold shadow-sm"
            >
              {pickedIndex !== null ? "6本の柱を作成する →" : "候補を選んでください"}
            </Button>
          </div>
        </div>
      )}

      {competitorSuggestions.length > 0 && (
        <Dialog
          open={showCompetitorModal}
          onOpenChange={(open) => {
            if (!open) {
              setShowCompetitorModal(false);
              setCompetitorError(null);
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>競合チャンネルを登録</DialogTitle>
              <DialogDescription>
                今回の分析で見つかった競合 ch です。今後の分析に使う ch を選んで承認してください。
              </DialogDescription>
            </DialogHeader>

            {viewerReadOnly && (
              <DemoAiNotice>
                この候補はデモ用に用意したサンプルです（チャンネルは実在）。承認すると競合リストに実際に追加され、競合チャンネル設定からいつでも削除できます。
              </DemoAiNotice>
            )}

            {competitorError && (
              <div
                role="alert"
                className="flex items-start justify-between gap-2 text-xs text-destructive leading-relaxed bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2"
              >
                <span className="min-w-0">{competitorError}</span>
                <Button
                  variant="destructive"
                  size="xs"
                  onClick={handleApproveCompetitors}
                  disabled={savingCompetitors}
                  className="shrink-0"
                >
                  再試行
                </Button>
              </div>
            )}

            <ul className="space-y-2 max-h-56 overflow-y-auto">
              {competitorSuggestions.map((s) => (
                <li key={s.channelId}>
                  <label className="flex items-start gap-2 cursor-pointer rounded-lg p-1 -m-1 hover:bg-muted/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedCompetitors.has(s.channelId)}
                      onChange={(e) => {
                        setSelectedCompetitors((prev) => {
                          const next = new Set(prev);
                          if (e.target.checked) next.add(s.channelId);
                          else next.delete(s.channelId);
                          return next;
                        });
                      }}
                      className="rounded border-gray-300 mt-0.5"
                    />
                    <CompetitorChannelAvatar
                      channelId={s.channelId}
                      displayName={s.displayName}
                      thumbnailUrl={competitorStats[s.channelId]?.thumbnailUrl}
                      size={32}
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-xs text-gray-700">
                        <a
                          href={youtubeChannelUrl(s.channelId)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-blue-600 hover:underline"
                        >
                          {s.displayName}
                        </a>
                        <span className="text-gray-500 ml-1">({s.videoCount}件ヒット)</span>
                      </span>
                      <CompetitorSubscriberStats stats={competitorStats[s.channelId]} />
                    </div>
                  </label>
                </li>
              ))}
            </ul>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCompetitorModal(false)}
              >
                後で
              </Button>
              <Button
                onClick={handleApproveCompetitors}
                disabled={savingCompetitors}
                aria-busy={savingCompetitors}
              >
                {savingCompetitors ? "保存中…" : "承認して保存"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
