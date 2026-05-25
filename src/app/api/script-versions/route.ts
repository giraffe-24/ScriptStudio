import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase-server";
import {
  createScriptSnapshot,
  getLatestScriptSnapshot,
  getScriptSnapshotById,
  listScriptSnapshots,
} from "@/lib/script-versions";
import type { DiffStats } from "@/lib/script-diff";
import { getSessionUsernameFromRequest } from "@/lib/studio-session";
import { getStudioUserName } from "@/lib/studio-user";

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
    return NextResponse.json({ configured: isSupabaseConfigured() });
  }

  if (!isSupabaseConfigured()) return notConfigured();

  const number = Number(searchParams.get("number"));
  const slug = searchParams.get("slug") ?? "";

  if (action === "list") {
    if (!number || !slug) {
      return NextResponse.json({ error: "number and slug required" }, { status: 400 });
    }
    try {
      const snapshots = await listScriptSnapshots(number, slug);
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
      const snapshot = await getLatestScriptSnapshot(number, slug);
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
      const snapshot = await getScriptSnapshotById(id);
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
  if (!isSupabaseConfigured()) return notConfigured();

  let body: {
    episodeNumber?: number;
    episodeSlug?: string;
    authorName?: string;
    summary?: string;
    content?: string;
    diffStats?: DiffStats | null;
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
    const snapshot = await createScriptSnapshot({
      episodeNumber,
      episodeSlug,
      authorName,
      summary,
      content,
      diffStats: body.diffStats ?? null,
    });
    return NextResponse.json({ snapshot });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
