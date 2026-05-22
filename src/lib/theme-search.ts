export interface YouTubeVideo {
  title: string;
  channelTitle: string;
  viewCount?: string;
  publishedAt?: string;
}

export interface GoogleWebResult {
  title: string;
  snippet: string;
  link: string;
}

export interface XPostResult {
  text: string;
  author?: string;
  createdAt?: string;
  url?: string;
  source: "x-api" | "google";
}

export interface ThemeSearchSources {
  youtube: boolean;
  google: boolean;
  x: boolean;
}

export interface ThemeSearchResult {
  query: string;
  youtube: YouTubeVideo[];
  google: GoogleWebResult[];
  x: XPostResult[];
  sources: ThemeSearchSources;
}

const RECENT_MONTHS = 12;
const FETCH_OPTS: RequestInit = { cache: "no-store" };

function recentIsoMonthsAgo(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString();
}

/** YouTube（第一指標） */
export async function searchYouTubeVideos(query: string): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_DATA_API_KEY;
  if (!apiKey) return [];

  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("q", query);
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("order", "viewCount");
  searchUrl.searchParams.set("maxResults", "20");
  searchUrl.searchParams.set("regionCode", "JP");
  searchUrl.searchParams.set("relevanceLanguage", "ja");
  searchUrl.searchParams.set("publishedAfter", recentIsoMonthsAgo(RECENT_MONTHS));
  searchUrl.searchParams.set("key", apiKey);

  const searchRes = await fetch(searchUrl.toString(), FETCH_OPTS);
  const searchData = await searchRes.json();
  if (!searchData.items?.length) return [];

  const videoIds = searchData.items
    .map((item: { id: { videoId: string } }) => item.id.videoId)
    .join(",");

  const statsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  statsUrl.searchParams.set("part", "statistics,snippet");
  statsUrl.searchParams.set("id", videoIds);
  statsUrl.searchParams.set("key", apiKey);

  const statsRes = await fetch(statsUrl.toString(), FETCH_OPTS);
  const statsData = await statsRes.json();

  return (statsData.items ?? []).map(
    (item: {
      snippet: { title: string; channelTitle: string; publishedAt?: string };
      statistics: { viewCount?: string };
    }) => ({
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      viewCount: item.statistics.viewCount,
      publishedAt: item.snippet.publishedAt,
    }),
  );
}

/** Google 検索（Custom Search JSON API） */
export async function searchGoogleWeb(query: string): Promise<GoogleWebResult[]> {
  const apiKey = process.env.GOOGLE_CSE_API_KEY ?? process.env.YOUTUBE_DATA_API_KEY;
  const cx = process.env.GOOGLE_CSE_CX;
  if (!apiKey || !cx) return [];

  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("cx", cx);
  url.searchParams.set("q", query);
  url.searchParams.set("num", "10");
  url.searchParams.set("dateRestrict", "m12");
  url.searchParams.set("lr", "lang_ja");
  url.searchParams.set("hl", "ja");
  url.searchParams.set("gl", "jp");

  const res = await fetch(url.toString(), FETCH_OPTS);
  const data = await res.json();
  if (!data.items?.length) return [];

  return data.items.map(
    (item: { title?: string; snippet?: string; link?: string }) => ({
      title: item.title ?? "",
      snippet: item.snippet ?? "",
      link: item.link ?? "",
    }),
  );
}

