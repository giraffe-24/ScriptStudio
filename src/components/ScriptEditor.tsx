"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Menu } from "lucide-react";
import {
  combineScriptCalib,
  splitScriptCalib,
} from "@/lib/script-calib";
import { extractSelectionContext } from "@/lib/script-selection";
import { buildEditorNavSections } from "@/lib/script-outline";
import { scrollTextareaToCharOffset } from "@/lib/script-editor-scroll";
import {
  scriptBtnPrimaryBlue,
  scriptBtnSecondary,
  scriptBtnTertiary,
} from "./script-toolbar-styles";

export type SelectionRegeneratePayload = {
  selection: string;
  before: string;
  after: string;
  sectionHeading: string | null;
};

export type GenerationStatus = {
  active: boolean;
  kind: "full" | "sections";
  title: string;
  detail?: string;
  streaming?: boolean;
};

interface Props {
  script: string;
  onSave: (content: string) => Promise<void> | void;
  episodeTitle: string;
  outline?: { section: string; content: string }[];
  onRevisionEntered?: () => void;
  onRevisionCleared?: () => void;
  onDraftChange?: () => void;
  latestContentRef?: React.MutableRefObject<string>;
  onRegenerateSelection?: (payload: SelectionRegeneratePayload) => Promise<string>;
  onSelectionRegenerated?: (beforeContent: string, afterContent: string) => void;
  generationStatus?: GenerationStatus;
}

interface Section {
  label: string;
  planSection: string | null;
  content: string;
  charOffset: number;
}

const MIN_SELECTION_CHARS = 8;
const HEADING_LINE_RE = /^#{1,6}\s/;

function splitCalib(raw: string): { main: string; calib: string } {
  return splitScriptCalib(raw);
}

function toHtml(text: string): string {
  const lines = text.split("\n");
  const htmlLines = lines.map((line) => {
    if (/^##\s/.test(line)) {
      const heading = line.replace(/^##\s+/, "");
      return `<h2><strong>${heading}</strong></h2>`;
    }
    if (/^#\s/.test(line)) {
      const heading = line.replace(/^#\s+/, "");
      return `<h1><strong>${heading}</strong></h1>`;
    }
    if (line.trim() === "") return "<br>";
    return `<p>${line}</p>`;
  });
  return htmlLines.join("");
}

function renderHighlightedContent(text: string) {
  const lines = text.split("\n");
  return lines.map((line, index) => (
    <span key={index}>
      {index > 0 ? "\n" : null}
      {HEADING_LINE_RE.test(line) ? (
        <span className="font-bold text-gray-900">{line}</span>
      ) : (
        line
      )}
    </span>
  ));
}

function LoadingSpinner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`script-loading-spinner w-4 h-4 rounded-full border-2 border-blue-200 border-t-blue-600 shrink-0 ${className}`}
      aria-hidden
    />
  );
}

