export interface OutlineItem {
  section: string;
  content: string;
}

/** 目次案から時間表記（0:00、5分など）を除去 */
export function stripTimeFromSection(section: string): string {
  return section
    .replace(/[（(]\s*\d{1,2}:\d{2}(?:[〜~\-–—]\d{1,2}:\d{2})?\s*[）)]/g, "")
    .replace(/[（(]\s*\d+\s*分(?:鐘)?(?:[〜~\-–—]\d+\s*分)?\s*[）)]/g, "")
    .replace(/\s*[・｜|]\s*\d{1,2}:\d{2}(?:[〜~\-–—]\d{1,2}:\d{2})?/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function sanitizeOutline(outline: OutlineItem[]): OutlineItem[] {
  return outline.map((item) => ({
    ...item,
    section: stripTimeFromSection(item.section),
  }));
}

export function sanitizePlanOutline<T extends { outline?: OutlineItem[] }>(plan: T): T {
  if (!plan.outline?.length) return plan;
  return { ...plan, outline: sanitizeOutline(plan.outline) };
}
