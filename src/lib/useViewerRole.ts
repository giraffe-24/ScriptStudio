"use client";

import { useEffect, useState } from "react";

/**
 * 閲覧専用（レビュアー）ログインかどうかを返すフック。
 * /api/site-auth/me の readOnly をモジュール内でキャッシュし、
 * 複数コンポーネントから使っても fetch は1回にする。
 * 取得完了までは false（通常表示）。レビュアーの書き込みはサーバー側でも
 * 403 で遮断されるため、ここは UX 調整（導線を隠す・自動保存を止める）が目的。
 */
let cachedReadOnly: Promise<boolean> | null = null;

function fetchReadOnly(): Promise<boolean> {
  cachedReadOnly ??= fetch("/api/site-auth/me")
    .then((r) => r.json())
    .then((d: { readOnly?: boolean }) => Boolean(d?.readOnly))
    .catch(() => false);
  return cachedReadOnly;
}

export function useReadOnly(): boolean {
  const [readOnly, setReadOnly] = useState(false);
  useEffect(() => {
    let cancelled = false;
    void fetchReadOnly().then((value) => {
      if (!cancelled && value) setReadOnly(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return readOnly;
}
