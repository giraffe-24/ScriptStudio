import { NextRequest, NextResponse } from "next/server";
import { listEpisodes, createEpisode, readEpisodeFile, writeEpisodeFile, readPlan, writePlan } from "@/lib/file-manager";

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

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.action === "create") {
    const episode = await createEpisode(body.episode);
    return NextResponse.json({ episode });
  }

  if (body.action === "write") {
    await writeEpisodeFile(body.number, body.slug, body.filename, body.content);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "write-plan") {
    await writePlan(body.number, body.slug, body.plan);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
