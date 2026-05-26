import type { CompetitorChannel } from "@/lib/types";
import { getSupabaseServer, isSupabaseConfigured } from "@/lib/supabase-server";
import { ensurePersistedRuntimeStoreConfigured } from "@/lib/runtime-persistence";

const COMPETITORS_BUCKET = "scriptstudio-competitors-config";
const COMPETITORS_OBJECT_PATH = "competitors.json";
let bucketReady = false;

function isMissingStorageError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /not found|does not exist|bucket.*not found|resource.*not found/i.test(message);
}

function normalizeChannel(input: Partial<CompetitorChannel>): CompetitorChannel | null {
  if (typeof input.channelId !== "string" || !input.channelId.trim()) return null;
  if (typeof input.displayName !== "string" || !input.displayName.trim()) return null;
  if (typeof input.addedAt !== "string" || !input.addedAt.trim()) return null;
  return {
    channelId: input.channelId.trim(),
    displayName: input.displayName.trim(),
    addedAt: input.addedAt.trim(),
    enabled: input.enabled !== false,
  };
}

function parsePersistedCompetitors(raw: string): CompetitorChannel[] | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed
      .map((value) =>
        value && typeof value === "object"
          ? normalizeChannel(value as Partial<CompetitorChannel>)
          : null,
      )
      .filter((value): value is CompetitorChannel => value !== null);
  } catch {
    return null;
  }
}

async function ensureCompetitorsBucket(): Promise<void> {
  if (bucketReady || !isSupabaseConfigured()) return;
  const supabase = getSupabaseServer();
  const { data, error } = await supabase.storage.listBuckets();
  if (error) throw new Error(error.message);
  if (data?.some((bucket) => bucket.name === COMPETITORS_BUCKET)) {
    bucketReady = true;
    return;
  }
  const { error: createError } = await supabase.storage.createBucket(
    COMPETITORS_BUCKET,
    { public: false },
  );
  if (createError && !/already exists/i.test(createError.message)) {
    throw new Error(createError.message);
  }
  bucketReady = true;
}

export async function readPersistedCompetitorsConfig(): Promise<CompetitorChannel[] | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabaseServer();
  const { data, error } = await supabase.storage
    .from(COMPETITORS_BUCKET)
    .download(COMPETITORS_OBJECT_PATH);
  if (error) {
    if (isMissingStorageError(error)) return null;
    throw new Error(error.message);
  }
  const raw = await data.text();
  return parsePersistedCompetitors(raw);
}

async function uploadPersistedCompetitorsConfig(
  channels: CompetitorChannel[],
): Promise<void> {
  const supabase = getSupabaseServer();
  const payload = new Blob([JSON.stringify(channels, null, 2)], {
    type: "application/json",
  });
  const { error } = await supabase.storage
    .from(COMPETITORS_BUCKET)
    .upload(COMPETITORS_OBJECT_PATH, payload, {
      upsert: true,
      contentType: "application/json",
      cacheControl: "0",
    });
  if (error) throw new Error(error.message);
}

export async function writePersistedCompetitorsConfig(
  channels: CompetitorChannel[],
): Promise<CompetitorChannel[]> {
  ensurePersistedRuntimeStoreConfigured("競合チャンネル設定");
  if (!isSupabaseConfigured()) return channels;
  try {
    await ensureCompetitorsBucket();
    await uploadPersistedCompetitorsConfig(channels);
    return channels;
  } catch (error) {
    if (!isMissingStorageError(error)) throw error;
    bucketReady = false;
    await ensureCompetitorsBucket();
    await uploadPersistedCompetitorsConfig(channels);
    return channels;
  }
}
