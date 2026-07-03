import fs from "fs/promises";
import path from "path";
import { getSupabaseServer } from "./supabase-server";
import {
  ensurePersistedRuntimeStoreConfigured,
  shouldUsePersistedRuntimeStore,
} from "./runtime-persistence";
import {
  isGitMirrorConfigured,
  mirrorDeleteFile,
  mirrorPutFile,
} from "./git-mirror";
import { getActor } from "./request-actor";

export type EpisodeStorageBase = "outputs" | "archive";

type EpisodeOverlayIndex = {
  outputs: string[];
  archive: string[];
  hiddenOutputs: string[];
  hiddenArchive: string[];
};

const EPISODES_BUCKET = "scriptstudio-episodes";
const INDEX_OBJECT_PATH = "_meta/index.json";
const ROOT = process.cwd();
const OUTPUTS_DIR = path.join(ROOT, "outputs");
const ARCHIVE_DIR = path.join(OUTPUTS_DIR, "没");
let bucketReady = false;

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

function objectPath(base: EpisodeStorageBase, dirName: string, filename: string): string {
  return `${base}/${dirName}/${filename}`;
}

/**
 * Git ミラー上のパス。ローカルの outputs/ 構造に合わせる
 * （没＝アーカイブは outputs/没/ 配下）ので、リポジトリを見れば直感的に差分が追える。
 */
function mirrorRelPath(
  base: EpisodeStorageBase,
  dirName: string,
  filename: string,
): string {
  return base === "archive"
    ? `outputs/没/${dirName}/${filename}`
    : `outputs/${dirName}/${filename}`;
}

/** ミラーは best-effort: 失敗しても Supabase 保存自体は止めない。 */
async function safeMirror(run: () => Promise<void>): Promise<void> {
  if (!shouldUsePersistedRuntimeStore() || !isGitMirrorConfigured()) return;
  try {
    await run();
  } catch (error) {
    console.warn("[episode-files-store] Git ミラー失敗（保存は継続）:", error);
  }
}

function normalizeIndex(input?: Partial<EpisodeOverlayIndex> | null): EpisodeOverlayIndex {
  const uniq = (values: unknown) =>
    Array.isArray(values)
      ? [
          ...new Set(
            values
              .filter(
                (value): value is string =>
                  typeof value === "string" && Boolean(value.trim()),
              )
              .map((value) => value.trim()),
          ),
        ]
      : [];
  return {
    outputs: uniq(input?.outputs),
    archive: uniq(input?.archive),
    hiddenOutputs: uniq(input?.hiddenOutputs),
    hiddenArchive: uniq(input?.hiddenArchive),
  };
}

function isMissingStorageError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /not found|does not exist|bucket.*not found|resource.*not found/i.test(message);
}

async function ensureEpisodesBucket(): Promise<void> {
  if (bucketReady || !shouldUsePersistedRuntimeStore()) return;
  const supabase = getSupabaseServer();
  const { data, error } = await supabase.storage.listBuckets();
  if (error) throw new Error(error.message);
  if (data?.some((bucket) => bucket.name === EPISODES_BUCKET)) {
    bucketReady = true;
    return;
  }
  const { error: createError } = await supabase.storage.createBucket(
    EPISODES_BUCKET,
    { public: false },
  );
  if (createError && !/already exists/i.test(createError.message)) {
    throw new Error(createError.message);
  }
  bucketReady = true;
}

async function readPersistedIndex(): Promise<EpisodeOverlayIndex | null> {
  if (!shouldUsePersistedRuntimeStore()) return null;
  const supabase = getSupabaseServer();
  const { data, error } = await supabase.storage
    .from(EPISODES_BUCKET)
    .download(INDEX_OBJECT_PATH);
  if (error) {
    if (isMissingStorageError(error)) return null;
    throw new Error(error.message);
  }
  const raw = await data.text();
  try {
    return normalizeIndex(JSON.parse(raw) as Partial<EpisodeOverlayIndex>);
  } catch {
    return normalizeIndex();
  }
}

