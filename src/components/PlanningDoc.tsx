"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ThemeCandidate, ChatMessage } from "@/lib/types";
import { ChatPane } from "./ChatPane";
import { sanitizePlanOutline, sanitizeSectionName } from "@/lib/plan-outline";

/* ── 編集フィールド共通スタイル ── */
const EDITABLE =
  "w-full text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 leading-relaxed placeholder:text-gray-300 transition-colors";

const EDITABLE_INPUT =
  "w-full text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 placeholder:text-gray-300 transition-colors";

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
  episodeNumber?: number | null;
  onPlanReady: (plan: Plan, title: string) => void;
  onTitleChange?: (title: string) => void;
  onEpisodeNumberChange?: (number: number) => void;
  onPlanChange?: (plan: Plan) => void;
}

export function PlanningDoc({ candidate, plan: initialPlan, episodeNumber, onPlanReady, onTitleChange, onEpisodeNumberChange, onPlanChange }: Props) {
  const [plan, setPlan] = useState<Plan | null>(initialPlan ?? null);
  const [loading, setLoading] = useState(false);
  const [chatSection, setChatSection] = useState<{ label: string; content: string } | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (initialPlan) {
      setPlan(sanitizePlanOutline(initialPlan));
    } else if (!candidate) {
      setPlan(null);
    }
    setChatSection(null);
    setChatHistory([]);
    setLoading(false);
  }, [initialPlan, candidate]);

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
    setPlan(sanitizePlanOutline(data.plan ?? null));
    setLoading(false);
  }

  function update<K extends keyof Plan>(key: K, value: Plan[K]) {
    if (!plan) return;
    const next = { ...plan, [key]: value };
    setPlan(next);
    onPlanChange?.(next);
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
          <DocSection label="タイトル">
            <div className="flex gap-2 items-stretch">
              <div className="relative w-14 shrink-0">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm font-mono text-gray-400 select-none">
                  #
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={3}
                  value={episodeNumber != null ? String(episodeNumber) : ""}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 3);
                    if (!digits) return;
                    const n = parseInt(digits, 10);
                    if (n > 0) onEpisodeNumberChange?.(n);
                  }}
                  className={`${EDITABLE_INPUT} w-full text-left font-mono pl-5 pr-1.5 py-2 tabular-nums`}
                  placeholder="—"
                  aria-label="動画管理番号"
                />
              </div>
              <input
                value={plan.episodeTitle}
                onChange={(e) => {
                  update("episodeTitle", e.target.value);
                  onTitleChange?.(e.target.value);
                }}
                className={`${EDITABLE_INPUT} flex-1 min-w-0`}
                placeholder="動画タイトルを入力…"
              />
            </div>
          </DocSection>

          {/* フック */}
          {candidate?.hook && (
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
              historyResetKey={initialPlan?.episodeTitle ?? "plan"}
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
              className={`${EDITABLE_INPUT} w-40`}
              placeholder="例：10〜15分"
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
              押すと台本の生成を開始します（登録済みのファイルは上書きしません）
            </p>
          </div>
        </div>
      </div>

      {/* チャットパネル */}
      {chatSection && (
        <ChatPane
          theme={candidate?.title ?? plan?.episodeTitle ?? ""}
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
        <li key={i} className="flex items-start gap-2.5">
          <span className="text-gray-500 text-[10px] shrink-0 mt-3">●</span>
          <input
            ref={(el) => { refs.current[i] = el; }}
            value={point}
            onChange={(e) => {
              const next = [...items];
              next[i] = e.target.value;
              onChange(next);
            }}
            onKeyDown={(e) => handleKeyDown(e, i)}
            className={`${EDITABLE_INPUT} flex-1`}
            placeholder="ポイントを入力（Enter で追加）"
          />
        </li>
      ))}
    </ul>
  );
}

/* ── 構成エディタ ── */
type OutlineItem = { section: string; content: string };

function cloneOutline(items: OutlineItem[]): OutlineItem[] {
  return items.map((item) => ({ ...item }));
}

