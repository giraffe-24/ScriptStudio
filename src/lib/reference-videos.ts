import type { YouTubeVideo } from "@/lib/theme-search";
import { parseYouTubeVideoId } from "@/lib/youtube-video-url";

export const MAX_REFERENCE_VIDEOS = 3;

/** リクエスト body の referenceUrls を検証して最大3件の YouTube 動画 URL に整える */
export function sanitizeReferenceUrls(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const urls: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const url = item.trim();
    if (!url || !parseYouTubeVideoId(url) || seen.has(url)) continue;
    seen.add(url);
    urls.push(url);
    if (urls.length >= MAX_REFERENCE_VIDEOS) break;
  }
  return urls;
}

/** 参考動画のメタ情報を YouTube Data API で取得する（失敗時は URL のみで返す） */
export async function fetchReferenceVideos(urls: string[]): Promise<YouTubeVideo[]> {
  if (urls.length === 0) return [];

  const entries = urls.map((url) => ({ url, videoId: parseYouTubeVideoId(url) }));
  const ids = entries.map((e) => e.videoId).filter((id): id is string => !!id);
  const details = new Map<string, YouTubeVideo>();

  const apiKey = process.env.YOUTUBE_DATA_API_KEY;
  if (apiKey && ids.length > 0) {
    try {
      const statsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
      statsUrl.searchParams.set("part", "snippet,statistics");
      statsUrl.searchParams.set("id", ids.join(","));
      statsUrl.searchParams.set("key", apiKey);

      const res = await fetch(statsUrl.toString(), { cache: "no-store" });
      const data = await res.json();
      for (const item of (data.items ?? []) as {
        id: string;
        snippet: {
          title: string;
          channelTitle: string;
          channelId?: string;
          publishedAt?: string;
        };
        statistics?: { viewCount?: string };
      }[]) {
        details.set(item.id, {
          videoId: item.id,
          title: item.snippet.title,
          channelTitle: item.snippet.channelTitle,
          channelId: item.snippet.channelId,
          viewCount: item.statistics?.viewCount,
          publishedAt: item.snippet.publishedAt,
          url: `https://www.youtube.com/watch?v=${item.id}`,
        });
      }
    } catch (err) {
      console.warn("[reference-videos] metadata fetch failed:", err);
    }
  }

  return entries.map(({ url, videoId }) => {
    if (videoId && details.has(videoId)) return details.get(videoId)!;
    return { videoId: videoId ?? undefined, title: url, channelTitle: "（タイトル未取得）", url };
  });
}

/** プロンプトに注入する「方向性の基準」ブロックを組み立てる（動画なしなら空文字） */
export function formatReferenceVideosSummary(videos: YouTubeVideo[]): string {
  if (videos.length === 0) return "";
  const lines = videos
    .map(
      (v, i) =>
        `${i + 1}. 「${v.title}」(${v.channelTitle}${
          v.viewCount ? `, ${Number(v.viewCount).toLocaleString()}回再生` : ""
        }${v.url ? `, ${v.url}` : ""})`,
    )
    .join("\n");
  return `=== 【最優先】参考動画（ユーザー指定・テーマ方向性の基準） ===
ユーザーがテーマ選定の方向性の基準として指定した動画です。
- 候補は必ずこれらの参考動画のテーマ領域・切り口・視聴者層の方向性に沿わせること
- 参考動画の方向性から大きく外れた候補を出さないこと（検索結果に多くても除外する）
- reason には、どの参考動画の方向性に沿っているかを一言添えること
${lines}`;
}
