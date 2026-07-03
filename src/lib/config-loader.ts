import fs from "fs/promises";
import path from "path";
import type { ChannelConfig } from "./types";
import { readCurrentStyleLearnings } from "./style-learnings";

const ROOT = process.cwd();
const CONFIG_DIR = path.join(ROOT, "config");

async function readConfigFile(name: string): Promise<string> {
  return fs.readFile(path.join(CONFIG_DIR, name), "utf-8").catch(() => "");
}

export async function loadChannelConfig(): Promise<ChannelConfig> {
  const [brand, audience, quality, planning, themeSelection, marketAnalysisRubric, voiceLearnings] =
    await Promise.all([
    readConfigFile("brand.md"),
    readConfigFile("audience.md"),
    readConfigFile("quality.md"),
    readConfigFile("planning.md"),
    readConfigFile("theme-selection.md"),
    readConfigFile("market-analysis-rubric.md"),
    readCurrentStyleLearnings().then((l) => l.content),
  ]);
  return { brand, audience, quality, planning, themeSelection, marketAnalysisRubric, voiceLearnings };
}

export function buildSystemPrompt(config: ChannelConfig): string {
  const voiceLearnings = config.voiceLearnings?.trim();
  return `あなたは「効率化オタクのあらきり」チャンネルの企画・台本作成AIアシスタントです。

以下のチャンネル設定に厳密に従ってください。

=== ブランド ===
${config.brand}

=== 視聴者ペルソナ ===
${config.audience}

=== 品質基準 ===
${config.quality}

=== 企画書・目次案 ===
${config.planning ?? ""}

=== テーマ選定 ===
${config.themeSelection ?? ""}

=== 市場分析スコアリング ===
${config.marketAnalysisRubric ?? ""}${voiceLearnings ? `

=== あらきりらしさ（推敲差分から学習した文体メモ） ===
本人が AI 原稿を手直しした傾向の蓄積。執筆・修正ではこのメモを文体の参考にする。
${voiceLearnings}` : ""}`;
}
