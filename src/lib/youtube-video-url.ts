/** YouTube 動画 URL から videoId を抽出する（クライアント・サーバー共用） */

const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

export function parseYouTubeVideoId(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\.|^m\./, "");

  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0] ?? "";
    return VIDEO_ID_PATTERN.test(id) ? id : null;
  }

  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const v = url.searchParams.get("v");
    if (v && VIDEO_ID_PATTERN.test(v)) return v;

    const segments = url.pathname.split("/").filter(Boolean);
    if (
      segments.length >= 2 &&
      ["shorts", "live", "embed", "v"].includes(segments[0]) &&
      VIDEO_ID_PATTERN.test(segments[1])
    ) {
      return segments[1];
    }
  }

  return null;
}
