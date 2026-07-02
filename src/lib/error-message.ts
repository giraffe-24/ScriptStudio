/**
 * どんなエラー（Error オブジェクト / 文字列 / {error} / fetch 失敗など）でも、
 * 非エンジニアが読んで「次に何をすればいいか」が分かる日本語 1 文に変換する。
 *
 * 方針:
 * - 技術的な生メッセージ（英語・URL・スタック・"409" 等）はユーザーに見せない。
 * - よくある失敗は、原因ではなく「対処」が伝わる文にする。
 * - サーバが返した短く分かりやすい日本語文はそのまま活かす。
 */

const DEFAULT_FALLBACK =
  "うまくいきませんでした。少し時間をおいて、もう一度お試しください。";

const NETWORK_MESSAGE =
  "通信に失敗しました。インターネット接続を確認して、もう一度お試しください。";

/** 生メッセージの部分一致 → ユーザー向け日本語（上から順に判定）。 */
const PATTERNS: { test: RegExp; message: string }[] = [
  {
    // ブラウザ: "Failed to fetch" / Node(undici): "fetch failed" / "TypeError: fetch failed"
    test: /failed to fetch|fetch failed|networkerror|network request failed|load failed|err_internet|net::|econnrefused|enotfound|econnreset|dns/i,
    message: NETWORK_MESSAGE,
  },
  {
    test: /timeout|timed out|etimedout|aborted|abort/i,
    message:
      "時間内に応答がありませんでした。通信環境を確認して、もう一度お試しください。",
  },
  {
    test: /rate limit|too many requests|\b429\b/i,
    message: "アクセスが集中しています。少し時間をおいて、もう一度お試しください。",
  },
  {
    test: /unauthorized|forbidden|\b401\b|\b403\b|session|token/i,
    message:
      "ログインの有効期限が切れている可能性があります。お手数ですが、再度ログインしてください。",
  },
  {
    test: /conflict|\b409\b/i,
    message:
      "ほかの人が先に更新したようです。最新の内容を確認してから、もう一度保存してください。",
  },
  {
    test: /supabase|service_role|publishable|sb_secret|sb_publishable/i,
    message:
      "保存用の設定が未完了のため、この操作はいま実行できません。管理者にご連絡ください。",
  },
  {
    test: /github|mirror|contents\/|git\/ref|per_page/i,
    message:
      "履歴の保存先に接続できませんでした。少し時間をおいて、もう一度お試しください。",
  },
  {
    test: /invalid json|unexpected token|json/i,
    message:
      "データの読み込みに失敗しました。画面を再読み込みして、もう一度お試しください。",
  },
  {
    test: /\b5\d{2}\b|internal server error|server error/i,
    message:
      "サーバー側で問題が発生しました。少し時間をおいて、もう一度お試しください。",
  },
];

function extractRaw(input: unknown): string {
  if (input == null) return "";
  if (typeof input === "string") return input;
  if (input instanceof Error) return input.message;
  if (typeof input === "object") {
    const o = input as { error?: unknown; message?: unknown };
    if (typeof o.error === "string") return o.error;
    if (typeof o.message === "string") return o.message;
  }
  return String(input);
}

/** 生メッセージが「そのまま見せてよい、短く分かりやすい日本語」か判定。 */
function isCleanJapanese(raw: string): boolean {
  if (raw.length > 60) return false;
  const hasJapanese = /[ぁ-んァ-ン一-龯]/.test(raw);
  if (!hasJapanese) return false;
  // URL・スタック・型名・パス・英語識別子など、技術っぽい要素が混ざるなら見せない
  const looksTechnical =
    /https?:\/\/|\bat \b|Error:|[{}]|[A-Za-z][A-Za-z0-9_]*\/[A-Za-z0-9_]|[A-Za-z]{2,}_[A-Za-z]{2,}|\b\d{3}\b/.test(
      raw,
    );
  return !looksTechnical;
}

export function toUserMessage(
  input: unknown,
  fallback: string = DEFAULT_FALLBACK,
): string {
  const raw = extractRaw(input).trim();
  if (!raw) return fallback;
  for (const p of PATTERNS) if (p.test.test(raw)) return p.message;
  if (isCleanJapanese(raw)) return raw;
  return fallback;
}
