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
    <p className={`text-[10px] text-gray-500 leading-relaxed ${className}`}>
      <span>登録者 {countLabel}</span>
      {!stats.hidden && stats.trendAvailable && stats.change30d != null && (
        <span
          className={
            stats.change30d >= 0 ? "text-green-600 ml-1" : "text-red-600 ml-1"
          }
        >
          · 30日 {formatSubscriberChange(stats.change30d)}
          {stats.change30dPercent != null &&
            ` (${formatSubscriberChangePercent(stats.change30dPercent)})`}
        </span>
      )}
      {!stats.hidden && !stats.trendAvailable && stats.subscriberCount != null && (
        <span className="text-gray-400 ml-1">· 30日推移: 収集中</span>
      )}
    </p>
  );
}
