export interface OutlineItem {
  section: string;
  content: string;
}

/** 台本内の ## 見出し1つ分（先頭メタ行はセクションに含めない） */
export type ScriptHeadingBlock = {
  heading: string;
  charOffset: number;
  body: string;
};

/** エディタ左サイドバー用（ジャンプ先は常に台本の ## 行） */
export type EditorNavSection = {
  label: string;
  planSection: string | null;
  content: string;
  charOffset: number;
};

export function extractScriptHeaders(script: string): string[] {
  return parseScriptHeadingBlocks(script).map((block) => block.heading);
}

/**
 * 台本を ## 見出しだけで分割する。
 * 最初の ## より前（# タイトル・引用・管理番号など）はセクションにしない。
 */
export function parseScriptHeadingBlocks(text: string): ScriptHeadingBlock[] {
  const lines = text.split("\n");
  const blocks: ScriptHeadingBlock[] = [];
  let charPos = 0;
  let current: ScriptHeadingBlock | null = null;

  for (const line of lines) {
    if (/^##\s/.test(line)) {
      if (current) blocks.push(current);
      current = {
        heading: line.replace(/^##\s+/, "").trim(),
        charOffset: charPos,
        body: "",
      };
    } else if (current) {
      current.body += line + "\n";
    }
    charPos += line.length + 1;
  }
  if (current) blocks.push(current);

  return blocks;
}

/** 企画 outline と台本 ## をインデックスで対応付け、ジャンプ用オフセットは台本基準 */
export function buildEditorNavSections(
  text: string,
  outline?: OutlineItem[],
): EditorNavSection[] {
  const blocks = parseScriptHeadingBlocks(text);

  if (!outline?.length) {
    return blocks.map((block) => ({
      label: block.heading,
      planSection: null,
      content: block.body.trimEnd(),
      charOffset: block.charOffset,
    }));
  }

  const length = Math.max(blocks.length, outline.length);
  const sections: EditorNavSection[] = [];

  for (let index = 0; index < length; index++) {
    const block = blocks[index];
    const planItem = outline[index];

    if (block && planItem) {
      sections.push({
        label: block.heading,
        planSection: planItem.section !== block.heading ? planItem.section : null,
        content: block.body.trimEnd(),
        charOffset: block.charOffset,
      });
      continue;
    }

    if (block) {
      sections.push({
        label: block.heading,
        planSection: null,
        content: block.body.trimEnd(),
        charOffset: block.charOffset,
      });
      continue;
    }

    if (planItem) {
      sections.push({
        label: planItem.section,
        planSection: null,
        content: "",
        charOffset: text.length,
      });
    }
  }

  return sections;
}

export function isScriptOutlineInSync(script: string, outline: OutlineItem[]): boolean {
  if (!outline.length) return true;
  if (!script.trim()) return false;

  const headers = extractScriptHeaders(script);
  if (headers.length !== outline.length) return false;

  return outline.every((item, i) => headers[i] === item.section);
}

export function syncScriptHeadersByIndex(
  script: string,
  outline: Pick<OutlineItem, "section">[],
): string {
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
