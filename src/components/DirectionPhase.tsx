"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Check, X, FlaskConical } from "lucide-react";
import type { DirectionAxis, PlanDirection, ThemeCandidate } from "@/lib/types";

interface Props {
  candidate: ThemeCandidate;
  /** 概要・軸の両方が承認されたら確定した方向性を返す */
  onApproved: (direction: PlanDirection) => void;
  /** リセット判定用のキー（テーマが変わったら作り直す） */
  resetKey?: string;
}

type Stage = "overview" | "axes";

/**
 * 企画書を生成する前の「方向性確認フェーズ」。
 * まず大枠概要を出して承認 → 設計思想の6本柱を出して承認 → 企画書生成へ。
 * いずれの段階でも「要修正」で修正指示を入れて再出力できる。
 */
export function DirectionPhase({ candidate, onApproved, resetKey }: Props) {
  const [stage, setStage] = useState<Stage>("overview");
  const [overview, setOverview] = useState<string | null>(null);
  const [axes, setAxes] = useState<DirectionAxis[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [revising, setRevising] = useState(false);
  const [feedback, setFeedback] = useState("");

  const reqRef = useRef(0);
  const loadedKeyRef = useRef("");

  const generate = useCallback(
    async (
      target: Stage,
      opts?: { feedback?: string; overviewForAxes?: string },
    ) => {
      const requestId = ++reqRef.current;
      setLoading(true);
      try {
        const res = await fetch("/api/generate-direction", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stage: target,
            theme: candidate.title,
            hook: candidate.hook,
            targetPain: candidate.targetPain,
            reason: candidate.reason,
            feedback: opts?.feedback,
            overview: target === "axes" ? opts?.overviewForAxes ?? overview : undefined,
            previousOverview: target === "overview" ? overview ?? undefined : undefined,
            previousAxes: target === "axes" ? axes ?? undefined : undefined,
          }),
        });
        const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        if (reqRef.current !== requestId) return;

        if (!res.ok) {
          alert(`方向性の生成に失敗しました。\n${data.error ?? res.statusText}`);
          return;
        }

        if (target === "overview") {
          setOverview(data.overview ?? "");
        } else {
          setAxes(Array.isArray(data.axes) ? data.axes : []);
        }
        setRevising(false);
        setFeedback("");
      } catch {
        if (reqRef.current !== requestId) return;
        alert("方向性の生成に失敗しました。\n通信状況を確認して再試行してください。");
      } finally {
        if (reqRef.current === requestId) setLoading(false);
      }
    },
    [candidate, overview, axes],
  );

  // テーマが変わったら最初から（大枠概要の生成）やり直す
  useEffect(() => {
    const key = resetKey ?? candidate.title;
    if (loadedKeyRef.current === key) return;
    loadedKeyRef.current = key;
    setStage("overview");
    setOverview(null);
    setAxes(null);
    setRevising(false);
    setFeedback("");
    void generate("overview");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, candidate.title]);

  function updateAxis(index: number, field: keyof DirectionAxis, value: string) {
    setAxes((prev) =>
      prev ? prev.map((a, i) => (i === index ? { ...a, [field]: value } : a)) : prev,
    );
  }

  function approveOverview() {
    if (!overview) return;
    setStage("axes");
    setRevising(false);
    setFeedback("");
    void generate("axes", { overviewForAxes: overview });
  }

  function approveAxes() {
    if (!overview || !axes?.length) return;
    onApproved({ overview, axes });
  }

  function submitRevision() {
    const fb = feedback.trim();
    if (!fb) return;
    void generate(stage, { feedback: fb, overviewForAxes: overview ?? undefined });
  }

  const busyLabel =
    stage === "overview" ? "方向性（大枠概要）を作成中…" : "設計思想の6本柱を作成中…";

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="max-w-2xl mx-auto px-8 py-6 space-y-6">
        <div className="text-center">
          <p className="text-xs font-semibold text-purple-600">方向性の確認</p>
          <p className="text-[11px] text-gray-400 mt-1">
            企画書を作る前に方向性をすり合わせます。承認すると次に進みます。
          </p>
          {/* ステップインジケータ */}
          <div className="flex items-center justify-center gap-2 mt-3 text-[11px]">
            <StepDot active={stage === "overview"} done={stage === "axes"} label="大枠概要" />
            <span className="text-gray-300">→</span>
            <StepDot active={stage === "axes"} done={false} label="設計思想の柱" />
            <span className="text-gray-300">→</span>
            <span className="text-gray-400">企画書</span>
          </div>
        </div>

        {/* 大枠概要 */}
        <section>
          <h3 className="text-sm font-semibold text-gray-800 mb-2">{candidate.title}</h3>
          {overview === null && loading && stage === "overview" ? (
            <LoadingCard label={busyLabel} />
          ) : overview !== null ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50/60 px-3 py-3">
              <AutoTextarea
                value={overview}
                onChange={setOverview}
                placeholder="大枠概要を記述…"
                className="text-sm text-gray-700 leading-relaxed"
              />
            </div>
          ) : null}

          {/* 大枠概要の承認操作（軸ステージに進む前のみ） */}
          {stage === "overview" && overview !== null && !loading && (
            <ApprovalControls
              revising={revising}
              feedback={feedback}
              onFeedbackChange={setFeedback}
              onApprove={approveOverview}
              onStartRevise={() => setRevising(true)}
              onCancelRevise={() => {
                setRevising(false);
                setFeedback("");
              }}
              onSubmitRevise={submitRevision}
              revisePlaceholder="例：もっと初心者向けに / 〇〇の観点を加えて"
            />
          )}
        </section>

        {/* 設計思想の6本柱 */}
        {stage === "axes" && (
          <section>
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200 mb-3">
              <FlaskConical className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-700">設計思想（6本柱）</h3>
            </div>

            {axes === null && loading ? (
              <LoadingCard label={busyLabel} />
            ) : axes !== null ? (
              <ol className="space-y-3">
                {axes.map((axis, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="shrink-0 w-7 h-7 rounded-md bg-gray-100 text-gray-500 text-xs font-semibold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <AutoTextarea
                        value={axis.title}
                        onChange={(v) => updateAxis(i, "title", v)}
                        placeholder="見出し（日本語）…"
                        className="text-sm font-semibold text-gray-800 leading-snug"
                      />
                      <AutoTextarea
                        value={axis.subtitle}
                        onChange={(v) => updateAxis(i, "subtitle", v)}
                        placeholder="English Label"
                        className="text-[11px] font-mono text-gray-400"
                      />
                      <AutoTextarea
                        value={axis.description}
                        onChange={(v) => updateAxis(i, "description", v)}
                        placeholder="詳細を記述…"
                        className="text-xs text-gray-600 leading-relaxed"
                      />
                    </div>
                  </li>
                ))}
              </ol>
            ) : null}

            {axes !== null && !loading && (
              <ApprovalControls
                revising={revising}
                feedback={feedback}
                onFeedbackChange={setFeedback}
                approveLabel="承認して企画書を作成"
                onApprove={approveAxes}
                onStartRevise={() => setRevising(true)}
                onCancelRevise={() => {
                  setRevising(false);
                  setFeedback("");
                }}
                onSubmitRevise={submitRevision}
                revisePlaceholder="例：〇本目の軸を△△に差し替えて / 表現をやさしく"
              />
            )}
          </section>
        )}
      </div>
    </div>
  );
}

