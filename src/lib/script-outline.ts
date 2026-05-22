export interface OutlineItem {
  section: string;
  content: string;
}

export function extractScriptHeaders(script: string): string[] {
  return script
    .split("\n")
    .filter((line) => /^##\s/.test(line))
    .map((line) => line.replace(/^##\s+/, "").trim());
}

export function isScriptOutlineInSync(script: string, outline: OutlineItem[]): boolean {
  if (!outline.length) return true;
  if (!script.trim()) return false;

  const headers = extractScriptHeaders(script);
  if (headers.length !== outline.length) return false;

  return outline.every((item, i) => headers[i] === item.section);
}

export function syncScriptHeadersByIndex(script: string, outline: Pick<OutlineItem, "section">[]): string {
  let idx = 0;
  return script
    .split("\n")
    .map((line) => {
      if (!/^##\s/.test(line)) return line;
      if (idx < outline.length) {
        const updated = `## ${outline[idx].section}`;
        idx++;
        return updated;
      }
      idx++;
      return line;
    })
    .join("\n");
}
