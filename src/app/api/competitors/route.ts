import { NextRequest, NextResponse } from "next/server";
import {
  appendCompetitorsConfig,
  readCompetitorsConfig,
  updateCompetitorsEnabled,
} from "@/lib/market-analysis/competitors-config";
import { buildChannelSubscriberStats } from "@/lib/market-analysis/channel-stats";
import { resolveYouTubeChannel } from "@/lib/youtube-channel-resolve";
import type { CompetitorChannel } from "@/lib/types";

async function respondWithChannels(includeStats: boolean) {
  const channels = await readCompetitorsConfig();
  let stats = {};
  if (includeStats && channels.length > 0 && process.env.YOUTUBE_DATA_API_KEY) {
    try {
      stats = await buildChannelSubscriberStats(channels.map((c) => c.channelId));
    } catch (err) {
      console.warn("[competitors] stats fetch failed:", err);
    }
  }
  return NextResponse.json({ channels, stats });
}

export async function GET() {
  return respondWithChannels(true);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (typeof body.url === "string" && body.url.trim()) {
      if (!process.env.YOUTUBE_DATA_API_KEY) {
        return NextResponse.json(
          { error: "YOUTUBE_DATA_API_KEY が未設定です" },
          { status: 503 },
        );
      }

      const resolved = await resolveYouTubeChannel(body.url);
      if (!resolved) {
        return NextResponse.json(
          { error: "チャンネル URL を解釈できませんでした。YouTube のチャンネルページ URL を入力してください。" },
          { status: 422 },
        );
      }

      await appendCompetitorsConfig([
        {
          channelId: resolved.channelId,
          displayName: resolved.displayName,
          addedAt: new Date().toISOString().slice(0, 10),
          enabled: true,
        },
      ]);
      return respondWithChannels(true);
    }

    const channels: CompetitorChannel[] = (body.channels ?? []).map(
      (c: { channelId: string; displayName: string }) => ({
        channelId: c.channelId,
        displayName: c.displayName,
        addedAt: new Date().toISOString().slice(0, 10),
        enabled: true,
      }),
    );

    if (channels.length === 0) {
      return NextResponse.json({ error: "承認するチャンネルがありません" }, { status: 400 });
    }

    await appendCompetitorsConfig(channels);
    return respondWithChannels(false);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[competitors]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const updates: { channelId: string; enabled: boolean }[] = body.updates ?? [];
    if (updates.length === 0) {
      return NextResponse.json({ error: "updates required" }, { status: 400 });
    }

    await updateCompetitorsEnabled(updates);
    const channels = await readCompetitorsConfig();
    return NextResponse.json({ channels });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[competitors]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
