export function formatSubscriberCount(
  count: number | null | undefined,
  hidden?: boolean,
): string {
  if (hidden) return "非公開";
  if (count == null) return "—";
  if (count >= 100_000_000) return `${(count / 100_000_000).toFixed(1)}億人`;
  if (count >= 10_000) return `${(count / 10_000).toFixed(1)}万人`;
  return `${count.toLocaleString("ja-JP")}人`;
}

export function formatSubscriberChange(delta: number): string {
  const sign = delta >= 0 ? "+" : "";
  const abs = Math.abs(delta);
  if (abs >= 10_000) return `${sign}${(delta / 10_000).toFixed(1)}万人`;
  return `${sign}${delta.toLocaleString("ja-JP")}人`;
}

export function formatSubscriberChangePercent(percent: number | null): string {
  if (percent == null) return "";
  const sign = percent >= 0 ? "+" : "";
  return `${sign}${percent}%`;
}
