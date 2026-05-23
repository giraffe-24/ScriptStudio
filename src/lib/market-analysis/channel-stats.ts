import type { ChannelSubscriberStats } from "@/lib/market-analysis/subscriber-history";
import {
  computeSubscriberTrend,
  readSubscriberHistory,
  recordSubscriberSnapshots,
} from "@/lib/market-analysis/subscriber-history";

const FETCH_OPTS: RequestInit = { cache: "no-store" };

export interface ChannelStatistics {
  subscriberCount: number | null;
  hidden: boolean;
  thumbnailUrl: string | null;
}

function pickThumbnail(item: {
  snippet?: { thumbnails?: { medium?: { url?: string }; default?: { url?: string } } };
}): string | null {
  return (
    item.snippet?.thumbnails?.medium?.url ??
    item.snippet?.thumbnails?.default?.url ??
    null
  );
}

export async function fetchChannelStatistics(
  channelIds: string[],
): Promise<Map<string, ChannelStatistics>> {
  const apiKey = process.env.YOUTUBE_DATA_API_KEY;
  const result = new Map<string, ChannelStatistics>();
  if (!apiKey || channelIds.length === 0) return result;

  const unique = [...new Set(channelIds)];
  for (let i = 0; i < unique.length; i += 50) {
    const batch = unique.slice(i, i + 50);
    const url = new URL("https://www.googleapis.com/youtube/v3/channels");
    url.searchParams.set("part", "snippet,statistics");
    url.searchParams.set("id", batch.join(","));
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString(), FETCH_OPTS);
    const data = await res.json();

    for (const item of data.items ?? []) {
      const hidden = item.statistics?.hiddenSubscriberCount === true;
      const raw = item.statistics?.subscriberCount;
      const subscriberCount =
        hidden || raw == null ? null : Number.parseInt(String(raw), 10);
      result.set(item.id, {
        subscriberCount: Number.isFinite(subscriberCount) ? subscriberCount : null,
        hidden,
        thumbnailUrl: pickThumbnail(item),
      });
    }
  }

  return result;
}

export async function buildChannelSubscriberStats(
  channelIds: string[],
): Promise<Record<string, ChannelSubscriberStats>> {
  const statsMap = await fetchChannelStatistics(channelIds);
  const history = await readSubscriberHistory();
  const toRecord: { channelId: string; subscriberCount: number }[] = [];
  const out: Record<string, ChannelSubscriberStats> = {};

  for (const channelId of channelIds) {
    const raw = statsMap.get(channelId) ?? {
      subscriberCount: null,
      hidden: false,
      thumbnailUrl: null,
    };
    if (raw.subscriberCount != null) {
      toRecord.push({ channelId, subscriberCount: raw.subscriberCount });
    }
    const trend = computeSubscriberTrend(channelId, raw.subscriberCount, history);
    out[channelId] = {
      subscriberCount: raw.subscriberCount,
      hidden: raw.hidden,
      thumbnailUrl: raw.thumbnailUrl,
      ...trend,
    };
  }

  await recordSubscriberSnapshots(toRecord);
  return out;
}
