"use client";

import { useCallback, useEffect, useState } from "react";

const CALIB_MARKER = "<<<YT_TALKSCRIPT_CALIB_SPLIT>>>";

interface Props {
  script: string;
  onSave: (content: string) => void;
  episodeTitle: string;
}

interface Section {
  label: string;
  content: string;
}

function parseSections(text: string): Section[] {
  if (!text.trim()) return [];
  const lines = text.split("\n");
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (current) sections.push(current);
      current = { label: line.replace(/^##\s+/, "").trim(), content: "" };
    } else {
      if (!current) {
        current = { label: "導入", content: "" };
      }
      current.content += line + "\n";
    }
  }
  if (current) sections.push(current);
  return sections.filter((s) => s.content.trim());
}

function splitCalib(raw: string): { main: string; calib: string } {
  const idx = raw.indexOf(CALIB_MARKER);
  if (idx === -1) return { main: raw, calib: "" };
  return {
    main: raw.slice(0, idx).trim(),
    calib: raw.slice(idx + CALIB_MARKER.length).trim(),
  };
}

export function ScriptEditor({ script, onSave }: Props) {
  const { main: initMain, calib: initCalib } = splitCalib(script);
  const [content, setContent] = useState(initMain);
  const [calibText, setCalibText] = useState(initCalib);
  const [saved, setSaved] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [calibOpen, setCalibOpen] = useState(!!initCalib);

  useEffect(() => {
    const { main, calib } = splitCalib(script);
    setContent(main);
    setCalibText(calib);
    setCalibOpen(!!calib);
  }, [script]);

  const charCount = content.replace(/\s/g, "").length;

  const handleChange = useCallback((value: string) => {
    setContent(value);
    setSaved(false);
  }, []);

  function handleSave() {
    const combined = calibText.trim()
      ? `${content}\n\n${CALIB_MARKER}\n\n${calibText}`
      : content;
    onSave(combined);
    setSaved(true);
  }

  async function handleCopy(label: string, text: string) {
    await navigator.clipboard.writeText(text.trim());
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  }

  async function handleCopyAll() {
    await navigator.clipboard.writeText(content);
    setCopied("__all__");
    setTimeout(() => setCopied(null), 1500);
  }

  const sections = parseSections(content);
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
            {sections.map((sec) => (
              <button
                key={sec.label}
                onClick={() => handleCopy(sec.label, sec.content)}
                title={`「${sec.label}」をコピー`}
                className={`w-full text-left rounded-lg px-2.5 py-2 transition-all group ${
                  copied === sec.label
                    ? "bg-green-100 text-green-700"
                    : "hover:bg-white hover:shadow-sm text-gray-600"
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs leading-snug line-clamp-2 flex-1">{sec.label}</span>
                  <span
                    className={`shrink-0 text-[10px] transition-opacity ${
                      copied === sec.label
                        ? "opacity-100 text-green-600"
                        : "opacity-0 group-hover:opacity-100 text-gray-400"
                    }`}
                  >
                    {copied === sec.label ? "✓" : "⎘"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* 右：台本 + 推敲比較 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 台本テキストエリア */}
          <div className="flex-1 overflow-hidden">
            <textarea
              value={content}
              onChange={(e) => handleChange(e.target.value)}
              className="w-full h-full p-4 text-sm leading-relaxed text-gray-800 resize-none border-0 focus:outline-none font-mono"
              placeholder="台本をここに入力…"
              spellCheck={false}
            />
          </div>

          {/* 推敲比較セクション */}
          <div className="border-t-2 border-dashed border-amber-200 shrink-0">
            {/* ヘッダー */}
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

            {/* 貼り付けエリア */}
            {calibOpen && (
              <div className="bg-amber-50 border-t border-amber-100">
                <textarea
                  value={calibText}
                  onChange={(e) => {
                    setCalibText(e.target.value);
                    setSaved(false);
                  }}
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
                      onClick={() => { setCalibText(""); setSaved(false); }}
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
      </div>
    </div>
  );
}
