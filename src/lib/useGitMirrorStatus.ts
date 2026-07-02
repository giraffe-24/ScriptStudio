import { useEffect, useState } from "react";

// Git ミラー設定の有無はセッション内で不変なので 1 度だけ確認してキャッシュする。
let configuredCache: boolean | null = null;

/** Git ミラーが設定済みか（履歴ボタンの表示可否判定に使う）。 */
export function useGitMirrorStatus(): boolean {
  const [configured, setConfigured] = useState(configuredCache ?? false);

  useEffect(() => {
    if (configuredCache !== null) return;
    let cancelled = false;
    fetch("/api/git-history?action=status")
      .then((res) => res.json())
      .then((data) => {
        configuredCache = Boolean(data?.configured);
        if (!cancelled) setConfigured(configuredCache);
      })
      .catch(() => {
        if (!cancelled) setConfigured(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return configured;
}
