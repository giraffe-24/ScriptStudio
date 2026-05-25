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

const ENRICHED_FALLBACK_VARIANTS = [
  {
    suffix: "",
    hook: (title: string) => `「${title.slice(0, 36)}…」のように、困りごとから入る切り口が有効です。`,
    targetPain: "機能はあるのに使い方が分からず、時間がかかる・続かない",
    angle: "まずは全体像を短く整理し、最初の一歩を迷わない形に落とし込む",
    reasonNote: "YouTube 需要を確認して、そのまま主軸候補として採用しました。",
  },
  {
    suffix: "｜まずはここだけ",
    hook: (title: string) => `「結局どこから触ればいいの？」に、${title.slice(0, 28)} を起点に答える構成です。`,
    targetPain: "設定項目が多く、最初に触るべき場所が分からない",
    angle: "最初に触る設定や操作だけに絞って、判断コストを減らす",
    reasonNote: "同じ需要の中でも、最初の一手に絞った周辺切り口として候補化しました。",
  },
  {
    suffix: "｜やりがちミス対策",
    hook: (title: string) => `「よかれと思って触るほど逆にややこしくなる」を、${title.slice(0, 26)} の文脈で防ぎます。`,
    targetPain: "自己流で触って失敗し、余計に分かりにくくなるのが怖い",
    angle: "ありがちな勘違いと回避策を先回りで示す",
    reasonNote: "需要が薄いわけではなく、失敗回避に寄せた派生テーマとして補完しました。",
  },
  {
    suffix: "｜最新版の見直し",
    hook: (title: string) => `前は正解だったやり方が今は違うかもしれない。その不安を ${title.slice(0, 24)} から解きほぐします。`,
    targetPain: "アップデート後に手順や設定名が変わり、古い情報が役に立たない",
    angle: "最新版で変わった点・見直す点に寄せて整理する",
    reasonNote: "検索根拠を保ちつつ、更新差分に寄せた需要として展開しました。",
  },
  {
    suffix: "｜ズボラ向け時短",
    hook: (title: string) => `細かい説明より、まず楽に終わるやり方が知りたい人向けに ${title.slice(0, 24)} を短縮します。`,
    targetPain: "丁寧すぎる説明は見きれず、結局手を付けられない",
    angle: "ズボラでも再現できる最短手順に圧縮する",
    reasonNote: "同じ検索需要を、時短重視の視聴意図にずらして候補化しました。",
  },
  {
    suffix: "｜安全確認つき",
    hook: (title: string) => `設定を変えて壊れないか不安。その心理に対して ${title.slice(0, 24)} を安全確認付きで案内します。`,
    targetPain: "設定変更や削除操作で失敗しないか不安で進めない",
    angle: "触ってよい範囲と避けるべき操作を明示して安心感を出す",
    reasonNote: "同一テーマの中でも、不安解消に寄せた需要として最低件数を補完しました。",
  },
] as const;

const THEME_FALLBACK_VARIANTS = [
  "",
  "｜まずはここだけ",
  "｜やりがちミス対策",
  "｜最新版の見直し",
  "｜ズボラ向け時短",
  "｜安全確認つき",
] as const;

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

function appendTitleSuffix(base: string, suffix: string): string {
  if (!suffix) return base;
  const headLimit = Math.max(12, 60 - suffix.length);
  return `${base.slice(0, headLimit)}${suffix}`.slice(0, 60);
}

export function buildFallbackEnrichedCandidates(
  videos: YouTubeVideo[],
  options: { themeMode: ThemeMode; category?: string },
): EnrichedCandidate[] {
  const fit = themeModeFit(options.themeMode);
  const picked = pickUniqueVideos(videos, MAX_FALLBACK_CANDIDATES);
  if (picked.length === 0) return [];

  const targetCount = Math.min(
    MAX_FALLBACK_CANDIDATES,
    Math.max(MIN_CANDIDATES, picked.length),
  );
  const out: EnrichedCandidate[] = [];
  const seenTitles = new Set<string>();

  for (let variantIndex = 0; variantIndex < ENRICHED_FALLBACK_VARIANTS.length; variantIndex += 1) {
    const variant = ENRICHED_FALLBACK_VARIANTS[variantIndex];
    for (const video of picked) {
      const title = appendTitleSuffix(
        buildTitleFromVideo(video, options.category),
        variant.suffix,
      );
      if (seenTitles.has(title)) continue;
      seenTitles.add(title);
      out.push({
        title,
        hook: variant.hook(video.title),
        targetPain: variant.targetPain,
        reason: `YouTube 需要を確認: 「${video.title}」（${video.channelTitle}）を根拠に候補化しました。${variant.reasonNote}`,
        score: out.length < 2 ? "medium" : "low",
        differentiationAngle: variant.angle,
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
      });
      if (out.length >= targetCount) return out;
    }
  }

  return out;
}

export function buildFallbackThemeCandidates(
  videos: YouTubeVideo[],
  theme: string,
): ThemeCandidate[] {
  const picked = pickUniqueVideos(videos, MAX_FALLBACK_CANDIDATES);
  if (picked.length === 0) return [];

  const targetCount = Math.min(
    MAX_FALLBACK_CANDIDATES,
    Math.max(MIN_CANDIDATES, picked.length),
  );
  const out: ThemeCandidate[] = [];
  const seenTitles = new Set<string>();

  for (const suffix of THEME_FALLBACK_VARIANTS) {
    for (const video of picked) {
      const title = appendTitleSuffix(buildTitleFromVideo(video, theme), suffix);
      if (seenTitles.has(title)) continue;
      seenTitles.add(title);
      out.push({
        title,
        hook: `入力テーマ「${theme}」を、需要のある切り口「${video.title.slice(0, 30)}」に寄せて整理します。`,
        targetPain: "やりたいことは分かるが、具体的な手順や設定が分からない",
        reason: `YouTube 需要を確認: 「${video.title}」（${video.channelTitle}）を根拠に「${theme}」を改変しました。`,
        score: out.length < 2 ? "medium" : "low",
      });
      if (out.length >= targetCount) return out;
    }
  }

  return out;
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
