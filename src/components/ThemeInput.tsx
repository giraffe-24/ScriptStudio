"use client";

import { useEffect, useState } from "react";
import type {
  CompetitorSuggestion,
  EnrichedCandidate,
  ThemeCandidate,
  ThemeMode,
  ThemePattern,
} from "@/lib/types";
import type { ThemeSearchSources } from "@/lib/theme-search";
import type { ChannelSubscriberStats } from "@/lib/market-analysis/subscriber-history";
import { youtubeChannelUrl } from "@/lib/youtube-channel-url";
import { CompetitorSubscriberStats } from "@/components/CompetitorSubscriberStats";
import { CompetitorChannelAvatar } from "@/components/CompetitorChannelAvatar";

interface Props {
  pattern: ThemePattern;
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
  const [userTheme, setUserTheme] = useState("");
  const [category, setCategory] = useState("");
  const [themeMode, setThemeMode] = useState<ThemeMode>("C");
  const [loading, setLoading] = useState(false);
  const [progressIndex, setProgressIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<EnrichedCandidate[]>([]);
  const [searchSources, setSearchSources] = useState<ThemeSearchSources | null>(null);
  const [competitorSuggestions, setCompetitorSuggestions] = useState<CompetitorSuggestion[]>([]);
  const [showCompetitorModal, setShowCompetitorModal] = useState(false);
  const [selectedCompetitors, setSelectedCompetitors] = useState<Set<string>>(new Set());
  const [savingCompetitors, setSavingCompetitors] = useState(false);
  const [competitorStats, setCompetitorStats] = useState<Record<string, ChannelSubscriberStats>>({});

  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const [openIndexes, setOpenIndexes] = useState<Set<number>>(new Set());
  const [themeModeLocked, setThemeModeLocked] = useState(false);

  function resetResults() {
    setCandidates([]);
    setPickedIndex(null);
    setOpenIndexes(new Set());
    setSearchSources(null);
    setCompetitorSuggestions([]);
    setShowCompetitorModal(false);
    setSelectedCompetitors(new Set());
    setCompetitorStats({});
    setError(null);
    setProgressIndex(0);
  }

  function resetMarketForm() {
    resetResults();
    setThemeModeLocked(false);
  }

  useEffect(() => {
    resetMarketForm();
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
      .then((r) => r.json())
      .then((d) => setCompetitorStats(d.stats ?? {}))
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
      const endpoint = pattern === "market" ? "/api/market-research" : "/api/adapt-theme";
      const body =
        pattern === "market"
          ? { category, themeMode }
          : { theme: userTheme };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "分析に失敗しました。しばらくしてから再試行してください。");
        return;
      }

      const results: EnrichedCandidate[] = data.candidates ?? [];
      setCandidates(results);
      setSearchSources(data.searchSources ?? { youtube: true, google: false, x: false });

      const suggestions: CompetitorSuggestion[] = data.competitorSuggestions ?? [];
      if (suggestions.length > 0) {
        setCompetitorSuggestions(suggestions);
        setSelectedCompetitors(new Set(suggestions.map((s) => s.channelId)));
        setShowCompetitorModal(true);
      }
    } catch (e) {
      console.error("ThemeInput fetch error:", e);
      setError("通信エラーが発生しました。ネットワークを確認して再試行してください。");
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
    try {
      await fetch("/api/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channels: toSave.map((s) => ({
            channelId: s.channelId,
            displayName: s.displayName,
          })),
        }),
      });
      setShowCompetitorModal(false);
    } catch (e) {
      console.error("competitors save error:", e);
    } finally {
      setSavingCompetitors(false);
    }
  }

  function handleConfirm() {
    if (pickedIndex === null) return;
    onSelect(candidates[pickedIndex]);
  }

  return (
    <div className="space-y-4">
      {pattern === "market" ? (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              カテゴリ（空白でも OK）
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                resetMarketForm();
              }}
              placeholder="例：Gmail, Android, Google フォト"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              どんなネタを探しますか？
            </label>
            {!themeModeLocked && (
              <p className="text-[11px] text-gray-500 mb-2.5 leading-relaxed">
                探したい動画のタイプを1つ選んでください。
              </p>
            )}
            <div className="space-y-2">
              {(themeModeLocked ? THEME_MODES.filter((m) => m.id === themeMode) : THEME_MODES).map(
                (m) => {
                const selected = themeMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      if (themeModeLocked) return;
                      setThemeMode(m.id);
                      resetMarketForm();
                    }}
                    disabled={themeModeLocked}
                    className={`w-full flex items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-all ${
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
                      <span className="block text-[11px] text-gray-400 mt-1 leading-relaxed">
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
          <label className="block text-xs font-medium text-gray-500 mb-1">
            テーマを入力
          </label>
          <input
            type="text"
            value={userTheme}
            onChange={(e) => {
              setUserTheme(e.target.value);
              resetResults();
            }}
            placeholder="例：LINEの通知をまとめて管理する方法"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        </div>
      )}

      <button
        onClick={handleResearch}
        disabled={loading || (pattern === "user-input" && !userTheme.trim())}
        className={`w-full rounded-lg py-2.5 text-sm font-medium transition-all ${
          loading
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : pattern === "market"
            ? "bg-blue-500 text-white hover:bg-blue-600"
            : "bg-purple-500 text-white hover:bg-purple-600"
        }`}
      >
        {loading
          ? "AI が分析中…"
          : pattern === "market"
          ? "📊 トレンド分析する"
          : "✨ テーマを改変する"}
      </button>

      {loading && pattern === "market" && (
        <div className="analysis-loading-panel bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 space-y-1.5">
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
                className={`text-[11px] ${
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
        <p className="text-xs text-red-500 leading-relaxed bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {candidates.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              テーマ候補
            </h3>
            {searchSources && (
              <div className="flex flex-wrap gap-1">
                {searchSources.youtube && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                    YouTube（第一指標）
                  </span>
                )}
                {searchSources.google && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                    Google
                  </span>
                )}
                {searchSources.x && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">
                    X
                  </span>
                )}
              </div>
            )}
          </div>

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
                          className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${
                            RELATION_BADGE[c.ownChannelRelation]
                          }`}
                        >
                          {RELATION_LABEL[c.ownChannelRelation]}
                        </span>
                      )}
                      {c.competitionDensity && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-gray-200 bg-gray-50 text-gray-500">
                          {DENSITY_LABEL[c.competitionDensity]}
                        </span>
                      )}
                    </div>
                  </button>
                  <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${
                        SCORE_BADGE[c.score]
                      }`}
                    >
                      {SCORE_LABEL[c.score]}
                    </span>
                    <button
                      onClick={() => toggleOpen(i)}
                      className="text-gray-400 hover:text-gray-600 text-xs leading-none w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
                      aria-label="詳細を表示"
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
                  <div className="border-t border-gray-100 px-3 pb-3 pt-2 space-y-2.5 bg-white bg-opacity-60">
                    {c.differentiationAngle && (
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                          差別化切り口
                        </p>
                        <p className="text-xs text-gray-700 leading-relaxed">
                          {c.differentiationAngle}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">
                        フック
                      </p>
                      <p className="text-xs text-blue-600 italic leading-relaxed">
                        「{c.hook}」
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                        視聴者の悩み
                      </p>
                      <p className="text-xs text-gray-700 leading-relaxed">{c.targetPain}</p>
                    </div>
                    {c.reason && (
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                          選定理由
                        </p>
                        <p className="text-xs text-gray-500 leading-relaxed">{c.reason}</p>
                      </div>
                    )}
                    {c.competitorNotes && (
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                          競合との差分
                        </p>
                        <p className="text-xs text-gray-500 leading-relaxed">{c.competitorNotes}</p>
                      </div>
                    )}
                    {c.seriesPotential && (
                      <div>
                        <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-1">
                          シリーズ化
                        </p>
                        <p className="text-xs text-purple-600 leading-relaxed">
                          {c.seriesPotential}
                        </p>
                      </div>
                    )}
                    {c.overlapWarning && (
                      <div>
                        <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-1">
                          被り注意
                        </p>
                        <p className="text-xs text-orange-600 leading-relaxed">
                          {c.overlapWarning}
                        </p>
                      </div>
                    )}
                    {c.referencedVideos && c.referencedVideos.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
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
                              <span className="text-[10px] text-gray-400 ml-1">
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
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
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
            <button
              onClick={handleConfirm}
              disabled={pickedIndex === null}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                pickedIndex !== null
                  ? "bg-blue-500 text-white hover:bg-blue-600 shadow-sm active:scale-[0.98]"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              {pickedIndex !== null ? "企画書を作成する →" : "候補を選んでください"}
            </button>
          </div>
        </div>
      )}

      {showCompetitorModal && competitorSuggestions.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-800">競合チャンネルを登録</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              今回の分析で見つかった競合 ch です。今後の分析に使う ch を選んで承認してください。
            </p>
            <ul className="space-y-2 max-h-56 overflow-y-auto">
              {competitorSuggestions.map((s) => (
                <li key={s.channelId} className="flex items-start gap-2">
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
                        className="text-blue-600 hover:underline"
                      >
                        {s.displayName}
                      </a>
                      <span className="text-gray-400 ml-1">({s.videoCount}件ヒット)</span>
                    </span>
                    <CompetitorSubscriberStats stats={competitorStats[s.channelId]} />
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowCompetitorModal(false)}
                className="flex-1 py-2 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                後で
              </button>
              <button
                onClick={handleApproveCompetitors}
                disabled={savingCompetitors}
                className="flex-1 py-2 text-xs rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
              >
                {savingCompetitors ? "保存中…" : "承認して保存"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
