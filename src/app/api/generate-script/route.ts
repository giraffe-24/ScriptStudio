import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { loadChannelConfig, buildSystemPrompt } from "@/lib/config-loader";

export async function POST(req: NextRequest) {
  const { plan, streaming } = await req.json();
  if (!plan) return NextResponse.json({ error: "plan required" }, { status: 400 });

  const config = await loadChannelConfig();
  const systemPrompt = buildSystemPrompt(config);
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `以下の企画書に基づいて、YouTube動画のトークスクリプトを書いてください。

=== 企画書 ===
タイトル：${plan.episodeTitle}
YouTubeゴール：${plan.youtubeGoal}
想定視聴者：${plan.targetViewer}
視聴者の悩み：${plan.pain}
動画の約束：${plan.promise}

構成：
${(plan.outline ?? []).map((s: { section: string; content: string }) => `・${s.section}：${s.content}`).join("\n")}

=== 執筆ルール ===
1. 視聴者は40〜60代、ITリテラシー初〜中級を想定して親しみやすく
2. 冒頭30秒で視聴者の悩みを直撃するフックを入れる
3. 「実際にやってみます」など一緒に操作できるよう誘導する
4. 各セクションの冒頭は「さて、」「次に、」など自然なつなぎ言葉で
5. 難しい用語は必ず平易な言葉で言い換える
6. エンディングは「チャンネル登録」「高評価」「コメント」の3点を自然に促す
7. 目標文字数：4,000〜6,000文字

=== 見出しルール（必ず守ること） ===
- 各セクションの直前に「## 見出し名」を1行で入れる
- 見出し名は【】（二重山括弧）を絶対に使わない
- 「【本題】」「【導入】」「【まとめ】」「【今日のゴール】」「【定型締め】」などの接頭辞は一切禁止
- 見出し名は内容を端的に表す自然な日本語にする
  例：「## 導入」「## Windowsで付箋を書く」「## Androidで確認する」「## まとめ」
- 「## まとめ」の後にさらに「## 定型締め」などの見出しを追加しない（定型締めはまとめに統合）

台本のみを書いてください（タイトル行・読み込みメモ・メタ説明は一切不要）：`;

  if (streaming) {
    const stream = client.messages.stream({
      model: "claude-opus-4-5",
      max_tokens: 6000,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
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
  }

  const message = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 6000,
    system: systemPrompt,
    messages: [{ role: "user", content: prompt }],
  });

  const script = message.content[0].type === "text" ? message.content[0].text : "";
  return NextResponse.json({ script });
}
