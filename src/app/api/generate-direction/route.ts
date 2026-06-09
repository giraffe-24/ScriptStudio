import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getAnthropicModel } from "@/lib/anthropic-models";
import { loadChannelConfig, buildSystemPrompt } from "@/lib/config-loader";
import { toFriendlyApiError } from "@/lib/api-error";
import type { DirectionAxis } from "@/lib/types";

export const maxDuration = 120;

type Stage = "overview" | "axes";

const AXIS_COUNT = 6;

function themeBlock(body: {
  theme: string;
  hook?: string;
  targetPain?: string;
  reason?: string;
}): string {
  return [
    `テーマ：${body.theme}`,
    body.hook ? `フック：${body.hook}` : "",
    body.targetPain ? `ターゲットの悩み：${body.targetPain}` : "",
    body.reason ? `選定理由：${body.reason}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildOverviewPrompt(body: {
  theme: string;
  hook?: string;
  targetPain?: string;
  reason?: string;
  feedback?: string;
  previousOverview?: string;
}): string {
  const revision =
    body.feedback && body.previousOverview
      ? `

【前回の大枠概要】
${body.previousOverview}

【修正指示】
${body.feedback}

上記の修正指示を反映して、大枠概要を作り直してください。`
      : "";

  return `以下のテーマで作成する YouTube 動画の「大枠概要（企画の方向性）」を作成してください。
これは企画書を作る前に、視聴者にどんな価値をどんな切り口で届けるかの方向性を確認するためのものです。

${themeBlock(body)}${revision}

ルール：
- 3〜5行程度で、テーマの捉え方・出発点となる身近な問い・到達点（視聴者が得られるもの）が分かるように書く
- 専門用語に逃げず、視聴者の言葉で書く
- 箇条書きではなく、つながった文章で書く

以下の JSON 形式のみで出力してください（前後に説明文を付けない）：
{
  "overview": "大枠概要の本文（改行を含んでよい）"
}`;
}

function buildAxesPrompt(body: {
  theme: string;
  hook?: string;
  targetPain?: string;
  reason?: string;
  overview: string;
  feedback?: string;
  previousAxes?: DirectionAxis[];
}): string {
  const revision =
    body.feedback && body.previousAxes?.length
      ? `

【前回の設計思想の${AXIS_COUNT}本柱】
${body.previousAxes
  .map((a, i) => `${i + 1}. ${a.title}（${a.subtitle}）：${a.description}`)
  .join("\n")}

【修正指示】
${body.feedback}

上記の修正指示を反映して、${AXIS_COUNT}本柱を作り直してください。`
      : "";

  return `以下のテーマと承認済みの大枠概要をもとに、この企画を貫く「設計思想の${AXIS_COUNT}本柱」を作成してください。
各柱は、企画書・構成・台本のすべての判断基準となる軸です。

${themeBlock(body)}

【承認済みの大枠概要】
${body.overview}${revision}

ルール：
- 必ずちょうど ${AXIS_COUNT} 個の軸を作る
- title は日本語の短いフレーズ（例：「安全な操作から危険な操作へ」）
- subtitle は title を表す英語の短いラベル（例：「Safety-First Progression」）
- description は、その軸が何を意味し、なぜ視聴者にとって重要かを2〜3行で説明する
- 6本が互いに重複せず、企画全体を異なる角度から支えるようにする

以下の JSON 形式のみで出力してください（前後に説明文を付けない）：
{
  "axes": [
    { "title": "日本語タイトル", "subtitle": "English Label", "description": "説明" }
  ]
}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const stage: Stage = body.stage === "axes" ? "axes" : "overview";

    if (!body.theme) {
      return NextResponse.json({ error: "theme required" }, { status: 400 });
    }
    if (stage === "axes" && !body.overview) {
      return NextResponse.json({ error: "overview required" }, { status: 400 });
    }

    const config = await loadChannelConfig();
    const systemPrompt = buildSystemPrompt(config);
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const userPrompt =
      stage === "overview" ? buildOverviewPrompt(body) : buildAxesPrompt(body);

    const message = await client.messages.create({
      model: getAnthropicModel("planning"),
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "JSON parse failed" }, { status: 500 });
    }
    const parsed = JSON.parse(jsonMatch[0]);

    if (stage === "overview") {
      const overview = typeof parsed.overview === "string" ? parsed.overview.trim() : "";
      if (!overview) {
        return NextResponse.json({ error: "overview generation failed" }, { status: 500 });
      }
      return NextResponse.json({ overview });
    }

    const axes: DirectionAxis[] = Array.isArray(parsed.axes)
      ? parsed.axes
          .filter((a: unknown): a is Record<string, unknown> => !!a && typeof a === "object")
          .map((a: Record<string, unknown>) => ({
            title: String(a.title ?? "").trim(),
            subtitle: String(a.subtitle ?? "").trim(),
            description: String(a.description ?? "").trim(),
          }))
          .filter((a: DirectionAxis) => a.title || a.description)
      : [];

    if (axes.length === 0) {
      return NextResponse.json({ error: "axes generation failed" }, { status: 500 });
    }
    return NextResponse.json({ axes });
  } catch (err) {
    console.error("[generate-direction]", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: toFriendlyApiError(err) }, { status: 500 });
  }
}
