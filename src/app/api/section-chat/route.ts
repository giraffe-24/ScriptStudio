import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getAnthropicModel } from "@/lib/anthropic-models";
import { loadChannelConfig, buildSystemPrompt } from "@/lib/config-loader";
import type { ChatMessage } from "@/lib/types";
import { toFriendlyApiError } from "@/lib/api-error";

export async function POST(req: NextRequest) {
  const { theme, sectionLabel, sectionContent, planContext, history, userMessage } = await req.json();

  const config = await loadChannelConfig();
  const systemPrompt = buildSystemPrompt(config);
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // コンテキストは毎リクエスト最新値で組み直す（企画書の編集を常に反映させるため、
  // 会話履歴側にはスナップショットを残さない）。担当は sectionLabel のセクションに限定する。
  const contextMessage = `現在の企画テーマ：${theme}
${planContext ? `企画書全体の現在の内容（参考情報）：\n${planContext}\n\n` : ""}あなたが担当するセクション：${sectionLabel}
担当セクションの現在の内容：
${sectionContent}

あなたは「${sectionLabel}」セクション専属の相談相手です。企画書全体は文脈把握のための参考とし、提案・改善案は担当セクションに絞って行ってください。改善案・深掘り・別角度での提案などを行ってください。`;

  const messages: Array<{ role: "user" | "assistant"; content: string }> = [
    { role: "user", content: contextMessage },
    { role: "assistant", content: "了解しました。このセクションについて詳しく議論しましょう。どのような観点で深掘りしたいですか？" },
    ...(history as ChatMessage[]).map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: userMessage },
  ];

  try {
    const stream = client.messages.stream({
      model: getAnthropicModel("sectionChat"),
      max_tokens: 1500,
      system: systemPrompt,
      messages,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.error("[section-chat]", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: toFriendlyApiError(error) }, { status: 500 });
  }
}
