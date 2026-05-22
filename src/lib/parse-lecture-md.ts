/** 講義文字起こし MD（# タイトル / ## セクション / 本文行）をパース */

export interface ParsedLecture {
  title: string;
  sections: ParsedSection[];
}

export interface ParsedSection {
  name: string;
  paragraphs: string[];
}

export function parseLectureMarkdown(raw: string): ParsedLecture {
  const lines = raw.split(/\r?\n/);
  let title = "無題の講義";
  const sections: ParsedSection[] = [];
  let current: ParsedSection | null = null;

  for (const line of lines) {
    const h1 = line.match(/^#\s+(.+)/);
    if (h1) {
      title = h1[1].trim();
      continue;
    }

    const h2 = line.match(/^##\s+(.+)/);
    if (h2) {
      current = { name: h2[1].trim(), paragraphs: [] };
      sections.push(current);
      continue;
    }

    const text = line.trim();
    if (!text || !current) continue;
    current.paragraphs.push(text);
  }

  return { title, sections: sections.filter((s) => s.paragraphs.length > 0) };
}

/** 300字/分で目安時間（分）を算出 */
export function estimateMinutes(charCount: number): number {
  return Math.max(1, Math.round(charCount / 300));
}