function EditorLoadingOverlay({
  title,
  detail,
  blocking,
}: {
  title: string;
  detail?: string;
  blocking: boolean;
}) {
  return (
    <div
      className={`absolute inset-0 z-10 flex items-center justify-center pointer-events-none ${
        blocking ? "bg-white/75 backdrop-blur-[1px]" : "bg-transparent"
      }`}
    >
      <div
        className={`rounded-lg border border-blue-200 px-4 py-3 shadow-sm max-w-md mx-4 ${
          blocking ? "analysis-loading-panel bg-blue-50" : "bg-white/95"
        }`}
      >
        <div className="flex items-start gap-3">
          <LoadingSpinner className="mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-blue-900 analysis-loading-text">{title}</p>
            {detail && <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">{detail}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ScriptEditor({
  script,
  onSave,
  outline,
  onRevisionEntered,
  onRevisionCleared,
  onDraftChange,
  latestContentRef,
  onRegenerateSelection,
  onSelectionRegenerated,
  generationStatus,
}: Props) {
  const { main: initMain, calib: initCalib } = splitCalib(script);
  const [content, setContent] = useState(initMain);
  const [calibText, setCalibText] = useState(initCalib);
  const [saved, setSaved] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [calibOpen, setCalibOpen] = useState(false);
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const [selectionBusy, setSelectionBusy] = useState(false);
  const [activeSectionOffset, setActiveSectionOffset] = useState<number | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const hadRevisionRef = useRef(initCalib.trim().length > 0);
  const saveRequestRef = useRef(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const selectionRef = useRef<{ start: number; end: number } | null>(null);

  useEffect(() => {
    const { main, calib } = splitCalib(script);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setContent(main);
    setCalibText(calib);
    setCalibOpen(false);
    setSaved(true);
    setSaveError(null);
    hadRevisionRef.current = calib.trim().length > 0;
    if (latestContentRef) latestContentRef.current = script;
  }, [script, latestContentRef]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const combined = combineScriptCalib(content, calibText);
      const requestId = ++saveRequestRef.current;
      if (latestContentRef) latestContentRef.current = combined;
      void Promise.resolve(onSave(combined))
        .then(() => {
          if (saveRequestRef.current !== requestId) return;
          setSaved(true);
          setSaveError(null);

          const hasCalib = calibText.trim().length > 0;
          if (hasCalib) {
            hadRevisionRef.current = true;
            onRevisionEntered?.();
          } else if (hadRevisionRef.current) {
            hadRevisionRef.current = false;
            onRevisionCleared?.();
          }
        })
        .catch((error) => {
          if (saveRequestRef.current !== requestId) return;
          setSaved(false);
          setSaveError(error instanceof Error ? error.message : "保存に失敗しました");
        });
    }, 800);

    return () => clearTimeout(timer);
  }, [calibText, content, latestContentRef, onSave, onRevisionEntered, onRevisionCleared]);

  const charCount = content.replace(/\s/g, "").length;

  const handleChange = useCallback((value: string) => {
    setContent(value);
    setSaved(false);
    setSaveError(null);
    if (latestContentRef) {
      latestContentRef.current = combineScriptCalib(value, calibText);
    }
    onDraftChange?.();
  }, [calibText, latestContentRef, onDraftChange]);

  const handleCalibChange = useCallback((value: string) => {
    setCalibText(value);
    setSaved(false);
    setSaveError(null);
    if (latestContentRef) {
      latestContentRef.current = combineScriptCalib(content, value);
    }
    onDraftChange?.();
  }, [content, latestContentRef, onDraftChange]);

  function syncHighlightScroll(scrollTop: number) {
    if (highlightRef.current) {
      highlightRef.current.scrollTop = scrollTop;
    }
  }

  function syncSelectionFromTextarea() {
    const ta = textareaRef.current;
    if (!ta) {
      setSelectionRange(null);
      selectionRef.current = null;
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    if (end - start >= MIN_SELECTION_CHARS) {
      const next = { start, end };
      setSelectionRange(next);
      selectionRef.current = next;
    } else {
      setSelectionRange(null);
      selectionRef.current = null;
    }
  }

  function scrollToSection(sec: Section) {
    const ta = textareaRef.current;
    if (!ta) return;

    setActiveSectionOffset(sec.charOffset);
    scrollTextareaToCharOffset(ta, content, sec.charOffset);
    syncHighlightScroll(ta.scrollTop);
    syncSelectionFromTextarea();
  }

  async function handleCopyAll() {
    try {
      const html = toHtml(content);
      const htmlBlob = new Blob([html], { type: "text/html" });
      const textBlob = new Blob([content], { type: "text/plain" });
      await navigator.clipboard.write([
        new ClipboardItem({ "text/html": htmlBlob, "text/plain": textBlob }),
      ]);
    } catch {
      await navigator.clipboard.writeText(content);
    }
    setCopied("__all__");
    setTimeout(() => setCopied(null), 1500);
  }

  async function handleCopySection(label: string, text: string) {
    try {
      const html = toHtml(text);
      const htmlBlob = new Blob([html], { type: "text/html" });
      const textBlob = new Blob([text], { type: "text/plain" });
      await navigator.clipboard.write([
        new ClipboardItem({ "text/html": htmlBlob, "text/plain": textBlob }),
      ]);
    } catch {
      await navigator.clipboard.writeText(text.trim());
    }
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  }

  async function handleRegenerateSelectionClick() {
    const range = selectionRef.current;
    if (!range || !onRegenerateSelection || selectionBusy) return;

    const payload = extractSelectionContext(content, range.start, range.end);
    if (!payload.selection.trim()) return;

    setSelectionBusy(true);
    try {
      const replacement = await onRegenerateSelection(payload);
      if (!replacement.trim()) return;

      const beforeCombined = combineScriptCalib(content, calibText);
      const newContent =
        content.slice(0, range.start) + replacement + content.slice(range.end);
      const afterCombined = combineScriptCalib(newContent, calibText);

      handleChange(newContent);
      onSelectionRegenerated?.(beforeCombined, afterCombined);

      requestAnimationFrame(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.focus();
        const newEnd = range.start + replacement.length;
        ta.setSelectionRange(range.start, newEnd);
        const next = { start: range.start, end: newEnd };
        setSelectionRange(next);
        selectionRef.current = next;
      });
    } catch {
      window.alert("選択部分の再生成に失敗しました");
    } finally {
      setSelectionBusy(false);
    }
  }

  const sections: Section[] = buildEditorNavSections(content, outline);
  const selectionLength = selectionRange ? selectionRange.end - selectionRange.start : 0;
  const canRegenerateSelection =
    !!onRegenerateSelection && !!selectionRange && selectionLength >= MIN_SELECTION_CHARS;

  const isGenerating = Boolean(generationStatus?.active);
  const isStreaming = Boolean(generationStatus?.active && generationStatus.streaming);
  const editorLocked = selectionBusy || (isGenerating && !isStreaming);

  const targetMin = 4000;
  const targetMax = 6000;
  const progress = Math.min((charCount / targetMax) * 100, 100);
  const progressColor =
    charCount < targetMin ? "bg-yellow-400" : charCount <= targetMax ? "bg-green-400" : "bg-red-400";
  const countColor =
    charCount < targetMin ? "text-yellow-600" : charCount <= targetMax ? "text-green-600" : "text-red-600";

  const editorTextareaClass =
    "absolute inset-0 w-full h-full p-4 text-sm leading-relaxed resize-none border-0 focus:outline-none font-mono bg-transparent text-transparent caret-gray-800 selection:bg-blue-200/60 placeholder:text-gray-400";

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-between bg-white shrink-0 gap-3">
        <div className="flex items-center gap-4 min-w-0">
          <span className={`text-xs font-bold font-mono tabular-nums ${countColor}`}>
            {charCount.toLocaleString()} 字
          </span>
          <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className={`h-full ${progressColor} transition-all`} style={{ width: `${progress}%` }} />
          </div>
          <span className="text-[10px] text-gray-400 hidden md:inline">目標 4,000〜6,000 字</span>
          {(isGenerating || selectionBusy) && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-blue-700">
              <LoadingSpinner className="w-3 h-3 border-[1.5px]" />
              {selectionBusy
                ? "部分再生成中"
                : isStreaming
                ? "執筆中（反映中）"
                : generationStatus?.kind === "sections"
                ? "セクション再生成中"
                : "台本生成中"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onRegenerateSelection && (
            <button
              type="button"
              onClick={() => void handleRegenerateSelectionClick()}
              disabled={!canRegenerateSelection || selectionBusy || isGenerating}
              title={
                isGenerating
                  ? "台本生成中は部分再生成できません"
                  : canRegenerateSelection
                  ? `選択中 ${selectionLength} 字を前後文脈を踏まえて書き直す`
                  : "台本内の文字列をドラッグして選択してください"
              }
              className={`inline-flex items-center gap-1.5 ${
                canRegenerateSelection && !selectionBusy && !isGenerating
                  ? scriptBtnPrimaryBlue
                  : scriptBtnSecondary
              }`}
            >
              {selectionBusy && <LoadingSpinner className="w-3 h-3 border-[1.5px]" />}
              {selectionBusy ? "再生成中…" : "部分再生成"}
            </button>
          )}
          <button
            onClick={() => void handleCopyAll()}
            disabled={selectionBusy || isGenerating}
            className={
              copied === "__all__"
                ? "text-xs font-medium px-3 py-1 rounded-md border border-green-300 bg-green-50 text-green-600"
                : scriptBtnTertiary
            }
          >
            {copied === "__all__" ? "コピー済み ✓" : "全体をコピー"}
          </button>
          {sections.length > 0 && (
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              aria-label="セクション目次"
              className="md:hidden shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 active:bg-gray-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          {!saved && !editorLocked && (
            <span className="text-[10px] text-gray-400">自動保存中…</span>
          )}
          {saveError && !editorLocked && (
            <span className="text-[10px] text-red-500">保存失敗: {saveError}</span>
          )}
        </div>
      </div>

      {navOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex" onClick={() => setNavOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="relative ml-auto w-72 max-w-[80%] h-full bg-white shadow-xl border-l border-gray-200 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between shrink-0">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">セクション</p>
              <button
                type="button"
                onClick={() => setNavOpen(false)}
                className="text-gray-400 active:text-gray-600 text-xl leading-none"
                aria-label="閉じる"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {sections.map((sec) => (
                <button
                  key={`nav-${sec.charOffset}-${sec.label}`}
                  onClick={() => {
                    scrollToSection(sec);
                    setNavOpen(false);
                  }}
                  className={`w-full text-left rounded-lg px-3 py-2.5 text-sm leading-snug transition-colors ${
                    activeSectionOffset === sec.charOffset
                      ? "bg-blue-100 text-blue-800"
                      : "text-gray-700 active:bg-gray-100"
                  }`}
                >
                  {sec.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectionRange && canRegenerateSelection && !selectionBusy && !isGenerating && (
        <div className="px-4 py-1.5 border-b border-blue-100 bg-blue-50 shrink-0">
          <p className="text-[10px] text-blue-700">
            {selectionLength.toLocaleString()} 字を選択中 —「部分再生成」で前後の文脈を踏まえて書き直します
          </p>
        </div>
      )}

      {selectionBusy && (
        <div className="px-4 py-1.5 border-b border-blue-200 bg-blue-100 shrink-0">
          <div className="flex items-center gap-2">
            <LoadingSpinner className="w-3 h-3 border-[1.5px]" />
            <p className="text-[10px] text-blue-800 font-medium">
              選択した {selectionLength.toLocaleString()} 字を AI が前後文脈を踏まえて書き直しています…
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {sections.length > 0 && (
          <div className="hidden md:block w-44 shrink-0 border-r border-gray-100 overflow-y-auto bg-gray-50 py-3 px-2 space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1 mb-2">
              セクション
            </p>
            {sections.map((sec) => (
              <button
                key={`${sec.charOffset}-${sec.label}`}
                onClick={() => scrollToSection(sec)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  void handleCopySection(sec.label, sec.content);
                }}
                title={
                  sec.planSection
                    ? `台本: ${sec.label}\n企画: ${sec.planSection}\nクリック：ジャンプ　右クリック：コピー`
                    : "クリック：ジャンプ　右クリック：コピー"
                }
                className={`w-full text-left rounded-lg px-2.5 py-2 transition-all group ${
                  activeSectionOffset === sec.charOffset
                    ? "bg-blue-100 text-blue-800 ring-1 ring-blue-200"
                    : copied === sec.label
                    ? "bg-green-100 text-green-700"
                    : "hover:bg-white hover:shadow-sm text-gray-600"
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs leading-snug line-clamp-2 flex-1">{sec.label}</span>
                  <span className="shrink-0 text-[10px] opacity-0 group-hover:opacity-100 text-gray-400 transition-opacity">
                    {copied === sec.label ? "✓" : "↑"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-hidden relative flex flex-col">
          {isStreaming && (
            <div className="h-1 shrink-0 script-editor-streaming-bar" aria-hidden />
          )}

          <div className="relative flex-1 overflow-hidden">
            <pre
              ref={highlightRef}
              aria-hidden
              className="absolute inset-0 m-0 p-4 text-sm leading-relaxed font-mono whitespace-pre-wrap wrap-break-word overflow-hidden pointer-events-none text-gray-800"
            >
              {renderHighlightedContent(content)}
            </pre>

            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => handleChange(e.target.value)}
              onSelect={syncSelectionFromTextarea}
              onMouseUp={syncSelectionFromTextarea}
              onKeyUp={syncSelectionFromTextarea}
              onScroll={(e) => syncHighlightScroll(e.currentTarget.scrollTop)}
              readOnly={editorLocked}
              className={editorTextareaClass}
              placeholder="台本をここに入力…"
              spellCheck={false}
            />

            {selectionBusy && (
              <EditorLoadingOverlay
                blocking
                title="選択部分を再生成中"
                detail="前後の文脈を読み取り、選択範囲だけを書き直しています。完了までお待ちください。"
              />
            )}

            {isGenerating && !selectionBusy && generationStatus?.kind === "sections" && (
              <EditorLoadingOverlay
                blocking
                title={generationStatus.title}
                detail={generationStatus.detail}
              />
            )}

            {isGenerating && !selectionBusy && generationStatus?.kind === "full" && !isStreaming && (
              <EditorLoadingOverlay
                blocking
                title={generationStatus.title}
                detail={generationStatus.detail ?? "AIが構成に沿って執筆しています。"}
              />
            )}

            {isStreaming && (
              <div className="absolute bottom-3 right-3 z-10 pointer-events-none">
                <div className="flex items-center gap-2 rounded-full border border-blue-200 bg-white/95 px-3 py-1.5 shadow-sm">
                  <LoadingSpinner className="w-3 h-3 border-[1.5px]" />
                  <span className="text-[11px] font-medium text-blue-800">執筆中…</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t-2 border-dashed border-amber-200 shrink-0">
        <button
          onClick={() => setCalibOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-amber-50 hover:bg-amber-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-700">推敲比較</span>
            <span className="text-[10px] text-amber-500">
              手直し後の確定稿をここに貼り付けて /推敲比較 で使用
            </span>
          </div>
          <span className={`text-amber-500 text-xs transition-transform duration-200 ${calibOpen ? "rotate-180" : ""}`}>
            ▾
          </span>
        </button>

        {calibOpen && (
          <div className="bg-amber-50 border-t border-amber-100">
            <textarea
              value={calibText}
              onChange={(e) => handleCalibChange(e.target.value)}
              rows={8}
              placeholder="手直し後の台本をここに全文貼り付けてください…"
              className="w-full px-4 py-3 text-sm font-mono leading-relaxed text-gray-700 bg-transparent resize-none border-0 focus:outline-none placeholder:text-amber-300"
              spellCheck={false}
            />
            {calibText && (
              <div className="px-4 pb-2 flex items-center justify-between">
                <span className="text-[10px] text-amber-500">
                  {calibText.replace(/\s/g, "").length.toLocaleString()} 字
                </span>
                <button
                  onClick={() => handleCalibChange("")}
                  className="text-[10px] text-amber-400 hover:text-amber-600 transition-colors"
                >
                  クリア
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
