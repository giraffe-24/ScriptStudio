import { listEpisodes } from "@/lib/file-manager";
import type { OwnChannelEntry } from "../types";

const OWN_CHANNEL_NAMES = ["効率化オタクのあらきり", "あらきり"];
const FETCH_OPTS: RequestInit = { cache: "no-store" };

async function resolveOwnChannelId(apiKey: string): Promise<string | null> {
  const envId = process.env.ARAKIRI_YOUTUBE_CHANNEL_ID;
  if (envId) return envId;

  const url = new URL("https://www.googleapis.com/youtube/v3/channels");
  url.searchParams.set("part", "id");
  url.searchParams.set("forHandle", "arakiri_ch");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString(), FETCH_OPTS);
  const data = await res.json();
  return data.items?.[0]?.id ?? null;
}

export async function fetchChannelRecentVideos(
  channelId: string,
  apiKey: string,
  maxResults = 10,
): Promise<Array<{ title: string; url: string; viewCount?: string; publishedAt?: string }>> {
  const chUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
  chUrl.searchParams.set("part", "contentDetails,snippet");
  chUrl.searchParams.set("id", channelId);
  chUrl.searchParams.set("key", apiKey);

  const chRes = await fetch(chUrl.toString(), FETCH_OPTS);
  const chData = await chRes.json();
  const uploadsId = chData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsId) return [];

  const plUrl = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
  plUrl.searchParams.set("part", "snippet,contentDetails");
  plUrl.searchParams.set("playlistId", uploadsId);
  plUrl.searchParams.set("maxResults", String(maxResults));
  plUrl.searchParams.set("key", apiKey);

  const plRes = await fetch(plUrl.toString(), FETCH_OPTS);
  const plData = await plRes.json();
  const videoIds = (plData.items ?? [])
    .map((item: { contentDetails?: { videoId?: string } }) => item.contentDetails?.videoId)
    .filter(Boolean)
    .join(",");

  if (!videoIds) {
    return (plData.items ?? []).map(
      (item: { snippet?: { title?: string; resourceId?: { videoId?: string } } }) => ({
        title: item.snippet?.title ?? "",
        url: item.snippet?.resourceId?.videoId
          ? `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`
          : "",
      }),
    );
  }

  const statsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  statsUrl.searchParams.set("part", "statistics,snippet");
  statsUrl.searchParams.set("id", videoIds);
  statsUrl.searchParams.set("key", apiKey);

  const statsRes = await fetch(statsUrl.toString(), FETCH_OPTS);
  const statsData = await statsRes.json();

  return (statsData.items ?? []).map(
    (item: {
      id: string;
      snippet: { title: string; publishedAt?: string };
      statistics: { viewCount?: string };
    }) => ({
      title: item.snippet.title,
      url: `https://www.youtube.com/watch?v=${item.id}`,
      viewCount: item.statistics.viewCount,
      publishedAt: item.snippet.publishedAt,
    }),
  );
}

export async function collectOwnChannelHistory(): Promise<OwnChannelEntry[]> {
  const entries: OwnChannelEntry[] = [];

  const episodes = await listEpisodes();
  for (const ep of episodes) {
    entries.push({
      title: ep.title,
      source: "outputs",
      status: ep.status,
      number: ep.number,
    });
  }

  const apiKey = process.env.YOUTUBE_DATA_API_KEY;
  if (!apiKey) return entries;

  const channelId = await resolveOwnChannelId(apiKey);
  if (!channelId) return entries;

  const videos = await fetchChannelRecentVideos(channelId, apiKey, 30);
  for (const v of videos) {
    entries.push({ title: v.title, source: "youtube" });
  }

  return entries;
}

export function isOwnChannelName(name: string): boolean {
  const lower = name.toLowerCase();
  return OWN_CHANNEL_NAMES.some((n) => lower.includes(n.toLowerCase()));
}

export { resolveOwnChannelId };
