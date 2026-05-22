import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { loadChannelConfig, buildSystemPrompt } from "@/lib/config-loader";
import type { ThemeCandidate } from "@/lib/types";
import { buildThemeSearchUserPrompt, runThemeSearch } from "@/lib/theme-search";

export async function POST(req: NextRequest) {
  try {
    const { category } = await req.json();

    if (!process.env.YOUTUBE_DATA_API_KEY) {
      return NextResponse.json(
        {
          error:
            "YOUTUBE_DATA_API_KEY が未設定です。テーマ選定には YouTube 検索が必要です（.env を確認してください）。",
        },
        { status: 503 },
      );
    }

    const searchQuery = category
      ? `${category} スマホ 便利 簡単 設定`
      : "スマホ 便利 使い方 設定 無料 Google 効率化";

    const searchResult = await runThemeSearch(searchQuery);

    if (searchResult.youtube.length === 0) {
      return NextResponse.json(
        {
          error: "YouTube 検索結果が 0 件でした。カテゴリを変えて再検索してください。",
          candidates: [],
          searchSources: searchResult.sources,
        },
        { status: 422 },
      );
    }

    const config = await loadChannelConfig();
    const systemPrompt = buildSystemPrompt(config);
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const userPrompt = buildThemeSearchUserPrompt(
      searchQuery,
      searchResult,
      `あなたのチャンネル「効率化オタクのあらきり」の視聴者（40〜60代、ITリテラシー初〜中級、Google系・無料ツール好き）に刺さるテーマ候補を 6〜10 件提案してください。
各候補は YouTube リストの動画タイトル・切り口から直接連想できるものを優先し、リストにない話題は出さないこと。

以下の JSON 配列形式のみで回答してください：
[
  {
    "title": "動画タイトル案",
    "hook": "最初の30秒のフック文",
    "targetPain": "視聴者の悩み（1〜2行）",
    "reason": "参照した YouTube 動画タイトルを必ず含め、なぜ刺さるか（2〜3行。Google/X は補足可）",
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

    let candidates: ThemeCandidate[] = [];
    try {
      const text = message.content[0].type === "text" ? message.content[0].text : "[]";
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      candidates = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      candidates = [];
    }

    return NextResponse.json({
      candidates,
      searchSources: searchResult.sources,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[market-research]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
