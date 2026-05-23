#!/usr/bin/env npx tsx
/**
 * 市場分析 CLI — Studio と同一エンジン（runMarketAnalysis）
 *
 * Usage:
 *   npm run market-research -- --mode C --category "Gmail"
 *   npm run market-research -- --mode A --out outputs/00-discovery.md
 */
import fs from "fs/promises";
import path from "path";
import { runMarketAnalysis } from "../src/lib/market-analysis";
import type { ThemeMode, EnrichedCandidate } from "../src/lib/types";

async function loadDotEnv() {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), ".env"), "utf-8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // .env が無くても続行
  }
}

function parseArgs(argv: string[]) {
  let mode: ThemeMode = "C";
  let category: string | undefined;
  let out: string | undefined;
  let format: "json" | "markdown" = "json";

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--mode" && argv[i + 1]) mode = argv[++i] as ThemeMode;
    else if (arg === "--category" && argv[i + 1]) category = argv[++i];
    else if (arg === "--out" && argv[i + 1]) out = argv[++i];
    else if (arg === "--format" && argv[i + 1]) format = argv[++i] as "json" | "markdown";
  }

  return { mode, category, out, format };
}

function toDiscoveryMarkdown(candidates: EnrichedCandidate[], mode: ThemeMode, category?: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const lines: string[] = [
    `# テーマ調査メモ：${category ?? "全体"}`,
    "",
    "## メタ情報",
    `- 調査日：${date}`,
    `- 選択モード：${mode}`,
    `- カテゴリ：${category ?? "（なし）"}`,
    "",
    "---",
    "",
    "## テーマ候補",
    "",
  ];

  candidates.forEach((c, i) => {
    lines.push(`### 候補${i + 1}（score: ${c.score}）`);
    lines.push("");
    lines.push(`- タイトル：${c.title}`);
    lines.push(`- フック：${c.hook}`);
    lines.push(`- 視聴者の悩み：${c.targetPain}`);
    lines.push(`- 選定理由：${c.reason}`);
    lines.push(`- 差別化切り口：${c.differentiationAngle}`);
    lines.push(`- 競合密度：${c.competitionDensity}`);
    lines.push(`- 自ch関係：${c.ownChannelRelation}`);
    if (c.seriesPotential) lines.push(`- シリーズ化：${c.seriesPotential}`);
    if (c.overlapWarning) lines.push(`- 被り注意：${c.overlapWarning}`);
    if (c.referencedVideos?.length) {
      lines.push("- 参照動画：");
      for (const v of c.referencedVideos) {
        lines.push(`  - [${v.title}](${v.url}) (${v.channel})`);
      }
    }
    lines.push("");
  });

  return lines.join("\n");
}

async function main() {
  await loadDotEnv();
  const { mode, category, out, format } = parseArgs(process.argv.slice(2));

  if (!process.env.YOUTUBE_DATA_API_KEY) {
    console.error("YOUTUBE_DATA_API_KEY が未設定です");
    process.exit(1);
  }

  console.error(`[market-research] mode=${mode} category=${category ?? "(none)"}`);

  const result = await runMarketAnalysis({
    category,
    themeMode: mode,
    onProgress: (step) => console.error(`  → ${step.label}`),
  });

  const output =
    format === "markdown"
      ? toDiscoveryMarkdown(result.candidates, mode, category)
      : JSON.stringify(result, null, 2);

  if (out) {
    await fs.writeFile(path.resolve(out), output, "utf-8");
    console.error(`Wrote ${out}`);
  } else {
    console.log(output);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
