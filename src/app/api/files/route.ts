import { NextRequest, NextResponse } from "next/server";
import { listEpisodes, createEpisode, readEpisodeFile, writeEpisodeFile, readPlan, writePlan, updateManifestTitle, updateEpisodeNumber, updateManifestStatus, readScriptMeta, deleteEpisodes, syncScriptRecordBaseline } from "@/lib/file-manager";
import { normalizeEpisodeStatus } from "@/lib/episode-status";
import { isPersistenceConfigurationError } from "@/lib/runtime-persistence";
import { getSessionUsernameFromRequest } from "@/lib/studio-session";
import { getStudioUserName } from "@/lib/studio-user";

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return NextResponse.json(
    { error: message },
    { status: isPersistenceConfigurationError(error) ? 503 : 500 },
  );
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const action = searchParams.get("action");

    if (action === "list") {
      const episodes = await listEpisodes();
      return NextResponse.json({ episodes });
    }

    if (action === "read") {
      const number = Number(searchParams.get("number"));
      const slug = searchParams.get("slug") ?? "";
      const filename = searchParams.get("filename") ?? "";
      const content = await readEpisodeFile(number, slug, filename);
      return NextResponse.json({ content });
    }

    if (action === "read-plan") {
      const number = Number(searchParams.get("number"));
      const slug = searchParams.get("slug") ?? "";
      const plan = await readPlan(number, slug);
      return NextResponse.json({ plan });
    }

    if (action === "read-script-meta") {
      const number = Number(searchParams.get("number"));
      const slug = searchParams.get("slug") ?? "";
      const scriptMeta = await readScriptMeta(number, slug);
      return NextResponse.json({ scriptMeta });
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sessionUser =
      (await getSessionUsernameFromRequest(req)) || getStudioUserName();

    if (body.action === "create") {
      const episode = await createEpisode(body.episode);
      return NextResponse.json({ episode });
    }

    if (body.action === "write") {
      const scriptMeta =
        body.filename === "01-script-draft.md"
          ? await writeEpisodeFile(body.number, body.slug, body.filename, body.content, {
              source: body.scriptSaveSource === "generation" ? "generation" : "manual",
              planFingerprint: body.planFingerprint,
              updatedBy: sessionUser,
            })
          : await writeEpisodeFile(body.number, body.slug, body.filename, body.content);
      return NextResponse.json({ ok: true, scriptMeta });
    }

    if (body.action === "write-plan") {
      await writePlan(body.number, body.slug, body.plan);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "update-title") {
      await updateManifestTitle(body.number, body.slug, body.title);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "update-number") {
      try {
        const episode = await updateEpisodeNumber(body.oldNumber, body.slug, body.newNumber);
        return NextResponse.json({ episode });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ error: message }, { status: 409 });
      }
    }

    if (body.action === "update-status") {
      const status = normalizeEpisodeStatus(body.status);
      const resolved = await updateManifestStatus(body.number, body.slug, status);
      return NextResponse.json({ ok: true, status: resolved });
    }

    if (body.action === "update-recorded-plan") {
      const planFingerprint = typeof body.planFingerprint === "string" ? body.planFingerprint.trim() : "";
      if (!body.number || !body.slug || !planFingerprint) {
        return NextResponse.json({ error: "number, slug, planFingerprint required" }, { status: 400 });
      }
      const scriptMeta = await syncScriptRecordBaseline(body.number, body.slug, planFingerprint);
      return NextResponse.json({ ok: true, scriptMeta });
    }

    if (body.action === "delete") {
      const episodes = Array.isArray(body.episodes) ? body.episodes : [];
      if (episodes.length === 0) {
        return NextResponse.json({ error: "削除対象が指定されていません" }, { status: 400 });
      }
      const mode = body.mode === "permanent" ? "permanent" : "archive";
      const result = await deleteEpisodes(episodes, mode);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (error) {
    return errorResponse(error);
  }
}
