"use client";

import { useEffect, useState } from "react";
import { DesktopStudio } from "@/components/DesktopStudio";
import { MobileStudio } from "@/components/MobileStudio";
import { SplashScreen } from "@/components/SplashScreen";
import { useIsMobile } from "@/lib/useIsMobile";
import { useStudio } from "@/lib/useStudio";

/** スプラッシュの最小表示時間(ms)。タイピングアニメを見せ切るための下限 */
const MIN_SPLASH_MS = 1900;
/** 初期データ取得が遅延・失敗してもスプラッシュを抜ける上限(ms) */
const MAX_SPLASH_MS = 6000;

export default function Home() {
  const studio = useStudio();
  const isMobile = useIsMobile();
  const [ready, setReady] = useState(false);
  const [splashGone, setSplashGone] = useState(false);

  // 初期データ取得（エピソード一覧）と最小表示時間の両方が満たされたら準備完了
  useEffect(() => {
    let cancelled = false;
    const startedAt = Date.now();

    const dataReady = fetch("/api/files?action=list")
      .then((r) => r.json())
      .catch(() => undefined);
    const maxTimer = new Promise<void>((resolve) => setTimeout(resolve, MAX_SPLASH_MS));

    Promise.race([dataReady, maxTimer]).then(() => {
      if (cancelled) return;
      const wait = Math.max(0, MIN_SPLASH_MS - (Date.now() - startedAt));
      setTimeout(() => {
        if (!cancelled) setReady(true);
      }, wait);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      {/* スタジオはスプラッシュの裏で先にマウントし、読み込みを進めておく */}
      {isMobile !== null &&
        (isMobile ? <MobileStudio studio={studio} /> : <DesktopStudio studio={studio} />)}

      {!splashGone && (
        <SplashScreen
          visible={!ready || isMobile === null}
          onExited={() => setSplashGone(true)}
        />
      )}
    </>
  );
}
