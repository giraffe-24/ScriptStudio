import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { loadChannelConfig, buildSystemPrompt } from "@/lib/config-loader";

export async function POST(req: NextRequest) {
  const { theme, hook, targetPain, reason } = await req.json();
  if (!theme) return NextResponse.json({ error: "theme required" }, { status: 400 });

  const config = await loadChannelConfig();
  const systemPrompt = buildSystemPrompt(config);
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 3000,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `以下のテーマで YouTube 動画の企画書を作成してください。

テーマ：${theme}
${hook ? `フック：${hook}` : ""}
${targetPain ? `ターゲットの悩み：${targetPain}` : ""}
${reason ? `選定理由：${reason}` : ""}

以下のJSON形式で企画書を作成してください：
{
  "episodeTitle": "最終的な動画タイトル（30文字以内、視聴者の言葉で）",
  "targetViewer": "想定視聴者プロフィール（具体的な人物像・状況）",
  "pain": "視聴者が抱える具体的な悩み・不安・欲求",
  "promise": "動画を最後まで見ると視聴者が得られる価値",
  "keyPoints": [
    "コンテンツの核となるポイント1",
    "コンテンツの核となるポイント2",
    "コンテンツの核となるポイント3"
  ],
  "outline": [
    { "section": "オープニング（0:00〜）", "content": "内容の概要" },
    { "section": "本題①（x:xx〜）", "content": "内容の概要" },
    { "section": "本題②（x:xx〜）", "content": "内容の概要" },
    { "section": "まとめ（x:xx〜）", "content": "内容の概要" }
  ],
  "competitorAnalysis": "競合動画との差別化ポイント（2〜3行）",
  "estimatedLength": "想定動画尺（例：8〜12分）"
}`,
      },
    ],
  });

  try {
    const text = message.content[0].type === "text" ? message.content[0].text : "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const plan = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    return NextResponse.json({ plan });
  } catch {
    return NextResponse.json({ error: "parse error" }, { status: 500 });
  }
}
