import { NextRequest, NextResponse } from "next/server";
import {
  getFileContentAtRef,
  isGitMirrorConfigured,
  listFileCommits,
} from "@/lib/git-mirror";
import { episodeDirName, isValidEpisodeIdentity } from "@/lib/episode-identity";

/** Git 履歴を辿ってよいエピソードファイル（任意入力からの露出を絞る）。 */
const ALLOWED_FILES = new Set([
  "plan.json",
  "01-script-draft.md",
  "00-plan-and-structure.md",
  "manifest.json",
]);

function relPathFor(number: number, slug: string, filename: string): string {
  return `outputs/${episodeDirName(number, slug)}/${filename}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const action = searchParams.get("action");

  if (action === "status") {
    return NextResponse.json({ configured: isGitMirrorConfigured() });
  }

  if (!isGitMirrorConfigured()) {
    return NextResponse.json({ error: "Git ミラーが未設定です" }, { status: 503 });
  }

  const number = Number(searchParams.get("number"));
  const slug = searchParams.get("slug") ?? "";
  const filename = searchParams.get("filename") ?? "";
  if (!isValidEpisodeIdentity(number, slug) || !ALLOWED_FILES.has(filename)) {
    return NextResponse.json(
      { error: "number / slug / filename が不正です" },
      { status: 400 },
    );
  }
  const relPath = relPathFor(number, slug.trim(), filename);

  try {
    if (action === "list") {
      const commits = await listFileCommits(relPath);
      return NextResponse.json({ commits });
    }

    if (action === "content") {
      const sha = searchParams.get("sha") ?? "";
      if (!sha) {
        return NextResponse.json({ error: "sha required" }, { status: 400 });
      }
      const content = await getFileContentAtRef(relPath, sha);
      return NextResponse.json({ content });
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
