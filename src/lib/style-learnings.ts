import type { DiffStats } from "@/lib/script-diff";
import {
  readLocalStyleLearnings,
  writeLocalStyleLearnings,
} from "@/lib/style-learnings-local";

/**
 * 「あらきりらしさメモ」＝推敲比較（元原稿と確定稿の差分）から学習した文体の参考データ。
 * 執筆・部分修正の system プロンプトに注入され、AI の書き方を本人に寄せるために使う。
 * 保存先は config/voice-learnings.md（style-learnings-local.ts）だけ。
 */

/**
 * 現行メモを読む。プロンプト注入用のため、保存先に到達できなくても
 * 生成を止めない（失敗時は空を返す）。
 */
export async function readCurrentStyleLearnings(): Promise<{
  content: string;
  updatedAt: string | null;
}> {
  try {
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
  await writeLocalStyleLearnings(input.content);
  return { updatedAt: new Date().toISOString() };
}
