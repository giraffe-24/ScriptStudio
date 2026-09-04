#!/usr/bin/env node
/**
 * Supabase（Vercel 本番の永続化層）→ ローカルのファイル形式へ一回きりで書き戻す移行スクリプト。
 *
 * 使い方:
 *   node --env-file=.env scripts/migrate-export-supabase.mjs          # dry-run（差分レポートのみ）
 *   node --env-file=.env scripts/migrate-export-supabase.mjs --apply  # 実際に書き込む
 *
 * 対象:
 *   - Storage scriptstudio-episodes          → outputs/ , outputs/没/
 *   - Storage scriptstudio-script-meta       → outputs/<dir>/manifest.json のメタ
 *   - Storage scriptstudio-competitors-config → config/competitors.md
 *   - Table   plan_snapshots                 → .plan-history/<NN>-<slug>.json
 *   - Table   script_snapshots               → .script-history/<NN>-<slug>.json
 *   - Table   style_learnings                → config/voice-learnings.md（最新1行）
 *                                              docs/migration/style-learnings-archive.json（全行）
 *
 * 注意: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY の値は一切出力しない。
 *       git 操作は行わない（差分の確定は呼び出し側の責任）。
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUTS_DIR = path.join(ROOT, "outputs");
const ARCHIVE_DIR = path.join(OUTPUTS_DIR, "没");
const PLAN_HISTORY_DIR = path.join(ROOT, ".plan-history");
const SCRIPT_HISTORY_DIR = path.join(ROOT, ".script-history");
const CONFIG_DIR = path.join(ROOT, "config");
const MIGRATION_DOCS_DIR = path.join(ROOT, "docs", "migration");

// バケット名は src/lib の各ストアと一致させること。
const EPISODES_BUCKET = "scriptstudio-episodes";
const SCRIPT_META_BUCKET = "scriptstudio-script-meta";
const COMPETITORS_BUCKET = "scriptstudio-competitors-config";
const KNOWN_BUCKETS = [EPISODES_BUCKET, SCRIPT_META_BUCKET, COMPETITORS_BUCKET];

const INDEX_OBJECT_PATH = "_meta/index.json";
const COMPETITORS_OBJECT_PATH = "competitors.json";

// competitors-config.ts の TABLE_HEADER と同一にすること。
const COMPETITORS_TABLE_HEADER = `# 競合チャンネル（承認済み）

| channelId | displayName | addedAt | enabled |
|-----------|-------------|---------|---------|
`;

const APPLY = process.argv.includes("--apply");
const LIST_PAGE_SIZE = 1000;
const TABLE_PAGE_SIZE = 1000;

/** ログに秘匿値が混じらないよう、URL とキーの断片を伏せる。 */
function redact(value) {
  let text = value instanceof Error ? value.message : String(value ?? "");
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (url) text = text.split(url).join("<SUPABASE_URL>");
  if (key) text = text.split(key).join("<SUPABASE_SERVICE_ROLE_KEY>");
  return text;
}

function log(line = "") {
  process.stdout.write(`${line}\n`);
}

function rel(absPath) {
  return path.relative(ROOT, absPath) || ".";
}

/** episode-identity.ts の episodeDirName と同じ規則（番号は2桁ゼロ埋め）。 */
function episodeDirName(number, slug) {
  return `${String(number).padStart(2, "0")}-${slug}`;
}

/** episode-files-store.ts の normalizeIndex と同じ正規化。 */
function normalizeIndex(input) {
  const uniq = (values) =>
    Array.isArray(values)
      ? [
          ...new Set(
            values
              .filter((value) => typeof value === "string" && Boolean(value.trim()))
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

// ---------------------------------------------------------------------------
// レポート収集
// ---------------------------------------------------------------------------

const report = {
  buckets: [],
  unknownBuckets: [],
  fileWrites: [], // { path, state: "new" | "diff" | "same", note? }
  dirDeletes: [], // { path, exists }
  manifestUpdates: [], // { path, from, to, by }
  manifestSkips: [], // { path, reason }
  historyFiles: [], // { path, localOnly, fromSupabase, merged, state }
  warnings: [],
};

function recordWrite(absPath, nextContent, prevContent, note) {
  const state =
    prevContent === null ? "new" : prevContent === nextContent ? "same" : "diff";
  report.fileWrites.push({ path: rel(absPath), state, note });
  return state;
}

async function readLocalTextOrNull(absPath) {
  try {
    return await fs.readFile(absPath, "utf-8");
  } catch {
    return null;
  }
}

async function writeFileIfApplying(absPath, content) {
  if (!APPLY) return;
  await fs.mkdir(path.dirname(absPath), { recursive: true });
  await fs.writeFile(absPath, content, "utf-8");
}

// ---------------------------------------------------------------------------
// Supabase ヘルパー
// ---------------------------------------------------------------------------

function createSupabase() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が未設定です（node --env-file=.env で実行してください）",
    );
  }
  if (key.startsWith("sb_publishable_")) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY に publishable キーが入っています。Secret / service_role キーを使ってください",
    );
  }
  return createClient(url, key);
}

