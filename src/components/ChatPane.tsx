"use client";

import { useRef, useState } from "react";
import type { ChatMessage } from "@/lib/types";

interface Props {
  theme: string;
  sectionLabel: string;
  sectionContent: string;
  history: ChatMessage[];
  onHistoryUpdate: (history: ChatMessage[]) => void;
  onClose: () => void;
}

export function ChatPane({ theme, sectionLabel, sectionContent, history, onHistoryUpdate, onClose }: Props) {
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function handleSend() {
    if (!input.trim() || streaming) return;
    const userMsg: ChatMessage = { role: "user", content: input };
    const newHistory = [...history, userMsg];
    onHistoryUpdate(newHistory);
    setInput("");
    setStreaming(true);

    const assistantMsg: ChatMessage = { role: "assistant", content: "" };
    const withAssistant = [...newHistory, assistantMsg];
    onHistoryUpdate(withAssistant);

    const res = await fetch("/api/section-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        theme,
        sectionLabel,
        sectionContent,
        history: newHistory.slice(0, -1),
        userMessage: input,
      }),
    });

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let full = "";
    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      full += decoder.decode(value, { stream: true });
      onHistoryUpdate([...newHistory, { role: "assistant", content: full }]);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    setStreaming(false);
  }

  return (
    <div className="w-72 border-l border-gray-200 flex flex-col bg-white">
      <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-gray-700">AI と深掘り</p>
          <p className="text-[10px] text-gray-400">{sectionLabel}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {history.length === 0 && (
          <div className="text-[11px] text-gray-400 bg-gray-50 rounded-lg p-2 leading-relaxed">
            このセクションについて改善案・別角度・具体例など、何でも聞いてください
          </div>
        )}
        {history.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[90%] text-xs rounded-xl px-3 py-2 leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {msg.content || (streaming && i === history.length - 1 ? "▋" : "")}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="p-2 border-t border-gray-200">
        <div className="flex gap-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="質問・改善依頼…"
            className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-blue-300"
            disabled={streaming}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || streaming}
            className="bg-blue-500 text-white rounded-lg px-2.5 py-2 text-xs hover:bg-blue-600 disabled:opacity-40 transition-colors"
          >
            送信
          </button>
        </div>
      </div>
    </div>
  );
}