async function writePersistedIndex(index: EpisodeOverlayIndex): Promise<void> {
  await ensureEpisodesBucket();
  const supabase = getSupabaseServer();
  const payload = new Blob([JSON.stringify(normalizeIndex(index), null, 2)], {
    type: "application/json",
  });
  const { error } = await supabase.storage
    .from(EPISODES_BUCKET)
    .upload(INDEX_OBJECT_PATH, payload, {
      upsert: true,
      contentType: "application/json",
      cacheControl: "0",
    });
  if (error) throw new Error(error.message);
}

async function getOverlayIndex(): Promise<EpisodeOverlayIndex> {
  if (!shouldUsePersistedRuntimeStore()) return normalizeIndex();
  await ensureEpisodesBucket();
  return (await readPersistedIndex()) ?? normalizeIndex();
}

async function updateOverlayIndex(
  mutate: (current: EpisodeOverlayIndex) => EpisodeOverlayIndex,
): Promise<EpisodeOverlayIndex> {
  ensurePersistedRuntimeStoreConfigured("エピソード保存");
  const current = await getOverlayIndex();
  const next = normalizeIndex(mutate(current));
  await writePersistedIndex(next);
  return next;
}

async function listPersistedFiles(
  base: EpisodeStorageBase,
  dirName: string,
): Promise<string[]> {
  if (!shouldUsePersistedRuntimeStore()) return [];
  await ensureEpisodesBucket();
  const supabase = getSupabaseServer();
  const { data, error } = await supabase.storage
    .from(EPISODES_BUCKET)
    .list(`${base}/${dirName}`, { limit: 1000 });
  if (error) {
    if (isMissingStorageError(error)) return [];
    throw new Error(error.message);
  }
  return (data ?? [])
    .map((entry) => entry.name)
    .filter((name) => typeof name === "string" && !name.endsWith("/"));
}

async function listLocalFiles(
  base: EpisodeStorageBase,
  dirName: string,
): Promise<string[]> {
  const dirPath = path.join(baseDir(base), dirName);
  const entries = await fs.readdir(dirPath, { withFileTypes: true }).catch(() => []);
  return entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
}

async function readPersistedText(
  base: EpisodeStorageBase,
  dirName: string,
  filename: string,
): Promise<string | null> {
  if (!shouldUsePersistedRuntimeStore()) return null;
  await ensureEpisodesBucket();
  const supabase = getSupabaseServer();
  const { data, error } = await supabase.storage
    .from(EPISODES_BUCKET)
    .download(objectPath(base, dirName, filename));
  if (error) {
    if (isMissingStorageError(error)) return null;
    throw new Error(error.message);
  }
  return data.text();
}

async function writePersistedText(
  base: EpisodeStorageBase,
  dirName: string,
  filename: string,
  content: string,
): Promise<void> {
  ensurePersistedRuntimeStoreConfigured("エピソード保存");
  await ensureEpisodesBucket();
  const supabase = getSupabaseServer();
  const payload = new Blob([content], { type: "text/plain" });
  const { error } = await supabase.storage
    .from(EPISODES_BUCKET)
    .upload(objectPath(base, dirName, filename), payload, {
      upsert: true,
      contentType: filename.endsWith(".json") ? "application/json" : "text/plain; charset=utf-8",
      cacheControl: "0",
    });
  if (error) throw new Error(error.message);
}

async function removePersistedFiles(paths: string[]): Promise<void> {
  if (!shouldUsePersistedRuntimeStore() || paths.length === 0) return;
  await ensureEpisodesBucket();
  const supabase = getSupabaseServer();
  const { error } = await supabase.storage.from(EPISODES_BUCKET).remove(paths);
  if (error && !isMissingStorageError(error)) throw new Error(error.message);
}

async function readLocalText(
  base: EpisodeStorageBase,
  dirName: string,
  filename: string,
): Promise<string> {
  const filePath = path.join(baseDir(base), dirName, filename);
  return fs.readFile(filePath, "utf-8").catch(() => "");
}

