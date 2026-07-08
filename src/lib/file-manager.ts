import path from "path";
import type { Episode } from "./types";
import { normalizeEpisodeStatus, resolveEpisodeStatus, type EpisodeStatus } from "./episode-status";
import { hasRevision, hasScriptDraft } from "./script-calib";
import { sortEpisodesByNumberDesc } from "./episode-sort";
import {
  episodeDirectoryExists,
  listEpisodeDirectoryNames,
  moveEpisodeDirectory,
  readEpisodeText,
  removeEpisodeDirectory,
  writeEpisodeText,
  type EpisodeStorageBase,
} from "./episode-files-store";
import {
  readPersistedScriptMeta,
  writePersistedScriptMeta,
  type PersistedScriptMeta,
} from "./script-meta-store";
import { getStudioUserName } from "./studio-user";
import {
  episodeDirName,
  isValidEpisodeIdentity,
  manifestNeedsIdentityRepair,
  mergeManifestIdentity,
  parseEpisodeDirName,
  type EpisodeIdentity,
} from "./episode-identity";

const ROOT = process.cwd();
const OUTPUTS_DIR = path.join(ROOT, "outputs");
const ARCHIVE_DIR = path.join(OUTPUTS_DIR, "没");

export type EpisodeDeleteTarget = {
  number: number;
  slug: string;
};

export type EpisodeDeleteResult = {
  deleted: EpisodeDeleteTarget[];
  errors: { target: EpisodeDeleteTarget; error: string }[];
};

function episodeDirPath(baseDir: string, identity: EpisodeIdentity): string {
  const dirPath = path.resolve(baseDir, identity.dirName);
  const resolvedBase = path.resolve(baseDir);
  if (!dirPath.startsWith(resolvedBase + path.sep) && dirPath !== resolvedBase) {
    throw new Error("Invalid episode path");
  }
  return dirPath;
}

function resolveStoreLocation(dirPath: string): { base: EpisodeStorageBase; dirName: string } {
  const resolved = path.resolve(dirPath);
  const resolvedArchive = path.resolve(ARCHIVE_DIR);
  const resolvedOutputs = path.resolve(OUTPUTS_DIR);

  if (resolved.startsWith(resolvedArchive + path.sep) || resolved === resolvedArchive) {
    return { base: "archive", dirName: path.basename(resolved) };
  }

  if (resolved.startsWith(resolvedOutputs + path.sep) || resolved === resolvedOutputs) {
    return { base: "outputs", dirName: path.basename(resolved) };
  }

  throw new Error("Invalid episode storage location");
}

function resolveEpisodeIdentity(number: number, slug: string): EpisodeIdentity {
  if (!isValidEpisodeIdentity(number, slug)) {
    throw new Error("Invalid episode number or slug");
  }
  return {
    number,
    slug: slug.trim(),
    dirName: episodeDirName(number, slug.trim()),
  };
}

export type ScriptMeta = PersistedScriptMeta;

