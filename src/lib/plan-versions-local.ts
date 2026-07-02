import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import type { PlanSnapshot } from "./plan-versions";
import { episodeDirName } from "./episode-identity";

/**
 * ローカル開発用の企画書スナップショット履歴（ファイルベース）。
 * 台本の script-versions-local.ts と対称で、本番では Supabase の
 * `plan_snapshots` テーブルを使う。ローカルでは Supabase に到達できなくても
 * 壊れないよう `<ROOT>/.plan-history/<番号>-<slug>.json` に保存する。
 */

const ROOT = process.cwd();
const HISTORY_DIR = path.join(ROOT, ".plan-history");

function historyFilePath(episodeNumber: number, episodeSlug: string): string {
  return path.join(HISTORY_DIR, `${episodeDirName(episodeNumber, episodeSlug)}.json`);
}

async function readSnapshotFile(
  episodeNumber: number,
  episodeSlug: string,
): Promise<PlanSnapshot[]> {
  try {
    const raw = await fs.readFile(historyFilePath(episodeNumber, episodeSlug), "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as PlanSnapshot[]) : [];
  } catch {
    return [];
  }
}

async function writeSnapshotFile(
  episodeNumber: number,
  episodeSlug: string,
  snapshots: PlanSnapshot[],
): Promise<void> {
  await fs.mkdir(HISTORY_DIR, { recursive: true });
  await fs.writeFile(
    historyFilePath(episodeNumber, episodeSlug),
    JSON.stringify(snapshots, null, 2),
    "utf-8",
  );
}

function sortNewestFirst(snapshots: PlanSnapshot[]): PlanSnapshot[] {
  return [...snapshots].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function listLocalPlanSnapshots(
  episodeNumber: number,
  episodeSlug: string,
  limit = 50,
): Promise<PlanSnapshot[]> {
  const all = await readSnapshotFile(episodeNumber, episodeSlug);
  return sortNewestFirst(all).slice(0, limit);
}

export async function getLatestLocalPlanSnapshot(
  episodeNumber: number,
  episodeSlug: string,
): Promise<PlanSnapshot | null> {
  const list = await listLocalPlanSnapshots(episodeNumber, episodeSlug, 1);
  return list[0] ?? null;
}

export async function getLocalPlanSnapshotById(id: string): Promise<PlanSnapshot | null> {
  let files: string[];
  try {
    files = await fs.readdir(HISTORY_DIR);
  } catch {
    return null;
  }
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const raw = await fs.readFile(path.join(HISTORY_DIR, file), "utf-8").catch(() => "");
    if (!raw) continue;
    try {
      const arr = JSON.parse(raw) as unknown;
      if (Array.isArray(arr)) {
        const found = (arr as PlanSnapshot[]).find((snap) => snap?.id === id);
        if (found) return found;
      }
    } catch {
      // 壊れたファイルは無視して次を探す
    }
  }
  return null;
}

export async function createLocalPlanSnapshot(input: {
  episodeNumber: number;
  episodeSlug: string;
  authorName: string;
  summary: string;
  content: string;
}): Promise<PlanSnapshot> {
  const snapshot: PlanSnapshot = {
    id: randomUUID(),
    episodeNumber: input.episodeNumber,
    episodeSlug: input.episodeSlug,
    authorName: input.authorName,
    summary: input.summary,
    content: input.content,
    createdAt: new Date().toISOString(),
  };
  const all = await readSnapshotFile(input.episodeNumber, input.episodeSlug);
  all.unshift(snapshot);
  await writeSnapshotFile(input.episodeNumber, input.episodeSlug, all);
  return snapshot;
}
