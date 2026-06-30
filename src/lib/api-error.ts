/**
 * API エラーを「種類（code）」と「非エンジニア向けの日本語メッセージ」に正規化する。
 *
 * Google（YouTube Data API）/ Anthropic などの失敗を、生の JSON やスタックではなく、
 * 5 つの code に振り分ける。フロントの ErrorBox（renderError）はこの code を見て
 * 見出し・案内・再試行ボタンの出し方を決める。
 *
 * この module はサーバ・クライアント双方から import される。next/server など
 * サーバ専用 API は持ち込まないこと（純粋な文字列処理のみ）。
 */

export type ApiErrorCode =
  | "quota" // 利用上限（クォータ枯渇・残高不足）
  | "rate" // アクセス集中（レート制限）
  | "auth" // 認証・キーが無効
  | "config" // 設定不足（キー未設定など）
  | "upstream" // 接続不可・外部サービス障害
  | "unknown"; // 分類不能

export type NormalizedApiError = {
  code: ApiErrorCode;
  /** 見出し（短く） */
  title: string;
  /** やさしい案内（1〜2文） */
  message: string;
  /** 再試行で直る可能性があるか */
  retryable: boolean;
  /** 折りたたみに入れる生の詳細（開発・問い合わせ用） */
  detail: string;
};

const COPY: Record<ApiErrorCode, { title: string; message: string; retryable: boolean }> = {
  quota: {
    title: "本日の利用上限に達しました",
    message:
      "AI／検索の1日あたりの利用上限に達した可能性があります（多くは翌日にリセットされます）。時間をおいてから再試行してください。続く場合は管理者にご連絡ください。",
    retryable: true,
  },
  rate: {
    title: "アクセスが集中しています",
    message: "短時間にリクエストが集中しています。少し待ってから再試行してください。",
    retryable: true,
  },
  auth: {
    title: "認証に問題があります",
    message:
      "APIキーが無効か、権限が不足している可能性があります。お手数ですが管理者にご連絡ください。",
    retryable: false,
  },
  config: {
    title: "設定が不足しています",
    message:
      "必要なAPIキーなどの設定が見つかりませんでした。お手数ですが管理者にご連絡ください。",
    retryable: false,
  },
  upstream: {
    title: "接続できませんでした",
    message:
      "外部サービスに一時的につながりにくくなっています。時間をおいて再試行してください。",
    retryable: true,
  },
  unknown: {
    title: "エラーが発生しました",
    message: "処理に失敗しました。時間をおいて再試行してください。続く場合は管理者にご連絡ください。",
    retryable: true,
  },
};

/** code ごとの見出し・既定文言・再試行可否を返す（クライアントの ErrorBox からも使う） */
export function apiErrorCopy(code: ApiErrorCode): {
  title: string;
  message: string;
  retryable: boolean;
} {
  return COPY[code] ?? COPY.unknown;
}

function rawMessageOf(input: unknown): string {
  if (input == null) return "";
  if (typeof input === "string") return input;
  if (input instanceof Error) return input.message || String(input);
  if (typeof input === "object") {
    const obj = input as Record<string, unknown>;
    // Google API のエラー形 { error: { message, errors:[{reason}] } } や Anthropic 形に対応
    const nested =
      (obj.error as { message?: string } | undefined)?.message ??
      (typeof obj.message === "string" ? obj.message : undefined);
    if (nested) return nested;
    try {
      return JSON.stringify(input);
    } catch {
      return String(input);
    }
  }
  return String(input);
}

/** 例外オブジェクト等から HTTP ステータスらしき数値を拾う（任意） */
function statusOf(input: unknown): number | undefined {
  if (input && typeof input === "object") {
    const obj = input as Record<string, unknown>;
    const s = obj.status ?? obj.statusCode ?? (obj.error as { code?: unknown })?.code;
    if (typeof s === "number") return s;
    if (typeof s === "string" && /^\d{3}$/.test(s)) return Number(s);
  }
  return undefined;
}

/** 生メッセージ・ステータスから code を推定する */
export function classifyApiError(
  rawInput: string,
  status?: number,
): ApiErrorCode {
  const raw = rawInput.toLowerCase();

  // 設定不足（キー未設定など）— 最優先で拾う
  if (
    /未設定|not set|missing|not configured|is required|no api key|api key not found/.test(raw) &&
    /key|apikey|api_key|credential|token|設定/.test(raw)
  ) {
    return "config";
  }

  // 利用上限・残高不足
  if (
    /quota|quotaexceeded|dailylimitexceeded|daily limit|利用上限|上限に達/.test(raw) ||
    /credit balance is too low|insufficient (credit|funds|quota|balance)|billing|残高/.test(raw)
  ) {
    return "quota";
  }

  // レート制限
  if (
    /rate ?limit|ratelimitexceeded|userratelimitexceeded|too many requests/.test(raw) ||
    status === 429 ||
    /\b429\b/.test(raw)
  ) {
    return "rate";
  }

  // 認証・キー無効
  if (
    /api key not valid|invalid api key|keyinvalid|invalid_api_key|unauthorized|authentication[_ ]?error|permission|forbidden/.test(raw) ||
    status === 401 ||
    status === 403 ||
    /\b401\b/.test(raw)
  ) {
    return "auth";
  }

  // 接続不可・外部障害
  if (
    /overloaded|service unavailable|bad gateway|gateway timeout|timed? ?out|timeout|fetch failed|network|econnreset|econnrefused|enotfound|socket hang up|529|502|503|504/.test(raw) ||
    (status != null && status >= 500)
  ) {
    return "upstream";
  }

  return "unknown";
}

/**
 * 任意の例外・文字列を正規化された ApiError に変換する。
 * @param opts.code 明示的に code を指定すると推定をスキップする。
 * @param opts.status HTTP ステータスがわかっていれば渡す（推定精度が上がる）。
 */
export function normalizeApiError(
  input: unknown,
  opts?: { code?: ApiErrorCode; status?: number },
): NormalizedApiError {
  const detail = rawMessageOf(input);
  const status = opts?.status ?? statusOf(input);
  const code = opts?.code ?? classifyApiError(detail, status);
  const copy = COPY[code] ?? COPY.unknown;
  return { code, title: copy.title, message: copy.message, retryable: copy.retryable, detail };
}

/** API ルートが JSON で返すエラー本文。フロントはこれを ErrorBox に渡せる。 */
export type ApiErrorPayload = {
  error: string;
  code: ApiErrorCode;
  retryable: boolean;
  detail: string;
};

/** ルートのレスポンス本文を組み立てる（NextResponse.json(...) にそのまま渡す） */
export function toErrorPayload(
  input: unknown,
  opts?: { code?: ApiErrorCode; status?: number },
): ApiErrorPayload {
  const n = normalizeApiError(input, opts);
  return { error: n.message, code: n.code, retryable: n.retryable, detail: n.detail };
}

/** code から妥当な HTTP ステータスを返す（ルートで status 指定に使える） */
export function httpStatusForCode(code: ApiErrorCode): number {
  switch (code) {
    case "quota":
      return 429;
    case "rate":
      return 429;
    case "auth":
      return 502;
    case "config":
      return 503;
    case "upstream":
      return 502;
    default:
      return 500;
  }
}

/**
 * 後方互換：従来どおり「ユーザー向けメッセージ文字列」を返す。
 * 既存の呼び出し箇所をそのまま動かしつつ、内部は新しい正規化を使う。
 */
export function toFriendlyApiError(err: unknown): string {
  return normalizeApiError(err).message;
}
