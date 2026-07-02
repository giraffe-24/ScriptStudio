import { getSupabaseServer } from "@/lib/supabase-server";

/**
 * 企画書（plan.json）バージョン履歴の本番ストア（Supabase）。
 * 台本の script-versions.ts と対称。content には企画書の JSON 文字列を保存する。
 */

export type PlanSnapshot = {
  id: string;
  episodeNumber: number;
  episodeSlug: string;
  authorName: string;
  summary: string;
  content: string;
  createdAt: string;
};

type PlanSnapshotRow = {
  id: string;
  episode_number: number;
  episode_slug: string;
  author_name: string;
  summary: string;
  content: string;
  created_at: string;
};

function mapRow(row: PlanSnapshotRow): PlanSnapshot {
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

export async function listPlanSnapshots(
  episodeNumber: number,
  episodeSlug: string,
  limit = 50,
): Promise<PlanSnapshot[]> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("plan_snapshots")
    .select("*")
    .eq("episode_number", episodeNumber)
    .eq("episode_slug", episodeSlug)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data as PlanSnapshotRow[]).map(mapRow);
}

export async function getLatestPlanSnapshot(
  episodeNumber: number,
  episodeSlug: string,
): Promise<PlanSnapshot | null> {
  const list = await listPlanSnapshots(episodeNumber, episodeSlug, 1);
  return list[0] ?? null;
}

export async function getPlanSnapshotById(id: string): Promise<PlanSnapshot | null> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("plan_snapshots")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapRow(data as PlanSnapshotRow);
}

export async function createPlanSnapshot(input: {
  episodeNumber: number;
  episodeSlug: string;
  authorName: string;
  summary: string;
  content: string;
}): Promise<PlanSnapshot> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("plan_snapshots")
    .insert({
      episode_number: input.episodeNumber,
      episode_slug: input.episodeSlug,
      author_name: input.authorName,
      summary: input.summary,
      content: input.content,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapRow(data as PlanSnapshotRow);
}
