import { NextRequest, NextResponse } from "next/server";
import { buildChannelSubscriberStats } from "@/lib/market-analysis/channel-stats";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const channelIds: string[] = body.channelIds ?? [];
    if (channelIds.length === 0) {
      return NextResponse.json({ stats: {} });
    }

    if (!process.env.YOUTUBE_DATA_API_KEY) {
      return NextResponse.json(
        { error: "YOUTUBE_DATA_API_KEY が未設定です" },
        { status: 503 },
      );
    }

    const stats = await buildChannelSubscriberStats(channelIds);
    return NextResponse.json({ stats });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[competitors/stats]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
