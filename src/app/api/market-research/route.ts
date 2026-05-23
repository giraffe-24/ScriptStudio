import { NextRequest, NextResponse } from "next/server";
import { runMarketAnalysis } from "@/lib/market-analysis";
import type { ThemeMode } from "@/lib/types";

function parseThemeMode(value: unknown): ThemeMode {
  if (value === "A" || value === "B" || value === "C") return value;
  return "C";
}

export async function POST(req: NextRequest) {
  try {
    const { category, themeMode: rawMode } = await req.json();
    const themeMode = parseThemeMode(rawMode);

    if (!process.env.YOUTUBE_DATA_API_KEY) {
      return NextResponse.json(
        {
          error:
            "YOUTUBE_DATA_API_KEY が未設定です。テーマ選定には YouTube 検索が必要です（.env を確認してください）。",
        },
        { status: 503 },
      );
    }

    const result = await runMarketAnalysis({ category, themeMode });
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[market-research]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
