"use client";

import { useEffect, useState } from "react";
import AppIcon from "@image/ScriptStudioIcon.svg";
import { TypingText } from "@/components/TypingText";

/**
 * 読み込み中のファーストビュー。ロゴ＋タグラインのタイピングアニメを全画面で表示する。
 * `visible` が false になるとフェードアウトし、完了後に onExited を呼んでアンマウントできる。
 */
export function SplashScreen({
  visible,
  onExited,
}: {
  visible: boolean;
  onExited?: () => void;
}) {
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    if (visible) return;
    const t = setTimeout(() => {
      setMounted(false);
      onExited?.();
    }, 500); // フェード時間と合わせる
    return () => clearTimeout(t);
  }, [visible, onExited]);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-white transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="text-center px-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={AppIcon.src}
          alt="ScriptStudio"
          width={260}
          height={58}
          className="mx-auto mb-4 splash-logo-in"
        />
        <p className="text-sm text-gray-400 leading-relaxed">
          <TypingText text="企画から台本まで、ひとつの画面で" />
        </p>
      </div>
    </div>
  );
}
