"use client";

import { useEffect, useState } from "react";

/**
 * ビューポート幅がスマホ相当（< breakpoint）かどうかを返す。
 * マウント前は null を返すので、呼び出し側はハイドレーション差異を避けられる。
 */
export function useIsMobile(breakpoint = 768): boolean | null {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [breakpoint]);

  return isMobile;
}