/** storage.list() は1階層分しか返さない。1000件超に備えてページングする。 */
async function listStorageEntries(supabase, bucket, prefix) {
  const entries = [];
  for (let offset = 0; ; offset += LIST_PAGE_SIZE) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(prefix, { limit: LIST_PAGE_SIZE, offset });
    if (error) throw new Error(redact(error.message));
    const page = data ?? [];
    entries.push(...page);
    if (page.length < LIST_PAGE_SIZE) break;
  }
  return entries;
}

/** list() の結果からファイル（フォルダでない）だけを返す。 */
function fileNamesOf(entries) {
  return entries
    .filter((entry) => typeof entry?.name === "string")
    .filter((entry) => !entry.name.endsWith("/"))
    .filter((entry) => entry.name !== ".emptyFolderPlaceholder")
    // フォルダは id / metadata がいずれも null で返る（Supabase Storage の仕様）。
    // 取りこぼしを避けるため、どちらかが埋まっていればファイルとして扱う。
    .filter((entry) => entry.id != null || entry.metadata != null)
    .map((entry) => entry.name);
}

async function downloadText(supabase, bucket, objectPath) {
  const { data, error } = await supabase.storage.from(bucket).download(objectPath);
  if (error) {
    const message = redact(error.message);
    if (/not found|does not exist|resource.*not found/i.test(message)) return null;
    throw new Error(message);
  }
  return data.text();
}

/** テーブル全行をページングして取得する。 */
async function fetchAllRows(supabase, table, orderColumn) {
  const rows = [];
  for (let from = 0; ; from += TABLE_PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order(orderColumn, { ascending: false })
      .range(from, from + TABLE_PAGE_SIZE - 1);
    if (error) throw new Error(redact(error.message));
    const page = data ?? [];
    rows.push(...page);
    if (page.length < TABLE_PAGE_SIZE) break;
  }
  return rows;
}

// ---------------------------------------------------------------------------
// 1. バケット一覧
// ---------------------------------------------------------------------------

async function inspectBuckets(supabase) {
  const { data, error } = await supabase.storage.listBuckets();
  if (error) throw new Error(redact(error.message));
  const names = (data ?? []).map((bucket) => bucket.name).sort();
  report.buckets = names;
  report.unknownBuckets = names.filter((name) => !KNOWN_BUCKETS.includes(name));
}

// ---------------------------------------------------------------------------
// 2. エピソード本体（scriptstudio-episodes）
// ---------------------------------------------------------------------------

function localBaseDir(base) {
  return base === "archive" ? ARCHIVE_DIR : OUTPUTS_DIR;
}

async function exportEpisodeBase(supabase, index, base) {
  const dirNames = base === "archive" ? index.archive : index.outputs;
  for (const dirName of dirNames) {
    let entries;
    try {
      entries = await listStorageEntries(supabase, EPISODES_BUCKET, `${base}/${dirName}`);
    } catch (error) {
      report.warnings.push(`${base}/${dirName} の一覧取得に失敗: ${redact(error)}`);
      continue;
    }
    const fileNames = fileNamesOf(entries);
    if (fileNames.length === 0) {
      report.warnings.push(
        `${base}/${dirName} はバケット上にファイルがありません（ローカルのファイルをそのまま残します）`,
      );
      continue;
    }
    for (const fileName of fileNames) {
      const objectPath = `${base}/${dirName}/${fileName}`;
      let content;
      try {
        content = await downloadText(supabase, EPISODES_BUCKET, objectPath);
      } catch (error) {
        report.warnings.push(`${objectPath} のダウンロードに失敗: ${redact(error)}`);
        continue;
      }
      if (content === null) {
        report.warnings.push(`${objectPath} が見つかりません（一覧には存在）`);
        continue;
      }
      const absPath = path.join(localBaseDir(base), dirName, fileName);
      const prev = await readLocalTextOrNull(absPath);
      recordWrite(absPath, content, prev);
      await writeFileIfApplying(absPath, content);
    }
  }
}

