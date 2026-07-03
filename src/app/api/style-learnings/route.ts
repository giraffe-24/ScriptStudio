import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getAnthropicModel } from "@/lib/anthropic-models";
import { computeScriptDiff } from "@/lib/script-diff";
import { toFriendlyApiError } from "@/lib/api-error";
import { isReviewerRequest } from "@/lib/reviewer-access";
import { getSessionUsernameFromRequest } from "@/lib/studio-session";
import { getStudioUserName } from "@/lib/studio-user";
import {
  readCurrentStyleLearnings,
  saveStyleLearnings,
} from "@/lib/style-learnings";

/**
 * あらきりらしさメモ（推敲差分からの文体学習）。
 * POST action="propose": 元原稿と確定稿の差分を AI が分析し、現行メモに統合した案を返す（保存しない）。
 * POST action="commit": 利用者が確認・修正したメモを保存する。
 * 変更内容は重要なため、必ず propose → UI で確認・修正 → commit の2段階を踏む。
 * 保存されたメモは buildSystemPrompt 経由で執筆・部分修正のプロンプトに自動注入される。
 */

const SUMMARY_MARKER = "<<<SUMMARY>>>";
const MEMO_MARKER = "<<<MEMO>>>";

function buildLearnPrompt(input: {
  currentMemo: string;
  episodeTitle: string;
  stats: { added: number; removed: number };
  diffExcerpt: string;
}): string {
  return `あなたは YouTube チャンネル「効率化オタクのあらきり」の文体キャリブレーション担当です。
AI が書いた台本（元原稿）と、本人が手直しした確定稿の差分を分析し、
今後 AI が台本を書く・修正するときに参照する「あらきりらしさメモ」を更新してください。

## 現在のメモ
${input.currentMemo || "（まだありません。今回の差分から新規に作成してください）"}

## 今回の差分（元原稿 → 確定稿）
エピソード: ${input.episodeTitle}
変更統計: 追加 ${input.stats.added} 行 / 削除 ${input.stats.removed} 行

${input.diffExcerpt || "（差分テキストなし）"}

## 更新ルール
- 差分から「本人がどう直したか」の傾向を抽出し、既存メモに統合する。重複はまとめ、一般化する
- エピソード固有の内容（固有名詞・話題そのもの）は書かない。言い回し・構成・語彙・トーンの規則だけを書く
- メモは Markdown。「言い回し」「構成・リズム」「語彙」「トーン」「NG（避ける表現）」の見出しごとに箇条書き
- 全体で 400 行以内。1回の差分だけからは断定せず、確信の持てる傾向だけを残す
- 既存メモと矛盾する傾向が出たら、新しい傾向を優先しつつ慎重に書き換える

## 出力形式（この2つのマーカー行を必ず含める）
${SUMMARY_MARKER}
（今回の差分から学んだことの要約。日本語1〜2文）
${MEMO_MARKER}
（更新後のメモ全文）`;
}

function parseLearnResponse(
  text: string,
): { summary: string; memo: string } | null {
  const memoIdx = text.indexOf(MEMO_MARKER);
  if (memoIdx === -1) return null;
  const memo = text.slice(memoIdx + MEMO_MARKER.length).trim();
  if (!memo) return null;
  const head = text.slice(0, memoIdx);
  const summaryIdx = head.indexOf(SUMMARY_MARKER);
  const summary = (
    summaryIdx === -1 ? head : head.slice(summaryIdx + SUMMARY_MARKER.length)
  ).trim();
  return { summary: summary || "文体メモを更新しました。", memo };
}

export async function GET() {
  const { content, updatedAt } = await readCurrentStyleLearnings();
  return NextResponse.json({ learnings: content, updatedAt });
}

export async function POST(req: NextRequest) {
  if (await isReviewerRequest(req)) {
    return NextResponse.json(
      { error: "閲覧専用アカウントでは推敲を実行できません" },
      { status: 403 },
    );
  }

  let body: {
    action?: "propose" | "commit";
    originalText?: string;
    finalText?: string;
    episodeTitle?: string;
    content?: string;
    summary?: string;
    diffStats?: { added: number; removed: number; changed: number; isFirstRecord: boolean } | null;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  // 確定：UI で確認・修正済みのメモをそのまま保存する（AI は呼ばない）
  if (body.action === "commit") {
    const content = body.content?.trim() ?? "";
    if (!content) {
      return NextResponse.json({ error: "メモの内容が空です" }, { status: 400 });
    }
    try {
      const sessionUser = await getSessionUsernameFromRequest(req);
      const authorName = sessionUser?.trim() || getStudioUserName();
      const summary = body.summary?.trim() || "文体メモを更新しました。";
      const { updatedAt } = await saveStyleLearnings({
        content,
        summary,
        authorName,
        episodeTitle: body.episodeTitle?.trim() || null,
        diffStats: body.diffStats ?? null,
      });
      return NextResponse.json({ summary, learnings: content, updatedAt });
    } catch (err) {
      console.error("[style-learnings] メモの保存に失敗:", err);
      return NextResponse.json({ error: toFriendlyApiError(err) }, { status: 500 });
    }
  }

  // 提案（既定）：差分を AI が分析してメモ案を返す。保存は commit まで行わない
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY が未設定です" }, { status: 503 });
  }

  const originalText = body.originalText ?? "";
  const finalText = body.finalText ?? "";
  if (!originalText.trim() || !finalText.trim()) {
    return NextResponse.json(
      { error: "元原稿と確定稿の両方が必要です" },
      { status: 400 },
    );
  }

  const diff = computeScriptDiff(originalText, finalText);
  if (diff.stats.added === 0 && diff.stats.removed === 0) {
    return NextResponse.json(
      { error: "元原稿と確定稿に差分がありません" },
      { status: 400 },
    );
  }

  const episodeTitle = body.episodeTitle?.trim() || "（タイトル未設定）";
  const { content: currentMemo } = await readCurrentStyleLearnings();
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const model = getAnthropicModel("calibration");

  try {
    const message = await client.messages.create({
      model,
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: buildLearnPrompt({
            currentMemo,
            episodeTitle,
            stats: diff.stats,
            diffExcerpt: diff.diffExcerpt,
          }),
        },
      ],
    });

    const block = message.content.find((b) => b.type === "text");
    const text = block?.type === "text" ? block.text : "";
    const parsed = parseLearnResponse(text);
    if (!parsed) {
      console.error(`[style-learnings] AI応答にマーカーがありません (model=${model})`);
      return NextResponse.json(
        { error: "AI の応答を解釈できませんでした。もう一度お試しください。" },
        { status: 502 },
      );
    }

    return NextResponse.json({
      summary: parsed.summary,
      learnings: parsed.memo,
    });
  } catch (err) {
    console.error(`[style-learnings] 推敲の分析に失敗 (model=${model}):`, err);
    return NextResponse.json({ error: toFriendlyApiError(err) }, { status: 500 });
  }
}