/** インライン編集用の自動リサイズ textarea（全文常時表示・スクロール禁止） */
function AutoTextarea({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
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

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={resize}
      rows={1}
      placeholder={placeholder}
      className={`w-full bg-transparent resize-none rounded-md px-2 py-1 -mx-2 placeholder-gray-300 hover:bg-gray-100/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 transition-colors${
        className ? ` ${className}` : ""
      }`}
      style={{ overflow: "hidden" }}
    />
  );
}

function StepDot({
  active,
  done,
  label,
}: {
  active: boolean;
  done: boolean;
  label: string;
}) {
  return (
    <span
      className={`px-2 py-0.5 rounded-full font-medium ${
        active
          ? "bg-purple-100 text-purple-700"
          : done
            ? "bg-green-100 text-green-700"
            : "bg-gray-100 text-gray-400"
      }`}
    >
      {label}
    </span>
  );
}

function LoadingCard({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-8 flex flex-col items-center justify-center">
      <div className="text-2xl mb-2 animate-bounce">✍️</div>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

function ApprovalControls({
  revising,
  feedback,
  onFeedbackChange,
  onApprove,
  onStartRevise,
  onCancelRevise,
  onSubmitRevise,
  approveLabel = "承認",
  revisePlaceholder,
}: {
  revising: boolean;
  feedback: string;
  onFeedbackChange: (v: string) => void;
  onApprove: () => void;
  onStartRevise: () => void;
  onCancelRevise: () => void;
  onSubmitRevise: () => void;
  approveLabel?: string;
  revisePlaceholder?: string;
}) {
  if (revising) {
    return (
      <div className="mt-3 space-y-2">
        <textarea
          autoFocus
          value={feedback}
          onChange={(e) => onFeedbackChange(e.target.value)}
          rows={3}
          placeholder={revisePlaceholder}
          className="w-full text-sm text-gray-900 placeholder-gray-400 bg-white border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-purple-200"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSubmitRevise}
            disabled={!feedback.trim()}
            className="flex-1 bg-purple-500 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium py-2 rounded-lg transition-colors"
          >
            この指示で再生成
          </button>
          <button
            type="button"
            onClick={onCancelRevise}
            className="px-4 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg transition-colors"
          >
            キャンセル
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 mt-3">
      <button
        type="button"
        onClick={onApprove}
        className="inline-flex items-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
      >
        <Check className="w-3.5 h-3.5" />
        {approveLabel}
      </button>
      <button
        type="button"
        onClick={onStartRevise}
        className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-700 border border-gray-200 hover:border-gray-300 text-sm px-4 py-1.5 rounded-lg transition-colors"
      >
        <X className="w-3.5 h-3.5" />
        要修正
      </button>
    </div>
  );
}
