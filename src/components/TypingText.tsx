"use client";

import { useEffect, useState } from "react";

interface Props {
  /** タイプして表示する文字列 */
  text: string;
  /** 1文字あたりの表示間隔(ms) */
  speed?: number;
  /** 開始までの遅延(ms) */
  startDelay?: number;
  /** 打ち終わってからカーソルを消すまでの時間(ms)。0 で消さない */
  caretLingerMs?: number;
  className?: string;
  /** カーソル要素に付与する追加クラス（縦書き用など） */
  caretClassName?: string;
  /** 装飾目的：読み上げ対象から除外する（背景アニメ等） */
  decorative?: boolean;
  /**
   * 全文ぶんのレイアウトを最初から確保し、未入力部分を visibility:hidden で
   * 不可視にしながら1文字ずつ可視化する。要素幅が一定になるため、
   * 横スクロール（マーキー）と併用してもガタつかない。
   */
  reserveLayout?: boolean;
}

/**
 * スタイリッシュなタイピング（タイプライター）アニメーション。
 * 1文字ずつ表示し、末尾に点滅カーソルを出す。打ち切ったら1回で止まる。
 */
export function TypingText({
  text,
  speed = 70,
  startDelay = 200,
  caretLingerMs = 1600,
  className,
  caretClassName,
  decorative = false,
  reserveLayout = false,
}: Props) {
  const chars = Array.from(text);
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const total = Array.from(text).length;
    let i = 0;
    let interval: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      interval = setInterval(() => {
        i += 1;
        setCount(i);
        if (i >= total) {
          if (interval) clearInterval(interval);
          setDone(true);
        }
      }, speed);
    }, startDelay);

    return () => {
      clearTimeout(start);
      if (interval) clearInterval(interval);
    };
  }, [text, speed, startDelay]);

  // 打ち終わったらカーソルを少し点滅させてからフェードアウト
  const [caretHidden, setCaretHidden] = useState(false);
  useEffect(() => {
    if (!done || caretLingerMs <= 0) return;
    const t = setTimeout(() => setCaretHidden(true), caretLingerMs);
    return () => clearTimeout(t);
  }, [done, caretLingerMs]);

  return (
    <span
      className={className}
      {...(decorative ? { "aria-hidden": true } : { "aria-label": text })}
    >
      <span aria-hidden="true">{chars.slice(0, count).join("")}</span>
      <span
        aria-hidden="true"
        className={`typing-caret${caretHidden ? " typing-caret--hidden" : ""}${
          caretClassName ? ` ${caretClassName}` : ""
        }`}
      />
      {reserveLayout ? (
        <span aria-hidden="true" style={{ visibility: "hidden" }}>
          {chars.slice(count).join("")}
        </span>
      ) : null}
    </span>
  );
}
