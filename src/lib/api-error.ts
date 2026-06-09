/**
 * API エラーをユーザー向けの日本語メッセージに変換する。
 * Anthropic API のクレジット残高不足（トークン切れ）など、
 * 生のエラー文字列をそのまま出すと分かりにくいものを整形する。
 */
export function toFriendlyApiError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  const lower = raw.toLowerCase();

  // Anthropic: クレジット残高不足（トークン切れ）
  if (
    lower.includes("credit balance is too low") ||
    lower.includes("insufficient credit") ||
    lower.includes("billing")
  ) {
    return "トークン切れです。Anthropic API のクレジット残高が不足しています。管理者に残高の追加（Plans & Billing）を依頼してください。";
  }

  // Anthropic: レート制限
  if (lower.includes("rate limit") || lower.includes("429")) {
    return "アクセスが集中しています。少し時間をおいて再試行してください。";
  }

  // Anthropic: 過負荷
  if (lower.includes("overloaded") || lower.includes("529")) {
    return "AI サーバーが混み合っています。少し時間をおいて再試行してください。";
  }

  return raw;
}
