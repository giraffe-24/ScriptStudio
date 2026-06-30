"use client";

import { useEffect, useState } from "react";
import { LogOut, UserRound } from "lucide-react";
import { clearStudioAuthorName } from "@/lib/studio-author";

/**
 * ログイン中のユーザー名を表示し、ログアウトできるメニュー。
 * - 認証有効（本番等）: 名前＋ログアウトボタン
 * - 認証無効（ローカル）: 名前のみ（ログアウト先が無いためボタンは出さない）
 *
 * compact=true ではボタンのラベルを省きアイコンのみにする（モバイル上部バー向け）。
 */
export function UserMenu({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const [username, setUsername] = useState("");
  const [authEnabled, setAuthEnabled] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/site-auth/me")
      .then((r) => r.json())
      .then((data: { authEnabled?: boolean; username?: string | null }) => {
        if (cancelled) return;
        setUsername(data?.username?.trim() ?? "");
        setAuthEnabled(Boolean(data?.authEnabled));
      })
      .catch(() => {
        // 取得に失敗したら何も表示しない
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/site-auth/logout", { method: "POST" });
    } catch {
      // 通信失敗でも cookie 切れの可能性があるので /login へ送る
    }
    clearStudioAuthorName();
    // フルリロードで proxy.ts の判定とクライアント状態を確実にリセットする
    window.location.href = "/login";
  }

  // 表示するものが無ければ何も描画しない
  if (!username && !authEnabled) return null;

  return (
    <div className={`flex items-center gap-2 min-w-0 ${className}`}>
      <div className="flex items-center gap-1.5 min-w-0">
        <UserRound className="size-3.5 text-muted-foreground shrink-0" />
        {username ? (
          <span className="text-xs text-gray-700 truncate" title={username}>
            {username}
          </span>
        ) : null}
      </div>
      {authEnabled ? (
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          title="ログアウト"
          aria-label="ログアウト"
          className="shrink-0 flex items-center gap-1 text-xs text-gray-600 hover:text-destructive border border-border hover:border-destructive/40 px-2 py-1 rounded-md transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <LogOut className="size-3" />
          {compact ? null : <span>ログアウト</span>}
        </button>
      ) : null}
    </div>
  );
}
