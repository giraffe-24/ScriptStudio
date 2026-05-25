"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  combineScriptCalib,
  splitScriptCalib,
} from "@/lib/script-calib";
import { extractSelectionContext } from "@/lib/script-selection";

export type SelectionRegeneratePayload = {
  selection: string;
  before: string;
  after: string;
  sectionHeading: string | null;
};

interface Props {
  script: string;
  onSave: (content: string) => void;
  episodeTitle: string;
  outline?: { section: string; content: string }[];
  onRevisionEntered?: () => void;
  onRevisionCleared?: () => void;
  latestContentRef?: React.MutableRefObject<string>;
  onRegenerateSelection?: (payload: SelectionRegeneratePayload) => Promise<string>;
  onSelectionRegenerated?: (beforeContent: string, afterContent: string) => void;
}

interface Section {
  label: string;
  content: string;
  charOffset: number;
}

const MIN_SELECTION_CHARS = 8;

function parseSections(text: string, outline?: { section: string; content: string }[]): Section[] {
  if (!text.trim()) return outline?.map((item) => ({ label: item.section, content: "", charOffset: 0 })) ?? [];

  const lines = text.split("\n");
  const sections: Section[] = [];
  let current: Section | null = null;
  let charPos = 0;

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (current) sections.push(current);
      current = { label: line.replace(/^##\s+/, "").trim(), content: "", charOffset: charPos };
    } else {
      if (!current) {
        current = { label: "導入", content: "", charOffset: 0 };
      }
      current.content += line + "\n";
    }
    charPos += line.length + 1;
  }
  if (current) sections.push(current);

  const parsed = sections.filter((s) => s.content.trim() || outline?.length);

  if (!outline?.length) return parsed.filter((s) => s.content.trim());

  return outline.map((item, i) => {
    const fromScript = parsed[i];
    if (fromScript) {
      return { ...fromScript, label: item.section };
    }
    return { label: item.section, content: "", charOffset: text.length };
  });
}

function splitCalib(raw: string): { main: string; calib: string } {
  return splitScriptCalib(raw);
}

