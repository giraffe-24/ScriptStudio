import type { YouTubeVideo } from "@/lib/theme-search";
import type { EnrichedCandidate, ThemeCandidate, ThemeMode } from "@/lib/types";
import { fetchChannelRecentVideos } from "./collectors/own-channel";
import { collectYouTubeVideos } from "./collectors/youtube";
import type { CompetitorVideo } from "./types";
import { themeModeFit } from "./query-planner";

const FETCH_OPTS: RequestInit = { cache: "no-store" };

/** SSOT: config/theme-selection.md §3.3 — 救済 YouTube クエリ */
export const GUARANTEED_RESCUE_QUERIES = [
  "スマホ 便利 使い方 設定 無料",
  "Google アプリ 使い方 初心者",
  "Android 設定 効率化",
  "Gmail 整理 方法",
  "iPhone 便利機能 まとめ",
] as const;

const MIN_CANDIDATES = 6;
const MAX_FALLBACK_CANDIDATES = 8;

function videoUrl(video: { url?: string; videoId?: string }): string {
  if (video.url) return video.url;
  if (video.videoId) return `https://www.youtube.com/watch?v=${video.videoId}`;
  return "";
}

export function competitorVideosToYouTube(videos: CompetitorVideo[]): YouTubeVideo[] {
  return videos.map((v) => ({
    title: v.title,
    channelTitle: v.channelTitle,
    channelId: v.channelId,
    viewCount: v.viewCount,
    publishedAt: v.publishedAt,
    url: v.url,
  }));
}

/** 通常クエリ → 救済クエリ → 自 ch 直近動画の順で YouTube を確保する */
export async function collectYouTubeWithRescue(queries: string[]): Promise<YouTubeVideo[]> {
  let merged = await collectYouTubeVideos(queries);
  if (merged.length > 0) return merged;

  merged = await collectYouTubeVideos([...GUARANTEED_RESCUE_QUERIES]);
  if (merged.length > 0) return merged;

  return collectLastResortYouTube();
}

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

/** 自 ch 公開動画を最終根拠源として使う */
export async function collectLastResortYouTube(): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_DATA_API_KEY;
  if (!apiKey) return [];

  const channelId = await resolveOwnChannelId(apiKey);
  if (!channelId) return [];

  const recent = await fetchChannelRecentVideos(channelId, apiKey, 12);
  return recent.map((video) => ({
    title: video.title,
    channelTitle: "効率化オタクのあらきり",
    url: video.url,
    viewCount: video.viewCount,
    publishedAt: video.publishedAt,
  }));
}

function sortByViews(videos: YouTubeVideo[]): YouTubeVideo[] {
  return [...videos].sort(
    (a, b) => Number(b.viewCount ?? 0) - Number(a.viewCount ?? 0),
  );
}

function pickUniqueVideos(videos: YouTubeVideo[], limit: number): YouTubeVideo[] {
  const seen = new Set<string>();
  const picked: YouTubeVideo[] = [];
  for (const v of sortByViews(videos)) {
    const key = v.videoId ?? v.title;
    if (!v.title.trim() || seen.has(key)) continue;
    seen.add(key);
    picked.push(v);
    if (picked.length >= limit) break;
  }
  return picked;
}

function buildTitleFromVideo(video: YouTubeVideo, category?: string): string {
  const base = video.title.replace(/\s*【.*?】\s*/g, " ").trim();
  const prefix = category?.trim();
  if (prefix && !base.includes(prefix)) {
    return `${prefix}｜${base.slice(0, 40)}`.slice(0, 60);
  }
  return base.slice(0, 60);
}

export function buildFallbackEnrichedCandidates(
  videos: YouTubeVideo[],
  options: { themeMode: ThemeMode; category?: string },
): EnrichedCandidate[] {
  const fit = themeModeFit(options.themeMode);
  const picked = pickUniqueVideos(videos, MAX_FALLBACK_CANDIDATES);

  return picked.map((video, index) => ({
    title: buildTitleFromVideo(video, options.category),
    hook: `「${video.title.slice(0, 36)}…」のように、困りごとから入る切り口が有効です。`,
    targetPain: "機能はあるのに使い方が分からず、時間がかかる・続かない",
    reason: `YouTube 需要を確認: 「${video.title}」（${video.channelTitle}）を根拠に候補化しました。`,
    score: index < 2 ? "medium" : "low",
    differentiationAngle: "手順を短く整理し、ズボラでも再現できる形に落とし込む",
    competitionDensity: "medium",
    ownChannelRelation: "new",
    referencedVideos: [
      {
        title: video.title,
        url: videoUrl(video),
        channel: video.channelTitle,
        viewCount: video.viewCount,
      },
    ],
    themeModeFit: fit,
  }));
}

export function buildFallbackThemeCandidates(
  videos: YouTubeVideo[],
  theme: string,
): ThemeCandidate[] {
  const picked = pickUniqueVideos(videos, MAX_FALLBACK_CANDIDATES);
  return picked.map((video, index) => ({
    title: buildTitleFromVideo(video, theme),
    hook: `入力テーマ「${theme}」を、需要のある切り口「${video.title.slice(0, 30)}」に寄せて整理します。`,
    targetPain: "やりたいことは分かるが、具体的な手順や設定が分からない",
    reason: `YouTube 需要を確認: 「${video.title}」（${video.channelTitle}）を根拠に「${theme}」を改変しました。`,
    score: index < 2 ? "medium" : "low",
  }));
}

export function ensureEnrichedCandidates(
  candidates: EnrichedCandidate[],
  videos: YouTubeVideo[],
  options: { themeMode: ThemeMode; category?: string },
): EnrichedCandidate[] {
  if (candidates.length >= MIN_CANDIDATES) return candidates;
  const fallback = buildFallbackEnrichedCandidates(videos, options);
  if (candidates.length === 0) return fallback;

  const seen = new Set(candidates.map((c) => c.title));
  const merged = [...candidates];
  for (const c of fallback) {
    if (merged.length >= MIN_CANDIDATES) break;
    if (seen.has(c.title)) continue;
    seen.add(c.title);
    merged.push(c);
  }
  return merged;
}

export function ensureThemeCandidates(
  candidates: ThemeCandidate[],
  videos: YouTubeVideo[],
  theme: string,
): ThemeCandidate[] {
  if (candidates.length >= MIN_CANDIDATES) return candidates;
  const fallback = buildFallbackThemeCandidates(videos, theme);
  if (candidates.length === 0) return fallback;

  const seen = new Set(candidates.map((c) => c.title));
  const merged = [...candidates];
  for (const c of fallback) {
    if (merged.length >= MIN_CANDIDATES) break;
    if (seen.has(c.title)) continue;
    seen.add(c.title);
    merged.push(c);
  }
  return merged;
}
