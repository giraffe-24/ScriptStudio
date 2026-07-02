"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * ルート単位のエラーバウンダリ。
 * 画面描画中に想定外の例外が起きたとき、英語の技術的な画面ではなく
 * 非エンジニアにも分かる日本語の案内を出す。
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 原因調査用にコンソールへは詳細を残す（画面には出さない）。
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-full items-center justify-center bg-white px-6 py-12 text-gray-800">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white/80 p-8 text-center shadow-xl">
        <div className="mb-3 text-5xl" aria-hidden>
          😵‍💫
        </div>
        <h1 className="text-base font-semibold text-gray-800">
          画面の表示中に問題が発生しました
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-500">
          一時的なエラーの可能性があります。下のボタンでもう一度お試しください。
          直らない場合は、少し時間をおいてからアクセスしてください。
        </p>
        <div className="mt-6 space-y-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-600"
          >
            もう一度読み込む
          </button>
          <Link
            href="/"
            className="block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            最初の画面に戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
