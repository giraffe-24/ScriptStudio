import type { OutlineItem } from "@/lib/script-outline";

export type ScriptSectionBlock = {
  section: string;
  body: string;
};

export function splitScriptIntoSections(
  script: string,
  outline: OutlineItem[],
): ScriptSectionBlock[] {
  if (!outline.length) return [];

  const lines = script.split("\n");
  const blocks: ScriptSectionBlock[] = [];
  let currentName: string | null = null;
  let bodyLines: string[] = [];

  function flush() {
    if (currentName === null) return;
    blocks.push({ section: currentName, body: bodyLines.join("\n").trimEnd() });
    bodyLines = [];
  }

  for (const line of lines) {
    if (/^##\s/.test(line)) {
      flush();
      currentName = line.replace(/^##\s+/, "").trim();
      continue;
    }
    if (currentName !== null) {
      bodyLines.push(line);
    }
  }
  flush();

  return outline.map((item, index) => {
    const byName = blocks.find((b) => b.section === item.section);
    const byIndex = blocks[index];
    const body = byName?.body ?? byIndex?.body ?? "";
    return { section: item.section, body };
  });
}

export function buildScriptFromSections(outline: OutlineItem[], sections: ScriptSectionBlock[]): string {
  return outline
    .map((item, index) => {
      const body = sections[index]?.body?.trim() ?? sections.find((s) => s.section === item.section)?.body?.trim() ?? "";
      return body ? `## ${item.section}\n${body}` : `## ${item.section}\n`;
    })
    .join("\n\n")
    .trim();
}

export function replaceScriptSections(
  script: string,
  outline: OutlineItem[],
  updates: Map<number, string>,
): string {
  const sections = splitScriptIntoSections(script, outline);
  for (const [index, body] of updates) {
    if (index >= 0 && index < sections.length) {
      sections[index] = { section: outline[index].section, body: body.trim() };
    }
  }
  return buildScriptFromSections(outline, sections);
}

export function removeScriptSectionsByName(script: string, outline: OutlineItem[], removeNames: string[]): string {
  const removeSet = new Set(removeNames);
  const filteredOutline = outline.filter((item) => !removeSet.has(item.section));
  const sections = splitScriptIntoSections(script, outline).filter((s) => !removeSet.has(s.section));
  return buildScriptFromSections(filteredOutline, sections);
}
