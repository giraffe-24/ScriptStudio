module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/fs/promises [external] (fs/promises, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs/promises", () => require("fs/promises"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[project]/src/lib/config-loader.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "buildSystemPrompt",
    ()=>buildSystemPrompt,
    "loadChannelConfig",
    ()=>loadChannelConfig
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/fs/promises [external] (fs/promises, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
;
;
const ROOT = process.cwd();
const CONFIG_DIR = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(ROOT, "config");
async function loadChannelConfig() {
    const [brand, audience, quality] = await Promise.all([
        __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].readFile(__TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(CONFIG_DIR, "brand.md"), "utf-8").catch(()=>""),
        __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].readFile(__TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(CONFIG_DIR, "audience.md"), "utf-8").catch(()=>""),
        __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].readFile(__TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(CONFIG_DIR, "quality.md"), "utf-8").catch(()=>"")
    ]);
    return {
        brand,
        audience,
        quality
    };
}
function buildSystemPrompt(config) {
    return `あなたは「効率化オタクのあらきり」チャンネルの企画・台本作成AIアシスタントです。

以下のチャンネル設定に厳密に従ってください。

=== ブランド ===
${config.brand}

=== 視聴者ペルソナ ===
${config.audience}

=== 品質基準 ===
${config.quality}`;
}
}),
"[project]/src/app/api/market-research/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$anthropic$2d$ai$2f$sdk$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@anthropic-ai/sdk/index.mjs [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$anthropic$2d$ai$2f$sdk$2f$client$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__Anthropic__as__default$3e$__ = __turbopack_context__.i("[project]/node_modules/@anthropic-ai/sdk/client.mjs [app-route] (ecmascript) <export Anthropic as default>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2d$loader$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/config-loader.ts [app-route] (ecmascript)");
;
;
;
async function fetchYouTubeVideos(query) {
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
    searchUrl.searchParams.set("key", apiKey);
    const searchRes = await fetch(searchUrl.toString());
    const searchData = await searchRes.json();
    if (!searchData.items) return [];
    const videoIds = searchData.items.map((item)=>item.id.videoId).join(",");
    const statsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    statsUrl.searchParams.set("part", "statistics,snippet");
    statsUrl.searchParams.set("id", videoIds);
    statsUrl.searchParams.set("key", apiKey);
    const statsRes = await fetch(statsUrl.toString());
    const statsData = await statsRes.json();
    return (statsData.items ?? []).map((item)=>({
            title: item.snippet.title,
            channelTitle: item.snippet.channelTitle,
            viewCount: item.statistics.viewCount
        }));
}
async function POST(req) {
    const { category } = await req.json();
    const config = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2d$loader$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["loadChannelConfig"])();
    const systemPrompt = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2d$loader$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["buildSystemPrompt"])(config);
    const searchQuery = category ? `${category} スマホ 便利 簡単 設定` : "スマホ 便利 使い方 設定 無料 Google 効率化";
    const videos = await fetchYouTubeVideos(searchQuery);
    const hasYouTubeData = videos.length > 0;
    const videoSummary = hasYouTubeData ? videos.slice(0, 15).map((v, i)=>`${i + 1}. 「${v.title}」(${v.channelTitle}, ${Number(v.viewCount ?? 0).toLocaleString()}回再生)`).join("\n") : "（YouTube API 未設定のため、AIの知識ベースで分析します）";
    const client = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$anthropic$2d$ai$2f$sdk$2f$client$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__Anthropic__as__default$3e$__["default"]({
        apiKey: process.env.ANTHROPIC_API_KEY
    });
    const message = await client.messages.create({
        model: "claude-opus-4-5",
        max_tokens: 2048,
        system: systemPrompt,
        messages: [
            {
                role: "user",
                content: `以下は${hasYouTubeData ? "YouTubeで再生数が多い動画のリスト" : "分析のリクエスト"}です。

${videoSummary}

あなたのチャンネル「効率化オタクのあらきり」の視聴者（40〜60代、ITリテラシー初〜中級、Google系・無料ツール好き）に刺さるテーマ候補を5件提案してください。

以下のJSON配列形式で回答してください。他の説明文は不要です：
[
  {
    "title": "動画タイトル案（視聴者に刺さる言葉を使ったもの）",
    "hook": "最初の30秒で言うフック文（視聴者の悩みを直撃する一文）",
    "targetPain": "audience.md のどの恐れ・欲求に当たるか（1〜2行）",
    "reason": "なぜ今このテーマが視聴者に刺さるか（2〜3行）",
    "score": "high | medium | low"
  }
]`
            }
        ]
    });
    let candidates = [];
    try {
        const text = message.content[0].type === "text" ? message.content[0].text : "[]";
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        candidates = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch  {
        candidates = [];
    }
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        candidates,
        hasYouTubeData
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0te8mde._.js.map