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
"[project]/src/lib/file-manager.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createEpisode",
    ()=>createEpisode,
    "listEpisodes",
    ()=>listEpisodes,
    "readEpisodeFile",
    ()=>readEpisodeFile,
    "updateManifestStatus",
    ()=>updateManifestStatus,
    "writeEpisodeFile",
    ()=>writeEpisodeFile
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/fs/promises [external] (fs/promises, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
;
;
const ROOT = process.cwd();
const OUTPUTS_DIR = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(ROOT, "outputs");
async function listEpisodes() {
    const entries = await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].readdir(OUTPUTS_DIR, {
        withFileTypes: true
    }).catch(()=>[]);
    const episodes = [];
    for (const entry of entries){
        if (!entry.isDirectory() || entry.name.startsWith(".") || entry.name === "没") continue;
        const manifestPath = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(OUTPUTS_DIR, entry.name, "manifest.json");
        try {
            const raw = await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].readFile(manifestPath, "utf-8");
            const m = JSON.parse(raw);
            episodes.push({
                id: m.id ?? entry.name,
                number: Number(m.id ?? 0),
                slug: m.slug ?? entry.name,
                title: m.title ?? entry.name,
                status: m.status ?? "planning",
                themePattern: m.theme_pattern,
                createdAt: m.created_at ?? "",
                hook: m.hook,
                targetPain: m.target_pain,
                reason: m.reason
            });
        } catch  {
        // manifest.json がないフォルダはスキップ
        }
    }
    return episodes.sort((a, b)=>b.number - a.number);
}
async function createEpisode(episode) {
    const slug = episode.slug || episode.title.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").slice(0, 50);
    const dirName = `${String(episode.number).padStart(2, "0")}-${slug}`;
    const dirPath = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(OUTPUTS_DIR, dirName);
    await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].mkdir(dirPath, {
        recursive: true
    });
    const ep = {
        ...episode,
        slug,
        createdAt: new Date().toISOString().slice(0, 10)
    };
    const manifest = {
        id: String(episode.number),
        slug,
        title: episode.title,
        status: episode.status,
        theme_pattern: episode.themePattern,
        created_at: ep.createdAt,
        hook: episode.hook,
        target_pain: episode.targetPain,
        reason: episode.reason,
        panes: [
            {
                id: "pane1",
                label: "企画",
                path: "00-plan-and-structure.md"
            },
            {
                id: "pane2",
                label: "台本",
                path: "01-script-draft.md"
            }
        ]
    };
    await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].writeFile(__TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(dirPath, "manifest.json"), JSON.stringify(manifest, null, 2));
    return ep;
}
async function readEpisodeFile(number, slug, filename) {
    const dirName = `${String(number).padStart(2, "0")}-${slug}`;
    const filePath = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(OUTPUTS_DIR, dirName, filename);
    return __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].readFile(filePath, "utf-8").catch(()=>"");
}
async function writeEpisodeFile(number, slug, filename, content) {
    const dirName = `${String(number).padStart(2, "0")}-${slug}`;
    const dirPath = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(OUTPUTS_DIR, dirName);
    await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].mkdir(dirPath, {
        recursive: true
    });
    await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].writeFile(__TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(dirPath, filename), content, "utf-8");
}
async function updateManifestStatus(number, slug, status) {
    const dirName = `${String(number).padStart(2, "0")}-${slug}`;
    const manifestPath = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(OUTPUTS_DIR, dirName, "manifest.json");
    const raw = await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].readFile(manifestPath, "utf-8");
    const m = JSON.parse(raw);
    m.status = status;
    await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].writeFile(manifestPath, JSON.stringify(m, null, 2));
}
}),
"[project]/src/app/api/files/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$file$2d$manager$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/file-manager.ts [app-route] (ecmascript)");
;
;
async function GET(req) {
    const { searchParams } = req.nextUrl;
    const action = searchParams.get("action");
    if (action === "list") {
        const episodes = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$file$2d$manager$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["listEpisodes"])();
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            episodes
        });
    }
    if (action === "read") {
        const number = Number(searchParams.get("number"));
        const slug = searchParams.get("slug") ?? "";
        const filename = searchParams.get("filename") ?? "";
        const content = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$file$2d$manager$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["readEpisodeFile"])(number, slug, filename);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            content
        });
    }
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        error: "unknown action"
    }, {
        status: 400
    });
}
async function POST(req) {
    const body = await req.json();
    if (body.action === "create") {
        const episode = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$file$2d$manager$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createEpisode"])(body.episode);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            episode
        });
    }
    if (body.action === "write") {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$file$2d$manager$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["writeEpisodeFile"])(body.number, body.slug, body.filename, body.content);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ok: true
        });
    }
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        error: "unknown action"
    }, {
        status: 400
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0mleuod._.js.map