async function readManifestAtDir(dirPath: string): Promise<Record<string, unknown>> {
  const { base, dirName } = resolveStoreLocation(dirPath);
  const raw = await readEpisodeText(base, dirName, "manifest.json");
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function writeManifestAtDir(dirPath: string, manifest: Record<string, unknown>): Promise<void> {
  const { base, dirName } = resolveStoreLocation(dirPath);
  await writeEpisodeText(base, dirName, "manifest.json", JSON.stringify(manifest, null, 2));
}

function extractScriptMetaFromManifest(manifest: Record<string, unknown>): ScriptMeta | null {
  const updatedAt = manifest.script_updated_at;
  const updatedBy = manifest.script_updated_by;
  if (typeof updatedAt !== "string" || typeof updatedBy !== "string") return null;
  return {
    updatedAt,
    updatedBy,
    planFingerprint:
      typeof manifest.script_plan_fingerprint === "string"
        ? manifest.script_plan_fingerprint
        : undefined,
    recordedPlanFingerprint:
      typeof manifest.recorded_plan_fingerprint === "string"
        ? manifest.recorded_plan_fingerprint
        : undefined,
  };
}

async function readManifestScriptMeta(dirPath: string): Promise<ScriptMeta | null> {
  const manifest = await readManifestAtDir(dirPath);
  return extractScriptMetaFromManifest(manifest);
}

async function writeScriptMetaBestEffort(dirPath: string, meta: ScriptMeta): Promise<void> {
  try {
    const manifest = await readManifestAtDir(dirPath);
    manifest.script_updated_at = meta.updatedAt;
    manifest.script_updated_by = meta.updatedBy;
    if (meta.planFingerprint) {
      manifest.script_plan_fingerprint = meta.planFingerprint;
    }
    if (meta.recordedPlanFingerprint) {
      manifest.recorded_plan_fingerprint = meta.recordedPlanFingerprint;
    }
    await writeManifestAtDir(dirPath, manifest);
  } catch (error) {
    console.warn("[file-manager] skipped manifest script meta write:", error);
  }
}

async function readCurrentScriptMeta(number: number, slug: string): Promise<ScriptMeta | null> {
  try {
    const persisted = await readPersistedScriptMeta(number, slug);
    if (persisted) return persisted;
  } catch (error) {
    console.warn("[file-manager] failed to read persisted script meta:", error);
  }
  const identity = resolveEpisodeIdentity(number, slug);
  const dirPath = episodeDirPath(OUTPUTS_DIR, identity);
  return readManifestScriptMeta(dirPath);
}

async function readPlanTitle(dirPath: string): Promise<string | undefined> {
  try {
    const { base, dirName } = resolveStoreLocation(dirPath);
    const raw = await readEpisodeText(base, dirName, "plan.json");
    const plan = JSON.parse(raw) as { episodeTitle?: string };
    return typeof plan.episodeTitle === "string" ? plan.episodeTitle : undefined;
  } catch {
    return undefined;
  }
}

async function loadManifestForIdentity(
  identity: EpisodeIdentity,
  options?: { repair?: boolean; persistRepair?: boolean },
): Promise<Record<string, unknown>> {
  const dirPath = episodeDirPath(OUTPUTS_DIR, identity);
  let manifest = await readManifestAtDir(dirPath);
  if (!options?.repair || !manifestNeedsIdentityRepair(identity, manifest)) {
    return manifest;
  }

  const planTitle = await readPlanTitle(dirPath);
  manifest = mergeManifestIdentity(identity, manifest);
  if (typeof manifest.title !== "string" || !manifest.title.trim()) {
    manifest.title = planTitle ?? identity.slug;
  }
  if (typeof manifest.status !== "string") {
    manifest.status = "planning";
  }
  if (typeof manifest.created_at !== "string") {
    manifest.created_at = new Date().toISOString().slice(0, 10);
  }
  if (!Array.isArray(manifest.panes)) {
    manifest.panes = [
      { id: "pane1", label: "企画", path: "00-plan-and-structure.md" },
      { id: "pane2", label: "台本", path: "01-script-draft.md" },
    ];
  }
  if (options.persistRepair) {
    await writeManifestAtDir(dirPath, manifest);
  }
  return manifest;
}

export async function readScriptMeta(number: number, slug: string): Promise<ScriptMeta | null> {
  const identity = resolveEpisodeIdentity(number, slug);
  const exists = await episodeDirectoryExists("outputs", identity.dirName);
  if (!exists) return null;
  return readCurrentScriptMeta(number, slug);
}

export async function syncScriptRecordBaseline(
  number: number,
  slug: string,
  planFingerprint: string,
): Promise<ScriptMeta | null> {
  const identity = resolveEpisodeIdentity(number, slug);
  const dirPath = episodeDirPath(OUTPUTS_DIR, identity);
  const current = await readCurrentScriptMeta(number, slug);
  const meta: ScriptMeta = {
    updatedAt: current?.updatedAt ?? new Date().toISOString(),
    updatedBy: current?.updatedBy ?? getStudioUserName(),
    planFingerprint,
    recordedPlanFingerprint: planFingerprint,
  };
  await writePersistedScriptMeta(number, slug, meta);
  await writeScriptMetaBestEffort(dirPath, meta);
  return meta;
}

export async function updateScriptMeta(
  number: number,
  slug: string,
  options: {
    source: "generation" | "manual";
    planFingerprint?: string;
    updatedBy?: string;
  },
): Promise<ScriptMeta> {
  const identity = resolveEpisodeIdentity(number, slug);
  const dirPath = episodeDirPath(OUTPUTS_DIR, identity);
  const exists = await episodeDirectoryExists("outputs", identity.dirName);
  if (!exists) {
    throw new Error(`Episode folder not found: ${identity.dirName}`);
  }

  const current = await readCurrentScriptMeta(number, slug);
  const meta: ScriptMeta = {
    updatedAt: new Date().toISOString(),
    updatedBy: options.updatedBy?.trim() || getStudioUserName(),
    planFingerprint: options.planFingerprint ?? current?.planFingerprint,
    recordedPlanFingerprint: current?.recordedPlanFingerprint,
  };
  await writePersistedScriptMeta(number, slug, meta);
  await writeScriptMetaBestEffort(dirPath, meta);
  return meta;
}

export async function listEpisodes(): Promise<Episode[]> {
  const episodes: Episode[] = [];
  const entries = await listEpisodeDirectoryNames("outputs");

  for (const entryName of entries) {
    if (entryName.startsWith(".") || entryName === "没") continue;

    const identity = parseEpisodeDirName(entryName);
    if (!identity) continue;

    try {
      const m = await loadManifestForIdentity(identity, { repair: true });
      const scriptContent = await readEpisodeText("outputs", identity.dirName, "01-script-draft.md");

      const hasDraft = hasScriptDraft(scriptContent);
      const storedStatus = normalizeEpisodeStatus(typeof m.status === "string" ? m.status : undefined);
      const status = resolveEpisodeStatus(storedStatus, hasDraft);

      episodes.push({
        id: String(identity.number),
        number: identity.number,
        slug: identity.slug,
        title: typeof m.title === "string" && m.title.trim() ? m.title : identity.slug,
        status,
        themePattern: m.theme_pattern as Episode["themePattern"],
        createdAt: typeof m.created_at === "string" ? m.created_at : "",
        hook: typeof m.hook === "string" ? m.hook : undefined,
        targetPain: typeof m.target_pain === "string" ? m.target_pain : undefined,
        reason: typeof m.reason === "string" ? m.reason : undefined,
        hasScriptDraft: hasScriptDraft(scriptContent),
        hasRevision: hasRevision(scriptContent),
      });
    } catch {
      // 読み込み不能なフォルダは一覧に出さない
    }
  }

  return sortEpisodesByNumberDesc(episodes);
}

export async function createEpisode(episode: Omit<Episode, "createdAt">): Promise<Episode> {
  if (!isValidEpisodeIdentity(episode.number, episode.slug)) {
    throw new Error("Invalid episode number or slug");
  }

  const slug =
    episode.slug.trim() ||
    episode.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 50);
  const identity = resolveEpisodeIdentity(episode.number, slug);
  const dirPath = episodeDirPath(OUTPUTS_DIR, identity);

  const exists = await episodeDirectoryExists("outputs", identity.dirName);
  if (exists) {
    // 同じフォルダが既にある場合はエラーにせず上書き（企画メタのみ更新）。
    // created_at / status / script_updated_at 等の既存フィールドと、
    // 台本など manifest 以外の既存ファイルはそのまま保持する。
    let existing: Record<string, unknown> = {};
    try {
      existing = await readManifestAtDir(dirPath);
    } catch {
      // manifest が無い・読めない場合は新規相当として作り直す
    }
    const merged: Record<string, unknown> = {
      ...existing,
      id: String(identity.number),
      slug: identity.slug,
      title: episode.title,
      status: typeof existing.status === "string" && existing.status ? existing.status : episode.status,
    };
    if (episode.themePattern) merged.theme_pattern = episode.themePattern;
    if (episode.hook) merged.hook = episode.hook;
    if (episode.targetPain) merged.target_pain = episode.targetPain;
    if (episode.reason) merged.reason = episode.reason;
    if (typeof merged.created_at !== "string" || !merged.created_at) {
      merged.created_at = new Date().toISOString().slice(0, 10);
    }
    if (!Array.isArray(merged.panes)) {
      merged.panes = [
        { id: "pane1", label: "企画", path: "00-plan-and-structure.md" },
        { id: "pane2", label: "台本", path: "01-script-draft.md" },
      ];
    }
    await writeManifestAtDir(dirPath, merged);
    return {
      ...episode,
      number: identity.number,
      slug: identity.slug,
      status: merged.status as Episode["status"],
      createdAt: String(merged.created_at),
    };
  }

  const ep: Episode = { ...episode, number: identity.number, slug: identity.slug, createdAt: new Date().toISOString().slice(0, 10) };
  const manifest = {
    id: String(identity.number),
    slug: identity.slug,
    title: episode.title,
    status: episode.status,
    theme_pattern: episode.themePattern,
    created_at: ep.createdAt,
    hook: episode.hook,
    target_pain: episode.targetPain,
    reason: episode.reason,
    panes: [
      { id: "pane1", label: "企画", path: "00-plan-and-structure.md" },
      { id: "pane2", label: "台本", path: "01-script-draft.md" },
    ],
  };
  await writeManifestAtDir(dirPath, manifest);
  return ep;
}

