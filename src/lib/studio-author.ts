const STORAGE_KEY = "scriptstudio_author_name";

export function getStudioAuthorName(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(STORAGE_KEY)?.trim() ?? "";
}

export function setStudioAuthorName(name: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, name.trim());
}

/** ログイン ID を優先して記録者名を取得 */
export async function resolveStudioAuthorName(): Promise<string> {
  try {
    const res = await fetch("/api/site-auth/me");
    const data = (await res.json()) as { username?: string | null };
    if (data.username?.trim()) {
      setStudioAuthorName(data.username.trim());
      return data.username.trim();
    }
  } catch {
    // オフライン等
  }
  return getStudioAuthorName();
}
