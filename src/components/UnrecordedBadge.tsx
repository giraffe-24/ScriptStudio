/** 記録されていない変更があることを示すバッジ */
export function UnrecordedBadge({ label = "未記録" }: { label?: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800 shrink-0">
      {label}
    </span>
  );
}

export const scriptBtnRecordPending =
  "text-xs font-medium px-3 py-1 rounded-md transition-colors border border-amber-400 bg-amber-50 text-amber-800 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40";
