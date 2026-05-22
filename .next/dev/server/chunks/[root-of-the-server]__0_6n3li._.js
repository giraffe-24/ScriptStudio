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
"[project]/src/app/api/generate-plan/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
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
async function POST(req) {
    const { theme, hook, targetPain, reason } = await req.json();
    if (!theme) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        error: "theme required"
    }, {
        status: 400
    });
    const config = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2d$loader$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["loadChannelConfig"])();
    const systemPrompt = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2d$loader$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["buildSystemPrompt"])(config);
    const client = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$anthropic$2d$ai$2f$sdk$2f$client$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__Anthropic__as__default$3e$__["default"]({
        apiKey: process.env.ANTHROPIC_API_KEY
    });
    const message = await client.messages.create({
        model: "claude-opus-4-5",
        max_tokens: 3000,
        system: systemPrompt,
        messages: [
            {
                role: "user",
                content: `以下のテーマで YouTube 動画の企画書を作成してください。

テーマ：${theme}
${hook ? `フック：${hook}` : ""}
${targetPain ? `ターゲットの悩み：${targetPain}` : ""}
${reason ? `選定理由：${reason}` : ""}

以下のJSON形式で企画書を作成してください：
{
  "episodeTitle": "最終的な動画タイトル（30文字以内、視聴者の言葉で）",
  "targetViewer": "想定視聴者プロフィール（具体的な人物像・状況）",
  "pain": "視聴者が抱える具体的な悩み・不安・欲求",
  "promise": "動画を最後まで見ると視聴者が得られる価値",
  "keyPoints": [
    "コンテンツの核となるポイント1",
    "コンテンツの核となるポイント2",
    "コンテンツの核となるポイント3"
  ],
  "outline": [
    { "section": "オープニング（0:00〜）", "content": "内容の概要" },
    { "section": "本題①（x:xx〜）", "content": "内容の概要" },
    { "section": "本題②（x:xx〜）", "content": "内容の概要" },
    { "section": "まとめ（x:xx〜）", "content": "内容の概要" }
  ],
  "competitorAnalysis": "競合動画との差別化ポイント（2〜3行）",
  "estimatedLength": "想定動画尺（例：8〜12分）"
}`
            }
        ]
    });
    try {
        const text = message.content[0].type === "text" ? message.content[0].text : "{}";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const plan = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            plan
        });
    } catch  {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "parse error"
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0_6n3li._.js.map