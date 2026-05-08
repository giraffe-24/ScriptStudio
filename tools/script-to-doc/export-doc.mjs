/**
 * トークスクリプト（.md）→ 印刷・PDF保存向け単体 HTML
 * 使い方: node tools/script-to-doc/export-doc.mjs path/to/03-script.md
 * 出力: 同じディレクトリに .md のベース名 .html
 */

import fs from "node:fs";
import path from "node:path";

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** `code` と通常テキストを分割してエスケープ */
function inlineFormat(s) {
  const parts = String(s).split("`");
  return parts
    .map((chunk, i) =>
      i % 2 === 1
        ? "<code>" + escapeHtml(chunk) + "</code>"
        : escapeHtml(chunk)
    )
    .join("");
}

/** 行末までを1段落相当に（同一ブロック内は br） */
function paragraphBlock(lines) {
  const inner = lines.map(inlineFormat).join("<br>\n");
  return "<p>" + inner + "</p>";
}

function blockquoteHtml(bqLines) {
  let out = '<blockquote class="doc-note">\n';
  const items = [];

  for (const raw of bqLines) {
    const t = raw.trim();
    if (!t) continue;
    if (t.startsWith("- ")) {
      items.push(t.slice(2).trim());
    } else {
      if (items.length) {
        out +=
          "<ul>\n" +
          items.splice(0).map((li) => "  <li>" + inlineFormat(li) + "</li>").join("\n") +
          "\n</ul>\n";
      }
      out += "<p>" + inlineFormat(t) + "</p>\n";
    }
  }
  if (items.length) {
    out +=
      "<ul>\n" +
      items.map((li) => "  <li>" + inlineFormat(li) + "</li>").join("\n") +
      "\n</ul>\n";
  }
  out += "</blockquote>\n";
  return out;
}

function markdownToArticleHtml(md) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const chunks = [];
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const t = raw.trimEnd();
    const trim = t.trim();

    if (trim === "") {
      i++;
      continue;
    }

    if (trim === "---") {
      chunks.push('<hr class="doc-sep" />\n');
      i++;
      continue;
    }

    if (trim.startsWith("# ") && !trim.startsWith("## ")) {
      chunks.push("<h1>" + inlineFormat(trim.slice(2).trim()) + "</h1>\n");
      i++;
      continue;
    }

    if (trim.startsWith("### ")) {
      chunks.push("<h3>" + inlineFormat(trim.slice(4).trim()) + "</h3>\n");
      i++;
      continue;
    }

    if (trim.startsWith("## ")) {
      chunks.push("<h2>" + inlineFormat(trim.slice(3).trim()) + "</h2>\n");
      i++;
      continue;
    }

    if (/^>\s?/.test(t)) {
      const bq = [];
      while (i < lines.length && /^>\s?/.test(lines[i].trimEnd())) {
        bq.push(lines[i].trimEnd().replace(/^>\s?/, ""));
        i++;
      }
      chunks.push(blockquoteHtml(bq));
      continue;
    }

    if (/^\s*-\s/.test(t)) {
      const items = [];
      while (i < lines.length && /^\s*-\s/.test(lines[i].trimEnd())) {
        items.push(lines[i].replace(/^\s*-\s/, "").trimEnd());
        i++;
      }
      chunks.push(
        "<ul>\n" +
          items
            .map((line) => "  <li>" + inlineFormat(line.trim()) + "</li>")
            .join("\n") +
          "\n</ul>\n"
      );
      continue;
    }

    const paraLines = [];
    while (i < lines.length) {
      const ln = lines[i];
      const tr = ln.trim();
      if (tr === "") break;
      if (
        tr === "---" ||
        tr.startsWith("#") ||
        tr.startsWith(">") ||
        /^\s*-\s/.test(ln)
      ) {
        break;
      }
      paraLines.push(ln.trimEnd());
      i++;
    }
    if (paraLines.length) chunks.push(paragraphBlock(paraLines) + "\n");
  }

  return chunks.join("\n");
}

