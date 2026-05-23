import fs from "fs/promises";
import path from "path";
import type { CompetitorChannel } from "@/lib/types";

const COMPETITORS_PATH = path.join(process.cwd(), "config", "competitors.md");

export async function readCompetitorsConfig(): Promise<CompetitorChannel[]> {
  const raw = await fs.readFile(COMPETITORS_PATH, "utf-8").catch(() => "");
  const rows: CompetitorChannel[] = [];
  for (const line of raw.split("\n")) {
    if (!line.startsWith("|") || line.includes("channelId") || line.includes("---")) continue;
    const cols = line
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean);
    if (cols.length < 3) continue;
    const [channelId, displayName, addedAt] = cols;
    if (!channelId || channelId === "channelId") continue;
    rows.push({ channelId, displayName, addedAt });
  }
  return rows;
}

export async function appendCompetitorsConfig(channels: CompetitorChannel[]): Promise<void> {
  const existing = await readCompetitorsConfig();
  const existingIds = new Set(existing.map((c) => c.channelId));
  const toAdd = channels.filter((c) => !existingIds.has(c.channelId));
  if (toAdd.length === 0) return;

  let content = await fs.readFile(COMPETITORS_PATH, "utf-8").catch(() => "");
  if (!content.trim()) {
    content = `# 競合チャンネル（承認済み）

| channelId | displayName | addedAt |
|-----------|-------------|---------|
`;
  }

  const rows = toAdd
    .map((c) => `| ${c.channelId} | ${c.displayName} | ${c.addedAt} |`)
    .join("\n");
  content = content.trimEnd() + "\n" + rows + "\n";
  await fs.writeFile(COMPETITORS_PATH, content, "utf-8");
}
