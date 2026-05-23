import fs from "fs/promises";
import path from "path";
import type { Episode } from "./types";
import { normalizeEpisodeStatus, type EpisodeStatus } from "./episode-status";
import { hasRevision, hasScriptDraft } from "./script-calib";
import { sortEpisodesByNumberDesc } from "./episode-sort";
import { getStudioUserName } from "./studio-user";

const ROOT = process.cwd();
const OUTPUTS_DIR = path.join(ROOT, "outputs");

export interface ScriptMeta {
  updatedAt: string;
  updatedBy: string;
  planFingerprint?: string;
}

function manifestPath(number: number, slug: string): string {
  const dirName = `${String(number).padStart(2, "0")}-${slug}`;
  return path.join(OUTPUTS_DIR, dirName, "manifest.json");
}

async function readManifestRaw(number: number, slug: string): Promise<Record<string, unknown>> {
  const raw = await fs.readFile(manifestPath(number, slug), "utf-8").catch(() => "{}");
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function writeManifestRaw(number: number, slug: string, manifest: Record<string, unknown>): Promise<void> {
  await fs.writeFile(manifestPath(number, slug), JSON.stringify(manifest, null, 2));
}

export async function readScriptMeta(number: number, slug: string): Promise<ScriptMeta | null> {
  const m = await readManifestRaw(number, slug);
  const updatedAt = m.script_updated_at;
  const updatedBy = m.script_updated_by;
  if (typeof updatedAt !== "string" || typeof updatedBy !== "string") return null;
  return {
    updatedAt,
    updatedBy,
    planFingerprint: typeof m.script_plan_fingerprint === "string" ? m.script_plan_fingerprint : undefined,
  };
}

export async function updateScriptMeta(
  number: number,
  slug: string,
  options: { source: "generation" | "manual"; planFingerprint?: string },
): Promise<ScriptMeta> {
  const m = await readManifestRaw(number, slug);
  const meta: ScriptMeta = {
    updatedAt: new Date().toISOString(),
    updatedBy: getStudioUserName(),
    planFingerprint:
      options.source === "generation" && options.planFingerprint
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
  await writeManifestRaw(number, slug, m);
  return meta;
}

export async function listEpisodes(): Promise<Episode[]> {
  const entries = await fs.readdir(OUTPUTS_DIR, { withFileTypes: true }).catch(() => []);
  const episodes: Episode[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".") || entry.name === "没") continue;
    const manifestPath = path.join(OUTPUTS_DIR, entry.name, "manifest.json");
    try {
      const raw = await fs.readFile(manifestPath, "utf-8");
      const m = JSON.parse(raw);
      const number = Number(m.id ?? 0);
      const slug = m.slug ?? entry.name;
      const scriptContent = await readEpisodeFile(number, slug, "01-script-draft.md").catch(
        () => "",
      );
      episodes.push({
        id: m.id ?? entry.name,
        number,
        slug,
        title: m.title ?? entry.name,
        status: normalizeEpisodeStatus(m.status),
        themePattern: m.theme_pattern,
        createdAt: m.created_at ?? "",
        hook: m.hook,
        targetPain: m.target_pain,
        reason: m.reason,
        hasScriptDraft: hasScriptDraft(scriptContent),
        hasRevision: hasRevision(scriptContent),
      });
    } catch {
      // manifest.json がないフォルダはスキップ
    }
  }

  return sortEpisodesByNumberDesc(episodes);
}

export async function createEpisode(episode: Omit<Episode, "createdAt">): Promise<Episode> {
  const slug = episode.slug || episode.title.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").slice(0, 50);
  const dirName = `${String(episode.number).padStart(2, "0")}-${slug}`;
  const dirPath = path.join(OUTPUTS_DIR, dirName);
  await fs.mkdir(dirPath, { recursive: true });

  const ep: Episode = { ...episode, slug, createdAt: new Date().toISOString().slice(0, 10) };
  const manifest = {
    id: String(episode.number),
    slug,
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
  await fs.writeFile(path.join(dirPath, "manifest.json"), JSON.stringify(manifest, null, 2));
  return ep;
}

export async function readEpisodeFile(number: number, slug: string, filename: string): Promise<string> {
  const dirName = `${String(number).padStart(2, "0")}-${slug}`;
  const filePath = path.join(OUTPUTS_DIR, dirName, filename);
  return fs.readFile(filePath, "utf-8").catch(() => "");
}

export async function writeEpisodeFile(
  number: number,
  slug: string,
  filename: string,
  content: string,
  scriptMeta?: { source: "generation" | "manual"; planFingerprint?: string },
): Promise<ScriptMeta | null> {
  const dirName = `${String(number).padStart(2, "0")}-${slug}`;
  const dirPath = path.join(OUTPUTS_DIR, dirName);
  await fs.mkdir(dirPath, { recursive: true });
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
  try { return JSON.parse(content); } catch { return null; }
}

export async function updateManifestStatus(number: number, slug: string, status: EpisodeStatus): Promise<void> {
  const dirName = `${String(number).padStart(2, "0")}-${slug}`;
  const manifestPath = path.join(OUTPUTS_DIR, dirName, "manifest.json");
  const raw = await fs.readFile(manifestPath, "utf-8");
  const m = JSON.parse(raw);
  m.status = status;
  await fs.writeFile(manifestPath, JSON.stringify(m, null, 2));
}

export async function updateManifestTitle(number: number, slug: string, title: string): Promise<void> {
  const dirName = `${String(number).padStart(2, "0")}-${slug}`;
  const manifestPath = path.join(OUTPUTS_DIR, dirName, "manifest.json");
  const raw = await fs.readFile(manifestPath, "utf-8").catch(() => "{}");
  const m = JSON.parse(raw);
  m.title = title;
  await fs.writeFile(manifestPath, JSON.stringify(m, null, 2));
}

export async function updateEpisodeNumber(
  oldNumber: number,
  slug: string,
  newNumber: number,
): Promise<Episode> {
  if (oldNumber === newNumber) {
    const episodes = await listEpisodes();
    const current = episodes.find((e) => e.number === oldNumber && e.slug === slug);
    if (!current) throw new Error("Episode not found");
    return current;
  }

  const oldDirName = `${String(oldNumber).padStart(2, "0")}-${slug}`;
  const newDirName = `${String(newNumber).padStart(2, "0")}-${slug}`;
  const oldPath = path.join(OUTPUTS_DIR, oldDirName);
  const newPath = path.join(OUTPUTS_DIR, newDirName);

  const newExists = await fs.access(newPath).then(() => true).catch(() => false);
  if (newExists) {
    throw new Error(`#${newNumber} は既に使用されています`);
  }

  const oldExists = await fs.access(oldPath).then(() => true).catch(() => false);
  if (!oldExists) {
    throw new Error("Episode folder not found");
  }

  const manifestPath = path.join(oldPath, "manifest.json");
  const raw = await fs.readFile(manifestPath, "utf-8");
  const m = JSON.parse(raw);
  m.id = String(newNumber);
  await fs.writeFile(manifestPath, JSON.stringify(m, null, 2));
  await fs.rename(oldPath, newPath);

  return {
    id: String(newNumber),
    number: newNumber,
    slug,
    title: m.title ?? slug,
    status: normalizeEpisodeStatus(m.status),
    themePattern: m.theme_pattern,
    createdAt: m.created_at ?? "",
    hook: m.hook,
    targetPain: m.target_pain,
    reason: m.reason,
  };
}
