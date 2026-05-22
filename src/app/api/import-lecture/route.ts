import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { parseLectureMarkdown } from "@/lib/parse-lecture-md";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const filename =
      typeof body.filename === "string"
        ? body.filename
        : "第5回 講義 文字起こし.md";

    const filePath = path.join(process.cwd(), "講義", filename);
    const raw = await readFile(filePath, "utf-8");
    const parsed = parseLectureMarkdown(raw);

    const slug = parsed.title
      .toLowerCase()
      .replace(/[^\w\u3040-\u9fff\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 60);

    const episodeNumber = 5;

    const { data: existing } = await supabase
      .from("episodes")
      .select("id")
      .eq("number", episodeNumber)
      .maybeSingle();

    let episodeId: string;

    if (existing) {
      episodeId = existing.id;
      await supabase.from("paragraphs").delete().eq("episode_id", episodeId);
      await supabase.from("sections").delete().eq("episode_id", episodeId);
      await supabase.from("episodes").update({ title: parsed.title, slug }).eq("id", episodeId);
    } else {
      const { data: ep, error } = await supabase
        .from("episodes")
        .insert({
          slug,
          number: episodeNumber,
          title: parsed.title,
          status: "draft",
        })
        .select("id")
        .single();
      if (error || !ep) throw error ?? new Error("episode insert failed");
      episodeId = ep.id;
    }

    for (let si = 0; si < parsed.sections.length; si++) {
      const sec = parsed.sections[si];
      const { data: section, error: secErr } = await supabase
        .from("sections")
        .insert({ episode_id: episodeId, name: sec.name, order: si + 1 })
        .select("id")
        .single();
      if (secErr || !section) throw secErr ?? new Error("section insert failed");

      const rows = sec.paragraphs.map((content, pi) => ({
        section_id: section.id,
        episode_id: episodeId,
        content,
        slide_memo: "",
        order: pi + 1,
      }));

      const { error: paraErr } = await supabase.from("paragraphs").insert(rows);
      if (paraErr) throw paraErr;
    }

    return NextResponse.json({
      ok: true,
      episodeId,
      title: parsed.title,
      sectionCount: parsed.sections.length,
      paragraphCount: parsed.sections.reduce((n, s) => n + s.paragraphs.length, 0),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "import failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