async function assertEpisodeDirExists(identity: EpisodeIdentity): Promise<string> {
  const dirPath = episodeDirPath(OUTPUTS_DIR, identity);
  const exists = await episodeDirectoryExists("outputs", identity.dirName);
  if (!exists) {
    throw new Error(`Episode folder not found: ${identity.dirName}`);
  }
  return dirPath;
}

export async function readEpisodeFile(number: number, slug: string, filename: string): Promise<string> {
  const identity = resolveEpisodeIdentity(number, slug);
  await assertEpisodeDirExists(identity);
  return readEpisodeText("outputs", identity.dirName, filename);
}

export async function writeEpisodeFile(
  number: number,
  slug: string,
  filename: string,
  content: string,
  scriptMeta?: {
    source: "generation" | "manual";
    planFingerprint?: string;
    updatedBy?: string;
  },
): Promise<ScriptMeta | null> {
  const identity = resolveEpisodeIdentity(number, slug);
  const dirPath = await assertEpisodeDirExists(identity);
  await writeEpisodeText("outputs", identity.dirName, filename, content);
  if (filename === "01-script-draft.md") {
    const manifest = await loadManifestForIdentity(identity, { repair: true });
    const hasDraft = hasScriptDraft(content);
    const stored = normalizeEpisodeStatus(
      typeof manifest.status === "string" ? manifest.status : undefined,
    );
    const nextStatus = hasDraft
      ? stored === "planning" || stored === "considering"
        ? "scripting"
        : stored
      : "planning";
    if (nextStatus !== stored) {
      manifest.status = nextStatus;
      await writeManifestAtDir(dirPath, manifest);
    }
    if (scriptMeta) {
      return updateScriptMeta(number, slug, scriptMeta);
    }
    return null;
  }
  return null;
}

