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
"[project]/src/app/api/generate-script/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
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
    const { plan, streaming } = await req.json();
    if (!plan) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        error: "plan required"
    }, {
        status: 400
    });
    const config = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2d$loader$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["loadChannelConfig"])();
    const systemPrompt = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2d$loader$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["buildSystemPrompt"])(config);
    const client = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$anthropic$2d$ai$2f$sdk$2f$client$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__Anthropic__as__default$3e$__["default"]({
        apiKey: process.env.ANTHROPIC_API_KEY
    });
    const prompt = `以下の企画書に基づいて、YouTube動画のトークスクリプトを書いてください。

=== 企画書 ===
タイトル：${plan.episodeTitle}
YouTubeゴール：${plan.youtubeGoal}
想定視聴者：${plan.targetViewer}
視聴者の悩み：${plan.pain}
動画の約束：${plan.promise}

構成：
${(plan.outline ?? []).map((s)=>`・${s.section}：${s.content}`).join("\n")}

=== 執筆ルール ===
1. 視聴者は40〜60代、ITリテラシー初〜中級を想定して親しみやすく
2. 冒頭30秒で視聴者の悩みを直撃するフックを入れる
3. 「実際にやってみます」など一緒に操作できるよう誘導する
4. 各セクションの冒頭は「さて、」「次に、」など自然なつなぎ言葉で
5. 難しい用語は必ず平易な言葉で言い換える
6. エンディングは「チャンネル登録」「高評価」「コメント」の3点を自然に促す
7. 各段落の前に「## セクション名」の見出しを入れる
8. 目標文字数：4,000〜6,000文字

台本のみを書いてください（メタ説明不要）：`;
    if (streaming) {
        const stream = client.messages.stream({
            model: "claude-opus-4-5",
            max_tokens: 6000,
            system: systemPrompt,
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ]
        });
        const encoder = new TextEncoder();
        const readable = new ReadableStream({
            async start (controller) {
                for await (const chunk of stream){
                    if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
                        controller.enqueue(encoder.encode(chunk.delta.text));
                    }
                }
                controller.close();
            }
        });
        return new Response(readable, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8"
            }
        });
    }
    const message = await client.messages.create({
        model: "claude-opus-4-5",
        max_tokens: 6000,
        system: systemPrompt,
        messages: [
            {
                role: "user",
                content: prompt
            }
        ]
    });
    const script = message.content[0].type === "text" ? message.content[0].text : "";
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        script
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0-wtmh~._.js.map