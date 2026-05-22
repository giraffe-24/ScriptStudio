import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { loadChannelConfig, buildSystemPrompt } from "@/lib/config-loader";
import { sanitizePlanOutline } from "@/lib/plan-outline";

export async function POST(req: NextRequest) {
  try {
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
    { "section": "導入", "content": "内容の概要" },
    { "section": "本題 - 〇〇の設定", "content": "内容の概要" },
    { "section": "本題 - 〇〇の確認", "content": "内容の概要" },
    { "section": "まとめ", "content": "内容の概要" }
  ],
  "competitorAnalysis": "競合動画との差別化ポイント（2〜3行）",
  "estimatedLength": "想定動画尺（例：8〜12分）"
}

目次案（outline.section）のルール：
- 時間・尺・タイムコードを入れない（「0:00」「5分」「（3:00〜）」等は禁止）
- 尺の目安は estimatedLength にのみ書く
- section には内容を表す見出し名だけを書く`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const plan = jsonMatch ? sanitizePlanOutline(JSON.parse(jsonMatch[0])) : {};
    return NextResponse.json({ plan });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[generate-plan]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