async function writeLocalTextBestEffort(
  base: EpisodeStorageBase,
  dirName: string,
  filename: string,
  content: string,
): Promise<void> {
  try {
    const dirPath = path.join(baseDir(base), dirName);
    await fs.mkdir(dirPath, { recursive: true });
    await fs.writeFile(path.join(dirPath, filename), content, "utf-8");
  } catch (error) {
    console.warn("[episode-files-store] skipped local file write:", error);
  }
}

function hiddenSet(index: EpisodeOverlayIndex, base: EpisodeStorageBase): Set<string> {
  return new Set(base === "archive" ? index.hiddenArchive : index.hiddenOutputs);
}

function persistedSet(index: EpisodeOverlayIndex, base: EpisodeStorageBase): Set<string> {
  return new Set(base === "archive" ? index.archive : index.outputs);
}

export async function listEpisodeDirectoryNames(
  base: EpisodeStorageBase,
): Promise<string[]> {
  const localEntries = await fs.readdir(baseDir(base), { withFileTypes: true }).catch(() => []);
  const localDirNames = localEntries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name);

  if (!shouldUsePersistedRuntimeStore()) return localDirNames;

  const index = await getOverlayIndex().catch(() => normalizeIndex());
  const hidden = hiddenSet(index, base);
  const persisted = persistedSet(index, base);
  const merged = new Set<string>([...persisted, ...localDirNames.filter((name) => !hidden.has(name))]);
  return [...merged];
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
  if (!shouldUsePersistedRuntimeStore()) {
    return readLocalText(base, dirName, filename);
  }

  const index = await getOverlayIndex().catch(() => normalizeIndex());
  const persisted = persistedSet(index, base);
  if (persisted.has(dirName)) {
    const persistedContent = await readPersistedText(base, dirName, filename).catch(() => null);
    if (persistedContent !== null) return persistedContent;
  }

  const hidden = hiddenSet(index, base);
  if (hidden.has(dirName)) return "";
  return readLocalText(base, dirName, filename);
}

export async function writeEpisodeText(
  base: EpisodeStorageBase,
  dirName: string,
  filename: string,
  content: string,
): Promise<void> {
  assertSafeEpisodeFilename(filename);
  if (!shouldUsePersistedRuntimeStore()) {
    const dirPath = path.join(baseDir(base), dirName);
    await fs.mkdir(dirPath, { recursive: true });
    await fs.writeFile(path.join(dirPath, filename), content, "utf-8");
    return;
  }

  await writePersistedText(base, dirName, filename, content);
  await updateOverlayIndex((current) => {
    const next = normalizeIndex(current);
    const targetList = base === "archive" ? next.archive : next.outputs;
    if (!targetList.includes(dirName)) targetList.push(dirName);
    if (base === "archive") {
      next.hiddenArchive = next.hiddenArchive.filter((value) => value !== dirName);
    } else {
      next.hiddenOutputs = next.hiddenOutputs.filter((value) => value !== dirName);
    }
    return next;
  });
  await writeLocalTextBestEffort(base, dirName, filename, content);
  await safeMirror(() =>
    mirrorPutFile(
      mirrorRelPath(base, dirName, filename),
      content,
      getActor(),
      `${dirName}/${filename} を更新`,
    ),
  );
}

async function materializeEpisodeFiles(
  sourceBase: EpisodeStorageBase,
  sourceDirName: string,
  targetBase: EpisodeStorageBase,
  targetDirName: string,
): Promise<void> {
  const fileNames = new Set<string>([
    ...(await listLocalFiles(sourceBase, sourceDirName)),
    ...(await listPersistedFiles(sourceBase, sourceDirName)),
  ]);
  for (const fileName of fileNames) {
    const content = await readEpisodeText(sourceBase, sourceDirName, fileName);
    await writePersistedText(targetBase, targetDirName, fileName, content);
  }
}

