import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { loadChannelConfig, buildSystemPrompt } from "@/lib/config-loader";
import type { ThemeCandidate } from "@/lib/types";

interface YouTubeVideo {
  title: string;
  channelTitle: string;
  viewCount?: string;
  subscriberCount?: string;
}

async function fetchYouTubeVideos(query: string): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_DATA_API_KEY;
  if (!apiKey) return [];

  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("q", query);
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("order", "viewCount");
  searchUrl.searchParams.set("maxResults", "20");
  searchUrl.searchParams.set("regionCode", "JP");
  searchUrl.searchParams.set("relevanceLanguage", "ja");
  searchUrl.searchParams.set("key", apiKey);

  const searchRes = await fetch(searchUrl.toString());
  const searchData = await searchRes.json();
  if (!searchData.items) return [];

  const videoIds = searchData.items.map((item: { id: { videoId: string } }) => item.id.videoId).join(",");

  const statsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  statsUrl.searchParams.set("part", "statistics,snippet");
  statsUrl.searchParams.set("id", videoIds);
  statsUrl.searchParams.set("key", apiKey);

  const statsRes = await fetch(statsUrl.toString());
  const statsData = await statsRes.json();

  return (statsData.items ?? []).map((item: {
    snippet: { title: string; channelTitle: string };
    statistics: { viewCount?: string };
  }) => ({
    title: item.snippet.title,
    channelTitle: item.snippet.channelTitle,
    viewCount: item.statistics.viewCount,
  }));
}

export async function POST(req: NextRequest) {
  try {
  const { category } = await req.json();

  const config = await loadChannelConfig();
  const systemPrompt = buildSystemPrompt(config);

  const searchQuery = category
    ? `${category} スマホ 便利 簡単 設定`
    : "スマホ 便利 使い方 設定 無料 Google 効率化";

  const videos = await fetchYouTubeVideos(searchQuery);

  const hasYouTubeData = videos.length > 0;
  const videoSummary = hasYouTubeData
    ? videos
        .slice(0, 15)
        .map((v, i) => `${i + 1}. 「${v.title}」(${v.channelTitle}, ${Number(v.viewCount ?? 0).toLocaleString()}回再生)`)
        .join("\n")
    : "（YouTube API 未設定のため、AIの知識ベースで分析します）";

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 2048,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `以下は${hasYouTubeData ? "YouTubeで再生数が多い動画のリスト" : "分析のリクエスト"}です。

${videoSummary}

あなたのチャンネル「効率化オタクのあらきり」の視聴者（40〜60代、ITリテラシー初〜中級、Google系・無料ツール好き）に刺さるテーマ候補を5件提案してください。

以下のJSON配列形式で回答してください。他の説明文は不要です：
[
  {
    "title": "動画タイトル案（視聴者に刺さる言葉を使ったもの）",
    "hook": "最初の30秒で言うフック文（視聴者の悩みを直撃する一文）",
    "targetPain": "audience.md のどの恐れ・欲求に当たるか（1〜2行）",
    "reason": "なぜ今このテーマが視聴者に刺さるか（2〜3行）",
    "score": "high | medium | low"
  }
]`,
      },
    ],
  });

  let candidates: ThemeCandidate[] = [];
  try {
    const text = message.content[0].type === "text" ? message.content[0].text : "[]";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    candidates = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  } catch {
    candidates = [];
  }

  return NextResponse.json({ candidates, hasYouTubeData });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[market-research]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
