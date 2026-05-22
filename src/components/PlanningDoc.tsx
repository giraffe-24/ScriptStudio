"use client";

import { useEffect, useRef, useState } from "react";
import type { ThemeCandidate, ChatMessage } from "@/lib/types";
import { ChatPane } from "./ChatPane";

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

interface Props {
  candidate: ThemeCandidate | null;
  plan?: Plan | null;
  onPlanReady: (plan: Plan, title: string) => void;
}

export function PlanningDoc({ candidate, plan: initialPlan, onPlanReady }: Props) {
  const [plan, setPlan] = useState<Plan | null>(initialPlan ?? null);
  const [loading, setLoading] = useState(false);
  const [chatSection, setChatSection] = useState<{ label: string; content: string } | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (initialPlan) {
      setPlan(initialPlan);
      setChatSection(null);
      setChatHistory([]);
    }
  }, [initialPlan]);

  useEffect(() => {
    if (!candidate) return;
    generatePlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidate]);

  async function generatePlan() {
    if (!candidate) return;
    setLoading(true);
    setPlan(null);
    setChatSection(null);
    setChatHistory([]);

    const res = await fetch("/api/generate-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        theme: candidate.title,
        hook: candidate.hook,
        targetPain: candidate.targetPain,
        reason: candidate.reason,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      console.error("[PlanningDoc] generate-plan error:", err);
      alert(`企画書の生成に失敗しました。\n${err.error ?? res.statusText}`);
      setLoading(false);
      return;
    }

    const data = await res.json();
    setPlan(data.plan ?? null);
    setLoading(false);
  }

  function update<K extends keyof Plan>(key: K, value: Plan[K]) {
    if (!plan) return;
    setPlan({ ...plan, [key]: value });
  }

  if (!candidate && !plan) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-300">
          <div className="text-5xl mb-3">📋</div>
          <p className="text-sm">テーマを選択すると企画書を生成します</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-bounce">✍️</div>
          <p className="text-sm text-gray-500">企画書を生成中…</p>
          <p className="text-xs text-gray-400 mt-1">10〜20 秒かかります</p>
        </div>
      </div>
    );
  }

  if (!plan) return null;

  return (
    <div className="flex h-full overflow-hidden">
      {/* 企画書本体 */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="max-w-2xl mx-auto px-8 py-6 space-y-6">

          {/* タイトル */}
          <div>
            <input
              value={plan.episodeTitle}
              onChange={(e) => update("episodeTitle", e.target.value)}
              className="w-full text-base font-bold text-gray-900 bg-transparent border-0 focus:outline-none"
              placeholder="動画タイトルを入力…"
            />
            <div className="border-b-2 border-gray-800 mt-1" />
          </div>

          {/* フック */}
          {candidate.hook && (
            <DocSection label="フック（冒頭 30 秒）">
              <p className="text-sm text-blue-600 italic leading-relaxed">
                「{candidate.hook}」
              </p>
            </DocSection>
          )}

          {/* 想定視聴者 */}
          <DocSection
            label="想定視聴者"
            onChat={() => setChatSection({ label: "想定視聴者", content: plan.targetViewer })}
          >
            <AutoResizeTextarea
              value={plan.targetViewer}
              onChange={(v) => update("targetViewer", v)}
              placeholder="想定視聴者を記述…"
            />
          </DocSection>

          {/* 視聴者の悩み */}
          <DocSection
            label="視聴者の悩み"
            onChat={() => setChatSection({ label: "視聴者の悩み", content: plan.pain })}
          >
            <AutoResizeTextarea
              value={plan.pain}
              onChange={(v) => update("pain", v)}
              placeholder="悩みを記述…"
            />
          </DocSection>

          {/* 動画で提供する価値 */}
          <DocSection
            label="動画で提供する価値"
            onChat={() => setChatSection({ label: "動画の約束", content: plan.promise })}
          >
            <AutoResizeTextarea
              value={plan.promise}
              onChange={(v) => update("promise", v)}
              placeholder="視聴者が得る価値を記述…"
            />
          </DocSection>

          {/* コンテンツの核 */}
          <DocSection
            label="コンテンツの核"
            onChat={() =>
              setChatSection({ label: "コンテンツの核", content: plan.keyPoints.join("\n") })
            }
          >
            <KeyPointList
              items={plan.keyPoints}
              onChange={(items) => update("keyPoints", items)}
            />
          </DocSection>

          {/* 構成 */}
          <DocSection
            label="構成"
            onChat={() =>
              setChatSection({
                label: "構成",
                content: plan.outline.map((o) => `${o.section}：${o.content}`).join("\n"),
              })
            }
          >
            <OutlineEditor
              items={plan.outline}
              onChange={(items) => update("outline", items)}
            />
          </DocSection>

          {/* 競合との差別化 */}
          <DocSection
            label="競合との差別化"
            onChat={() =>
              setChatSection({ label: "差別化", content: plan.competitorAnalysis })
            }
          >
            <AutoResizeTextarea
              value={plan.competitorAnalysis}
              onChange={(v) => update("competitorAnalysis", v)}
              placeholder="差別化ポイントを記述…"
            />
          </DocSection>

          {/* 想定尺 */}
          <DocSection label="想定尺">
            <input
              value={plan.estimatedLength}
              onChange={(e) => update("estimatedLength", e.target.value)}
              className="text-sm text-gray-700 bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-400 w-40"
            />
          </DocSection>

          {/* 台本作成ボタン */}
          <div className="pt-2 pb-6">
            <button
              onClick={() => onPlanReady(plan, plan.episodeTitle)}
              className="w-full bg-blue-500 hover:bg-blue-600 active:scale-[0.98] text-white font-semibold text-sm py-3 rounded-xl transition-all shadow-sm"
            >
              台本を作成する →
            </button>
            <p className="text-center text-[10px] text-gray-400 mt-1.5">
              企画書の内容が決まったら押してください
            </p>
          </div>
        </div>
      </div>

      {/* チャットパネル */}
      {chatSection && (
        <ChatPane
          theme={candidate.title}
          sectionLabel={chatSection.label}
          sectionContent={chatSection.content}
          history={chatHistory}
          onHistoryUpdate={setChatHistory}
          onClose={() => setChatSection(null)}
        />
      )}
    </div>
  );
}

