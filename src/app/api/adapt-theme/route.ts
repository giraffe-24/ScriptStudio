import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { loadChannelConfig, buildSystemPrompt } from "@/lib/config-loader";
import {
  collectYouTubeWithRescue,
  ensureThemeCandidates,
} from "@/lib/market-analysis/guaranteed-search";
import type { ThemeCandidate } from "@/lib/types";
import { buildThemeSearchUserPrompt, runThemeSearch } from "@/lib/theme-search";

export async function POST(req: NextRequest) {
  try {
    const { theme } = await req.json();
    if (!theme) return NextResponse.json({ error: "theme required" }, { status: 400 });

    if (!process.env.YOUTUBE_DATA_API_KEY) {
      return NextResponse.json(
        {
          error:
            "YOUTUBE_DATA_API_KEY が未設定です。テーマ選定には YouTube 検索が必要です（.env を確認してください）。",
        },
        { status: 503 },
      );
    }

    const searchQueries = [
      `${theme} 使い方 スマホ 設定`,
      `${theme} 設定 初心者`,
      `${theme} 便利 機能`,
    ];
    let youtube = await collectYouTubeWithRescue(searchQueries);

    const searchResult = await runThemeSearch(searchQueries[0]);
    if (youtube.length === 0 && searchResult.youtube.length > 0) {
      youtube = searchResult.youtube;
    }

    const config = await loadChannelConfig();
    const systemPrompt = buildSystemPrompt(config);
    let candidates: ThemeCandidate[] = [];

    try {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const userPrompt = buildThemeSearchUserPrompt(
        searchQueries[0],
        { ...searchResult, youtube },
        `入力テーマ：「${theme}」

上記を踏まえ、入力テーマを「効率化オタクのあらきり」チャンネル向けに改変した候補を 6〜10 件出してください。
- 視聴者（40〜60代、ITリテラシー初〜中級）の言葉で表現
- YouTube を第一指標とし、元テーマのエッセンスは残して多様化
- reason には参照した YouTube 動画タイトルを必ず 1 件以上含める

以下の JSON 配列形式のみで回答してください：
[
  {
    "title": "改変後のタイトル案",
    "hook": "最初の30秒のフック文",
    "targetPain": "視聴者の悩み",
    "reason": "参照 YouTube 動画タイトルと改変理由（2〜3行）",
    "score": "high | medium | low"
  }
]`,
      );

      const message = await client.messages.create({
        model: "claude-opus-4-5",
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });

      const text = message.content[0].type === "text" ? message.content[0].text : "[]";
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      candidates = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch (err) {
      console.warn("[adapt-theme] LLM fallback:", err);
    }

    candidates = ensureThemeCandidates(candidates, youtube, theme);

    return NextResponse.json({
      candidates,
      searchSources: {
        youtube: youtube.length > 0,
        google: searchResult.sources.google,
        x: searchResult.sources.x,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[adapt-theme]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
