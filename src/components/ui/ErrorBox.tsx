"use client";

import { useState } from "react";
import {
  apiErrorCopy,
  normalizeApiError,
  type ApiErrorCode,
  type NormalizedApiError,
} from "@/lib/api-error";
import { Button } from "@/components/ui/button";

type ErrorInput = string | NormalizedApiError | null | undefined;

type Props = {
  /** API の data.error（表示する文言）か、正規化済みエラー。null/undefined なら何も描画しない */
  error: ErrorInput;
  /** サーバが返した data.code。渡すと error 文言をそのまま見出し付きで表示する */
  code?: ApiErrorCode;
  /** サーバが返した data.retryable。未指定なら code から推定 */
  retryable?: boolean;
  /** 折りたたみに入れる生の詳細（data.detail 等） */
  detail?: string;
  /** 再試行ハンドラ。指定かつ retryable のときだけボタンを出す */
  onRetry?: () => void;
  /** 再試行中（ボタンを無効化＋表示変更） */
  retrying?: boolean;
  /** 再試行ボタンを無効化する追加条件（入力未確定など） */
  retryDisabled?: boolean;
  retryLabel?: string;
  className?: string;
};

function resolve(
  error: ErrorInput,
  code?: ApiErrorCode,
  retryable?: boolean,
  detail?: string,
): NormalizedApiError | null {
  if (error == null || error === "") return null;

  // 既に正規化済みオブジェクトを直接渡された場合
  if (typeof error !== "string") {
    return {
      ...error,
      code: code ?? error.code,
      retryable: retryable ?? error.retryable,
      detail: detail ?? error.detail,
    };
  }

  // サーバが code を付けてきた → error 文言は整形済みとみなしてそのまま表示し、
  // 見出し・再試行可否だけ code から補う。
  if (code) {
    const copy = apiErrorCopy(code);
    return {
      code,
      title: copy.title,
      message: error,
      retryable: retryable ?? copy.retryable,
      detail: detail ?? "",
    };
  }

  // code 無し（生の文字列・クライアントの通信エラー等）→ 種類を推定し、
  // 定型のやさしい文言に置換。元の生文字列は詳細に回す。
  const n = normalizeApiError(error);
  return { ...n, retryable: retryable ?? n.retryable, detail: detail ?? n.detail };
}

/**
 * 失敗時の共通UX（renderError）。
 * 見出し（種類別）＋ やさしい案内 ＋ 折りたたみの生詳細 ＋ 任意の再試行ボタン。
 */
export function ErrorBox({
  error,
  code,
  retryable,
  detail,
  onRetry,
  retrying = false,
  retryDisabled = false,
  retryLabel = "再試行",
  className = "",
}: Props) {
  const [showDetail, setShowDetail] = useState(false);
  const n = resolve(error, code, retryable, detail);
  if (!n) return null;

  const showRetry = Boolean(onRetry) && n.retryable;
  // 生の詳細は、やさしい案内と実質同じなら隠す（重複表示を避ける）
  const hasDetail = Boolean(n.detail) && n.detail.trim() !== n.message.trim();

  return (
    <div
      role="alert"
      className={`rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-xs leading-relaxed text-destructive ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold">{n.title}</p>
          <p className="mt-1 text-destructive/90">{n.message}</p>
        </div>
        {showRetry && (
          <Button
            variant="destructive"
            size="xs"
            onClick={onRetry}
            disabled={retrying || retryDisabled}
            className="shrink-0"
          >
            {retrying ? "再試行中…" : retryLabel}
          </Button>
        )}
      </div>

      {hasDetail && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setShowDetail((v) => !v)}
            aria-expanded={showDetail}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-destructive/70 underline-offset-2 hover:underline"
          >
            {showDetail ? "詳細を隠す" : "詳細を表示"}
          </button>
          {showDetail && (
            <pre className="mt-1.5 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-md bg-destructive/5 p-2 text-[11px] text-destructive/80">
              {n.detail}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
