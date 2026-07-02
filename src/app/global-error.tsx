"use client";

import { useEffect } from "react";
import "./globals.css";

/**
 * ルートレイアウトごと落ちた場合の最終防衛ライン。
 * global-error はレイアウトを差し替えるため、自前で <html>/<body> を持つ。
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ja">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#ffffff",
          color: "#1f2937",
          fontFamily:
            "system-ui, -apple-system, 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif",
          padding: "48px 24px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "24rem",
            textAlign: "center",
            border: "1px solid #e5e7eb",
            borderRadius: "1rem",
            padding: "2rem",
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }} aria-hidden>
            😵‍💫
          </div>
          <h1 style={{ fontSize: "1rem", fontWeight: 600, margin: 0 }}>
            問題が発生し、画面を表示できませんでした
          </h1>
          <p
            style={{
              marginTop: "0.75rem",
              fontSize: "0.875rem",
              lineHeight: 1.7,
              color: "#6b7280",
            }}
          >
            一時的なエラーの可能性があります。もう一度読み込んでみてください。
            直らない場合は、少し時間をおいてからアクセスしてください。
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: "1.5rem",
              width: "100%",
              borderRadius: "0.5rem",
              backgroundColor: "#3b82f6",
              color: "#ffffff",
              border: "none",
              padding: "0.625rem 1rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            もう一度読み込む
          </button>
        </div>
      </body>
    </html>
  );
}
