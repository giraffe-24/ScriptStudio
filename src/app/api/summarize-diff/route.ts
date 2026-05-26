import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getAnthropicModel } from "@/lib/anthropic-models";
import { computeScriptDiff } from "@/lib/script-diff";

function buildFallbackSummary(
  episodeTitle: string,
  stats: { added: number; removed: number },
): string {
  if (stats.added > 0 && stats.removed > 0) {
    return `${episodeTitle} の台本を更新しました。表現と内容を見直しています。`;
  }
  if (stats.added > 0) {
    return `${episodeTitle} の台本に追記を反映しました。`;
  }
  if (stats.removed > 0) {
    return `${episodeTitle} の台本を整理して更新しました。`;
  }
  return "台本を更新しました。";
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY が未設定です" }, { status: 503 });
  }

  let body: {
    episodeTitle?: string;
    oldText?: string;
    newText?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const episodeTitle = body.episodeTitle?.trim() ?? "台本";
  const oldText = body.oldText ?? "";
  const newText = body.newText ?? "";
  const diff = computeScriptDiff(oldText, newText);

  if (diff.stats.isFirstRecord) {
    return NextResponse.json({
      summary: `初稿を記録。${episodeTitle} の台本を保存しました。`,
      stats: diff.stats,
    });
  }

  if (diff.stats.added === 0 && diff.stats.removed === 0) {
    return NextResponse.json({
      summary: "前回の記録から変更はありません。",
      stats: diff.stats,
    });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const model = getAnthropicModel("summary");

  const userPrompt = `YouTube トーク台本の変更内容を、日本語で1〜2文に要約してください。箇条書きや Markdown は使わないでください。

エピソード: ${episodeTitle}
変更統計: 追加 ${diff.stats.added} 行 / 削除 ${diff.stats.removed} 行

差分（抜粋）:
${diff.diffExcerpt || "（差分テキストなし）"}`;

  try {
    const message = await client.messages.create({
      model,
      max_tokens: 256,
      messages: [{ role: "user", content: userPrompt }],
    });

    const block = message.content.find((b) => b.type === "text");
    const summary = block?.type === "text" ? block.text.trim() : "";

    return NextResponse.json({
      summary: summary || "台本を更新しました。",
      stats: diff.stats,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      summary: buildFallbackSummary(episodeTitle, diff.stats),
      stats: diff.stats,
      warning: message,
    });
  }
}
