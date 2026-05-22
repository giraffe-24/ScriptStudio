import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

interface DiffItem {
  paraNum: number;
  sectionName: string;
  oldText: string | null;
  newText: string;
}

interface RequestBody {
  diffs: DiffItem[];
  episodeTitle: string;
}

export async function POST(req: NextRequest) {
  const body: RequestBody = await req.json();
  const { diffs, episodeTitle } = body;

  if (!diffs || diffs.length === 0) {
    return NextResponse.json({ summary: "変更なし" });
  }

  const diffText = diffs
    .map((d) => {
      if (!d.oldText) return `[§${d.sectionName} ¶${d.paraNum}] 新規追加: 「${d.newText}」`;
      return `[§${d.sectionName} ¶${d.paraNum}] 変更: 「${d.oldText}」→「${d.newText}」`;
    })
    .join("\n");

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: `以下はYouTube台本「${episodeTitle}」の変更内容です。1〜2文の日本語で自然に要約してください。箇条書きは使わず、文体は「〜した。」のようなです・ます調ではない体言止めや連体形を使ってください。\n\n${diffText}`,
      },
    ],
  });

  const summary =
    message.content[0].type === "text" ? message.content[0].text : "要約を生成できませんでした";

  return NextResponse.json({ summary });
}