async function planEpisodeDeletions(index) {
  const targets = [
    ...index.hiddenOutputs
      .filter((dirName) => !index.outputs.includes(dirName))
      .map((dirName) => path.join(OUTPUTS_DIR, dirName)),
    ...index.hiddenArchive
      .filter((dirName) => !index.archive.includes(dirName))
      .map((dirName) => path.join(ARCHIVE_DIR, dirName)),
  ];
  for (const absPath of targets) {
    const exists = await fs
      .stat(absPath)
      .then(() => true)
      .catch(() => false);
    report.dirDeletes.push({ path: rel(absPath), exists });
    if (exists && APPLY) {
      await fs.rm(absPath, { recursive: true, force: true });
    }
  }
}

async function exportEpisodes(supabase) {
  const raw = await downloadText(supabase, EPISODES_BUCKET, INDEX_OBJECT_PATH);
  if (raw === null) {
    report.warnings.push(
      `${EPISODES_BUCKET}/${INDEX_OBJECT_PATH} が見つかりません。エピソード本体の移行をスキップしました`,
    );
    return null;
  }
  let index;
  try {
    index = normalizeIndex(JSON.parse(raw));
  } catch (error) {
    report.warnings.push(`index.json の解析に失敗: ${redact(error)}`);
    return null;
  }

  await exportEpisodeBase(supabase, index, "outputs");
  await exportEpisodeBase(supabase, index, "archive");
  await planEpisodeDeletions(index);
  return index;
}

// ---------------------------------------------------------------------------
// 3. 台本メタ（scriptstudio-script-meta）→ manifest.json
// ---------------------------------------------------------------------------

/** バケット側のオブジェクト名は script-meta-store.ts の `${number}-${slug}.json`（ゼロ埋めなし）。 */
function parseScriptMetaObjectName(name) {
  const match = name.match(/^(\d{1,3})-(.+)\.json$/);
  if (!match) return null;
  const number = Number(match[1]);
  if (!Number.isInteger(number) || number <= 0) return null;
  return { number, slug: match[2] };
}

async function findManifestPath(dirName) {
  for (const dir of [OUTPUTS_DIR, ARCHIVE_DIR]) {
    const absPath = path.join(dir, dirName, "manifest.json");
    const exists = await fs
      .stat(absPath)
      .then(() => true)
      .catch(() => false);
    if (exists) return absPath;
  }
  return null;
}

async function exportScriptMeta(supabase) {
  let entries;
  try {
    entries = await listStorageEntries(supabase, SCRIPT_META_BUCKET, "");
  } catch (error) {
    report.warnings.push(`${SCRIPT_META_BUCKET} の一覧取得に失敗: ${redact(error)}`);
    return;
  }

  for (const name of fileNamesOf(entries)) {
    const identity = parseScriptMetaObjectName(name);
    if (!identity) {
      report.warnings.push(`${SCRIPT_META_BUCKET}/${name} は命名規則に合わないためスキップ`);
      continue;
    }

    let raw;
    try {
      raw = await downloadText(supabase, SCRIPT_META_BUCKET, name);
    } catch (error) {
      report.warnings.push(`${SCRIPT_META_BUCKET}/${name} のダウンロードに失敗: ${redact(error)}`);
      continue;
    }
    if (raw === null) continue;

    let meta;
    try {
      meta = JSON.parse(raw);
    } catch (error) {
      report.warnings.push(`${SCRIPT_META_BUCKET}/${name} の解析に失敗: ${redact(error)}`);
      continue;
    }
    if (typeof meta?.updatedAt !== "string" || typeof meta?.updatedBy !== "string") {
      report.warnings.push(`${SCRIPT_META_BUCKET}/${name} に updatedAt / updatedBy がありません`);
      continue;
    }

    const dirName = episodeDirName(identity.number, identity.slug);
    const manifestPath = await findManifestPath(dirName);
    if (!manifestPath) {
      report.manifestSkips.push({
        path: `outputs/${dirName}/manifest.json`,
        reason: "manifest.json が見つかりません（該当エピソードはローカルに無い）",
      });
      continue;
    }

    const prevRaw = await readLocalTextOrNull(manifestPath);
    let manifest;
    try {
      manifest = JSON.parse(prevRaw ?? "{}");
    } catch (error) {
      report.manifestSkips.push({
        path: rel(manifestPath),
        reason: `manifest.json の解析に失敗: ${redact(error)}`,
      });
      continue;
    }

    const currentAt =
      typeof manifest.script_updated_at === "string" ? manifest.script_updated_at : "";
    // バケット側が新しいときだけ上書きする（ローカルの方が新しければ触らない）。
    if (currentAt && currentAt >= meta.updatedAt) {
      report.manifestSkips.push({
        path: rel(manifestPath),
        reason: `ローカルが同等以上に新しい（local=${currentAt} / bucket=${meta.updatedAt}）`,
      });
      continue;
    }

    manifest.script_updated_at = meta.updatedAt;
    manifest.script_updated_by = meta.updatedBy;
    // fingerprint は「台本と企画の乖離」表示の材料。Vercel 稼働中は manifest 側への
    // 書き込みが揮発するためバケットにしか残っていない可能性があり、あれば持ち帰る
    // （file-manager.ts の writeScriptMetaBestEffort と同じキー名）。
    if (typeof meta.planFingerprint === "string" && meta.planFingerprint) {
      manifest.script_plan_fingerprint = meta.planFingerprint;
    }
    if (typeof meta.recordedPlanFingerprint === "string" && meta.recordedPlanFingerprint) {
      manifest.recorded_plan_fingerprint = meta.recordedPlanFingerprint;
    }
    // file-manager.ts の writeManifestAtDir と同じ書式（末尾改行なし）。
    const nextRaw = JSON.stringify(manifest, null, 2);
    report.manifestUpdates.push({
      path: rel(manifestPath),
      from: currentAt || "(なし)",
      to: meta.updatedAt,
      by: meta.updatedBy,
    });
    await writeFileIfApplying(manifestPath, nextRaw);
  }
}

