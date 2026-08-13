"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

/* ── AI 回答のパース ──
 * 行頭の箇条書き記号（・- • * / 1. 1) 1、）を落とし、
 * 見出し（#〜）・引用（>）・水平線（---）などの解説ノイズ行は取り込み候補から除外する */
const stripBullet = (line: string) => line.replace(/^\s*(?:[-・•*]|\d+[.)、])\s*/, "").trim();

const isNoiseLine = (line: string) => {
  const t = line.trim();
  return t === "" || /^#{1,6}\s/.test(t) || /^>/.test(t) || /^(?:-{3,}|\*{3,}|_{3,})$/.test(t);
};

export type OutlineItem = { section: string; content: string };

export function textToKeyPointItems(text: string): string[] {
  return text
    .split("\n")
    .filter((l) => !isNoiseLine(l))
    .map(stripBullet)
    .filter(Boolean);
}

export function textToOutlineItems(text: string): OutlineItem[] {
  return text
    .split("\n")
    .filter((l) => !isNoiseLine(l))
    .map(stripBullet)
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^(.+?)[：:]\s*(.+)$/);
      return m ? { section: m[1].trim(), content: m[2].trim() } : { section: "", content: line };
    });
}

/* ── 反映のしかた（確定結果） ── */
export type ApplyDecision =
  | { kind: "text"; mode: "replace" | "append"; text: string }
  | { kind: "list"; mode: "replace"; keyPoints?: string[]; outline?: OutlineItem[] }
  | { kind: "list"; mode: "insert"; index: number; keyPoints?: string[]; outline?: OutlineItem[] };

interface Props {
  sectionLabel: string;
  /** text = 文章フィールド / keyPoints・outline = リストフィールド */
  variant: "text" | "keyPoints" | "outline";
  /** AI の回答全文 */
  aiText: string;
  /** リストフィールドの現在の項目ラベル（挿入位置の選択肢に使う） */
  existingLabels: string[];
  onConfirm: (decision: ApplyDecision) => void;
  onCancel: () => void;
}

const truncate = (s: string, n: number) => (s.length > n ? `${s.slice(0, n)}…` : s);

export function ChatApplyDialog({ sectionLabel, variant, aiText, existingLabels, onConfirm, onCancel }: Props) {
  const isList = variant !== "text";

  const parsedKeyPoints = useMemo(
    () => (variant === "keyPoints" ? textToKeyPointItems(aiText) : []),
    [variant, aiText],
  );
  const parsedOutline = useMemo(
    () => (variant === "outline" ? textToOutlineItems(aiText) : []),
    [variant, aiText],
  );
  const itemLabels = variant === "outline"
    ? parsedOutline.map((o) => (o.section ? `${o.section}：${o.content}` : o.content))
    : parsedKeyPoints;

  // 取り込む項目の選択（初期値: 全選択）
  const [checked, setChecked] = useState<boolean[]>(() => itemLabels.map(() => true));
  // リスト: "replace" か挿入位置（"0"=先頭 … String(N)=末尾）。初期値は末尾に挿入
  const [listMode, setListMode] = useState<string>(String(existingLabels.length));
  // テキスト: 初期値は末尾に追記（丸ごと置き換えは明示的に選んだ時だけ）
  const [textMode, setTextMode] = useState<"append" | "replace">("append");

  const selectedCount = checked.filter(Boolean).length;
  const canConfirm = isList ? selectedCount > 0 : aiText.trim().length > 0;

  const containerRef = useRef<HTMLDivElement>(null);

  // 初期フォーカス + Esc キャンセル + Tab トラップ（モーダル）
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const getFocusable = () =>
      Array.from(
        container.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null);
    getFocusable()[0]?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onCancel();
        return;
      }
      if (e.key !== "Tab") return;
      const items = getFocusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleConfirm() {
    if (!canConfirm) return;
    if (!isList) {
      onConfirm({ kind: "text", mode: textMode, text: aiText.trim() });
      return;
    }
    const keyPoints = variant === "keyPoints" ? parsedKeyPoints.filter((_, i) => checked[i]) : undefined;
    const outline = variant === "outline" ? parsedOutline.filter((_, i) => checked[i]) : undefined;
    if (listMode === "replace") {
      onConfirm({ kind: "list", mode: "replace", keyPoints, outline });
    } else {
      onConfirm({ kind: "list", mode: "insert", index: Number(listMode), keyPoints, outline });
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onClick={onCancel}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${sectionLabel} への反映を確認`}
        className="w-full max-w-md max-h-[80vh] flex flex-col rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-bold text-gray-800">AI の回答を反映</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{sectionLabel}</p>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-4">
          {isList ? (
            <>
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1.5">
                  取り込む項目を選択（{selectedCount}/{itemLabels.length}）
                </p>
                {itemLabels.length === 0 ? (
                  <p className="text-xs text-muted-foreground bg-gray-50 rounded-lg p-2">
                    回答から取り込める項目が見つかりませんでした
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {itemLabels.map((label, i) => (
                      <li key={i}>
                        <label className="flex items-start gap-2 rounded-lg border border-gray-200 px-2.5 py-2 hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked[i] ?? false}
                            onChange={(e) => {
                              const next = [...checked];
                              next[i] = e.target.checked;
                              setChecked(next);
                            }}
                            className="mt-0.5 shrink-0 accent-primary"
                          />
                          <span className="text-xs text-gray-700 leading-relaxed">{label}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 block" htmlFor="chat-apply-position">
                  反映のしかた
                </label>
                <select
                  id="chat-apply-position"
                  value={listMode}
                  onChange={(e) => setListMode(e.target.value)}
                  className="w-full text-xs border border-input rounded-lg px-2.5 py-2 bg-white outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-ring"
                >
                  <option value={String(existingLabels.length)}>末尾に追加</option>
                  <option value="0">先頭に挿入</option>
                  {existingLabels.slice(0, -1).map((label, i) => (
                    <option key={i} value={String(i + 1)}>
                      「{truncate(label, 16)}」の後に挿入
                    </option>
                  ))}
                  <option value="replace">全体を置き換える（既存の項目は消えます）</option>
                </select>
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1.5">反映する内容</p>
                <div className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-lg p-2.5 max-h-48 overflow-y-auto">
                  {aiText.trim()}
                </div>
              </div>
              <fieldset>
                <legend className="text-xs font-semibold text-gray-700 mb-1.5">反映のしかた</legend>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="chat-apply-text-mode"
                      checked={textMode === "append"}
                      onChange={() => setTextMode("append")}
                      className="accent-primary"
                    />
                    末尾に追記する
                  </label>
                  <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="chat-apply-text-mode"
                      checked={textMode === "replace"}
                      onChange={() => setTextMode("replace")}
                      className="accent-primary"
                    />
                    全体を置き換える（今の内容は消えます）
                  </label>
                </div>
              </fieldset>
            </>
          )}
        </div>

        <div className="px-4 py-3 border-t border-gray-200 flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onCancel} className="text-xs">
            キャンセル
          </Button>
          <Button type="button" size="sm" onClick={handleConfirm} disabled={!canConfirm} className="text-xs">
            反映する
          </Button>
        </div>
      </div>
    </div>
  );
}
