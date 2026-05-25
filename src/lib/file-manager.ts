import fs from "fs/promises";
import path from "path";
import type { Episode } from "./types";
import { normalizeEpisodeStatus, type EpisodeStatus } from "./episode-status";
import { hasRevision, hasScriptDraft } from "./script-calib";
import { sortEpisodesByNumberDesc } from "./episode-sort";
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

export interface ScriptMeta {
  updatedAt: string;
  updatedBy: string;
  planFingerprint?: string;
  recordedPlanFingerprint?: string;
}

async function readManifestAtDir(dirPath: string): Promise<Record<string, unknown>> {
  const filePath = path.join(dirPath, "manifest.json");
  const raw = await fs.readFile(filePath, "utf-8").catch(() => "");
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function writeManifestAtDir(dirPath: string, manifest: Record<string, unknown>): Promise<void> {
  await fs.writeFile(path.join(dirPath, "manifest.json"), JSON.stringify(manifest, null, 2));
}

async function readPlanTitle(dirPath: string): Promise<string | undefined> {
  try {
    const raw = await fs.readFile(path.join(dirPath, "plan.json"), "utf-8");
    const plan = JSON.parse(raw) as { episodeTitle?: string };
    return typeof plan.episodeTitle === "string" ? plan.episodeTitle : undefined;
  } catch {
    return undefined;
  }
}

async function loadManifestForIdentity(
  identity: EpisodeIdentity,
  options?: { repair?: boolean },
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
    manifest.status = "considering";
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
  await writeManifestAtDir(dirPath, manifest);
  return manifest;
}

export async function readScriptMeta(number: number, slug: string): Promise<ScriptMeta | null> {
  const identity = resolveEpisodeIdentity(number, slug);
  const dirPath = episodeDirPath(OUTPUTS_DIR, identity);
  const exists = await fs.access(dirPath).then(() => true).catch(() => false);
  if (!exists) return null;

  const m = await loadManifestForIdentity(identity, { repair: true });
  const updatedAt = m.script_updated_at;
  const updatedBy = m.script_updated_by;
  if (typeof updatedAt !== "string" || typeof updatedBy !== "string") return null;
  return {
    updatedAt,
    updatedBy,
    planFingerprint: typeof m.script_plan_fingerprint === "string" ? m.script_plan_fingerprint : undefined,
    recordedPlanFingerprint:
      typeof m.recorded_plan_fingerprint === "string" ? m.recorded_plan_fingerprint : undefined,
  };
}

export async function updateRecordedPlanFingerprint(
  number: number,
  slug: string,
  planFingerprint: string,
): Promise<void> {
  const identity = resolveEpisodeIdentity(number, slug);
  const dirPath = episodeDirPath(OUTPUTS_DIR, identity);
  const m = await loadManifestForIdentity(identity, { repair: true });
  m.recorded_plan_fingerprint = planFingerprint;
  await writeManifestAtDir(dirPath, m);
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
  const exists = await fs.access(dirPath).then(() => true).catch(() => false);
  if (!exists) {
    throw new Error(`Episode folder not found: ${identity.dirName}`);
  }

  const m = await loadManifestForIdentity(identity, { repair: true });
  const meta: ScriptMeta = {
    updatedAt: new Date().toISOString(),
    updatedBy: options.updatedBy?.trim() || getStudioUserName(),
    planFingerprint: options.planFingerprint
      ? options.planFingerprint
      : typeof m.script_plan_fingerprint === "string"
        ? m.script_plan_fingerprint
        : undefined,
  };
  m.script_updated_at = meta.updatedAt;
  m.script_updated_by = meta.updatedBy;
  if (meta.planFingerprint) {
    m.script_plan_fingerprint = meta.planFingerprint;
  }
  await writeManifestAtDir(dirPath, m);
  return meta;
}

export async function listEpisodes(): Promise<Episode[]> {
  const entries = await fs.readdir(OUTPUTS_DIR, { withFileTypes: true }).catch(() => []);
  const episodes: Episode[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".") || entry.name === "没") continue;

    const identity = parseEpisodeDirName(entry.name);
    if (!identity) continue;

    try {
      const dirPath = episodeDirPath(OUTPUTS_DIR, identity);
      const m = await loadManifestForIdentity(identity, { repair: true });
      const scriptContent = await fs
        .readFile(path.join(dirPath, "01-script-draft.md"), "utf-8")
        .catch(() => "");

      episodes.push({
        id: String(identity.number),
        number: identity.number,
        slug: identity.slug,
        title: typeof m.title === "string" && m.title.trim() ? m.title : identity.slug,
        status: normalizeEpisodeStatus(typeof m.status === "string" ? m.status : undefined),
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

  const exists = await fs.access(dirPath).then(() => true).catch(() => false);
  if (exists) {
    throw new Error(`Episode folder already exists: ${identity.dirName}`);
  }

  await fs.mkdir(dirPath, { recursive: true });

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
  const exists = await fs.access(dirPath).then(() => true).catch(() => false);
  if (!exists) {
    throw new Error(`Episode folder not found: ${identity.dirName}`);
  }
  return dirPath;
}

export async function readEpisodeFile(number: number, slug: string, filename: string): Promise<string> {
  const identity = resolveEpisodeIdentity(number, slug);
  const dirPath = await assertEpisodeDirExists(identity);
  return fs.readFile(path.join(dirPath, filename), "utf-8").catch(() => "");
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
  await fs.writeFile(path.join(dirPath, filename), content, "utf-8");
  if (filename === "01-script-draft.md" && scriptMeta) {
    return updateScriptMeta(number, slug, scriptMeta);
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

export async function updateManifestStatus(number: number, slug: string, status: EpisodeStatus): Promise<void> {
  const identity = resolveEpisodeIdentity(number, slug);
  const dirPath = await assertEpisodeDirExists(identity);
  const m = await loadManifestForIdentity(identity, { repair: true });
  m.status = status;
  await writeManifestAtDir(dirPath, m);
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
  const newPath = episodeDirPath(OUTPUTS_DIR, newIdentity);

  const newExists = await fs.access(newPath).then(() => true).catch(() => false);
  if (newExists) {
    throw new Error(`#${newNumber} は既に使用されています`);
  }

  const oldExists = await fs.access(oldPath).then(() => true).catch(() => false);
  if (!oldExists) {
    throw new Error("Episode folder not found");
  }

  const m = await loadManifestForIdentity(oldIdentity, { repair: true });
  const updated = mergeManifestIdentity(newIdentity, { ...m, id: String(newNumber), slug });
  await writeManifestAtDir(oldPath, updated);
  await fs.rename(oldPath, newPath);

  return {
    id: String(newNumber),
    number: newNumber,
    slug,
    title: typeof updated.title === "string" ? updated.title : slug,
    status: normalizeEpisodeStatus(typeof updated.status === "string" ? updated.status : undefined),
    themePattern: updated.theme_pattern as Episode["themePattern"],
    createdAt: typeof updated.created_at === "string" ? updated.created_at : "",
    hook: typeof updated.hook === "string" ? updated.hook : undefined,
    targetPain: typeof updated.target_pain === "string" ? updated.target_pain : undefined,
    reason: typeof updated.reason === "string" ? updated.reason : undefined,
  };
}

export async function deleteEpisodes(
  targets: EpisodeDeleteTarget[],
  mode: "archive" | "permanent" = "archive",
): Promise<EpisodeDeleteResult> {
  const deleted: EpisodeDeleteTarget[] = [];
  const errors: EpisodeDeleteResult["errors"] = [];

  if (mode === "archive") {
    await fs.mkdir(ARCHIVE_DIR, { recursive: true });
  }

  for (const target of targets) {
    try {
      const identity = resolveEpisodeIdentity(target.number, target.slug);
      const sourcePath = episodeDirPath(OUTPUTS_DIR, identity);
      const sourceExists = await fs.access(sourcePath).then(() => true).catch(() => false);
      if (!sourceExists) {
        errors.push({ target, error: "フォルダが見つかりません" });
        continue;
      }

      if (mode === "archive") {
        const destPath = episodeDirPath(ARCHIVE_DIR, identity);
        const destExists = await fs.access(destPath).then(() => true).catch(() => false);
        if (destExists) {
          errors.push({ target, error: "没フォルダに同名の案件が既にあります" });
          continue;
        }
        await fs.rename(sourcePath, destPath);
      } else {
        await fs.rm(sourcePath, { recursive: true, force: true });
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