// ---------------------------------------------------------------------------
// 4. 競合チャンネル（scriptstudio-competitors-config）→ config/competitors.md
// ---------------------------------------------------------------------------

function normalizeCompetitor(input) {
  if (typeof input?.channelId !== "string" || !input.channelId.trim()) return null;
  if (typeof input?.displayName !== "string" || !input.displayName.trim()) return null;
  if (typeof input?.addedAt !== "string" || !input.addedAt.trim()) return null;
  return {
    channelId: input.channelId.trim(),
    displayName: input.displayName.trim(),
    addedAt: input.addedAt.trim(),
    enabled: input.enabled !== false,
  };
}

async function exportCompetitors(supabase) {
  let raw;
  try {
    raw = await downloadText(supabase, COMPETITORS_BUCKET, COMPETITORS_OBJECT_PATH);
  } catch (error) {
    report.warnings.push(`${COMPETITORS_BUCKET} の取得に失敗: ${redact(error)}`);
    return;
  }
  if (raw === null) {
    report.warnings.push(
      `${COMPETITORS_BUCKET}/${COMPETITORS_OBJECT_PATH} が見つかりません（競合チャンネルの移行をスキップ）`,
    );
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    report.warnings.push(`competitors.json の解析に失敗: ${redact(error)}`);
    return;
  }
  if (!Array.isArray(parsed)) {
    report.warnings.push("competitors.json が配列ではありません");
    return;
  }

  const channels = parsed.map(normalizeCompetitor).filter(Boolean);
  const rows = channels
    .map(
      (c) =>
        `| ${c.channelId} | ${c.displayName} | ${c.addedAt} | ${c.enabled !== false ? "true" : "false"} |`,
    )
    .join("\n");
  const content = `${COMPETITORS_TABLE_HEADER}${rows}\n`;

  const absPath = path.join(CONFIG_DIR, "competitors.md");
  const prev = await readLocalTextOrNull(absPath);
  recordWrite(absPath, content, prev, `${channels.length}件`);
  await writeFileIfApplying(absPath, content);
}

// ---------------------------------------------------------------------------
// 5. スナップショット履歴（plan_snapshots / script_snapshots）
// ---------------------------------------------------------------------------

function mapPlanRow(row) {
  return {
    id: row.id,
    episodeNumber: row.episode_number,
    episodeSlug: row.episode_slug,
    authorName: row.author_name,
    summary: row.summary,
    content: row.content,
    createdAt: row.created_at,
  };
}

function mapScriptRow(row) {
  return {
    id: row.id,
    episodeNumber: row.episode_number,
    episodeSlug: row.episode_slug,
    authorName: row.author_name,
    summary: row.summary,
    content: row.content,
    diffStats: row.diff_stats,
    createdAt: row.created_at,
  };
}

