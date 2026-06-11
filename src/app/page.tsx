"use client";

import { DesktopStudio } from "@/components/DesktopStudio";
import { MobileStudio } from "@/components/MobileStudio";
import { useIsMobile } from "@/lib/useIsMobile";
import { useStudio } from "@/lib/useStudio";

export default function Home() {
  const studio = useStudio();
  const isMobile = useIsMobile();

  if (isMobile === null) return null;

  return isMobile ? <MobileStudio studio={studio} /> : <DesktopStudio studio={studio} />;
}
