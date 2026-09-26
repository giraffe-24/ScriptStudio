import { NextResponse } from "next/server";
import { isGitMirrorConfigured } from "@/lib/git-mirror";

/**
 * 保存先（永続化バックエンド）の健全性診断。
 *
 * 保存先はサーバーのファイルシステム（outputs/ ・config/ ・.script-history/ など）
 * だけなので、到達確認の対象になる外部ストアは無い。
 * デプロイのヘルスチェック（triage）から叩かれるため、正常なら ok:true を返す。
 * 秘密情報（キー・完全なURL）は返さない。
 */

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      runtime: "local",
      persistence: {
        backend: "local-filesystem",
      },
      mirror: { configured: isGitMirrorConfigured() },
    },
    { status: 200 },
  );
}
