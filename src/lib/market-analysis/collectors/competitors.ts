import type { YouTubeVideo } from "@/lib/theme-search";
import type { CompetitorSuggestion } from "@/lib/types";
import type { CompetitorVideo } from "../types";
import { readEnabledCompetitorsConfig } from "../competitors-config";
import { fetchChannelRecentVideos, isOwnChannelName } from "./own-channel";

const MAX_DYNAMIC = 3;
const MAX_VIDEOS_PER_CHANNEL = 8;

function countChannelFrequency(videos: YouTubeVideo[]): Map<string, { count: number; title: string }> {
  const freq = new Map<string, { count: number; title: string }>();
  for (const v of videos) {
    if (!v.channelId || isOwnChannelName(v.channelTitle)) continue;
    const prev = freq.get(v.channelId);
    if (prev) {
      prev.count += 1;
    } else {
      freq.set(v.channelId, { count: 1, title: v.channelTitle });
    }
  }
  return freq;
}

export function suggestDynamicCompetitors(videos: YouTubeVideo[]): CompetitorSuggestion[] {
  const freq = countChannelFrequency(videos);
  return [...freq.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, MAX_DYNAMIC)
    .map(([channelId, { count, title }]) => ({
      channelId,
      displayName: title,
      videoCount: count,
      source: "dynamic" as const,
    }));
}

export async function collectCompetitorVideos(
  videos: YouTubeVideo[],
  approvedIds: string[] = [],
): Promise<{ competitorVideos: CompetitorVideo[]; suggestions: CompetitorSuggestion[] }> {
  const apiKey = process.env.YOUTUBE_DATA_API_KEY;
  if (!apiKey) return { competitorVideos: [], suggestions: [] };

  const approved = await readEnabledCompetitorsConfig();
  const approvedSet = new Set(approved.map((c) => c.channelId));
  for (const id of approvedIds) approvedSet.add(id);

  const dynamic = suggestDynamicCompetitors(videos).filter((s) => !approvedSet.has(s.channelId));
  const channelIds = [
    ...approved.map((c) => c.channelId),
    ...dynamic.map((d) => d.channelId),
  ].slice(0, approved.length + MAX_DYNAMIC);

  const competitorVideos: CompetitorVideo[] = [];

  for (const channelId of channelIds) {
    const isFixed = approvedSet.has(channelId) && approved.some((a) => a.channelId === channelId);
    const displayName =
      approved.find((a) => a.channelId === channelId)?.displayName ??
      dynamic.find((d) => d.channelId === channelId)?.displayName ??
      channelId;

    const recent = await fetchChannelRecentVideos(channelId, apiKey, MAX_VIDEOS_PER_CHANNEL);
    for (const v of recent) {
      competitorVideos.push({
        channelId,
        channelTitle: displayName,
        title: v.title,
        url: v.url,
        viewCount: v.viewCount,
        publishedAt: v.publishedAt,
        source: isFixed ? "fixed" : "dynamic",
      });
    }
  }

  const suggestions: CompetitorSuggestion[] = [
    ...approved.map((c) => ({
      channelId: c.channelId,
      displayName: c.displayName,
      videoCount: competitorVideos.filter((v) => v.channelId === c.channelId).length,
      source: "approved" as const,
    })),
    ...dynamic,
  ];

  return { competitorVideos, suggestions };
}
