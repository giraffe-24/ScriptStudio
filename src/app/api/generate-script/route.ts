import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { loadChannelConfig, buildSystemPrompt } from "@/lib/config-loader";

export const maxDuration = 300;

type OutlineItem = { section: string; content: string };
type PlanPayload = {
  episodeTitle: string;
  targetViewer?: string;
  pain?: string;
  promise?: string;
  keyPoints?: string[];
  outline?: OutlineItem[];
};

async function generateSectionBody(
  client: Anthropic,
  systemPrompt: string,
  plan: PlanPayload,
  index: number,
  existingBody: string,
  neighborBodies: { prev?: string; next?: string },
): Promise<string> {
  const outline = plan.outline ?? [];
  const item = outline[index];
  if (!item) throw new Error(`invalid section index: ${index}`);

  const keyPointsText = (plan.keyPoints ?? []).map((p) => `・${p}`).join("\n");
  const prompt = `YouTube動画のトークスクリプトの「1セクションだけ」を書いてください。見出し行（##）は出力しないでください。本文のみ。

=== 企画書 ===
タイトル：${plan.episodeTitle}
想定視聴者：${plan.targetViewer ?? ""}
視聴者の悩み：${plan.pain ?? ""}
動画の約束：${plan.promise ?? ""}
${keyPointsText ? `\nキーポイント：\n${keyPointsText}` : ""}

=== 今回書くセクション ===
見出し：${item.section}
詳細：${item.content}

=== 執筆ルール ===
1. 詳細欄の指示に沿って、このセクションの本文だけを書く
2. 他セクションの内容は書かない
3. 視聴者は40〜60代向けに平易な語り口
4. ### や # 見出しは禁止
5. 既存本文がある場合は、変更が必要な部分だけ直し、不要な全面書き換えは避ける

=== 前後のセクション（トーン参考・写さない） ===
${neighborBodies.prev ? `前：${neighborBodies.prev.slice(0, 400)}` : "（なし）"}
${neighborBodies.next ? `次：${neighborBodies.next.slice(0, 400)}` : "（なし）"}

=== 既存のこのセクション本文（参考） ===
${existingBody.trim() || "（新規セクション）"}

本文のみ出力：`;

  const message = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 1800,
    system: systemPrompt,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  return text.replace(/^##\s+.*\n?/m, "").trim();
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY?.trim()) {
      return NextResponse.json(
        {
          error:
            "ANTHROPIC_API_KEY が未設定です。Vercel の Environment Variables を確認してください。",
        },
        { status: 503 },
      );
    }

    const body = await req.json();
    const {
      plan,
      streaming,
      reconcile,
      existingScript,
      mode,
      sectionIndices,
      sectionBodies,
    } = body as {
      plan: PlanPayload;
      streaming?: boolean;
      reconcile?: boolean;
      existingScript?: string;
      mode?: "full" | "sections";
      sectionIndices?: number[];
      sectionBodies?: Record<string, string>;
    };

    if (!plan) return NextResponse.json({ error: "plan required" }, { status: 400 });

    const config = await loadChannelConfig();
    const systemPrompt = buildSystemPrompt(config);
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    if (mode === "sections") {
      const indices = Array.isArray(sectionIndices)
        ? sectionIndices.filter((n) => Number.isInteger(n) && n >= 0)
        : [];
      if (!indices.length) {
        return NextResponse.json({ error: "sectionIndices required" }, { status: 400 });
      }

      const bodies = sectionBodies ?? {};
      const sections: Record<number, string> = {};

      for (const index of indices) {
        const existingBody = bodies[String(index)] ?? "";
        sections[index] = await generateSectionBody(client, systemPrompt, plan, index, existingBody, {
          prev: bodies[String(index - 1)],
          next: bodies[String(index + 1)],
        });
      }

      return NextResponse.json({ sections });
    }

    const outline = plan.outline ?? [];
    const outlineText = outline
      .map(
        (s: OutlineItem, i: number) =>
          `${i + 1}. 見出し「${s.section}」\n   詳細：${s.content}`,
      )
      .join("\n");

    const outlineTemplate = outline
      .map(
        (s: OutlineItem) => `## ${s.section}\n（ここに「${s.content}」に沿った本文を書く）`,
      )
      .join("\n\n");

    const keyPointsText = (plan.keyPoints ?? []).map((p: string) => `・${p}`).join("\n");

    const reconcileBlock = reconcile
      ? `
=== 重要：構成更新に伴う再生成 ===
企画書の構成が更新され、既存台本と一致しなくなっています。
以下の既存台本を参考にしつつ、企画書の最新構成に完全準拠した台本を書き直してください。

手順：
1. ## 見出しは企画書の目次案 ${outline.length} 件と一字一句一致させる（既存台本の見出しは使わない）
2. 企画書にない「本題」「まとめ」「付録」「注意点」等の見出しは削除し、構成リストの見出しのみにする
3. 各セクション本文は詳細欄の指示に沿って執筆（既存台本から流用する場合も詳細に合致させる）
4. ### 見出しは使わず ## のみ

=== 既存台本（参考・見出し構造は無視すること） ===
${existingScript ?? "（なし）"}

`
      : "";

    const prompt = `${reconcileBlock}以下の企画書に基づいて、YouTube動画のトークスクリプトを書いてください。

=== 企画書 ===
タイトル：${plan.episodeTitle}
想定視聴者：${plan.targetViewer}
視聴者の悩み：${plan.pain}
動画の約束：${plan.promise}
${keyPointsText ? `\nキーポイント：\n${keyPointsText}` : ""}

=== 構成（目次案・詳細） ===
${outlineText || "（構成なし）"}

=== 構成遵守ルール（最重要・必ず守る） ===
1. 台本の ## 見出しは、上記「構成」の目次案を一字一句そのまま使う（${outline.length} セクション、順番固定）
2. 企画書にない見出しを追加しない（「本題」「まとめ」「付録」「注意点」「メタ情報」等の独自見出し禁止）
3. ### や # による追加見出しは禁止。見出しは ## のみ、かつ構成リストのものだけ
4. 各セクションの本文は、対応する「詳細」欄の指示に沿って執筆する。詳細に書かれていない別トピックに逸脱しない
5. セクションの統合・分割・省略は禁止
6. 出力前に ## 見出しが構成リストと完全一致しているか自己チェックしてから出力する

=== 出力テンプレート（この構造で書く） ===
${outlineTemplate || "## 導入\n（本文）"}

=== 執筆ルール ===
1. 視聴者は40〜60代、ITリテラシー初〜中級を想定して親しみやすく
2. 冒頭30秒で視聴者の悩みを直撃するフックを入れる（最初のセクション「${outline[0]?.section ?? "導入"}」内で）
3. 「実際にやってみます」など一緒に操作できるよう誘導する
4. 各セクションの冒頭は「さて、」「次に、」など自然なつなぎ言葉で
5. 難しい用語は必ず平易な言葉で言い換える
6. 最終セクションの末尾で「チャンネル登録」「高評価」「コメント」を自然に促す
7. 目標文字数：4,000〜6,000文字

=== 見出しの形式 ===
- 各セクション直前に「## 見出し名」を1行だけ入れる
- 見出し名に【】（二重山括弧）を使わない
- 「【本題】」「【導入】」「【まとめ】」などの接頭辞は付けない

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
          try {
            for await (const chunk of stream) {
              if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
                controller.enqueue(encoder.encode(chunk.delta.text));
              }
            }
            controller.close();
          } catch (err) {
            controller.error(err);
          }
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
  } catch (err) {
    console.error("generate-script error:", err);
    const message =
      err instanceof Error ? err.message : "台本生成中にサーバーエラーが発生しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
