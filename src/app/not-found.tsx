import Link from "next/link";

/**
 * 404 ページ。存在しない URL に来たときに、英語の既定画面ではなく
 * 分かりやすい日本語の案内とトップへの導線を出す。
 */
export default function NotFound() {
  return (
    <div className="flex min-h-full items-center justify-center bg-white px-6 py-12 text-gray-800">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white/80 p-8 text-center shadow-xl">
        <div className="mb-3 text-5xl" aria-hidden>
          🔍
        </div>
        <h1 className="text-base font-semibold text-gray-800">
          ページが見つかりませんでした
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-500">
          お探しのページは移動または削除された可能性があります。
        </p>
        <Link
          href="/"
          className="mt-6 block w-full rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-600"
        >
          最初の画面に戻る
        </Link>
      </div>
    </div>
  );
}
