import fs from "fs/promises";
import path from "path";
import type { CompetitorChannel } from "@/lib/types";

const COMPETITORS_PATH = path.join(process.cwd(), "config", "competitors.md");

const TABLE_HEADER = `# 競合チャンネル（承認済み）

| channelId | displayName | addedAt | enabled |
|-----------|-------------|---------|---------|
`;

function parseEnabled(raw: string | undefined): boolean {
  if (!raw) return true;
  const v = raw.toLowerCase();
  return v !== "false" && v !== "off" && v !== "0";
}

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
    const [channelId, displayName, addedAt, enabledRaw] = cols;
    if (!channelId || channelId === "channelId") continue;
    rows.push({ channelId, displayName, addedAt, enabled: parseEnabled(enabledRaw) });
  }
  return rows;
}

export async function readEnabledCompetitorsConfig(): Promise<CompetitorChannel[]> {
  const all = await readCompetitorsConfig();
  return all.filter((c) => c.enabled !== false);
}

async function writeCompetitorsConfig(channels: CompetitorChannel[]): Promise<void> {
  const rows = channels
    .map(
      (c) =>
        `| ${c.channelId} | ${c.displayName} | ${c.addedAt} | ${c.enabled !== false ? "true" : "false"} |`,
    )
    .join("\n");
  await fs.writeFile(COMPETITORS_PATH, `${TABLE_HEADER}${rows}\n`, "utf-8");
}

export async function appendCompetitorsConfig(channels: CompetitorChannel[]): Promise<void> {
  const existing = await readCompetitorsConfig();
  const existingIds = new Set(existing.map((c) => c.channelId));
  const toAdd = channels
    .filter((c) => !existingIds.has(c.channelId))
    .map((c) => ({ ...c, enabled: c.enabled !== false }));
  if (toAdd.length === 0) return;
  await writeCompetitorsConfig([...existing, ...toAdd]);
}

export async function updateCompetitorsEnabled(
  updates: { channelId: string; enabled: boolean }[],
): Promise<void> {
  const map = new Map(updates.map((u) => [u.channelId, u.enabled]));
  const channels = await readCompetitorsConfig();
  if (channels.length === 0) return;

  const updated = channels.map((c) => ({
    ...c,
    enabled: map.has(c.channelId) ? map.get(c.channelId)! : c.enabled !== false,
  }));
  await writeCompetitorsConfig(updated);
}
