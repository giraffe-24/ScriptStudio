"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ChatMessage } from "@/lib/types";
import { toUserMessage } from "@/lib/error-message";

interface Props {
  theme: string;
  sectionLabel: string;
  sectionContent: string;
  history: ChatMessage[];
  onHistoryUpdate: (history: ChatMessage[]) => void;
  /** AI の回答をこのセクションのフィールドへ反映する。省略時は反映ボタンを出さない。 */
  onApply?: (text: string) => void;
  onClose: () => void;
}

export function ChatPane({ theme, sectionLabel, sectionContent, history, onHistoryUpdate, onApply, onClose }: Props) {
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUserMessage, setLastUserMessage] = useState<string | null>(null);
  // 「反映しました」フィードバックを出す対象メッセージの index
  const [appliedIndex, setAppliedIndex] = useState<number | null>(null);
  // md 未満はオーバーレイ（モーダル）、md 以上は常設のドッキングパネル。
  const [isOverlay, setIsOverlay] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const headingId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // md 未満をオーバーレイ扱いにする（Tailwind md=768px）。リサイズにも追従。
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsOverlay(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Esc クローズは常時。初期フォーカスと Tab トラップはオーバーレイ（モバイル）時のみ。
  // デスクトップは隣にエディタが並ぶ常設パネルなので、トラップするとキーボードが
  // チャットから出られず（WCAG 2.1.2 違反）、aria-modal も虚偽セマンティクスになる。
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const getFocusable = () =>
      Array.from(
        container.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null);

    if (isOverlay) getFocusable()[0]?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (!isOverlay || e.key !== "Tab") return;
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
  }, [isOverlay]);

  async function runRequest(baseHistory: ChatMessage[], message: string) {
    const newHistory: ChatMessage[] = [...baseHistory, { role: "user", content: message }];
    onHistoryUpdate(newHistory);
    setError(null);
    setAppliedIndex(null);
    setLastUserMessage(message);
    setStreaming(true);
    onHistoryUpdate([...newHistory, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/section-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme,
          sectionLabel,
          sectionContent,
          history: baseHistory,
          userMessage: message,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "セクション相談に失敗しました");
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error("セクション相談の応答を受け取れませんでした");
      }

      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        onHistoryUpdate([...newHistory, { role: "assistant", content: full }]);
        bottomRef.current?.scrollIntoView({ behavior: "auto" });
      }
      setLastUserMessage(null);
    } catch (err) {
      // 失敗は assistant 吹き出しに混ぜず、空の応答を取り除いて専用バナーで通知する
      onHistoryUpdate(newHistory);
      setError(toUserMessage(err, "セクション相談に失敗しました。少し時間をおいて、もう一度お試しください。"));
    } finally {
      setStreaming(false);
    }
  }

  function handleSend() {
    const message = input.trim();
    if (!message || streaming) return;
    setInput("");
    void runRequest(history, message);
  }

  function handleApply(content: string, index: number) {
    if (!onApply) return;
    onApply(content);
    setAppliedIndex(index);
  }

  function handleRetry() {
    if (!lastUserMessage || streaming) return;
    const base =
      history.length > 0 && history[history.length - 1].role === "user"
        ? history.slice(0, -1)
        : history;
    void runRequest(base, lastUserMessage);
  }

  return (
    <div
      ref={containerRef}
      role={isOverlay ? "dialog" : undefined}
      aria-modal={isOverlay ? true : undefined}
      aria-labelledby={isOverlay ? headingId : undefined}
      className="fixed inset-0 z-40 w-full flex flex-col bg-white md:static md:inset-auto md:z-auto md:w-72 md:border-l md:border-gray-200"
    >
      <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 id={headingId} className="text-xs font-bold text-gray-700">
            AI と深掘り
          </h2>
          <p className="text-xs text-muted-foreground truncate">{sectionLabel}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="閉じる"
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted text-lg leading-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-ring outline-none"
        >
          ×
        </button>
      </div>

      <div
        className="flex-1 overflow-y-auto p-3 space-y-3"
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        aria-busy={streaming}
      >
        {history.length === 0 && (
          <div className="text-xs text-muted-foreground bg-gray-50 rounded-lg p-2 leading-relaxed">
            このセクションについて改善案・別角度・具体例など、何でも聞いてください
          </div>
        )}
        {history.map((msg, i) => {
          const isUser = msg.role === "user";
          const isStreamingLast = streaming && i === history.length - 1;
          const canApply = !isUser && !!msg.content && !isStreamingLast && !!onApply;
          return (
            <div key={i} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
              <div
                className={`max-w-[90%] text-xs rounded-xl px-3 py-2 leading-relaxed whitespace-pre-wrap ${
                  isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                }`}
              >
                {msg.content || (isStreamingLast ? <span aria-hidden>▋</span> : "")}
              </div>
              {canApply && (
                <button
                  type="button"
                  onClick={() => handleApply(msg.content, i)}
                  className="mt-1 inline-flex items-center gap-1 rounded-md border border-input px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-ring outline-none"
                >
                  {appliedIndex === i ? "✓ 反映しました" : "この内容を反映"}
                </button>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div
          role="alert"
          className="mx-3 mb-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          <p className="font-medium">送信に失敗しました</p>
          <p className="mt-1 leading-relaxed">{error}</p>
          <button
            type="button"
            onClick={handleRetry}
            disabled={streaming || !lastUserMessage}
            className="mt-2 inline-flex h-8 items-center rounded-md border border-destructive/30 px-3 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-ring outline-none"
          >
            再送信
          </button>
        </div>
      )}

      <div className="p-2 border-t border-gray-200">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing) return; // IME 変換確定の Enter は無視
              // Enter は改行、⌘/Ctrl+Enter で送信
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={2}
            placeholder="質問・改善依頼…（Enter で改行 / ⌘Enter で送信）"
            aria-label={`${sectionLabel} について質問・改善依頼を入力`}
            className="flex-1 text-xs border border-input rounded-lg px-2.5 py-2 resize-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-ring outline-none disabled:opacity-50"
            disabled={streaming}
          />
          <Button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || streaming}
            className="text-xs"
          >
            送信
          </Button>
        </div>
      </div>
    </div>
  );
}
