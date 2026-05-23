const FETCH_OPTS: RequestInit = { cache: "no-store" };

export interface ResolvedYouTubeChannel {
  channelId: string;
  displayName: string;
}

type ParsedChannelRef =
  | { kind: "id"; channelId: string }
  | { kind: "handle"; handle: string }
  | { kind: "username"; username: string };

/** ユーザー入力（URL・@handle・channelId）を解析 */
export function parseYouTubeChannelInput(raw: string): ParsedChannelRef | null {
  const input = raw.trim();
  if (!input) return null;

  if (/^UC[\w-]{20,}$/.test(input)) {
    return { kind: "id", channelId: input };
  }

  if (input.startsWith("@")) {
    const handle = input.slice(1).split(/[/?#]/)[0];
    return handle ? { kind: "handle", handle } : null;
  }

  let url: URL;
  try {
    url = new URL(input.includes("://") ? input : `https://${input}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "");
  if (host !== "youtube.com" && host !== "m.youtube.com") return null;

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length === 0) return null;

  if (parts[0] === "channel" && parts[1]?.startsWith("UC")) {
    return { kind: "id", channelId: parts[1] };
  }

  if (parts[0].startsWith("@")) {
    return { kind: "handle", handle: parts[0].slice(1) };
  }

  if (parts[0] === "user" && parts[1]) {
    return { kind: "username", username: parts[1] };
  }

  if (parts[0] === "c" && parts[1]) {
    return { kind: "handle", handle: parts[1] };
  }

  return null;
}

async function fetchChannelByQuery(
  apiKey: string,
  params: Record<string, string>,
): Promise<ResolvedYouTubeChannel | null> {
  const url = new URL("https://www.googleapis.com/youtube/v3/channels");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("key", apiKey);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), FETCH_OPTS);
  const data = await res.json();
  const item = data.items?.[0];
  if (!item?.id) return null;

  return {
    channelId: item.id,
    displayName: item.snippet?.title ?? item.id,
  };
}

export async function resolveYouTubeChannel(raw: string): Promise<ResolvedYouTubeChannel | null> {
  const apiKey = process.env.YOUTUBE_DATA_API_KEY;
  if (!apiKey) return null;

  const parsed = parseYouTubeChannelInput(raw);
  if (!parsed) return null;

  if (parsed.kind === "id") {
    return fetchChannelByQuery(apiKey, { id: parsed.channelId });
  }
  if (parsed.kind === "handle") {
    const byHandle = await fetchChannelByQuery(apiKey, { forHandle: parsed.handle });
    if (byHandle) return byHandle;
    return searchChannelByName(apiKey, parsed.handle);
  }
  if (parsed.kind === "username") {
    return fetchChannelByQuery(apiKey, { forUsername: parsed.username });
  }

  return null;
}

async function searchChannelByName(
  apiKey: string,
  query: string,
): Promise<ResolvedYouTubeChannel | null> {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "channel");
  url.searchParams.set("maxResults", "1");
  url.searchParams.set("q", query);
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString(), FETCH_OPTS);
  const data = await res.json();
  const item = data.items?.[0];
  const channelId = item?.id?.channelId ?? item?.snippet?.channelId;
  if (!channelId) return null;

  return {
    channelId,
    displayName: item.snippet?.title ?? channelId,
  };
}
