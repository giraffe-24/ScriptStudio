import type { YouTubeVideo } from "@/lib/theme-search";
import { searchYouTubeVideos } from "@/lib/theme-search";

export async function collectYouTubeVideos(queries: string[]): Promise<YouTubeVideo[]> {
  const results = await Promise.all(
    queries.map((q) => searchYouTubeVideos(q, { maxResults: 12 })),
  );

  const seen = new Set<string>();
  const merged: YouTubeVideo[] = [];

  for (const batch of results) {
    for (const video of batch) {
      const key = video.videoId ?? video.title;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(video);
    }
  }

  return merged;
}
