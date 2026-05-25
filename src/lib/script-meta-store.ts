import { getSupabaseServer, isSupabaseConfigured } from "./supabase-server";

export interface PersistedScriptMeta {
  updatedAt: string;
  updatedBy: string;
  planFingerprint?: string;
  recordedPlanFingerprint?: string;
}

const SCRIPT_META_BUCKET = "scriptstudio-script-meta";
let bucketReady = false;

function buildObjectPath(number: number, slug: string): string {
  return `${number}-${slug}.json`;
}

function isMissingStorageError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /not found|does not exist|bucket.*not found|resource.*not found/i.test(message);
}

function parsePersistedScriptMeta(raw: string): PersistedScriptMeta | null {
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedScriptMeta>;
    if (typeof parsed.updatedAt !== "string" || typeof parsed.updatedBy !== "string") {
      return null;
    }
    return {
      updatedAt: parsed.updatedAt,
      updatedBy: parsed.updatedBy,
      planFingerprint:
        typeof parsed.planFingerprint === "string" ? parsed.planFingerprint : undefined,
      recordedPlanFingerprint:
        typeof parsed.recordedPlanFingerprint === "string"
          ? parsed.recordedPlanFingerprint
          : undefined,
    };
  } catch {
    return null;
  }
}

async function ensureScriptMetaBucket(): Promise<void> {
  if (bucketReady || !isSupabaseConfigured()) return;
  const supabase = getSupabaseServer();
  const { data, error } = await supabase.storage.listBuckets();
  if (error) throw new Error(error.message);
  if (data?.some((bucket) => bucket.name === SCRIPT_META_BUCKET)) {
    bucketReady = true;
    return;
  }
  const { error: createError } = await supabase.storage.createBucket(
    SCRIPT_META_BUCKET,
    { public: false },
  );
  if (createError && !/already exists/i.test(createError.message)) {
    throw new Error(createError.message);
  }
  bucketReady = true;
}

export async function readPersistedScriptMeta(
  number: number,
  slug: string,
): Promise<PersistedScriptMeta | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabaseServer();
  const { data, error } = await supabase.storage
    .from(SCRIPT_META_BUCKET)
    .download(buildObjectPath(number, slug));
  if (error) {
    if (isMissingStorageError(error)) return null;
    throw new Error(error.message);
  }
  const raw = await data.text();
  return parsePersistedScriptMeta(raw);
}

async function uploadPersistedScriptMeta(
  number: number,
  slug: string,
  meta: PersistedScriptMeta,
): Promise<void> {
  const supabase = getSupabaseServer();
  const payload = new Blob([JSON.stringify(meta, null, 2)], {
    type: "application/json",
  });
  const { error } = await supabase.storage
    .from(SCRIPT_META_BUCKET)
    .upload(buildObjectPath(number, slug), payload, {
      upsert: true,
      contentType: "application/json",
      cacheControl: "0",
    });
  if (error) throw new Error(error.message);
}

export async function writePersistedScriptMeta(
  number: number,
  slug: string,
  meta: PersistedScriptMeta,
): Promise<PersistedScriptMeta> {
  if (!isSupabaseConfigured()) return meta;
  try {
    await ensureScriptMetaBucket();
    await uploadPersistedScriptMeta(number, slug, meta);
    return meta;
  } catch (error) {
    if (!isMissingStorageError(error)) throw error;
    bucketReady = false;
    await ensureScriptMetaBucket();
    await uploadPersistedScriptMeta(number, slug, meta);
    return meta;
  }
}
