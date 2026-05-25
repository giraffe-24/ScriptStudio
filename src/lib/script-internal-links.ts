import type { OutlineItem } from "@/lib/script-outline";

/** セクション再生成用：台本見出しと企画詳細を対応付けた構成一覧 */
export function buildScriptOutlineContext(
  outline: OutlineItem[],
  scriptHeaders: string[],
): string {
  if (!outline.length) return "（構成なし）";

  return outline
    .map((item, index) => {
      const scriptHeader = scriptHeaders[index]?.trim();
      const planHeader = item.section.trim();
      const headerLine = scriptHeader
        ? scriptHeader === planHeader
          ? `## ${scriptHeader}`
          : `## ${scriptHeader}（企画見出し: ${planHeader}）`
        : `## ${planHeader}`;
      return `${index + 1}. ${headerLine}\n   詳細・必須トピック: ${item.content.trim() || "（未記入）"}`;
    })
    .join("\n");
}

export const SECTION_INTERNAL_LINK_RULES = `=== セクション間の整合（内部リンク） ===
1. 詳細欄に書かれたトピックを省略・飛ばししない。見出し名そのものを説明の主題として扱う
2. 導入・全体像のセクションでは、後続チャプターの順番と優先理由を先に述べる（「重さの原因は複数」「公式手順」「リスクの低い順」など詳細欄の要素を落とさない）
3. 「さきほど」「次に」「チャプターとしては」「1. 2. 3.」など他セクションへの言及は、下記「動画全体の構成」と件数・順序・見出し名を一致させる
4. 台本内に ### や # の追加見出しは作らない（## は企画のセクション見出しのみ）
5. 前後セクション本文を写さないが、つながりの言い回しは自然に保つ`;
