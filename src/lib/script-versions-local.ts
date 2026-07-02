import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import type { DiffStats } from "./script-diff";
import type { ScriptSnapshot } from "./script-versions";
import { episodeDirName } from "./episode-identity";

/**
 * ローカル開発用の台本スナップショット履歴（ファイルベース）。
 *
 * 本番（Vercel）ではファイルシステムが揮発するため Supabase の
 * `script_snapshots` テーブルを使うが、ローカルでは Supabase に到達できず
 * 保存・履歴が壊れる。そこでローカルでは同じ ScriptSnapshot 形状のまま
 * `<ROOT>/.script-history/<番号>-<slug>.json` に JSON 配列として保存する。
 * これによりローカルでも「保存（記録）」「履歴」「この版に戻す」が動く。
 */

const ROOT = process.cwd();
const HISTORY_DIR = path.join(ROOT, ".script-history");

function historyFilePath(episodeNumber: number, episodeSlug: string): string {
  return path.join(HISTORY_DIR, `${episodeDirName(episodeNumber, episodeSlug)}.json`);
}

async function readSnapshotFile(
  episodeNumber: number,
  episodeSlug: string,
): Promise<ScriptSnapshot[]> {
  try {
    const raw = await fs.readFile(historyFilePath(episodeNumber, episodeSlug), "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as ScriptSnapshot[]) : [];
  } catch {
    return [];
  }
}

async function writeSnapshotFile(
  episodeNumber: number,
  episodeSlug: string,
  snapshots: ScriptSnapshot[],
): Promise<void> {
  await fs.mkdir(HISTORY_DIR, { recursive: true });
  await fs.writeFile(
    historyFilePath(episodeNumber, episodeSlug),
    JSON.stringify(snapshots, null, 2),
    "utf-8",
  );
}

function sortNewestFirst(snapshots: ScriptSnapshot[]): ScriptSnapshot[] {
  return [...snapshots].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function listLocalScriptSnapshots(
  episodeNumber: number,
  episodeSlug: string,
  limit = 50,
): Promise<ScriptSnapshot[]> {
  const all = await readSnapshotFile(episodeNumber, episodeSlug);
  return sortNewestFirst(all).slice(0, limit);
}

export async function getLatestLocalScriptSnapshot(
  episodeNumber: number,
  episodeSlug: string,
): Promise<ScriptSnapshot | null> {
  const list = await listLocalScriptSnapshots(episodeNumber, episodeSlug, 1);
  return list[0] ?? null;
}

export async function getLocalScriptSnapshotById(
  id: string,
): Promise<ScriptSnapshot | null> {
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
        const found = (arr as ScriptSnapshot[]).find((snap) => snap?.id === id);
        if (found) return found;
      }
    } catch {
      // 壊れたファイルは無視して次を探す
    }
  }
  return null;
}

export async function createLocalScriptSnapshot(input: {
  episodeNumber: number;
  episodeSlug: string;
  authorName: string;
  summary: string;
  content: string;
  diffStats: DiffStats | null;
}): Promise<ScriptSnapshot> {
  const snapshot: ScriptSnapshot = {
    id: randomUUID(),
    episodeNumber: input.episodeNumber,
    episodeSlug: input.episodeSlug,
    authorName: input.authorName,
    summary: input.summary,
    content: input.content,
    diffStats: input.diffStats,
    createdAt: new Date().toISOString(),
  };
  const all = await readSnapshotFile(input.episodeNumber, input.episodeSlug);
  all.unshift(snapshot);
  await writeSnapshotFile(input.episodeNumber, input.episodeSlug, all);
  return snapshot;
}
