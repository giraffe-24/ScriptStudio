export interface OutlineItem {
  section: string;
  content: string;
}

/** 単独で禁止の構成ラベル（視聴者向け見出しではない） */
const FORBIDDEN_STANDALONE = new Set([
  "本題",
  "まとめ",
  "導入",
  "序",
  "序章",
  "結び",
  "付録",
  "おまけ",
  "注意点",
  "メタ情報",
  "本編",
  "実践",
  "解説",
  "総括",
  "締め",
  "エンディング",
  "オープニング",
]);

/** 先頭から除去する構成ラベル接頭辞（繰り返し適用） */
const STRUCTURAL_PREFIX_PATTERNS: RegExp[] = [
  /^【[^】]*】\s*/,
  /^[\[［][^\]］]*[\]］]\s*/,
  /^(?:本題|導入|まとめ|序章?|結び|付録|おまけ|本編|実践|解説|総括|締め|注意点|オープニング|エンディング)\s*[-–—ー・｜|:：\s]+/iu,
  /^(?:STEP|Step|ステップ)\s*\d+\s*[-–—ー・｜|:：\s]*/iu,
  /^(?:第)?[0-9一二三四五六七八九十百千万]+[\.．、]\s*/,
];

/** 目次案から時間表記（0:00、5分など）を除去 */
export function stripTimeFromSection(section: string): string {
  return section
    .replace(/[（(]\s*\d{1,2}:\d{2}(?:[〜~\-–—]\d{1,2}:\d{2})?\s*[）)]/g, "")
    .replace(/[（(]\s*\d+\s*分(?:鐘)?(?:[〜~\-–—]\d+\s*分)?\s*[）)]/g, "")
    .replace(/\s*[・｜|]\s*\d{1,2}:\d{2}(?:[〜~\-–—]\d{1,2}:\d{2})?/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** 構成ラベルを除去し、視聴者にそのまま見せる見出し名だけ残す（AI生成・インポート用） */
export function sanitizeSectionName(section: string, contentFallback = ""): string {
  let name = normalizeSectionNameStructure(section);

  if (!name || FORBIDDEN_STANDALONE.has(name)) {
    const fallback = contentFallback.trim().split(/\n/)[0]?.slice(0, 40).trim() ?? "";
    if (fallback) name = fallback;
  }

  return name.trim();
}

/**
 * 手入力中・blur 時用。構成ラベルと時間表記だけ整え、詳細欄からの復元はしない。
 * 空文字は空のまま保持する（編集中に全文が戻るのを防ぐ）。
 */
export function normalizeSectionNameStructure(section: string): string {
  let name = stripTimeFromSection(section.trim());

  let prev = "";
  while (prev !== name) {
    prev = name;
    for (const pattern of STRUCTURAL_PREFIX_PATTERNS) {
      name = name.replace(pattern, "").trim();
    }
  }

  return name.trim();
}

export function sanitizeOutline(outline: OutlineItem[]): OutlineItem[] {
  return outline.map((item) => ({
    ...item,
    section: sanitizeSectionName(item.section, item.content),
  }));
}

export function sanitizePlanOutline<T extends { outline?: OutlineItem[] }>(plan: T): T {
  if (!plan.outline?.length) return plan;
  return { ...plan, outline: sanitizeOutline(plan.outline) };
}