/** plan-versions-local.ts / script-versions-local.ts の sortNewestFirst と同じ並び。 */
function sortNewestFirst(snapshots) {
  return [...snapshots].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

async function exportSnapshots(supabase, options) {
  let rows;
  try {
    rows = await fetchAllRows(supabase, options.table, "created_at");
  } catch (error) {
    report.warnings.push(`${options.table} の取得に失敗: ${redact(error)}`);
    return;
  }

  const grouped = new Map();
  for (const row of rows) {
    const number = Number(row.episode_number);
    const slug = typeof row.episode_slug === "string" ? row.episode_slug : "";
    if (!Number.isInteger(number) || number <= 0 || !slug) {
      report.warnings.push(`${options.table} に不正な episode 識別子の行があります（id=${row.id}）`);
      continue;
    }
    const dirName = episodeDirName(number, slug);
    if (!grouped.has(dirName)) grouped.set(dirName, []);
    grouped.get(dirName).push(options.mapRow(row));
  }

  for (const [dirName, snapshots] of grouped) {
    const absPath = path.join(options.dir, `${dirName}.json`);
    const prevRaw = await readLocalTextOrNull(absPath);
    let existing = [];
    if (prevRaw) {
      try {
        const parsed = JSON.parse(prevRaw);
        if (Array.isArray(parsed)) existing = parsed;
      } catch (error) {
        report.warnings.push(`${rel(absPath)} の解析に失敗（ローカル分は捨てられます）: ${redact(error)}`);
      }
    }

    // id でマージする（同じ id は Supabase 側を採用）。ローカル開発中の履歴を消さないため。
    const byId = new Map();
    for (const snapshot of existing) {
      if (snapshot && typeof snapshot.id === "string") byId.set(snapshot.id, snapshot);
    }
    const beforeCount = byId.size;
    for (const snapshot of snapshots) byId.set(snapshot.id, snapshot);

    const merged = sortNewestFirst([...byId.values()]);
    // *-versions-local.ts の writeSnapshotFile と同じ書式（末尾改行なし）。
    const content = JSON.stringify(merged, null, 2);
    const state = prevRaw === null ? "new" : prevRaw === content ? "same" : "diff";
    report.historyFiles.push({
      path: rel(absPath),
      state,
      localOnly: beforeCount,
      fromSupabase: snapshots.length,
      total: merged.length,
    });
    await writeFileIfApplying(absPath, content);
  }
}

// ---------------------------------------------------------------------------
// 6. 文体学習メモ（style_learnings）
// ---------------------------------------------------------------------------

function mapLearningRow(row) {
  return {
    id: row.id,
    content: row.content,
    summary: row.summary,
    authorName: row.author_name,
    episodeTitle: row.episode_title,
    diffStats: row.diff_stats,
    createdAt: row.created_at,
  };
}

async function exportStyleLearnings(supabase) {
  let rows;
  try {
    rows = await fetchAllRows(supabase, "style_learnings", "created_at");
  } catch (error) {
    report.warnings.push(`style_learnings の取得に失敗: ${redact(error)}`);
    return;
  }
  if (rows.length === 0) {
    report.warnings.push("style_learnings に行がありません（voice-learnings.md は変更しません）");
    return;
  }

  const learnings = rows.map(mapLearningRow);
  const latest = learnings[0]; // created_at 降順

  // style-learnings-local.ts の writeLocalStyleLearnings と同じ書式。
  const voicePath = path.join(CONFIG_DIR, "voice-learnings.md");
  const content = `${String(latest.content ?? "").trim()}\n`;
  const prev = await readLocalTextOrNull(voicePath);
  recordWrite(voicePath, content, prev, `最新1行 createdAt=${latest.createdAt}`);
  await writeFileIfApplying(voicePath, content);

  const archivePath = path.join(MIGRATION_DOCS_DIR, "style-learnings-archive.json");
  const archiveContent = `${JSON.stringify(learnings, null, 2)}\n`;
  const prevArchive = await readLocalTextOrNull(archivePath);
  recordWrite(archivePath, archiveContent, prevArchive, `${learnings.length}行`);
  await writeFileIfApplying(archivePath, archiveContent);
}

// ---------------------------------------------------------------------------
// レポート出力
// ---------------------------------------------------------------------------

function printReport() {
  const mode = APPLY ? "APPLY（書き込み実行）" : "DRY-RUN（書き込みなし）";
  log("==========================================================");
  log(`ScriptStudio Supabase エクスポート  モード: ${mode}`);
  log(`リポジトリ: ${ROOT}`);
  log("==========================================================");

  log("");
  log("[1] Storage バケット一覧");
  for (const name of report.buckets) {
    const known = KNOWN_BUCKETS.includes(name) ? "既知" : "WARN 未知";
    log(`  - ${name}  (${known})`);
  }
  if (report.unknownBuckets.length > 0) {
    log(`  WARN: コード上の既知バケット以外があります: ${report.unknownBuckets.join(", ")}`);
  }

  const news = report.fileWrites.filter((entry) => entry.state === "new");
  const diffs = report.fileWrites.filter((entry) => entry.state === "diff");
  const sames = report.fileWrites.filter((entry) => entry.state === "same");

  log("");
  log(`[2] 上書き対象ファイル（内容が異なる） ${diffs.length}件`);
  for (const entry of diffs) {
    log(`  DIFF  ${entry.path}${entry.note ? `  (${entry.note})` : ""}`);
  }
  if (diffs.length === 0) log("  （なし）");

  log("");
  log(`[3] 新規作成ファイル ${news.length}件`);
  for (const entry of news) {
    log(`  NEW   ${entry.path}${entry.note ? `  (${entry.note})` : ""}`);
  }
  if (news.length === 0) log("  （なし）");

  log("");
  log(`[4] 内容一致（変更なし） ${sames.length}件`);

  log("");
  log(`[5] 削除対象ディレクトリ（本番で削除済み） ${report.dirDeletes.length}件`);
  for (const entry of report.dirDeletes) {
    const suffix = entry.exists
      ? APPLY
        ? "削除しました"
        : "ローカルに存在（--apply で削除）"
      : "ローカルに無い（何もしません）";
    log(`  DEL   ${entry.path}  ${suffix}`);
  }
  if (report.dirDeletes.length === 0) log("  （なし）");

  log("");
  log(`[6] manifest.json のメタ更新 ${report.manifestUpdates.length}件`);
  for (const entry of report.manifestUpdates) {
    log(`  META  ${entry.path}  ${entry.from} -> ${entry.to} (${entry.by})`);
  }
  if (report.manifestUpdates.length === 0) log("  （なし）");
  if (report.manifestSkips.length > 0) {
    log(`  スキップ ${report.manifestSkips.length}件:`);
    for (const entry of report.manifestSkips) {
      log(`    SKIP  ${entry.path}  ${entry.reason}`);
    }
  }

  log("");
  log(`[7] スナップショット履歴 ${report.historyFiles.length}ファイル`);
  for (const entry of report.historyFiles) {
    log(
      `  ${entry.state.toUpperCase().padEnd(4)}  ${entry.path}  ` +
        `既存${entry.localOnly}件 + Supabase${entry.fromSupabase}件 = 合計${entry.total}件`,
    );
  }
  if (report.historyFiles.length === 0) log("  （なし）");

  log("");
  log(`[8] 警告 ${report.warnings.length}件`);
  for (const warning of report.warnings) {
    log(`  WARN  ${warning}`);
  }
  if (report.warnings.length === 0) log("  （なし）");

  log("");
  log("----------------------------------------------------------");
  log(
    `合計: 上書き${diffs.length} / 新規${news.length} / 一致${sames.length} / ` +
      `削除${report.dirDeletes.filter((entry) => entry.exists).length} / ` +
      `メタ更新${report.manifestUpdates.length} / 履歴${report.historyFiles.length}`,
  );
  if (!APPLY) {
    log("dry-run です。内容を確認したうえで --apply を付けて再実行してください。");
  }
  log("----------------------------------------------------------");
}

// ---------------------------------------------------------------------------

async function main() {
  const supabase = createSupabase();
  await inspectBuckets(supabase);
  await exportEpisodes(supabase);
  await exportScriptMeta(supabase);
  await exportCompetitors(supabase);
  await exportSnapshots(supabase, {
    table: "plan_snapshots",
    dir: PLAN_HISTORY_DIR,
    mapRow: mapPlanRow,
  });
  await exportSnapshots(supabase, {
    table: "script_snapshots",
    dir: SCRIPT_HISTORY_DIR,
    mapRow: mapScriptRow,
  });
  await exportStyleLearnings(supabase);
  printReport();
}

main().catch((error) => {
  process.stderr.write(`移行スクリプトが失敗しました: ${redact(error)}\n`);
  process.exitCode = 1;
});
