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
  /**
   * 1tick（speed間隔）あたりに進める文字数。ブラウザは setInterval を
   * 約4msに丸めるため、それより速くしたい場合はここを増やす。
   */
  charsPerTick?: number;
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
  charsPerTick = 1,
}: Props) {
  const chars = Array.from(text);
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // OS の「視差効果を減らす」設定を購読する（外部状態の同期）
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  useEffect(() => {
    // reduced-motion 時はアニメーションせず、描画側で全文を即時表示する
    if (reducedMotion) return;

    const total = Array.from(text).length;
    let i = 0;
    let interval: ReturnType<typeof setInterval> | undefined;
    const step = Math.max(1, charsPerTick);
    const start = setTimeout(() => {
      interval = setInterval(() => {
        i = Math.min(i + step, total);
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
  }, [text, speed, startDelay, charsPerTick, reducedMotion]);

  // 打ち終わったらカーソルを少し点滅させてからフェードアウト
  const [caretHidden, setCaretHidden] = useState(false);
  useEffect(() => {
    // reduced-motion 時は描画側でカーソルを消すため、ここでは何もしない
    if (reducedMotion || !done || caretLingerMs <= 0) return;
    const t = setTimeout(() => setCaretHidden(true), caretLingerMs);
    return () => clearTimeout(t);
  }, [done, caretLingerMs, reducedMotion]);

  // reduced-motion 時は全文表示・カーソル非表示に切り替える
  const visibleCount = reducedMotion ? chars.length : count;
  const caretIsHidden = reducedMotion || caretHidden;

  return (
    <span
      className={className}
      {...(decorative ? { "aria-hidden": true } : { "aria-label": text })}
    >
      <span aria-hidden="true">{chars.slice(0, visibleCount).join("")}</span>
      <span
        aria-hidden="true"
        className={`typing-caret${caretIsHidden ? " typing-caret--hidden" : ""}${
          caretClassName ? ` ${caretClassName}` : ""
        }`}
      />
      {reserveLayout ? (
        <span aria-hidden="true" style={{ visibility: "hidden" }}>
          {chars.slice(visibleCount).join("")}
        </span>
      ) : null}
    </span>
  );
}
