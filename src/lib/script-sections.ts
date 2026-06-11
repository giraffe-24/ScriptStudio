import {
  type OutlineItem,
  parseScriptHeadingBlocks,
} from "@/lib/script-outline";

export type ScriptSectionBlock = {
  section: string;
  body: string;
  scriptHeader?: string;
};

export function splitScriptIntoSections(
  script: string,
  outline: OutlineItem[],
): ScriptSectionBlock[] {
  if (!outline.length) return [];

  const blocks = parseScriptHeadingBlocks(script);
  const alignByIndex = blocks.length === outline.length;

  return outline.map((item, index) => {
    const byIndex = blocks[index];
    const byName = blocks.find((block) => block.heading === item.section);
    const matched = alignByIndex ? byIndex : (byName ?? byIndex);
    return {
      section: item.section,
      body: matched?.body.trimEnd() ?? "",
      scriptHeader: matched?.heading ?? item.section,
    };
  });
}

export function buildScriptFromSections(
  outline: OutlineItem[],
  sections: ScriptSectionBlock[],
  scriptHeaders?: string[],
): string {
  return outline
    .map((item, index) => {
      const body =
        sections[index]?.body?.trim() ??
        sections.find((s) => s.section === item.section)?.body?.trim() ??
        "";
      const header = scriptHeaders?.[index]?.trim() || item.section;
      return body ? `## ${header}\n${body}` : `## ${header}\n`;
    })
    .join("\n\n")
    .trim();
}

export function replaceScriptSections(
  script: string,
  outline: OutlineItem[],
  updates: Map<number, string>,
): string {
  const scriptHeaders = parseScriptHeadingBlocks(script).map((b) => b.heading);
  const sections = splitScriptIntoSections(script, outline);
  for (const [index, body] of updates) {
    if (index >= 0 && index < sections.length) {
      sections[index] = {
        section: outline[index].section,
        body: body.trim(),
        scriptHeader: scriptHeaders[index] ?? outline[index].section,
      };
    }
  }
  const headers =
    scriptHeaders.length === outline.length
      ? scriptHeaders
      : sections.map((s, i) => s.scriptHeader ?? outline[i]?.section ?? "");
  return buildScriptFromSections(outline, sections, headers);
}
