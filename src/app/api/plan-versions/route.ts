import { NextRequest, NextResponse } from "next/server";
import {
  createLocalPlanSnapshot,
  getLatestLocalPlanSnapshot,
  getLocalPlanSnapshotById,
  listLocalPlanSnapshots,
} from "@/lib/plan-versions-local";
import { getSessionUsernameFromRequest } from "@/lib/studio-session";
import { getStudioUserName } from "@/lib/studio-user";
import {
  MASKED_AUTHOR,
  isEpisodeAllowedForReviewer,
  isReviewerRequest,
} from "@/lib/reviewer-access";
import type { PlanSnapshot } from "@/lib/plan-versions-local";

/**
 * 企画書スナップショット履歴の API（台本の script-versions と同じ方針）。
 * 保存先はサーバーのファイルシステム（.plan-history/）だけで、外部ストアは使わない。
 */

function reviewerForbidden() {
  return NextResponse.json(
    { error: "このエピソードは閲覧できません" },
    { status: 403 },
  );
}

function maskSnapshot(snapshot: PlanSnapshot): PlanSnapshot {
  return { ...snapshot, authorName: MASKED_AUTHOR };
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const action = searchParams.get("action");

  if (action === "status") {
    return NextResponse.json({
      configured: true,
      hint: null,
    });
  }

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
      const snapshots = await listLocalPlanSnapshots(number, slug);
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
      const snapshot = await getLatestLocalPlanSnapshot(number, slug);
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
      const snapshot = await getLocalPlanSnapshotById(id);
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
    const snapshot = await createLocalPlanSnapshot({
      episodeNumber,
      episodeSlug,
      authorName,
      summary,
      content,
    });
    return NextResponse.json({ snapshot });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
