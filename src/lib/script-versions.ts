import { getSupabaseServer } from "@/lib/supabase-server";
import type { DiffStats } from "@/lib/script-diff";

export type ScriptSnapshot = {
  id: string;
  episodeNumber: number;
  episodeSlug: string;
  authorName: string;
  summary: string;
  content: string;
  diffStats: DiffStats | null;
  createdAt: string;
};

type SnapshotRow = {
  id: string;
  episode_number: number;
  episode_slug: string;
  author_name: string;
  summary: string;
  content: string;
  diff_stats: DiffStats | null;
  created_at: string;
};

function mapRow(row: SnapshotRow): ScriptSnapshot {
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

export async function listScriptSnapshots(
  episodeNumber: number,
  episodeSlug: string,
  limit = 50,
): Promise<ScriptSnapshot[]> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("script_snapshots")
    .select("*")
    .eq("episode_number", episodeNumber)
    .eq("episode_slug", episodeSlug)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data as SnapshotRow[]).map(mapRow);
}

export async function getLatestScriptSnapshot(
  episodeNumber: number,
  episodeSlug: string,
): Promise<ScriptSnapshot | null> {
  const list = await listScriptSnapshots(episodeNumber, episodeSlug, 1);
  return list[0] ?? null;
}

export async function getScriptSnapshotById(id: string): Promise<ScriptSnapshot | null> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("script_snapshots")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapRow(data as SnapshotRow);
}

export async function createScriptSnapshot(input: {
  episodeNumber: number;
  episodeSlug: string;
  authorName: string;
  summary: string;
  content: string;
  diffStats: DiffStats | null;
}): Promise<ScriptSnapshot> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("script_snapshots")
    .insert({
      episode_number: input.episodeNumber,
      episode_slug: input.episodeSlug,
      author_name: input.authorName,
      summary: input.summary,
      content: input.content,
      diff_stats: input.diffStats,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapRow(data as SnapshotRow);
}
