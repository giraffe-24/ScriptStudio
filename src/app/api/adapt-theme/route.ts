import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { loadChannelConfig, buildSystemPrompt } from "@/lib/config-loader";
import type { ThemeCandidate } from "@/lib/types";

export async function POST(req: NextRequest) {
  const { theme } = await req.json();
  if (!theme) return NextResponse.json({ error: "theme required" }, { status: 400 });

  const config = await loadChannelConfig();
  const systemPrompt = buildSystemPrompt(config);
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 2048,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `以下のテーマを「効率化オタクのあらきり」チャンネルに最適化した3パターンに改変してください。

入力テーマ：「${theme}」

改変にあたり以下を必ず考慮してください：
- 視聴者（40〜60代、ITリテラシー初〜中級）の言葉で表現する
- チャンネルの品質基準（具体的・再現可能・驚き要素）を満たす
- 元テーマのエッセンスは残しつつ、より刺さる切り口にする

以下のJSON配列形式のみで回答してください：
[
  {
    "title": "改変後のタイトル案",
    "hook": "最初の30秒で言うフック文",
    "targetPain": "視聴者のどの悩み・欲求に当たるか",
    "reason": "この切り口が刺さる理由（2〜3行）",
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

  return NextResponse.json({ candidates });
}
