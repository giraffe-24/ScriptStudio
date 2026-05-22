import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { sanitizePlanOutline } from "@/lib/plan-outline";

export async function POST(req: NextRequest) {
  try {
    const { script, title } = await req.json();
    if (!script) return NextResponse.json({ error: "script required" }, { status: 400 });

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `以下のYouTube台本を読んで、企画書情報をJSON形式で抽出・推定してください。

動画タイトル（参考）：${title ?? "不明"}

---台本---
${script.slice(0, 6000)}
---ここまで---

以下のJSON形式のみで回答してください（説明文不要）：
{
  "episodeTitle": "動画タイトル（台本から正確に抽出）",
  "targetViewer": "ターゲット視聴者（年代・属性・状況を1〜2行で）",
  "pain": "視聴者の悩み・課題（1〜2行）",
  "promise": "この動画で視聴者が得られるもの（1〜2行）",
  "keyPoints": ["キーポイント1", "キーポイント2", "キーポイント3"],
  "outline": [
    { "section": "セクション名（## 見出しから。時間表記は除く）", "content": "内容の要約（1行）" }
  ],
  "competitorAnalysis": "このテーマの競合・市場感（1〜2行）",
  "estimatedLength": "推定尺（台本の長さから）"
}

outline.section には時間・タイムコード（0:00、5分など）を入れないこと。尺は estimatedLength のみ。`,
        },
      ],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "JSON parse failed" }, { status: 500 });
    const plan = sanitizePlanOutline(JSON.parse(jsonMatch[0]));
    return NextResponse.json({ plan });
  } catch (e) {
    console.error("infer-plan error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
