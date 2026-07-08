"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { GripVertical, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChatMessage, EpisodePlan, PlanDirection, ThemeCandidate } from "@/lib/types";
import { ChatPane } from "./ChatPane";
import { DirectionPhase } from "./DirectionPhase";
import { GitHistoryModal } from "./GitHistoryModal";
import { sanitizePlanOutline, normalizeSectionNameStructure } from "@/lib/plan-outline";
import { useGitMirrorStatus } from "@/lib/useGitMirrorStatus";
import { useReadOnly } from "@/lib/useViewerRole";
import { buildDemoPlan, demoDelay } from "@/lib/demo-simulation";
import { DemoAiNotice } from "@/components/DemoAiNotice";
import { toUserMessage } from "@/lib/error-message";

/* ── 編集フィールド共通スタイル ── */
const EDITABLE =
  "w-full text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2 resize-none outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 leading-relaxed placeholder:text-gray-400 transition-colors";

const EDITABLE_INPUT =
  "w-full text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 placeholder:text-gray-400 transition-colors";

interface Props {
  candidate: ThemeCandidate | null;
  plan?: EpisodePlan | null;
  episodeNumber?: number | null;
  episodeSlug?: string;
  onPlanReady: (plan: EpisodePlan, title: string) => void | Promise<void>;
  onPlanSave?: (plan: EpisodePlan, title: string) => void | Promise<void>;
  onTitleChange?: (title: string) => void;
  onEpisodeNumberChange?: (number: number) => void;
  onPlanChange?: (plan: EpisodePlan) => void;
}

