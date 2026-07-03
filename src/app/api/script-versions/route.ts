import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, getSupabaseConfigHint } from "@/lib/supabase-server";
import { shouldUsePersistedRuntimeStore } from "@/lib/runtime-persistence";

/**
 * 台本スナップショット履歴の保存先を判定する。
 * - 本番（Vercel）: ファイルシステムが揮発するため Supabase 必須。
 * - ローカル開発: Supabase に到達できなくても壊れないよう、ファイルベースの
 *   ローカル履歴（.script-history/）を使う。これによりローカルでも
 *   「保存（記録）」「履歴」「この版に戻す」が使える。
 */
function versionsEnabled(): boolean {
  if (shouldUsePersistedRuntimeStore()) return isSupabaseConfigured();
  return true;
}

/** Supabase を保存先に使うか（本番かつ設定あり）。false ならローカルファイル。 */
function remoteStoreEnabled(): boolean {
  return shouldUsePersistedRuntimeStore() && isSupabaseConfigured();
}
import { syncScriptRecordBaseline } from "@/lib/file-manager";
import {
  createScriptSnapshot,
  getLatestScriptSnapshot,
  getScriptSnapshotById,
  listScriptSnapshots,
} from "@/lib/script-versions";
import {
  createLocalScriptSnapshot,
  getLatestLocalScriptSnapshot,
  getLocalScriptSnapshotById,
  listLocalScriptSnapshots,
} from "@/lib/script-versions-local";
import type { DiffStats } from "@/lib/script-diff";
import { getSessionUsernameFromRequest } from "@/lib/studio-session";
import { getStudioUserName } from "@/lib/studio-user";
import {
  MASKED_AUTHOR,
  isEpisodeAllowedForReviewer,
  isReviewerRequest,
} from "@/lib/reviewer-access";
import type { ScriptSnapshot } from "@/lib/script-versions";

function reviewerForbidden() {
  return NextResponse.json(
    { error: "このエピソードは閲覧できません" },
    { status: 403 },
  );
}

function maskSnapshot(snapshot: ScriptSnapshot): ScriptSnapshot {
  return { ...snapshot, authorName: MASKED_AUTHOR };
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
  const reviewer = await isReviewerRequest(req);

  if (action === "list") {
    if (!number || !slug) {
      return NextResponse.json({ error: "number and slug required" }, { status: 400 });
    }
    if (reviewer && !isEpisodeAllowedForReviewer(number, slug)) {
      return reviewerForbidden();
    }
    try {
      const snapshots = remoteStoreEnabled()
        ? await listScriptSnapshots(number, slug)
        : await listLocalScriptSnapshots(number, slug);
      return NextResponse.json({
        snapshots: reviewer ? snapshots.map(maskSnapshot) : snapshots,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  if (action === "latest") {
    if (!number || !slug) {
      return NextResponse.json({ error: "number and slug required" }, { status: 400 });
    }
    if (reviewer && !isEpisodeAllowedForReviewer(number, slug)) {
      return reviewerForbidden();
    }
    try {
      const snapshot = remoteStoreEnabled()
        ? await getLatestScriptSnapshot(number, slug)
        : await getLatestLocalScriptSnapshot(number, slug);
      return NextResponse.json({
        snapshot: reviewer && snapshot ? maskSnapshot(snapshot) : snapshot,
      });
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
        ? await getScriptSnapshotById(id)
        : await getLocalScriptSnapshotById(id);
      if (!snapshot) return NextResponse.json({ error: "not found" }, { status: 404 });
      if (reviewer && !isEpisodeAllowedForReviewer(snapshot.episodeNumber, snapshot.episodeSlug)) {
        return reviewerForbidden();
      }
      return NextResponse.json({
        snapshot: reviewer ? maskSnapshot(snapshot) : snapshot,
      });
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
    diffStats?: DiffStats | null;
    planFingerprint?: string;
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
      ? await createScriptSnapshot({
          episodeNumber,
          episodeSlug,
          authorName,
          summary,
          content,
          diffStats: body.diffStats ?? null,
        })
      : await createLocalScriptSnapshot({
          episodeNumber,
          episodeSlug,
          authorName,
          summary,
          content,
          diffStats: body.diffStats ?? null,
        });
    let scriptMeta = null;
    if (body.planFingerprint?.trim()) {
      scriptMeta = await syncScriptRecordBaseline(
        episodeNumber,
        episodeSlug,
        body.planFingerprint.trim(),
      );
    }
    return NextResponse.json({ snapshot, scriptMeta });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
