#!/usr/bin/env node
// 自チャンネル（あらきりチャンネル @arakiri_ch）の現況分析 CLI
//
// Usage:
//   npm run analyze-channel            # チャンネル統計 + 直近20本
//   npm run analyze-channel -- 50     # 直近50本（最大50）
//
// APIキーは .env の YOUTUBE_DATA_API_KEY を使用。
// チャンネルIDは ARAKIRI_YOUTUBE_CHANNEL_ID があればそれを、無ければ forHandle で解決する
// （src/lib/market-analysis/collectors/own-channel.ts と同じ流儀）。
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadDotEnv() {
  for (const file of [".env", ".env.local"]) {
    try {
      const raw = readFileSync(resolve(root, file), "utf8");
      for (const line of raw.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq <= 0) continue;
        const key = trimmed.slice(0, eq).trim();
        const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) process.env[key] = val;
      }
    } catch {
      // ファイルが無くても続行
    }
  }
}

loadDotEnv();
const apiKey = process.env.YOUTUBE_DATA_API_KEY;
if (!apiKey) {
  console.error("YOUTUBE_DATA_API_KEY が .env にありません");
  process.exit(1);
}

const maxResults = Math.min(Number(process.argv[2]) || 20, 50);

async function api(path, params) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("key", apiKey);
  const res = await fetch(url, { cache: "no-store" });
  return res.json();
}

const envId = process.env.ARAKIRI_YOUTUBE_CHANNEL_ID;
const ch = await api("channels", {
  part: "id,snippet,statistics,contentDetails",
  ...(envId ? { id: envId } : { forHandle: "arakiri_ch" }),
});
const channel = ch.items?.[0];
if (!channel) {
  console.error("チャンネル取得に失敗:", JSON.stringify(ch).slice(0, 300));
  process.exit(1);
}

const stats = channel.statistics;
console.log(`チャンネル: ${channel.snippet.title}（${channel.snippet.customUrl}）`);
console.log(`ID: ${channel.id}`);
console.log(
  `登録者: ${Number(stats.subscriberCount).toLocaleString()}人 / 動画: ${stats.videoCount}本 / 累計再生: ${Number(stats.viewCount).toLocaleString()}回`,
);

const uploads = channel.contentDetails.relatedPlaylists.uploads;
const pl = await api("playlistItems", {
  part: "contentDetails",
  playlistId: uploads,
  maxResults: String(maxResults),
});
const ids = (pl.items ?? [])
  .map((i) => i.contentDetails?.videoId)
  .filter(Boolean)
  .join(",");
if (!ids) process.exit(0);

const vids = await api("videos", { part: "snippet,statistics", id: ids });

console.log(`\n公開日        再生数   高評価  タイトル（直近${vids.items?.length ?? 0}本）`);
for (const v of vids.items ?? []) {
  const d = v.snippet.publishedAt.slice(0, 10);
  const views = String(Number(v.statistics.viewCount ?? 0).toLocaleString()).padStart(8);
  const likes = String(v.statistics.likeCount ?? "-").padStart(5);
  console.log(`${d}  ${views}  ${likes}  ${v.snippet.title}`);
}
