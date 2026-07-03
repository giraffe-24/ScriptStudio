import { getSupabaseServer, isSupabaseConfigured } from "@/lib/supabase-server";
import { shouldUsePersistedRuntimeStore } from "@/lib/runtime-persistence";
import type { DiffStats } from "@/lib/script-diff";
import {
  readLocalStyleLearnings,
  writeLocalStyleLearnings,
} from "@/lib/style-learnings-local";

/**
 * 「あらきりらしさメモ」＝推敲比較（元原稿と確定稿の差分）から学習した文体の参考データ。
 * 執筆・部分修正の system プロンプトに注入され、AI の書き方を本人に寄せるために使う。
 * - 本番（Vercel）: Supabase `style_learnings`（追記型。created_at 最新行が現行メモ）
 * - ローカル: config/voice-learnings.md（style-learnings-local.ts）
 */

export type StyleLearning = {
  id: string;
  content: string;
  summary: string;
  authorName: string;
  episodeTitle: string | null;
  diffStats: DiffStats | null;
  createdAt: string;
};

type LearningRow = {
  id: string;
  content: string;
  summary: string;
  author_name: string;
  episode_title: string | null;
  diff_stats: DiffStats | null;
  created_at: string;
};

function mapRow(row: LearningRow): StyleLearning {
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

/** Supabase を保存先に使うか（本番かつ設定あり）。false ならローカルファイル。 */
function remoteStoreEnabled(): boolean {
  return shouldUsePersistedRuntimeStore() && isSupabaseConfigured();
}

export async function getLatestStyleLearning(): Promise<StyleLearning | null> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("style_learnings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapRow(data as LearningRow) : null;
}

export async function createStyleLearning(input: {
  content: string;
  summary: string;
  authorName: string;
  episodeTitle: string | null;
  diffStats: DiffStats | null;
}): Promise<StyleLearning> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("style_learnings")
    .insert({
      content: input.content,
      summary: input.summary,
      author_name: input.authorName,
      episode_title: input.episodeTitle,
      diff_stats: input.diffStats,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapRow(data as LearningRow);
}

/**
 * 現行メモを読む。プロンプト注入用のため、保存先に到達できなくても
 * 生成を止めない（失敗時は空を返す）。
 */
export async function readCurrentStyleLearnings(): Promise<{
  content: string;
  updatedAt: string | null;
}> {
  try {
    if (remoteStoreEnabled()) {
      const latest = await getLatestStyleLearning();
      return { content: latest?.content ?? "", updatedAt: latest?.createdAt ?? null };
    }
    return await readLocalStyleLearnings();
  } catch {
    return { content: "", updatedAt: null };
  }
}

export async function saveStyleLearnings(input: {
  content: string;
  summary: string;
  authorName: string;
  episodeTitle: string | null;
  diffStats: DiffStats | null;
}): Promise<{ updatedAt: string }> {
  if (remoteStoreEnabled()) {
    const row = await createStyleLearning(input);
    return { updatedAt: row.createdAt };
  }
  await writeLocalStyleLearnings(input.content);
  return { updatedAt: new Date().toISOString() };
}
