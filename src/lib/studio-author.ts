const STORAGE_KEY = "scriptstudio_author_name";

export function getStudioAuthorName(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(STORAGE_KEY)?.trim() ?? "";
}

export function setStudioAuthorName(name: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, name.trim());
}

/** ログアウト時に記録者名を消し、前ユーザー名の残留を防ぐ */
export function clearStudioAuthorName(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export type StudioAuthor = {
  name: string;
  /** true = ログイン session がサーバーで確認できた名前（編集不要・不可） */
  fromLogin: boolean;
};

/**
 * 記録者名を解決する。
 * - 認証有効: session のユーザー名が唯一の情報源（localStorage には保存しない）
 * - 認証無効（ローカル）: 入力記憶（localStorage）→ サーバーの既定名 の順で編集可能
 * - セッション切れ: 残留値を出さず空欄の編集可能にする（前ユーザー名での誤帰属を防ぐ）
 */
export async function resolveStudioAuthor(): Promise<StudioAuthor> {
  try {
    const res = await fetch("/api/site-auth/me");
    const data = (await res.json()) as {
      authEnabled?: boolean;
      username?: string | null;
    };
    const username = data.username?.trim() ?? "";
    if (data.authEnabled) {
      return username
        ? { name: username, fromLogin: true }
        : { name: "", fromLogin: false };
    }
    return { name: getStudioAuthorName() || username, fromLogin: false };
  } catch {
    // オフライン等: 記憶値を初期値に、編集可能で返す
    return { name: getStudioAuthorName(), fromLogin: false };
  }
}
