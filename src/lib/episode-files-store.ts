import fs from "fs/promises";
import path from "path";

/**
 * エピソードのファイル（企画・台本・manifest 等）の読み書き。
 * 保存先はサーバーのファイルシステム（outputs/ 配下）だけで、外部ストアは使わない。
 */

export type EpisodeStorageBase = "outputs" | "archive";

const ROOT = process.cwd();
const OUTPUTS_DIR = path.join(ROOT, "outputs");
const ARCHIVE_DIR = path.join(OUTPUTS_DIR, "没");

function baseDir(base: EpisodeStorageBase): string {
  return base === "archive" ? ARCHIVE_DIR : OUTPUTS_DIR;
}

/**
 * API から渡される filename でのパストラバーサル（../../.env 等）を遮断する。
 * エピソードファイルは常にフォルダ直下の単純なファイル名のみ。
 */
function assertSafeEpisodeFilename(filename: string): void {
  if (
    !filename ||
    filename !== filename.trim() ||
    filename.startsWith(".") ||
    filename.includes("..") ||
    filename.includes("/") ||
    filename.includes("\\") ||
    filename.includes("\0")
  ) {
    throw new Error(`不正なファイル名です: ${filename}`);
  }
}

async function readLocalText(
  base: EpisodeStorageBase,
  dirName: string,
  filename: string,
): Promise<string> {
  const filePath = path.join(baseDir(base), dirName, filename);
  return fs.readFile(filePath, "utf-8").catch(() => "");
}

export async function listEpisodeDirectoryNames(
  base: EpisodeStorageBase,
): Promise<string[]> {
  const entries = await fs.readdir(baseDir(base), { withFileTypes: true }).catch(() => []);
  return entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name);
}

export async function episodeDirectoryExists(
  base: EpisodeStorageBase,
  dirName: string,
): Promise<boolean> {
  const names = await listEpisodeDirectoryNames(base);
  return names.includes(dirName);
}

export async function readEpisodeText(
  base: EpisodeStorageBase,
  dirName: string,
  filename: string,
): Promise<string> {
  assertSafeEpisodeFilename(filename);
  return readLocalText(base, dirName, filename);
}

export async function writeEpisodeText(
  base: EpisodeStorageBase,
  dirName: string,
  filename: string,
  content: string,
): Promise<void> {
  assertSafeEpisodeFilename(filename);
  const dirPath = path.join(baseDir(base), dirName);
  await fs.mkdir(dirPath, { recursive: true });
  await fs.writeFile(path.join(dirPath, filename), content, "utf-8");
}

export async function moveEpisodeDirectory(
  sourceBase: EpisodeStorageBase,
  sourceDirName: string,
  targetBase: EpisodeStorageBase,
  targetDirName: string,
): Promise<void> {
  const sourcePath = path.join(baseDir(sourceBase), sourceDirName);
  const targetPath = path.join(baseDir(targetBase), targetDirName);
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.rename(sourcePath, targetPath);
}

export async function removeEpisodeDirectory(
  base: EpisodeStorageBase,
  dirName: string,
): Promise<void> {
  await fs.rm(path.join(baseDir(base), dirName), { recursive: true, force: true });
}
