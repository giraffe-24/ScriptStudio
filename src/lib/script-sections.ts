import type { OutlineItem } from "@/lib/script-outline";
import { extractScriptHeaders } from "@/lib/script-outline";

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

  // 件数が一致するときは順序（インデックス）を優先。企画見出しと台本 ## が異なるケースで誤マッチを防ぐ
  const alignByIndex = blocks.length === outline.length;

  return outline.map((item, index) => {
    const byIndex = blocks[index];
    const byName = blocks.find((b) => b.section === item.section);
    const body = alignByIndex
      ? (byIndex?.body ?? byName?.body ?? "")
      : (byName?.body ?? byIndex?.body ?? "");
    return {
      section: item.section,
      body,
      scriptHeader: byIndex?.section ?? item.section,
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
  const scriptHeaders = extractScriptHeaders(script);
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

export function removeScriptSectionsByName(script: string, outline: OutlineItem[], removeNames: string[]): string {
  const removeSet = new Set(removeNames);
  const filteredOutline = outline.filter((item) => !removeSet.has(item.section));
  const sections = splitScriptIntoSections(script, outline).filter((s) => !removeSet.has(s.section));
  return buildScriptFromSections(filteredOutline, sections);
}
