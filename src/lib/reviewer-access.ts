import type { NextRequest } from "next/server";
import { getSessionUsernameFromRequest } from "./studio-session";
import { isReviewerUsername } from "./site-access";
import { episodeDirName } from "./episode-identity";

/** レビュアー向け表示で作成者名を置き換える値 */
export const MASKED_AUTHOR = "非公開";

/** このリクエストが閲覧専用（レビュアー）ユーザーによるものか */
export async function isReviewerRequest(req: NextRequest): Promise<boolean> {
  return isReviewerUsername(await getSessionUsernameFromRequest(req));
}

/**
 * レビュアーに見せてよいエピソードのフォルダ名集合（例: 59-gmailai2）。
 * アローリスト方式: REVIEWER_EPISODE_ALLOWLIST が未設定なら全エピソード非公開。
 * 「隠すものを列挙」ではなく「見せるものを列挙」にして、漏れをデフォルト非公開側に倒す。
 */
export function getReviewerEpisodeAllowlist(): Set<string> {
  const raw = process.env.REVIEWER_EPISODE_ALLOWLIST?.trim();
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean),
  );
}

export function isEpisodeAllowedForReviewer(number: number, slug: string): boolean {
  if (!Number.isInteger(number) || number <= 0 || !slug?.trim()) return false;
  return getReviewerEpisodeAllowlist().has(episodeDirName(number, slug.trim()));
}
