import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getAnthropicModel } from "@/lib/anthropic-models";
import { loadChannelConfig, buildSystemPrompt } from "@/lib/config-loader";
import { sanitizePlanOutline } from "@/lib/plan-outline";

export async function POST(req: NextRequest) {
  try {
    const { script, title } = await req.json();
    if (!script) return NextResponse.json({ error: "script required" }, { status: 400 });

    const config = await loadChannelConfig();
    const systemPrompt = buildSystemPrompt(config);
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: getAnthropicModel("inferPlan"),
      max_tokens: 2000,
      system: systemPrompt,
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
    { "section": "視聴者向けの内容見出し（## 見出しから。構成ラベル禁止）", "content": "内容の要約（1行）" }
  ],
  "competitorAnalysis": "このテーマの競合・市場感（1〜2行）",
  "estimatedLength": "推定尺（台本の長さから）"
}

outline.section のルール（config/planning.md 厳守）：
- 台本 ## 見出しから抽出するが、「本題」「まとめ」「導入」等の構成ラベルは除去し内容見出しだけ残す
- 「本題 - 〇〇」は「〇〇」だけにする
- 時間・タイムコード（0:00、5分など）は入れない。尺は estimatedLength のみ`,
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
