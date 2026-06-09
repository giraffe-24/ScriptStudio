import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getAnthropicModel } from "@/lib/anthropic-models";
import { loadChannelConfig, buildSystemPrompt } from "@/lib/config-loader";
import { sanitizePlanOutline } from "@/lib/plan-outline";
import { toFriendlyApiError } from "@/lib/api-error";

export async function POST(req: NextRequest) {
  try {
    const { theme, hook, targetPain, reason, direction } = await req.json();
    if (!theme) return NextResponse.json({ error: "theme required" }, { status: 400 });

    const config = await loadChannelConfig();
    const systemPrompt = buildSystemPrompt(config);
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // 方向性確認フェーズで承認された大枠概要・設計思想の軸を前提として渡す
    const directionBlock =
      direction && (direction.overview || direction.axes?.length)
        ? `\n\n【承認済みの方向性（必ずこの方向で企画書を作成すること）】
${direction.overview ? `大枠概要：\n${direction.overview}\n` : ""}${
            Array.isArray(direction.axes) && direction.axes.length
              ? `設計思想の柱：\n${direction.axes
                  .map(
                    (a: { title?: string; subtitle?: string; description?: string }, i: number) =>
                      `${i + 1}. ${a.title ?? ""}（${a.subtitle ?? ""}）：${a.description ?? ""}`,
                  )
                  .join("\n")}`
              : ""
          }

【方向性の反映ルール（厳守）】
- 「コンテンツの核（keyPoints）」は、上記の設計思想の6本柱の見出しをそのまま反映する（言い換えず、6つすべてを順番どおり使う）
- 「想定視聴者（targetViewer）」「視聴者の悩み（pain）」「動画で提供する価値（promise）」は、上記の大枠概要の内容を3つの観点に振り分けて記述する`
        : "";

    const message = await client.messages.create({
      model: getAnthropicModel("planning"),
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
    { "section": "なぜ今この設定が必要か", "content": "視聴者の悩みと解決の全体像" },
    { "section": "Geminiに食事ログを送る習慣づくり", "content": "写真・メモのテンプレと声かけ例" },
    { "section": "3か月続けたときの振り返り方", "content": "体重・体調・続けやすさのチェック" }
  ],
  "competitorAnalysis": "競合動画との差別化ポイント（2〜3行）",
  "estimatedLength": "想定動画尺（例：8〜12分）"
}

目次案（outline.section）のルール（config/planning.md 厳守）：
- 視聴者にそのまま見せる内容見出しだけを書く（構成ラベル禁止）
- 「本題」「まとめ」「導入」「本題 - 〇〇」「【本題】」等は絶対に使わない
- 時間・尺・タイムコードを入れない（「0:00」「5分」「（3:00〜）」等は禁止）
- 尺の目安は estimatedLength にのみ書く
- section には章のトピック名だけ。手順の詳細は content 欄へ${directionBlock}`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const plan = jsonMatch ? sanitizePlanOutline(JSON.parse(jsonMatch[0])) : {};
    return NextResponse.json({ plan });

  } catch (err) {
    console.error("[generate-plan]", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: toFriendlyApiError(err) }, { status: 500 });
  }
}