/* ── ドキュメントセクション ── */
function DocSection({
  label,
  children,
  onChat,
}: {
  label: string;
  children: React.ReactNode;
  onChat?: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between pb-1 border-b border-gray-300 mb-3">
        <h3 className="text-sm font-semibold text-gray-800">{label}</h3>
        {onChat && (
          <button
            onClick={onChat}
            className="text-[10px] text-gray-400 hover:text-blue-500 border border-gray-200 hover:border-blue-300 px-2 py-0.5 rounded-full transition-colors shrink-0 ml-2"
          >
            AI と深掘り
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

/* ── キーポイントリストエディタ ── */
function KeyPointList({
  items,
  onChange,
}: {
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key === "Enter") {
      e.preventDefault();
      const next = [...items];
      next.splice(index + 1, 0, "");
      onChange(next);
      setTimeout(() => refs.current[index + 1]?.focus(), 0);
    } else if (e.key === "Backspace" && items[index] === "" && items.length > 1) {
      e.preventDefault();
      const next = items.filter((_, i) => i !== index);
      onChange(next);
      setTimeout(() => refs.current[Math.max(0, index - 1)]?.focus(), 0);
    }
  }

  return (
    <ul className="space-y-2">
      {items.map((point, i) => (
        <li key={i} className="flex items-center gap-2.5">
          <span className="text-gray-500 text-[10px] shrink-0">●</span>
          <input
            ref={(el) => { refs.current[i] = el; }}
            value={point}
            onChange={(e) => {
              const next = [...items];
              next[i] = e.target.value;
              onChange(next);
            }}
            onKeyDown={(e) => handleKeyDown(e, i)}
            className="flex-1 text-sm text-gray-700 bg-transparent border-b border-gray-200 focus:outline-none focus:border-blue-300 py-0.5"
            placeholder="ポイントを入力（Enter で追加）"
          />
        </li>
      ))}
    </ul>
  );
}

/* ── 構成エディタ ── */
function OutlineEditor({
  items,
  onChange,
}: {
  items: { section: string; content: string }[];
  onChange: (items: { section: string; content: string }[]) => void;
}) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex gap-3">
          {/* 左：番号＋セクション名 */}
          <div className="w-36 shrink-0 pt-0.5">
            <span className="text-xs text-gray-400 leading-relaxed">{item.section}</span>
          </div>
          {/* 右：内容 */}
          <div className="flex-1 border-b border-gray-200 pb-1">
            <AutoResizeTextarea
              value={item.content}
              onChange={(v) => {
                const next = [...items];
                next[i] = { ...next[i], content: v };
                onChange(next);
              }}
              placeholder="内容を記述…"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── 共通：自動リサイズ textarea ── */
function AutoResizeTextarea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
        e.target.style.height = "auto";
        e.target.style.height = `${e.target.scrollHeight}px`;
      }}
      onFocus={(e) => {
        e.target.style.height = "auto";
        e.target.style.height = `${e.target.scrollHeight}px`;
      }}
      rows={2}
      placeholder={placeholder}
      className="w-full text-sm text-gray-700 bg-transparent resize-none overflow-hidden border-0 focus:outline-none leading-relaxed placeholder:text-gray-300"
    />
  );
}
