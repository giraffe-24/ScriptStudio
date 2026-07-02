"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Check, X, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toUserMessage } from "@/lib/error-message";
import type { DirectionAxis, PlanDirection, ThemeCandidate } from "@/lib/types";

interface Props {
  candidate: ThemeCandidate;
  /** 6本柱が承認されたら確定した方向性を返す */
  onApproved: (direction: PlanDirection) => void;
  /** リセット判定用のキー（テーマが変わったら作り直す） */
  resetKey?: string;
}

/**
 * 企画書を生成する前の「設計思想（6本柱）の確認フェーズ」。
 * 選んだテーマに対してのみ6本柱を生成し、テキストエリアで自由に編集して、
 * 「企画書として出力」で企画書生成へ進む。「要修正」で修正指示を入れて再出力もできる。
 */
export function DirectionPhase({ candidate, onApproved, resetKey }: Props) {
  const [axes, setAxes] = useState<DirectionAxis[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [revising, setRevising] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reqRef = useRef(0);
  const loadedKeyRef = useRef("");

  const generate = useCallback(
    async (opts?: { feedback?: string }) => {
      const requestId = ++reqRef.current;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/generate-direction", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stage: "axes",
            theme: candidate.title,
            hook: candidate.hook,
            targetPain: candidate.targetPain,
            reason: candidate.reason,
            feedback: opts?.feedback,
            previousAxes: axes ?? undefined,
          }),
        });
        const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        if (reqRef.current !== requestId) return;

        if (!res.ok) {
          setError(toUserMessage(data.error, "設計思想（6本柱）の生成に失敗しました。少し時間をおいて、もう一度お試しください。"));
          return;
        }

        setAxes(Array.isArray(data.axes) ? data.axes : []);
        setRevising(false);
        setFeedback("");
      } catch {
        if (reqRef.current !== requestId) return;
        setError("6本柱の生成に失敗しました。通信状況を確認して再試行してください。");
      } finally {
        if (reqRef.current === requestId) setLoading(false);
      }
    },
    [candidate, axes],
  );

  // テーマが変わったら6本柱を生成し直す
  useEffect(() => {
    const key = resetKey ?? candidate.title;
    if (loadedKeyRef.current === key) return;
    loadedKeyRef.current = key;
    setAxes(null);
    setRevising(false);
    setFeedback("");
    setError(null);
    void generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, candidate.title]);

  function updateAxis(index: number, field: keyof DirectionAxis, value: string) {
    setAxes((prev) =>
      prev ? prev.map((a, i) => (i === index ? { ...a, [field]: value } : a)) : prev,
    );
  }

  function approveAxes() {
    if (!axes?.length) return;
    onApproved({ overview: "", axes });
  }

  function submitRevision() {
    const fb = feedback.trim();
    if (!fb) return;
    void generate({ feedback: fb });
  }

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="max-w-2xl mx-auto px-8 py-6 space-y-6">
        <div className="text-center">
          <p className="text-xs font-semibold text-purple-600">設計思想の確認</p>
          <p className="text-xs text-gray-500 mt-1">
            選んだテーマの「6本柱」を作成します。自由に編集し、納得したら企画書として出力します。
          </p>
        </div>

        {/* 設計思想の6本柱 */}
        <section>
          <div className="flex items-center gap-2 pb-2 border-b border-gray-200 mb-3">
            <FlaskConical className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-700">{candidate.title}</h3>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start justify-between gap-2 mb-3 text-xs text-destructive leading-relaxed bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2"
            >
              <span className="min-w-0">{error}</span>
              <Button
                variant="destructive"
                size="xs"
                onClick={() => void generate(feedback.trim() ? { feedback: feedback.trim() } : undefined)}
                disabled={loading}
                className="shrink-0"
              >
                再試行
              </Button>
            </div>
          )}

          {loading && axes === null ? (
            <LoadingCard label="設計思想の6本柱を作成中…" />
          ) : axes !== null && axes.length === 0 ? (
            loading ? (
              <LoadingCard label="6本柱を再生成中…" />
            ) : !error ? (
              <div className="rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-8 flex flex-col items-center justify-center gap-3 text-center">
                <p className="text-xs text-gray-500 leading-relaxed">
                  6本柱を生成できませんでした。もう一度お試しください。
                </p>
                <Button variant="outline" size="sm" onClick={() => void generate()}>
                  再生成する
                </Button>
              </div>
            ) : null
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
                      className="text-xs font-mono text-gray-400"
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

          {loading && axes !== null && axes.length > 0 && (
            <p
              role="status"
              aria-live="polite"
              className="mt-3 text-xs text-purple-600 flex items-center gap-1.5"
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" aria-hidden />
              6本柱を再生成中…
            </p>
          )}

          {axes !== null && axes.length > 0 && (
            <ApprovalControls
              revising={revising}
              busy={loading}
              feedback={feedback}
              onFeedbackChange={setFeedback}
              approveLabel="企画書として出力"
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
      className={`w-full bg-transparent resize-none rounded-md px-2 py-1 -mx-2 placeholder-gray-400 hover:bg-gray-100/70 focus:bg-white outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-ring transition-colors${
        className ? ` ${className}` : ""
      }`}
      style={{ overflow: "hidden" }}
    />
  );
}

function LoadingCard({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-8 flex flex-col items-center justify-center"
    >
      <div className="text-2xl mb-2 animate-bounce" aria-hidden>✍️</div>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

function ApprovalControls({
  revising,
  busy = false,
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
  busy?: boolean;
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
          disabled={busy}
          rows={3}
          placeholder={revisePlaceholder}
          className="w-full text-sm text-gray-900 placeholder-gray-400 bg-white border border-gray-200 rounded-lg px-3 py-2 resize-none outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-ring disabled:opacity-50"
        />
        <div className="flex gap-2">
          <Button
            onClick={onSubmitRevise}
            disabled={!feedback.trim() || busy}
            aria-busy={busy}
            className="flex-1"
          >
            {busy ? "再生成中…" : "この指示で再生成"}
          </Button>
          <Button
            variant="outline"
            onClick={onCancelRevise}
            disabled={busy}
            className="px-4"
          >
            キャンセル
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 mt-3">
      <Button onClick={onApprove} disabled={busy}>
        <Check className="w-3.5 h-3.5" />
        {approveLabel}
      </Button>
      <Button variant="outline" onClick={onStartRevise} disabled={busy}>
        <X className="w-3.5 h-3.5" />
        要修正
      </Button>
    </div>
  );
}
