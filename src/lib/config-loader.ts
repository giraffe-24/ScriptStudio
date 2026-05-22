import fs from "fs/promises";
import path from "path";
import type { ChannelConfig } from "./types";

const ROOT = process.cwd();
const CONFIG_DIR = path.join(ROOT, "config");

export async function loadChannelConfig(): Promise<ChannelConfig> {
  const [brand, audience, quality] = await Promise.all([
    fs.readFile(path.join(CONFIG_DIR, "brand.md"), "utf-8").catch(() => ""),
    fs.readFile(path.join(CONFIG_DIR, "audience.md"), "utf-8").catch(() => ""),
    fs.readFile(path.join(CONFIG_DIR, "quality.md"), "utf-8").catch(() => ""),
  ]);
  return { brand, audience, quality };
}

export function buildSystemPrompt(config: ChannelConfig): string {
  return `あなたは「効率化オタクのあらきり」チャンネルの企画・台本作成AIアシスタントです。

以下のチャンネル設定に厳密に従ってください。

=== ブランド ===
${config.brand}

=== 視聴者ペルソナ ===
${config.audience}

=== 品質基準 ===
${config.quality}`;
}
