import { NextRequest, NextResponse } from "next/server";
import {
  appendCompetitorsConfig,
  readCompetitorsConfig,
} from "@/lib/market-analysis/competitors-config";
import type { CompetitorChannel } from "@/lib/types";

export async function GET() {
  const channels = await readCompetitorsConfig();
  return NextResponse.json({ channels });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const channels: CompetitorChannel[] = (body.channels ?? []).map(
      (c: { channelId: string; displayName: string }) => ({
        channelId: c.channelId,
        displayName: c.displayName,
        addedAt: new Date().toISOString().slice(0, 10),
      }),
    );

    if (channels.length === 0) {
      return NextResponse.json({ error: "承認するチャンネルがありません" }, { status: 400 });
    }

    await appendCompetitorsConfig(channels);
    const updated = await readCompetitorsConfig();
    return NextResponse.json({ channels: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[competitors]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
