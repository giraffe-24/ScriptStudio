"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppIcon from "@image/ScriptStudioIcon.svg";
import { setStudioAuthorName } from "@/lib/studio-author";
import { TypingText } from "@/components/TypingText";
import { LOGIN_BACKGROUND_SAGA } from "./saga-text";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/site-auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "ログインに失敗しました");
      return;
    }

    setStudioAuthorName(username.trim());
    router.replace(nextPath.startsWith("/") ? nextPath : "/");
    router.refresh();
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      {/* レイヤー1：背景の縦書き小説テキスト（一方向の自動横スクロール） */}
      <div
        className="pointer-events-none absolute inset-0 select-none overflow-hidden"
        aria-hidden="true"
      >
        <div className="login-marquee absolute left-0 top-0">
          {[0, 1].map((i) => (
            <TypingText
              key={i}
              text={LOGIN_BACKGROUND_SAGA}
              speed={4}
              startDelay={400}
              caretLingerMs={0}
              decorative
              reserveLayout
              caretClassName="typing-caret--vertical"
              className="login-vertical-text h-dvh shrink-0 px-10 py-12 text-[30px] text-zinc-400/45"
            />
          ))}
        </div>
      </div>

      {/* レイヤー2：グラデーションレイヤー（白基調） */}
      <div
        className="absolute inset-0 bg-linear-to-br from-white/85 via-white/55 to-blue-50/70"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_62%_55%_at_50%_50%,transparent_0%,rgba(255,255,255,0.8)_100%)]"
        aria-hidden="true"
      />

      {/* レイヤー3：ログインフォーム */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 text-gray-800">
        <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white/75 p-8 shadow-xl backdrop-blur-xl">
          {/* ロゴ */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={AppIcon.src}
            alt="ScriptStudio"
            width={258}
            height={58}
            className="mx-auto mb-1.5 h-9 w-auto"
          />

          <form className="mt-7 space-y-4" onSubmit={onSubmit}>
            <label className="block space-y-1.5 text-sm">
              <span className="text-gray-500">ユーザー名</span>
              <input
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                name="username"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </label>

            <label className="block space-y-1.5 text-sm">
              <span className="text-gray-500">パスワード</span>
              <input
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                name="password"
                type="password"
                autoComplete="current-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            {error ? (
              <p className="text-sm text-red-500" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-600 disabled:opacity-60"
            >
              {loading ? "ログイン中…" : "ログイン"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
