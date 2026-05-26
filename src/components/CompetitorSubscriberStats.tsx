"use client";

import type { ChannelSubscriberStats } from "@/lib/market-analysis/subscriber-history";
import {
  formatSubscriberChange,
  formatSubscriberChangePercent,
  formatSubscriberCount,
} from "@/lib/format-subscriber";

interface Props {
  stats?: ChannelSubscriberStats;
  className?: string;
}

export function CompetitorSubscriberStats({ stats, className = "" }: Props) {
  if (!stats) return null;

  const countLabel = formatSubscriberCount(stats.subscriberCount, stats.hidden);

  return (
    <p className={`text-xs leading-relaxed text-slate-600 dark:text-slate-300 ${className}`}>
      <span>登録者 {countLabel}</span>
      {!stats.hidden && stats.trendAvailable && stats.change30d != null && (
        <span
          className={
            stats.change30d >= 0
              ? "ml-1 text-emerald-600 dark:text-emerald-300"
              : "ml-1 text-rose-600 dark:text-rose-300"
          }
        >
          · 30日 {formatSubscriberChange(stats.change30d)}
          {stats.change30dPercent != null &&
            ` (${formatSubscriberChangePercent(stats.change30dPercent)})`}
        </span>
      )}
      {!stats.hidden && !stats.trendAvailable && stats.subscriberCount != null && (
        <span className="ml-1 text-slate-500 dark:text-slate-400">· 30日推移: 収集中</span>
      )}
    </p>
  );
}