export async function writePlan(number: number, slug: string, plan: Record<string, unknown>): Promise<void> {
  await writeEpisodeFile(number, slug, "plan.json", JSON.stringify(plan, null, 2));
}

export async function readPlan(number: number, slug: string): Promise<Record<string, unknown> | null> {
  const content = await readEpisodeFile(number, slug, "plan.json");
  if (!content) return null;
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export async function updateManifestStatus(number: number, slug: string, status: EpisodeStatus): Promise<EpisodeStatus> {
  const identity = resolveEpisodeIdentity(number, slug);
  const dirPath = await assertEpisodeDirExists(identity);
  const m = await loadManifestForIdentity(identity, { repair: true });
  const scriptContent = await readEpisodeText("outputs", identity.dirName, "01-script-draft.md");
  const resolved = resolveEpisodeStatus(normalizeEpisodeStatus(status), hasScriptDraft(scriptContent));
  m.status = resolved;
  await writeManifestAtDir(dirPath, m);
  return resolved;
}

export async function updateManifestTitle(number: number, slug: string, title: string): Promise<void> {
  const identity = resolveEpisodeIdentity(number, slug);
  const dirPath = await assertEpisodeDirExists(identity);
  const m = await loadManifestForIdentity(identity, { repair: true });
  m.title = title;
  await writeManifestAtDir(dirPath, m);
}

export async function updateEpisodeNumber(
  oldNumber: number,
  slug: string,
  newNumber: number,
): Promise<Episode> {
  if (!isValidEpisodeIdentity(newNumber, slug)) {
    throw new Error("Invalid episode number or slug");
  }

  const oldIdentity = resolveEpisodeIdentity(oldNumber, slug);
  const newIdentity = resolveEpisodeIdentity(newNumber, slug);

  if (oldIdentity.dirName === newIdentity.dirName) {
    const episodes = await listEpisodes();
    const current = episodes.find((e) => e.number === oldNumber && e.slug === slug);
    if (!current) throw new Error("Episode not found");
    return current;
  }

  const oldPath = episodeDirPath(OUTPUTS_DIR, oldIdentity);

  const newExists = await episodeDirectoryExists("outputs", newIdentity.dirName);
  if (newExists) {
    throw new Error(`#${newNumber} は既に使用されています`);
  }

  const oldExists = await episodeDirectoryExists("outputs", oldIdentity.dirName);
  if (!oldExists) {
    throw new Error("Episode folder not found");
  }

  const m = await loadManifestForIdentity(oldIdentity, { repair: true });
  const updated = mergeManifestIdentity(newIdentity, { ...m, id: String(newNumber), slug });
  await writeManifestAtDir(oldPath, updated);
  await moveEpisodeDirectory("outputs", oldIdentity.dirName, "outputs", newIdentity.dirName);

  const scriptContent = await readEpisodeText("outputs", newIdentity.dirName, "01-script-draft.md");
  const hasDraft = hasScriptDraft(scriptContent);
  const storedStatus = normalizeEpisodeStatus(typeof updated.status === "string" ? updated.status : undefined);
  const status = resolveEpisodeStatus(storedStatus, hasDraft);

  return {
    id: String(newNumber),
    number: newNumber,
    slug,
    title: typeof updated.title === "string" ? updated.title : slug,
    status,
    themePattern: updated.theme_pattern as Episode["themePattern"],
    createdAt: typeof updated.created_at === "string" ? updated.created_at : "",
    hook: typeof updated.hook === "string" ? updated.hook : undefined,
    targetPain: typeof updated.target_pain === "string" ? updated.target_pain : undefined,
    reason: typeof updated.reason === "string" ? updated.reason : undefined,
    hasScriptDraft: hasDraft,
    hasRevision: hasRevision(scriptContent),
  };
}

export async function deleteEpisodes(
  targets: EpisodeDeleteTarget[],
  mode: "archive" | "permanent" = "archive",
): Promise<EpisodeDeleteResult> {
  const deleted: EpisodeDeleteTarget[] = [];
  const errors: EpisodeDeleteResult["errors"] = [];

  for (const target of targets) {
    try {
      const identity = resolveEpisodeIdentity(target.number, target.slug);
      const sourceExists = await episodeDirectoryExists("outputs", identity.dirName);
      if (!sourceExists) {
        errors.push({ target, error: "フォルダが見つかりません" });
        continue;
      }

      if (mode === "archive") {
        const destExists = await episodeDirectoryExists("archive", identity.dirName);
        if (destExists) {
          errors.push({ target, error: "没フォルダに同名の案件が既にあります" });
          continue;
        }
        await moveEpisodeDirectory("outputs", identity.dirName, "archive", identity.dirName);
      } else {
        await removeEpisodeDirectory("outputs", identity.dirName);
      }

      deleted.push({ number: identity.number, slug: identity.slug });
    } catch (err) {
      errors.push({
        target,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { deleted, errors };
}
