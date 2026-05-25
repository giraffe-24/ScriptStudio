"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  combineScriptCalib,
  splitScriptCalib,
} from "@/lib/script-calib";

interface Props {
  script: string;
  onSave: (content: string) => void;
  episodeTitle: string;
  outline?: { section: string; content: string }[];
  onRevisionEntered?: () => void;
  onRevisionCleared?: () => void;
  latestContentRef?: React.MutableRefObject<string>;
  onRegenerateSection?: (index: number) => void;
  regeneratingSectionIndices?: number[];
}

interface Section {
  label: string;
  content: string;
  charOffset: number; // textarea 内の開始文字位置
}

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

  // 企画書の目次案をラベルに優先（台本 ## 見出しとインデックスで対応）
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

/** Markdown → Google Docs に貼り付けたとき見出しになる HTML を生成 */
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
  onRegenerateSection,
  regeneratingSectionIndices = [],
}: Props) {
  const { main: initMain, calib: initCalib } = splitCalib(script);
  const [content, setContent] = useState(initMain);
  const [calibText, setCalibText] = useState(initCalib);
  const [saved, setSaved] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [calibOpen, setCalibOpen] = useState(false);
  const hadRevisionRef = useRef(initCalib.trim().length > 0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  function handleSave() {
    const combined = combineScriptCalib(content, calibText);
    onSave(combined);
    setSaved(true);
  }

  /** セクションボタンクリック → textarea 内の該当見出しへスクロール */
  function scrollToSection(sec: Section) {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.focus();
    ta.setSelectionRange(sec.charOffset, sec.charOffset);

    // 見出しが何行目かを計算してスクロール
    const textBefore = content.slice(0, sec.charOffset);
    const lineIndex = textBefore.split("\n").length - 1;
    // lineHeight を測定（計算できないため固定値 + バッファ）
    const approxLineHeight = ta.scrollHeight / (content.split("\n").length || 1);
    ta.scrollTop = Math.max(0, (lineIndex - 1) * approxLineHeight);
  }

  /** 全体コピー：HTML 形式で Clipboard に書き込み（Google Docs 見出し対応） */
  async function handleCopyAll() {
    try {
      const html = toHtml(content);
      const htmlBlob = new Blob([html], { type: "text/html" });
      const textBlob = new Blob([content], { type: "text/plain" });
      await navigator.clipboard.write([
        new ClipboardItem({ "text/html": htmlBlob, "text/plain": textBlob }),
      ]);
    } catch {
      // ClipboardItem 非対応ブラウザはプレーンテキストにフォールバック
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

  const sections = parseSections(content, outline);
  const targetMin = 4000;
  const targetMax = 6000;
  const progress = Math.min((charCount / targetMax) * 100, 100);
  const progressColor =
    charCount < targetMin ? "bg-yellow-400" : charCount <= targetMax ? "bg-green-400" : "bg-red-400";
  const countColor =
    charCount < targetMin ? "text-yellow-600" : charCount <= targetMax ? "text-green-600" : "text-red-600";

  return (
    <div className="flex flex-col h-full">
      {/* ツールバー */}
      <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-4">
          <span className={`text-xs font-bold font-mono tabular-nums ${countColor}`}>
            {charCount.toLocaleString()} 字
          </span>
          <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className={`h-full ${progressColor} transition-all`} style={{ width: `${progress}%` }} />
          </div>
          <span className="text-[10px] text-gray-400">目標 4,000〜6,000 字</span>
          <span className="text-[10px] text-gray-400 hidden sm:inline">· 軽い修正は直接編集</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyAll}
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

      {/* 本体 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左：セクション一覧 */}
        {sections.length > 0 && (
          <div className="w-44 shrink-0 border-r border-gray-100 overflow-y-auto bg-gray-50 py-3 px-2 space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1 mb-2">
              セクション
            </p>
            {sections.map((sec, index) => (
              <div key={sec.label} className="flex items-start gap-1">
                <button
                  onClick={() => scrollToSection(sec)}
                  onContextMenu={(e) => { e.preventDefault(); handleCopySection(sec.label, sec.content); }}
                  title={`クリック：ジャンプ　右クリック：コピー`}
                  className={`flex-1 text-left rounded-lg px-2.5 py-2 transition-all group ${
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
                {onRegenerateSection && (
                  <button
                    type="button"
                    onClick={() => onRegenerateSection(index)}
                    disabled={regeneratingSectionIndices.includes(index)}
                    title="この章だけ AI 再生成"
                    className="shrink-0 mt-1.5 w-7 h-7 rounded text-[10px] text-gray-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {regeneratingSectionIndices.includes(index) ? "…" : "↻"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 右：台本テキストエリア */}
        <div className="flex-1 overflow-hidden">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full h-full p-4 text-sm leading-relaxed text-gray-800 resize-none border-0 focus:outline-none font-mono"
            placeholder="台本をここに入力…"
            spellCheck={false}
          />
        </div>
      </div>

      {/* 推敲比較セクション（全幅・初期状態：閉じ） */}
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
