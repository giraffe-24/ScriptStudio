"use client";

import { DesktopStudio } from "@/components/DesktopStudio";
import { MobileStudio } from "@/components/MobileStudio";
import { useIsMobile } from "@/lib/useIsMobile";
import { useStudio } from "@/lib/useStudio";

export default function Home() {
  const studio = useStudio();
  const isMobile = useIsMobile();

  // デバイス判定が確定するまで白画面で点滅させず、無地の土台を見せておく。
  if (isMobile === null) {
    return <div className="h-full bg-gray-100" aria-hidden="true" />;
  }

  return isMobile ? <MobileStudio studio={studio} /> : <DesktopStudio studio={studio} />;
}
