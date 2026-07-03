import fs from "fs/promises";
import path from "path";

/**
 * ローカル開発用の「あらきりらしさメモ」（推敲差分からの文体学習データ）。
 *
 * 本番（Vercel）ではファイルシステムが揮発するため Supabase の
 * `style_learnings` テーブルを使うが、ローカルでは config/voice-learnings.md に
 * Markdown で保存する。config/ に置くことで CLI エージェント（/執筆 など）からも
 * 参照でき、git で変更履歴も追える。
 */

const FILE_PATH = path.join(process.cwd(), "config", "voice-learnings.md");

export async function readLocalStyleLearnings(): Promise<{
  content: string;
  updatedAt: string | null;
}> {
  try {
    const [content, stat] = await Promise.all([
      fs.readFile(FILE_PATH, "utf-8"),
      fs.stat(FILE_PATH),
    ]);
    return { content: content.trim(), updatedAt: stat.mtime.toISOString() };
  } catch {
    return { content: "", updatedAt: null };
  }
}

export async function writeLocalStyleLearnings(content: string): Promise<void> {
  await fs.writeFile(FILE_PATH, `${content.trim()}\n`, "utf-8");
}