function OutlineEditor({
  items,
  onChange,
  historyResetKey,
}: {
  items: OutlineItem[];
  onChange: (items: OutlineItem[]) => void;
  historyResetKey?: string;
}) {
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const pastRef = useRef<OutlineItem[][]>([]);
  const futureRef = useRef<OutlineItem[][]>([]);
  const skipHistoryRef = useRef(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    pastRef.current = [];
    futureRef.current = [];
    setCanUndo(false);
    setCanRedo(false);
  }, [historyResetKey]);

  function syncHistoryFlags() {
    setCanUndo(pastRef.current.length > 0);
    setCanRedo(futureRef.current.length > 0);
  }

  function applyChange(next: OutlineItem[], recordHistory = true) {
    if (recordHistory && !skipHistoryRef.current) {
      pastRef.current.push(cloneOutline(itemsRef.current));
      futureRef.current = [];
    }
    skipHistoryRef.current = false;
    onChange(next);
    syncHistoryFlags();
  }

  const focusSnapshotRef = useRef<OutlineItem[] | null>(null);

  function handleFieldFocus() {
    focusSnapshotRef.current = cloneOutline(itemsRef.current);
  }

  function handleFieldBlur() {
    if (!focusSnapshotRef.current) return;
    if (JSON.stringify(focusSnapshotRef.current) !== JSON.stringify(itemsRef.current)) {
      pastRef.current.push(focusSnapshotRef.current);
      futureRef.current = [];
      syncHistoryFlags();
    }
    focusSnapshotRef.current = null;
  }

  function updateField(index: number, field: "section" | "content", value: string) {
    const next = cloneOutline(items);
    next[index] = {
      ...next[index],
      [field]:
        field === "section"
          ? sanitizeSectionName(value, next[index].content)
          : value,
    };
    skipHistoryRef.current = true;
    onChange(next);
  }

  function undo() {
    const prev = pastRef.current.pop();
    if (!prev) return;
    futureRef.current.push(cloneOutline(itemsRef.current));
    skipHistoryRef.current = true;
    onChange(prev);
    syncHistoryFlags();
  }

  function redo() {
    const next = futureRef.current.pop();
    if (!next) return;
    pastRef.current.push(cloneOutline(itemsRef.current));
    skipHistoryRef.current = true;
    onChange(next);
    syncHistoryFlags();
  }

  function moveItem(from: number, to: number) {
    if (to < 0 || to >= items.length) return;
    const next = cloneOutline(items);
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    applyChange(next);
  }

  function removeItem(index: number) {
    if (items.length <= 1) return;
    applyChange(items.filter((_, i) => i !== index));
  }

  function addItem() {
    applyChange([...items, { section: "", content: "" }]);
  }

  return (
    <div className="space-y-3">
      {/* 列見出し + 戻す/進む */}
      <div className="flex items-start gap-2">
        <div className="w-7 shrink-0" />
        <div className="w-40 shrink-0">
          <span className="text-xs font-medium text-gray-500">目次案</span>
        </div>
        <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
          <span className="text-xs font-medium text-gray-500">詳細</span>
          <div className="flex gap-1 shrink-0">
            <button
              type="button"
              onClick={undo}
              disabled={!canUndo}
              className="text-[10px] px-2 py-0.5 rounded border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ↩ 戻す
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={!canRedo}
              className="text-[10px] px-2 py-0.5 rounded border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ↪ 進む
            </button>
          </div>
        </div>
      </div>

      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          {/* 操作ボタン */}
          <div className="w-7 shrink-0 flex flex-col gap-0.5 pt-1">
            <button
              type="button"
              onClick={() => moveItem(i, i - 1)}
              disabled={i === 0}
              className="w-7 h-6 rounded text-[10px] text-gray-400 hover:text-blue-500 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="上へ移動"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => moveItem(i, i + 1)}
              disabled={i === items.length - 1}
              className="w-7 h-6 rounded text-[10px] text-gray-400 hover:text-blue-500 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="下へ移動"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => removeItem(i)}
              disabled={items.length <= 1}
              className="w-7 h-6 rounded text-[10px] text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="削除"
            >
              ×
            </button>
          </div>
          {/* 左：セクション名 */}
          <div className="w-40 shrink-0">
            <AutoResizeTextarea
              value={item.section}
              onChange={(v) => updateField(i, "section", v)}
              onFocus={handleFieldFocus}
              onBlur={handleFieldBlur}
              placeholder="セクション名…"
              className="text-xs text-gray-600"
            />
          </div>
          {/* 右：内容 */}
          <div className="flex-1">
            <AutoResizeTextarea
              value={item.content}
              onChange={(v) => updateField(i, "content", v)}
              onFocus={handleFieldFocus}
              onBlur={handleFieldBlur}
              placeholder="内容を記述…"
            />
          </div>
        </div>
      ))}

      {/* 行追加（1ボタン） */}
      <button
        type="button"
        onClick={addItem}
        className="w-full py-2 rounded-lg border border-dashed border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-500 text-sm transition-colors"
        aria-label="構成を追加"
      >
        ＋
      </button>
    </div>
  );
}

/* ── 共通：自動リサイズ textarea（全文常時表示・スクロール禁止） ── */
function AutoResizeTextarea({
  value,
  onChange,
  placeholder,
  className,
  onFocus,
  onBlur,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useLayoutEffect(() => {
    resize();
  }, [value, resize]);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    return () => observer.disconnect();
  }, [resize]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => {
        onFocus?.();
        resize();
      }}
      onBlur={() => onBlur?.()}
      rows={1}
      placeholder={placeholder}
      className={`${EDITABLE}${className ? ` ${className}` : ""}`}
      style={{ overflow: "hidden" }}
    />
  );
}
