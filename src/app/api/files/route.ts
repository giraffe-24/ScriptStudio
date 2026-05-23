import { NextRequest, NextResponse } from "next/server";
import { listEpisodes, createEpisode, readEpisodeFile, writeEpisodeFile, readPlan, writePlan, updateManifestTitle, updateEpisodeNumber, updateManifestStatus, readScriptMeta } from "@/lib/file-manager";
import { normalizeEpisodeStatus, type EpisodeStatus } from "@/lib/episode-status";

export async function GET(req: NextRequest) {
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
}

export async function POST(req: NextRequest) {
  const body = await req.json();

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
    await updateManifestStatus(body.number, body.slug, status);
    return NextResponse.json({ ok: true, status });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
