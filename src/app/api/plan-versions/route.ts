import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, getSupabaseConfigHint } from "@/lib/supabase-server";
import { shouldUsePersistedRuntimeStore } from "@/lib/runtime-persistence";
import {
  createPlanSnapshot,
  getLatestPlanSnapshot,
  getPlanSnapshotById,
  listPlanSnapshots,
} from "@/lib/plan-versions";
import {
  createLocalPlanSnapshot,
  getLatestLocalPlanSnapshot,
  getLocalPlanSnapshotById,
  listLocalPlanSnapshots,
} from "@/lib/plan-versions-local";
import { getSessionUsernameFromRequest } from "@/lib/studio-session";
import { getStudioUserName } from "@/lib/studio-user";

/**
 * 企画書スナップショット履歴の保存先を判定する（台本の script-versions と同じ方針）。
 * - 本番（Vercel）: ファイルシステムが揮発するため Supabase 必須。
 * - ローカル開発: ファイルベースのローカル履歴（.plan-history/）を使う。
 */
function versionsEnabled(): boolean {
  if (shouldUsePersistedRuntimeStore()) return isSupabaseConfigured();
  return true;
}

/** Supabase を保存先に使うか（本番かつ設定あり）。false ならローカルファイル。 */
function remoteStoreEnabled(): boolean {
  return shouldUsePersistedRuntimeStore() && isSupabaseConfigured();
}

function notConfigured() {
  return NextResponse.json(
    { error: "Supabase が未設定です。SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を設定してください。" },
    { status: 503 },
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const action = searchParams.get("action");

  if (action === "status") {
    return NextResponse.json({
      configured: versionsEnabled(),
      hint: getSupabaseConfigHint(),
    });
  }

  if (!versionsEnabled()) return notConfigured();

  const number = Number(searchParams.get("number"));
  const slug = searchParams.get("slug") ?? "";

  if (action === "list") {
    if (!number || !slug) {
      return NextResponse.json({ error: "number and slug required" }, { status: 400 });
    }
    try {
      const snapshots = remoteStoreEnabled()
        ? await listPlanSnapshots(number, slug)
        : await listLocalPlanSnapshots(number, slug);
      return NextResponse.json({ snapshots });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  if (action === "latest") {
    if (!number || !slug) {
      return NextResponse.json({ error: "number and slug required" }, { status: 400 });
    }
    try {
      const snapshot = remoteStoreEnabled()
        ? await getLatestPlanSnapshot(number, slug)
        : await getLatestLocalPlanSnapshot(number, slug);
      return NextResponse.json({ snapshot });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  if (action === "get") {
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    try {
      const snapshot = remoteStoreEnabled()
        ? await getPlanSnapshotById(id)
        : await getLocalPlanSnapshotById(id);
      if (!snapshot) return NextResponse.json({ error: "not found" }, { status: 404 });
      return NextResponse.json({ snapshot });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  if (!versionsEnabled()) return notConfigured();

  let body: {
    episodeNumber?: number;
    episodeSlug?: string;
    authorName?: string;
    summary?: string;
    content?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const episodeNumber = Number(body.episodeNumber);
  const episodeSlug = body.episodeSlug?.trim() ?? "";
  const sessionUser = await getSessionUsernameFromRequest(req);
  const authorName =
    sessionUser?.trim() || body.authorName?.trim() || getStudioUserName();
  const summary = body.summary?.trim() ?? "";
  const content = body.content ?? "";

  if (!episodeNumber || !episodeSlug || !authorName || !summary || !content.trim()) {
    return NextResponse.json({ error: "missing required fields" }, { status: 400 });
  }

  try {
    const snapshot = remoteStoreEnabled()
      ? await createPlanSnapshot({ episodeNumber, episodeSlug, authorName, summary, content })
      : await createLocalPlanSnapshot({ episodeNumber, episodeSlug, authorName, summary, content });
    return NextResponse.json({ snapshot });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
