"use client";

/**
 * 閲覧専用（レビュアー）向けデモ再生の注意書き。
 * デモで表示している結果に必ず添えて、AIを使っていないことを明示する。
 */
export function DemoAiNotice({ className = "" }: { className?: string }) {
  return (
    <div
      role="note"
      className={`rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs leading-relaxed text-violet-800 ${className}`}
    >
      🎭 <span className="font-semibold">デモ表示</span> —
      この結果はあらかじめ用意したサンプルです。AI・YouTube API などの外部サービスは一切使用していません。
    </div>
  );
}