function toHtml(text: string): string {
  const lines = text.split("\n");
  const htmlLines = lines.map((line) => {
    if (/^##\s/.test(line)) {
      const heading = line.replace(/^##\s+/, "");
      return `<h2>${heading}</h2>`;
    }
    if (/^#\s/.test(line)) {
      const heading = line.replace(/^#\s+/, "");
      return `<h1>${heading}</h1>`;
    }
    if (line.trim() === "") return "<br>";
    return `<p>${line}</p>`;
  });
  return htmlLines.join("");
}

export function ScriptEditor({
  script,
  onSave,
  outline,
  onRevisionEntered,
  onRevisionCleared,
  latestContentRef,
  onRegenerateSelection,
  onSelectionRegenerated,
}: Props) {
  const { main: initMain, calib: initCalib } = splitCalib(script);
  const [content, setContent] = useState(initMain);
  const [calibText, setCalibText] = useState(initCalib);
  const [saved, setSaved] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [calibOpen, setCalibOpen] = useState(false);
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const [selectionBusy, setSelectionBusy] = useState(false);
  const hadRevisionRef = useRef(initCalib.trim().length > 0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const selectionRef = useRef<{ start: number; end: number } | null>(null);

  useEffect(() => {
    const { main, calib } = splitCalib(script);
    setContent(main);
    setCalibText(calib);
    setCalibOpen(false);
    hadRevisionRef.current = calib.trim().length > 0;
    if (latestContentRef) latestContentRef.current = script;
  }, [script, latestContentRef]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const combined = combineScriptCalib(content, calibText);
      if (latestContentRef) latestContentRef.current = combined;
      onSave(combined);
      setSaved(true);

      const hasCalib = calibText.trim().length > 0;
      if (hasCalib) {
        hadRevisionRef.current = true;
        onRevisionEntered?.();
      } else if (hadRevisionRef.current) {
        hadRevisionRef.current = false;
        onRevisionCleared?.();
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [calibText, content, latestContentRef, onSave, onRevisionEntered, onRevisionCleared]);

  const charCount = content.replace(/\s/g, "").length;

  const handleChange = useCallback((value: string) => {
    setContent(value);
    setSaved(false);
    if (latestContentRef) {
      latestContentRef.current = combineScriptCalib(value, calibText);
    }
  }, [calibText, latestContentRef]);

  const handleCalibChange = useCallback((value: string) => {
    setCalibText(value);
    setSaved(false);
    if (latestContentRef) {
      latestContentRef.current = combineScriptCalib(content, value);
    }
  }, [content, latestContentRef]);

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

  function handleSave() {
    const combined = combineScriptCalib(content, calibText);
    onSave(combined);
    setSaved(true);
  }

  function scrollToSection(sec: Section) {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.focus();
    ta.setSelectionRange(sec.charOffset, sec.charOffset);
    const textBefore = content.slice(0, sec.charOffset);
    const lineIndex = textBefore.split("\n").length - 1;
    const approxLineHeight = ta.scrollHeight / (content.split("\n").length || 1);
    ta.scrollTop = Math.max(0, (lineIndex - 1) * approxLineHeight);
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

  const sections = parseSections(content, outline);
  const selectionLength = selectionRange ? selectionRange.end - selectionRange.start : 0;
  const canRegenerateSelection =
    !!onRegenerateSelection && !!selectionRange && selectionLength >= MIN_SELECTION_CHARS;

  const targetMin = 4000;
  const targetMax = 6000;
  const progress = Math.min((charCount / targetMax) * 100, 100);
  const progressColor =
    charCount < targetMin ? "bg-yellow-400" : charCount <= targetMax ? "bg-green-400" : "bg-red-400";
  const countColor =
    charCount < targetMin ? "text-yellow-600" : charCount <= targetMax ? "text-green-600" : "text-red-600";

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
          <span className="text-[10px] text-gray-400 hidden lg:inline">· ドラッグで選択 → 部分再生成</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onRegenerateSelection && (
            <button
              type="button"
              onClick={() => void handleRegenerateSelectionClick()}
              disabled={!canRegenerateSelection || selectionBusy}
              title={
                canRegenerateSelection
                  ? `選択中 ${selectionLength} 字を前後文脈を踏まえて書き直す`
                  : "台本内の文字列をドラッグして選択してください"
              }
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                canRegenerateSelection && !selectionBusy
                  ? "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
                  : "border-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {selectionBusy ? "再生成中…" : "選択部分を再生成"}
            </button>
          )}
          <button
            onClick={() => void handleCopyAll()}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium ${
              copied === "__all__"
                ? "bg-green-50 text-green-600 border-green-300"
                : "border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            {copied === "__all__" ? "コピー済み ✓" : "全体をコピー"}
          </button>
          {!saved && <span className="text-[10px] text-orange-400">未保存</span>}
          <button
            onClick={handleSave}
            className="text-xs bg-gray-800 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            保存
          </button>
        </div>
      </div>

      {selectionRange && canRegenerateSelection && !selectionBusy && (
        <div className="px-4 py-1.5 border-b border-blue-100 bg-blue-50 shrink-0">
          <p className="text-[10px] text-blue-700">
            {selectionLength.toLocaleString()} 字を選択中 —「選択部分を再生成」で前後の文脈を踏まえて書き直します
          </p>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {sections.length > 0 && (
          <div className="w-44 shrink-0 border-r border-gray-100 overflow-y-auto bg-gray-50 py-3 px-2 space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1 mb-2">
              セクション
            </p>
            {sections.map((sec) => (
              <button
                key={sec.label}
                onClick={() => scrollToSection(sec)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  void handleCopySection(sec.label, sec.content);
                }}
                title="クリック：ジャンプ　右クリック：コピー"
                className={`w-full text-left rounded-lg px-2.5 py-2 transition-all group ${
                  copied === sec.label
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

        <div className="flex-1 overflow-hidden">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleChange(e.target.value)}
            onSelect={syncSelectionFromTextarea}
            onMouseUp={syncSelectionFromTextarea}
            onKeyUp={syncSelectionFromTextarea}
            className="w-full h-full p-4 text-sm leading-relaxed text-gray-800 resize-none border-0 focus:outline-none font-mono"
            placeholder="台本をここに入力…"
            spellCheck={false}
          />
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
