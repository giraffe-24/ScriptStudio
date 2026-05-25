const CONTEXT_CHARS = 1000;

export function findSectionHeadingAtOffset(text: string, offset: number): string | null {
  const before = text.slice(0, Math.max(0, offset));
  const lines = before.split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    if (/^##\s/.test(lines[i])) {
      return lines[i].replace(/^##\s+/, "").trim();
    }
  }
  return null;
}

export function extractSelectionContext(
  text: string,
  start: number,
  end: number,
): {
  selection: string;
  before: string;
  after: string;
  sectionHeading: string | null;
} {
  const safeStart = Math.max(0, Math.min(start, text.length));
  const safeEnd = Math.max(safeStart, Math.min(end, text.length));
  return {
    selection: text.slice(safeStart, safeEnd),
    before: text.slice(Math.max(0, safeStart - CONTEXT_CHARS), safeStart),
    after: text.slice(safeEnd, Math.min(text.length, safeEnd + CONTEXT_CHARS)),
    sectionHeading: findSectionHeadingAtOffset(text, safeStart),
  };
}