export function PlanningDoc({
  candidate,
  plan: initialPlan,
  episodeNumber,
  episodeSlug,
  onPlanReady,
  onPlanSave,
  onTitleChange,
  onEpisodeNumberChange,
  onPlanChange,
}: Props) {
  // 閲覧専用ログインでは AI を呼ばず、デモ用の企画書を組み立てて表示する
  const viewerReadOnly = useReadOnly();
  const [draftPlan, setDraftPlan] = useState<EpisodePlan | null>(null);
  const [approvedDirection, setApprovedDirection] = useState<PlanDirection | null>(null);
  const [loading, setLoading] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [chatSection, setChatSection] = useState<{ label: string; content: string } | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  // 番号は確定（blur / Enter）まで親に流さない。編集中に空にできるようローカル draft を持つ
  // （即時反映だと入力途中の中間値でフォルダリネームが走り、空文字は即座に元の値へ戻ってしまう）。
  const [numberDraft, setNumberDraft] = useState<string | null>(null);
  const gitConfigured = useGitMirrorStatus();
  // 企画書のバージョン保存・履歴は台本ペインの統合保存/統合履歴に集約した
  // （状態と自動記録は usePlanVersions として studio レベルにある）。
  const planLoadKeyRef = useRef("");
  const planRequestRef = useRef(0);

  // タイトル変更でキーが変わらないよう slug / 候補テーマのみで判定
  const planLoadKey = `${episodeNumber ?? "new"}:${episodeSlug ?? "new"}:${candidate?.title ?? ""}`;

  useEffect(() => {
    if (planLoadKeyRef.current === planLoadKey) return;
    planLoadKeyRef.current = planLoadKey;
    planRequestRef.current += 1;
    setDraftPlan(null);
    setApprovedDirection(null);
    setChatSection(null);
    setChatHistory([]);
    setLoading(false);
    setPlanError(null);
  }, [planLoadKey]);

  const plan = initialPlan ?? draftPlan;

  function isActivePlanRequest(requestId: number, requestKey: string) {
    return planRequestRef.current === requestId && planLoadKeyRef.current === requestKey;
  }

  async function generatePlan(direction?: PlanDirection) {
    if (!candidate) return;
    const targetCandidate = candidate;
    const requestKey = planLoadKey;
    const requestId = ++planRequestRef.current;
    setLoading(true);
    setPlanError(null);
    setDraftPlan(null);
    setChatSection(null);
    setChatHistory([]);

    try {
      if (viewerReadOnly) {
        // デモ再生: 承認された6本柱を反映したサンプル企画書をその場で組み立てる
        await demoDelay(1800);
        if (!isActivePlanRequest(requestId, requestKey)) return;
        setDraftPlan(buildDemoPlan(targetCandidate, direction ?? approvedDirection ?? undefined));
        return;
      }

      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme: targetCandidate.title,
          hook: targetCandidate.hook,
          targetPain: targetCandidate.targetPain,
          reason: targetCandidate.reason,
          direction: direction ?? approvedDirection ?? undefined,
        }),
      });

      const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      if (!isActivePlanRequest(requestId, requestKey)) return;

      if (!res.ok) {
        console.error("[PlanningDoc] generate-plan error:", data);
        setPlanError(toUserMessage(data.error, "企画書の生成に失敗しました。少し時間をおいて、もう一度お試しください。"));
        return;
      }

      const sanitized = sanitizePlanOutline(data.plan ?? null);
      // 承認された設計思想の6本柱を「コンテンツの核」として確定反映（編集内容をそのまま使う）
      const dir = direction ?? approvedDirection;
      if (sanitized && dir?.axes?.length) {
        const pillars = dir.axes.map((a) => a.title.trim()).filter(Boolean);
        if (pillars.length) sanitized.keyPoints = pillars;
      }
      setDraftPlan(sanitized);
    } catch (error) {
      if (!isActivePlanRequest(requestId, requestKey)) return;
      console.error("[PlanningDoc] generate-plan error:", error);
      setPlanError("企画書の生成に失敗しました。通信状況を確認して再試行してください。");
    } finally {
      if (isActivePlanRequest(requestId, requestKey)) {
        setLoading(false);
      }
    }
  }

  function update<K extends keyof EpisodePlan>(key: K, value: EpisodePlan[K]) {
    const base = initialPlan ?? draftPlan;
    if (!base) return;
    const next = { ...base, [key]: value };
    if (initialPlan) {
      onPlanChange?.(next);
    } else {
      setDraftPlan(next);
    }
  }

  if (!candidate && !plan) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <div className="text-5xl mb-3" aria-hidden>📋</div>
          <p className="text-sm">テーマを選択すると企画書を生成します</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div role="status" aria-live="polite" className="text-center">
          <div className="text-4xl mb-3 animate-bounce" aria-hidden>✍️</div>
          <p className="text-sm text-gray-500">企画書を生成中…</p>
          <p className="text-xs text-gray-500 mt-1">10〜20 秒かかります</p>
        </div>
      </div>
    );
  }

  // 新規テーマで企画書がまだ無い場合は、まず方向性確認フェーズを表示する
  if (candidate && !plan) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        {planError && (
          <div
            role="alert"
            className="flex items-start justify-between gap-2 m-4 mb-0 text-xs text-destructive leading-relaxed bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2"
          >
            <span className="min-w-0">{planError}</span>
            <Button
              variant="destructive"
              size="xs"
              onClick={() => void generatePlan(approvedDirection ?? undefined)}
              className="shrink-0"
            >
              再試行
            </Button>
          </div>
        )}
        <div className="flex-1 min-h-0">
          <DirectionPhase
            candidate={candidate}
            resetKey={planLoadKey}
            onApproved={(direction) => {
              setApprovedDirection(direction);
              void generatePlan(direction);
            }}
          />
        </div>
      </div>
    );
  }

  if (!plan) return null;

  return (
    <div className="flex h-full overflow-hidden">
      {/* 企画書本体 */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 space-y-6">

          {/* デモ生成した企画書には AI 不使用の注意書きを必ず添える */}
          {viewerReadOnly && !initialPlan && <DemoAiNotice />}

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
                  value={numberDraft ?? (episodeNumber != null ? String(episodeNumber) : "")}
                  onChange={(e) => setNumberDraft(e.target.value.replace(/\D/g, "").slice(0, 3))}
                  onBlur={() => {
                    if (numberDraft === null) return;
                    const n = parseInt(numberDraft, 10);
                    setNumberDraft(null);
                    // 空・0 のまま確定したら元の番号に戻す（番号はフォルダ名の一部で必須）
                    if (Number.isFinite(n) && n > 0 && n !== episodeNumber) {
                      onEpisodeNumberChange?.(n);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                    if (e.key === "Escape") setNumberDraft(null);
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
              historyResetKey={planLoadKey}
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

          {/* アクションボタン。
              企画書の保存・履歴は台本ペインの統合保存/統合履歴（企画書＋台本）へ集約した。 */}
          <div className="pt-2 pb-6 space-y-2">
            {/* 台本生成の submit。完了で必ず submitting を戻す（一方向ラッチを防ぐ）。 */}
            <Button
              onClick={async () => {
                if (submitting) return;
                setSubmitting(true);
                try {
                  await onPlanReady(plan, plan.episodeTitle);
                } finally {
                  setSubmitting(false);
                }
              }}
              disabled={submitting}
              aria-busy={submitting}
              size="lg"
              className="w-full py-3 rounded-xl font-semibold shadow-sm"
            >
              {submitting ? "作成中…" : "台本を作成する →"}
            </Button>
            {onPlanSave && !viewerReadOnly && (
              <Button
                onClick={async () => {
                  if (submitting) return;
                  setSubmitting(true);
                  try {
                    await onPlanSave(plan, plan.episodeTitle);
                  } finally {
                    setSubmitting(false);
                  }
                }}
                disabled={submitting}
                variant="outline"
                size="lg"
                className="w-full py-3 rounded-xl font-semibold"
              >
                ＋ エピソードに追加
              </Button>
            )}
            {!viewerReadOnly && (
              <p className="text-center text-xs text-gray-500 mt-1.5">
                「追加」は台本を生成せず、企画のまま一覧に保存します
              </p>
            )}
            {episodeNumber != null && !!episodeSlug && gitConfigured && onPlanChange && (
              <Button
                onClick={() => setHistoryOpen(true)}
                variant="ghost"
                size="sm"
                className="w-full text-gray-500"
              >
                🕘 企画の変更履歴（Git）
              </Button>
            )}
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

      {episodeNumber != null && !!episodeSlug && (
        <GitHistoryModal
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          episodeNumber={episodeNumber}
          episodeSlug={episodeSlug}
          filename="plan.json"
          label="企画書"
          onRestore={async (content) => {
            let parsed: EpisodePlan;
            try {
              parsed = JSON.parse(content) as EpisodePlan;
            } catch {
              throw new Error("保存された企画データを読み込めませんでした");
            }
            const restored = sanitizePlanOutline(parsed) ?? parsed;
            onPlanChange?.(restored);
            onTitleChange?.(restored.episodeTitle);
          }}
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
            type="button"
            onClick={onChat}
            title="AI と深掘り"
            aria-label="AI と深掘り"
            className="inline-flex items-center justify-center text-gray-600 hover:text-foreground hover:bg-muted border border-border hover:border-ring p-1.5 rounded-full transition-colors shrink-0 ml-2 outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <Sparkles className="w-4 h-4" aria-hidden />
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
          <span className="text-gray-500 text-xs shrink-0 mt-3">●</span>
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

function computeDropSlot(clientY: number, rows: HTMLElement[]): number {
  const rects = rows.map((el) => el.getBoundingClientRect());
  const n = rects.length;
  if (n === 0) return 0;

  if (clientY <= rects[0].top + 4) return 0;

  for (let i = 0; i < n; i++) {
    const r = rects[i];
    if (clientY < r.top) return i;
    if (clientY <= r.bottom) {
      const mid = r.top + r.height / 2;
      return clientY < mid ? i : i + 1;
    }
  }

  return n;
}

function computeIndicatorTop(slot: number, rows: HTMLElement[], container: HTMLElement): number {
  const containerRect = container.getBoundingClientRect();
  if (rows.length === 0) return 0;

  if (slot <= 0) {
    return rows[0].getBoundingClientRect().top - containerRect.top - 2;
  }
  if (slot >= rows.length) {
    return rows[rows.length - 1].getBoundingClientRect().bottom - containerRect.top + 2;
  }

  const above = rows[slot - 1].getBoundingClientRect();
  const below = rows[slot].getBoundingClientRect();
  return (above.bottom + below.top) / 2 - containerRect.top;
}

function slotToMoveIndex(from: number, slot: number): number | null {
  let to = slot;
  if (from < slot) to = slot - 1;
  if (to === from) return null;
  return to;
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
  // eslint-disable-next-line react-hooks/refs
  itemsRef.current = items;

  const pastRef = useRef<OutlineItem[][]>([]);
  const futureRef = useRef<OutlineItem[][]>([]);
  const skipHistoryRef = useRef(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropSlot, setDropSlot] = useState<number | null>(null);
  const [indicatorTop, setIndicatorTop] = useState<number | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const dragFromRef = useRef<number | null>(null);
  const dropSlotRef = useRef<number | null>(null);

  function getRowElements(): HTMLElement[] {
    return Array.from(listRef.current?.querySelectorAll<HTMLElement>("[data-outline-row]") ?? []);
  }

  useEffect(() => {
    pastRef.current = [];
    futureRef.current = [];
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    const next = cloneOutline(itemsRef.current);
    next[index] = {
      ...next[index],
      [field]: value,
    };
    skipHistoryRef.current = true;
    onChange(next);
  }

  function handleSectionBlur(index: number) {
    handleFieldBlur();
    const item = itemsRef.current[index];
    if (!item) return;
    const normalized = normalizeSectionNameStructure(item.section);
    if (normalized !== item.section) {
      updateField(index, "section", normalized);
    }
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

  function reorderItems(from: number, to: number) {
    if (from === to || to < 0 || to >= itemsRef.current.length) return;
    const next = cloneOutline(itemsRef.current);
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    applyChange(next);
  }

  function clearDragState() {
    dragFromRef.current = null;
    dropSlotRef.current = null;
    setDragIndex(null);
    setDropSlot(null);
    setIndicatorTop(null);
  }

  function updateDropIndicator(clientY: number) {
    if (!listRef.current || dragFromRef.current === null) return;
    const rows = getRowElements();
    const slot = computeDropSlot(clientY, rows);
    dropSlotRef.current = slot;
    setDropSlot(slot);
    setIndicatorTop(computeIndicatorTop(slot, rows, listRef.current));
  }

  function handleGripKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      reorderItems(index, index - 1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      reorderItems(index, index + 1);
    }
  }

  function handleGripPointerDown(e: React.PointerEvent<HTMLButtonElement>, index: number) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    const grip = e.currentTarget;
    dragFromRef.current = index;
    setDragIndex(index);
    grip.setPointerCapture(e.pointerId);
    updateDropIndicator(e.clientY);

    const finish = (ev: PointerEvent) => {
      const from = dragFromRef.current;
      if (from !== null && listRef.current) {
        const rows = getRowElements();
        const slot = computeDropSlot(ev.clientY, rows);
        const to = slotToMoveIndex(from, slot);
        if (to !== null) reorderItems(from, to);
      }
      clearDragState();
      grip.removeEventListener("pointermove", onMove);
      grip.removeEventListener("pointerup", finish);
      grip.removeEventListener("pointercancel", finish);
      if (grip.hasPointerCapture(ev.pointerId)) {
        grip.releasePointerCapture(ev.pointerId);
      }
    };

    const onMove = (ev: PointerEvent) => {
      updateDropIndicator(ev.clientY);
    };

    grip.addEventListener("pointermove", onMove);
    grip.addEventListener("pointerup", finish);
    grip.addEventListener("pointercancel", finish);
  }

  const noopDrop =
    dragIndex !== null &&
    dropSlot !== null &&
    (dropSlot === dragIndex || dropSlot === dragIndex + 1);

  function removeItem(index: number) {
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
        <div className="hidden md:block w-40 shrink-0">
          <span className="text-xs font-medium text-gray-500">目次案</span>
        </div>
        <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
          <span className="text-xs font-medium text-gray-500 shrink-0">
            <span className="md:hidden">目次案・詳細</span>
            <span className="hidden md:inline">詳細</span>
          </span>
          <span className="text-xs text-gray-500 shrink-0 hidden md:inline">ドラッグ／矢印キーで並べ替え</span>
          <div className="flex gap-1 shrink-0">
            <button
              type="button"
              onClick={undo}
              disabled={!canUndo}
              className="text-xs px-2 py-0.5 rounded border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ↩ 戻す
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={!canRedo}
              className="text-xs px-2 py-0.5 rounded border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ↪ 進む
            </button>
          </div>
        </div>
        <div className="w-7 shrink-0" />
      </div>

      <div ref={listRef} className="relative space-y-0">
        {indicatorTop !== null && !noopDrop && (
          <div
            className="absolute left-0 right-0 flex items-center gap-1 pointer-events-none z-10 -translate-y-1/2"
            style={{ top: indicatorTop }}
            aria-hidden
          >
            <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
            <div className="flex-1 h-0.5 bg-blue-500 rounded-full" />
          </div>
        )}
        {items.length === 0 && (
          <p className="text-xs text-gray-500 px-2 py-3">目次案がありません。「＋」から行を追加できます。</p>
        )}
        {items.map((item, i) => (
          <div key={`outline-row-${i}`}>
            <div
              data-outline-row
              className={`flex items-start gap-2 rounded-lg py-1.5 transition-opacity ${
                dragIndex === i ? "opacity-40" : ""
              }`}
            >
              <div className="w-7 shrink-0 flex pt-1 items-center justify-center">
                <button
                  type="button"
                  onPointerDown={(e) => handleGripPointerDown(e, i)}
                  onKeyDown={(e) => handleGripKeyDown(e, i)}
                  className="w-7 h-7 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 cursor-grab active:cursor-grabbing transition-colors flex items-center justify-center touch-none select-none outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  aria-label={`${i + 1}行目を移動（ドラッグまたは上下矢印キー）`}
                >
                  <GripVertical className="w-3.5 h-3.5 pointer-events-none" />
                </button>
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-1.5 md:flex-row md:gap-2">
                <div className="md:w-40 md:shrink-0">
                  <AutoResizeTextarea
                    value={item.section}
                    onChange={(v) => updateField(i, "section", v)}
                    onFocus={handleFieldFocus}
                    onBlur={() => handleSectionBlur(i)}
                    placeholder="セクション名…"
                    className="text-xs text-gray-600"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <AutoResizeTextarea
                    value={item.content}
                    onChange={(v) => updateField(i, "content", v)}
                    onFocus={handleFieldFocus}
                    onBlur={handleFieldBlur}
                    placeholder="内容を記述…"
                  />
                </div>
              </div>
              <div className="w-7 shrink-0 flex pt-1 items-start justify-center">
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  className="w-7 h-7 rounded text-sm text-gray-500 hover:text-destructive hover:bg-destructive/10 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  aria-label={`${i + 1}行目を削除`}
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

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