/** X API v2（Bearer トークン） */
async function searchXViaApi(query: string): Promise<XPostResult[]> {
  const token = process.env.X_BEARER_TOKEN;
  if (!token) return [];

  const url = new URL("https://api.twitter.com/2/tweets/search/recent");
  url.searchParams.set("query", `${query} lang:ja -is:retweet`);
  url.searchParams.set("max_results", "10");
  url.searchParams.set("tweet.fields", "created_at,author_id");
  url.searchParams.set("expansions", "author_id");
  url.searchParams.set("user.fields", "username");

  const res = await fetch(url.toString(), {
    ...FETCH_OPTS,
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];

  const data = await res.json();
  const users = new Map<string, string>(
    (data.includes?.users ?? []).map((u: { id: string; username: string }) => [u.id, u.username]),
  );

  return (data.data ?? []).map(
    (tweet: { id: string; text: string; author_id?: string; created_at?: string }) => ({
      text: tweet.text,
      author: tweet.author_id ? users.get(tweet.author_id) : undefined,
      createdAt: tweet.created_at,
      url: tweet.id ? `https://x.com/i/web/status/${tweet.id}` : undefined,
      source: "x-api" as const,
    }),
  );
}

/** X 向け Google site 検索（X API 未設定時のフォールバック） */
async function searchXViaGoogle(query: string): Promise<XPostResult[]> {
  const results = await searchGoogleWeb(`${query} (site:x.com OR site:twitter.com)`);
  return results.map((r) => ({
    text: `${r.title} — ${r.snippet}`.trim(),
    url: r.link,
    source: "google" as const,
  }));
}

export async function searchXPosts(query: string): Promise<XPostResult[]> {
  const viaApi = await searchXViaApi(query);
  if (viaApi.length > 0) return viaApi;
  return searchXViaGoogle(query);
}

/** 3 ソースを並列検索（YouTube 必須・他はベストエフォート） */
export async function runThemeSearch(query: string): Promise<ThemeSearchResult> {
  const [youtube, google, x] = await Promise.all([
    searchYouTubeVideos(query),
    searchGoogleWeb(query),
    searchXPosts(query),
  ]);

  return {
    query,
    youtube,
    google,
    x,
    sources: {
      youtube: youtube.length > 0,
      google: google.length > 0,
      x: x.length > 0,
    },
  };
}

export function formatVideoSummary(videos: YouTubeVideo[]): string {
  if (videos.length === 0) return "（結果なし）";
  return videos
    .slice(0, 15)
    .map(
      (v, i) =>
        `${i + 1}. 「${v.title}」(${v.channelTitle}, ${Number(v.viewCount ?? 0).toLocaleString()}回再生${v.publishedAt ? `, ${v.publishedAt.slice(0, 10)}` : ""})`,
    )
    .join("\n");
}

function formatGoogleSummary(results: GoogleWebResult[]): string {
  if (results.length === 0) return "（結果なし）";
  return results
    .slice(0, 10)
    .map((r, i) => `${i + 1}. ${r.title}\n   ${r.snippet}\n   ${r.link}`)
    .join("\n");
}

function formatXSummary(posts: XPostResult[]): string {
  if (posts.length === 0) return "（結果なし）";
  return posts
    .slice(0, 10)
    .map((p, i) => {
      const meta = [p.author ? `@${p.author}` : null, p.createdAt?.slice(0, 10), p.url]
        .filter(Boolean)
        .join(", ");
      return `${i + 1}. ${p.text}${meta ? `\n   (${meta})` : ""}`;
    })
    .join("\n");
}

export function formatThemeSearchContext(result: ThemeSearchResult): string {
  return `=== 【第一指標】YouTube 検索結果 ===
${formatVideoSummary(result.youtube)}

=== Google 検索結果（補助） ===
${formatGoogleSummary(result.google)}

=== X（SNS）検索結果（補助） ===
${formatXSummary(result.x)}`;
}

export const THEME_SEARCH_RULES = `
=== テーマ選定の厳守事項（config/theme-selection.md） ===
- 根拠は YouTube・Google・X の検索結果「のみ」。学習データの推測で候補を足さない
- 第一指標は YouTube。score の high は YouTube リストと明確に対応する候補に限る
- reason には参照した YouTube 動画タイトルを必ず 1 件以上含める（リスト外引用禁止）
- Google / X は補助。YouTube に無い話題を Google/X だけを根拠に high にしない
- 検索ボリューム・CTR 等、API が返していない数値を reason に書かない
- 未確認のアップデート日・リリース情報を断定しない
`;

export function buildThemeSearchUserPrompt(
  searchQuery: string,
  result: ThemeSearchResult,
  taskPrompt: string,
): string {
  return `${THEME_SEARCH_RULES}

検索クエリ：「${searchQuery}」

以下は今回の検索で取得した結果です。このブロック以外の情報は根拠に使わないでください。
YouTube を第一指標とし、Google・X は補助として読むこと。

${formatThemeSearchContext(result)}

${taskPrompt}`;
}