function buildHtmlPage({ title, articleHtml, sourcePath }) {
  const generated = new Date().toISOString().slice(0, 19).replace("T", " ");
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root { --fg: #1a1a1a; --muted: #555; --border: #ccc; }
    * { box-sizing: border-box; }
    body {
      margin: 0 auto;
      max-width: 44rem;
      padding: 1.5rem 1.25rem 3rem;
      font-family: "Hiragino Sans", "Hiragino Kaku Gothic ProN", Meiryo, system-ui, sans-serif;
      line-height: 1.65;
      color: var(--fg);
      font-size: 11pt;
    }
    header.doc-banner {
      border: 1px solid var(--border);
      background: #f7f9fc;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      margin-bottom: 1.75rem;
      font-size: 0.9rem;
      color: var(--muted);
    }
    header.doc-banner strong { color: var(--fg); font-weight: 600; }
    article.talk-script h1 { font-size: 1.35rem; margin: 0 0 1rem; line-height: 1.35; }
    article.talk-script h2 {
      font-size: 1.12rem;
      margin: 1.75rem 0 0.65rem;
      padding-bottom: 0.25rem;
      border-bottom: 1px solid var(--border);
    }
    article.talk-script h3 { font-size: 1.02rem; margin: 1.25rem 0 0.5rem; }
    article.talk-script p { margin: 0.5rem 0 0.85rem; }
    article.talk-script ul { margin: 0.4rem 0 0.9rem; padding-left: 1.35rem; }
    article.talk-script li { margin: 0.25rem 0; }
    article.talk-script code {
      font-size: 0.92em;
      background: #f0f0ee;
      padding: 0.12em 0.35em;
      border-radius: 4px;
    }
    blockquote.doc-note {
      margin: 0 0 1.25rem;
      padding: 0.65rem 1rem;
      background: #faf9f5;
      border-left: 4px solid #c9b88a;
      font-size: 0.92rem;
      color: #333;
    }
    blockquote.doc-note p { margin: 0.35rem 0; }
    blockquote.doc-note ul { margin: 0.35rem 0 0.5rem; }
    hr.doc-sep { border: none; border-top: 1px dashed var(--border); margin: 1.5rem 0; }
    footer.doc-footer {
      margin-top: 2.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border);
      font-size: 0.82rem;
      color: var(--muted);
    }
    @media print {
      body { max-width: none; padding: 0; font-size: 10.5pt; }
      header.doc-banner { break-inside: avoid; }
      article.talk-script h2 { break-after: avoid; }
    }
  </style>
</head>
<body>
  <header class="doc-banner">
    <strong>ドキュメント版（トークスクリプト）</strong> · ブラウザの「印刷」からPDFに保存できます。
    <br />元ファイル: <code>${escapeHtml(sourcePath)}</code>
    <br />生成: ${escapeHtml(generated)}
  </header>
  <article class="talk-script">
${articleHtml}
  </article>
  <footer class="doc-footer">
    効率化オタクのあらきり · YT_TalkScript · npm run script-doc で再生成
  </footer>
</body>
</html>
`;
}

function main() {
  const args = process.argv.slice(2);
  if (!args.length) {
    console.error("使い方: npm run script-doc -- <path/to/script.md> [more.md ...]");
    process.exit(1);
  }

  for (const arg of args) {
    const inputPath = path.resolve(process.cwd(), arg);
    if (!fs.existsSync(inputPath)) {
      console.error("スキップ（ファイルなし）:", inputPath);
      continue;
    }
    const md = fs.readFileSync(inputPath, "utf8");
    const firstLine = md.split(/\r?\n/).find((l) => l.trim().startsWith("# "));
    const title = firstLine
      ? firstLine.replace(/^#\s+/, "").trim()
      : path.basename(inputPath, ".md");

    const articleHtml = markdownToArticleHtml(md);
    const outPath =
      inputPath.endsWith(".md") ? inputPath.slice(0, -3) + ".html" : inputPath + ".html";

    const full = buildHtmlPage({
      title,
      articleHtml,
      sourcePath: path.relative(process.cwd(), inputPath) || inputPath,
    });

    fs.writeFileSync(outPath, full, "utf8");
    console.log("書き出し:", path.relative(process.cwd(), outPath) || outPath);
  }
}

main();