export async function moveEpisodeDirectory(
  sourceBase: EpisodeStorageBase,
  sourceDirName: string,
  targetBase: EpisodeStorageBase,
  targetDirName: string,
): Promise<void> {
  if (!shouldUsePersistedRuntimeStore()) {
    const sourcePath = path.join(baseDir(sourceBase), sourceDirName);
    const targetPath = path.join(baseDir(targetBase), targetDirName);
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.rename(sourcePath, targetPath);
    return;
  }

  ensurePersistedRuntimeStoreConfigured("エピソード保存");
  await materializeEpisodeFiles(sourceBase, sourceDirName, targetBase, targetDirName);
  const sourceFiles = await listPersistedFiles(sourceBase, sourceDirName);
  await removePersistedFiles(sourceFiles.map((fileName) => objectPath(sourceBase, sourceDirName, fileName)));
  if (shouldUsePersistedRuntimeStore() && isGitMirrorConfigured()) {
    const actor = getActor();
    const targetFiles = await listPersistedFiles(targetBase, targetDirName);
    for (const fileName of targetFiles) {
      const content = await readPersistedText(targetBase, targetDirName, fileName);
      if (content !== null) {
        await safeMirror(() =>
          mirrorPutFile(
            mirrorRelPath(targetBase, targetDirName, fileName),
            content,
            actor,
            `${sourceDirName} → ${targetDirName} 移動`,
          ),
        );
      }
    }
    for (const fileName of sourceFiles) {
      await safeMirror(() =>
        mirrorDeleteFile(
          mirrorRelPath(sourceBase, sourceDirName, fileName),
          actor,
          `${sourceDirName} → ${targetDirName} 移動（旧を削除）`,
        ),
      );
    }
  }
  await updateOverlayIndex((current) => {
    const next = normalizeIndex(current);
    const sourceList = sourceBase === "archive" ? next.archive : next.outputs;
    const targetList = targetBase === "archive" ? next.archive : next.outputs;
    const sourceHidden = sourceBase === "archive" ? next.hiddenArchive : next.hiddenOutputs;
    const targetHidden = targetBase === "archive" ? next.hiddenArchive : next.hiddenOutputs;

    const removeSource = sourceList.filter((value) => value !== sourceDirName);
    if (sourceBase === "archive") next.archive = removeSource;
    else next.outputs = removeSource;

    if (!targetList.includes(targetDirName)) targetList.push(targetDirName);
    if (sourceBase === "archive") {
      if (!sourceHidden.includes(sourceDirName)) sourceHidden.push(sourceDirName);
    } else if (!sourceHidden.includes(sourceDirName)) {
      sourceHidden.push(sourceDirName);
    }

    const cleanedTargetHidden = targetHidden.filter((value) => value !== targetDirName);
    if (targetBase === "archive") next.hiddenArchive = cleanedTargetHidden;
    else next.hiddenOutputs = cleanedTargetHidden;
    return next;
  });
}

export async function removeEpisodeDirectory(
  base: EpisodeStorageBase,
  dirName: string,
): Promise<void> {
  if (!shouldUsePersistedRuntimeStore()) {
    await fs.rm(path.join(baseDir(base), dirName), { recursive: true, force: true });
    return;
  }

  ensurePersistedRuntimeStoreConfigured("エピソード保存");
  const persistedFiles = await listPersistedFiles(base, dirName);
  await removePersistedFiles(persistedFiles.map((fileName) => objectPath(base, dirName, fileName)));
  if (shouldUsePersistedRuntimeStore() && isGitMirrorConfigured()) {
    const actor = getActor();
    for (const fileName of persistedFiles) {
      await safeMirror(() =>
        mirrorDeleteFile(
          mirrorRelPath(base, dirName, fileName),
          actor,
          `${dirName} を完全削除`,
        ),
      );
    }
  }
  await updateOverlayIndex((current) => {
    const next = normalizeIndex(current);
    if (base === "archive") {
      next.archive = next.archive.filter((value) => value !== dirName);
      if (!next.hiddenArchive.includes(dirName)) next.hiddenArchive.push(dirName);
    } else {
      next.outputs = next.outputs.filter((value) => value !== dirName);
      if (!next.hiddenOutputs.includes(dirName)) next.hiddenOutputs.push(dirName);
    }
    return next;
  });
}
