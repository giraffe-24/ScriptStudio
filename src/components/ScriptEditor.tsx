"use client";

import { useCallback, useEffect, useState } from "react";

interface Props {
  script: string;
  onSave: (content: string) => void;
  episodeTitle: string;
}

export function ScriptEditor({ script, onSave, episodeTitle }: Props) {
  const [content, setContent] = useState(script);
  const [charCount, setCharCount] = useState(0);
  const [saved, setSaved] = useState(true);

  useEffect(() => {
    setContent(script);
    setCharCount(script.replace(/\s/g, "").length);
  }, [script]);

  const handleChange = useCallback((value: string) => {
    setContent(value);
    setCharCount(value.replace(/\s/g, "").length);
    setSaved(false);
  }, []);

  function handleSave() {
    onSave(content);
    setSaved(true);
  }

  const targetMin = 4000;
  const targetMax = 6000;
  const progress = Math.min((charCount / targetMax) * 100, 100);
  const progressColor =
    charCount < targetMin ? "bg-yellow-400" : charCount <= targetMax ? "bg-green-400" : "bg-red-400";
  const countColor =
    charCount < targetMin ? "text-yellow-600" : charCount <= targetMax ? "text-green-600" : "text-red-600";

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-between bg-white">
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
          {!saved && (
            <span className="text-[10px] text-orange-400">未保存</span>
          )}
          <button
            onClick={handleSave}
            className="text-xs bg-gray-800 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            保存
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <textarea
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full h-full p-4 text-sm leading-relaxed text-gray-800 resize-none border-0 focus:outline-none font-mono"
          placeholder="台本をここに入力…"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
