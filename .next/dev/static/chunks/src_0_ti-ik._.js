(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/components/EpisodeList.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "EpisodeList",
    ()=>EpisodeList
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
const STATUS_LABEL = {
    planning: "企画中",
    scripting: "執筆中",
    review: "確認中",
    done: "完了"
};
const STATUS_COLOR = {
    planning: "bg-yellow-100 text-yellow-700",
    scripting: "bg-blue-100 text-blue-700",
    review: "bg-purple-100 text-purple-700",
    done: "bg-green-100 text-green-700"
};
function EpisodeList({ selectedId, onSelect, refreshKey }) {
    _s();
    const [episodes, setEpisodes] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [openId, setOpenId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "EpisodeList.useEffect": ()=>{
            setLoading(true);
            fetch("/api/files?action=list").then({
                "EpisodeList.useEffect": (r)=>r.json()
            }["EpisodeList.useEffect"]).then({
                "EpisodeList.useEffect": (d)=>setEpisodes(d.episodes ?? [])
            }["EpisodeList.useEffect"]).finally({
                "EpisodeList.useEffect": ()=>setLoading(false)
            }["EpisodeList.useEffect"]);
        }
    }["EpisodeList.useEffect"], [
        refreshKey
    ]);
    function toggleOpen(id) {
        setOpenId((prev)=>prev === id ? null : id);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col h-full bg-gray-50",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "px-3 py-3 border-b border-gray-200",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                    className: "text-xs font-bold text-gray-400 uppercase tracking-widest",
                    children: "Episodes"
                }, void 0, false, {
                    fileName: "[project]/src/components/EpisodeList.tsx",
                    lineNumber: 46,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/EpisodeList.tsx",
                lineNumber: 45,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 overflow-y-auto py-1",
                children: loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "px-3 py-4 text-xs text-gray-400 animate-pulse",
                    children: "読み込み中…"
                }, void 0, false, {
                    fileName: "[project]/src/components/EpisodeList.tsx",
                    lineNumber: 53,
                    columnNumber: 11
                }, this) : episodes.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "px-3 py-4 text-xs text-gray-400",
                    children: "まだエピソードがありません"
                }, void 0, false, {
                    fileName: "[project]/src/components/EpisodeList.tsx",
                    lineNumber: 55,
                    columnNumber: 11
                }, this) : episodes.map((ep)=>{
                    const isSelected = ep.id === selectedId;
                    const isOpen = openId === ep.id;
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `border-l-2 transition-colors ${isSelected ? "border-blue-500 bg-white" : "border-transparent"}`,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>{
                                    onSelect(ep);
                                    toggleOpen(ep.id);
                                },
                                className: "w-full text-left px-3 py-2.5 flex items-start justify-between gap-2 hover:bg-white transition-colors",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex-1 min-w-0",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-1.5 mb-0.5",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-[10px] text-gray-400 font-mono shrink-0",
                                                        children: [
                                                            "#",
                                                            ep.number
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/components/EpisodeList.tsx",
                                                        lineNumber: 80,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: `text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLOR[ep.status] ?? "bg-gray-100 text-gray-600"}`,
                                                        children: STATUS_LABEL[ep.status] ?? ep.status
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/EpisodeList.tsx",
                                                        lineNumber: 81,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/EpisodeList.tsx",
                                                lineNumber: 79,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-xs text-gray-800 leading-snug line-clamp-2",
                                                children: ep.title
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/EpisodeList.tsx",
                                                lineNumber: 89,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/EpisodeList.tsx",
                                        lineNumber: 78,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: `text-gray-400 text-[10px] mt-1 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`,
                                        children: "▾"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/EpisodeList.tsx",
                                        lineNumber: 93,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/EpisodeList.tsx",
                                lineNumber: 71,
                                columnNumber: 17
                            }, this),
                            isOpen && (ep.hook || ep.targetPain || ep.reason) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "px-3 pb-3 space-y-2 border-t border-gray-100 pt-2 bg-white",
                                children: [
                                    ep.hook && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5",
                                                children: "フック"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/EpisodeList.tsx",
                                                lineNumber: 103,
                                                columnNumber: 25
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-xs text-blue-600 italic leading-relaxed",
                                                children: [
                                                    "「",
                                                    ep.hook,
                                                    "」"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/EpisodeList.tsx",
                                                lineNumber: 104,
                                                columnNumber: 25
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/EpisodeList.tsx",
                                        lineNumber: 102,
                                        columnNumber: 23
                                    }, this),
                                    ep.targetPain && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5",
                                                children: "視聴者の悩み"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/EpisodeList.tsx",
                                                lineNumber: 109,
                                                columnNumber: 25
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-xs text-gray-600 leading-relaxed",
                                                children: ep.targetPain
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/EpisodeList.tsx",
                                                lineNumber: 110,
                                                columnNumber: 25
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/EpisodeList.tsx",
                                        lineNumber: 108,
                                        columnNumber: 23
                                    }, this),
                                    ep.reason && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5",
                                                children: "選定理由"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/EpisodeList.tsx",
                                                lineNumber: 115,
                                                columnNumber: 25
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-xs text-gray-500 leading-relaxed",
                                                children: ep.reason
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/EpisodeList.tsx",
                                                lineNumber: 116,
                                                columnNumber: 25
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/EpisodeList.tsx",
                                        lineNumber: 114,
                                        columnNumber: 23
                                    }, this),
                                    ep.createdAt && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[10px] text-gray-300 pt-1",
                                        children: ep.createdAt
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/EpisodeList.tsx",
                                        lineNumber: 120,
                                        columnNumber: 23
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/EpisodeList.tsx",
                                lineNumber: 100,
                                columnNumber: 19
                            }, this),
                            isOpen && !ep.hook && !ep.targetPain && !ep.reason && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "px-3 pb-2 bg-white border-t border-gray-100 pt-2",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-[10px] text-gray-400",
                                    children: ep.createdAt || "詳細情報なし"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/EpisodeList.tsx",
                                    lineNumber: 128,
                                    columnNumber: 21
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/EpisodeList.tsx",
                                lineNumber: 127,
                                columnNumber: 19
                            }, this)
                        ]
                    }, ep.id, true, {
                        fileName: "[project]/src/components/EpisodeList.tsx",
                        lineNumber: 64,
                        columnNumber: 15
                    }, this);
                })
            }, void 0, false, {
                fileName: "[project]/src/components/EpisodeList.tsx",
                lineNumber: 51,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/EpisodeList.tsx",
        lineNumber: 44,
        columnNumber: 5
    }, this);
}
_s(EpisodeList, "LO5PE2C0kAc3fyyzwndFdh5VYhk=");
_c = EpisodeList;
var _c;
__turbopack_context__.k.register(_c, "EpisodeList");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/PatternSelector.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PatternSelector",
    ()=>PatternSelector
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
"use client";
;
function PatternSelector({ pattern, onChange }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex gap-2",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: ()=>onChange("market"),
                className: `flex-1 rounded-xl p-4 text-left border-2 transition-all ${pattern === "market" ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"}`,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2 mb-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-lg",
                                children: "📊"
                            }, void 0, false, {
                                fileName: "[project]/src/components/PatternSelector.tsx",
                                lineNumber: 22,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "font-semibold text-sm text-gray-800",
                                children: "パターン 1：市場起点"
                            }, void 0, false, {
                                fileName: "[project]/src/components/PatternSelector.tsx",
                                lineNumber: 23,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/PatternSelector.tsx",
                        lineNumber: 21,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-xs text-gray-500 leading-relaxed",
                        children: "YouTube のトレンドを自動取得してチャンネルに合ったテーマを提案"
                    }, void 0, false, {
                        fileName: "[project]/src/components/PatternSelector.tsx",
                        lineNumber: 25,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/PatternSelector.tsx",
                lineNumber: 13,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: ()=>onChange("user-input"),
                className: `flex-1 rounded-xl p-4 text-left border-2 transition-all ${pattern === "user-input" ? "border-purple-500 bg-purple-50" : "border-gray-200 bg-white hover:border-gray-300"}`,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2 mb-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-lg",
                                children: "✏️"
                            }, void 0, false, {
                                fileName: "[project]/src/components/PatternSelector.tsx",
                                lineNumber: 38,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "font-semibold text-sm text-gray-800",
                                children: "パターン 2：テーマ起点"
                            }, void 0, false, {
                                fileName: "[project]/src/components/PatternSelector.tsx",
                                lineNumber: 39,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/PatternSelector.tsx",
                        lineNumber: 37,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-xs text-gray-500 leading-relaxed",
                        children: "テーマを入力すると AI がチャンネルに最適な切り口に改変"
                    }, void 0, false, {
                        fileName: "[project]/src/components/PatternSelector.tsx",
                        lineNumber: 41,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/PatternSelector.tsx",
                lineNumber: 29,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/PatternSelector.tsx",
        lineNumber: 12,
        columnNumber: 5
    }, this);
}
_c = PatternSelector;
var _c;
__turbopack_context__.k.register(_c, "PatternSelector");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/ThemeInput.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ThemeInput",
    ()=>ThemeInput
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
const SCORE_BORDER = {
    high: "border-blue-300",
    medium: "border-yellow-300",
    low: "border-gray-200"
};
const SCORE_BG = {
    high: "bg-blue-50",
    medium: "bg-yellow-50",
    low: "bg-gray-50"
};
const SCORE_BADGE = {
    high: "bg-blue-100 text-blue-700 border-blue-200",
    medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
    low: "bg-gray-100 text-gray-500 border-gray-200"
};
// high: 積極的に採用を推奨 / medium: 標準的な候補 / low: 参考程度・再検討余地あり
const SCORE_LABEL = {
    high: "推奨",
    medium: "普通",
    low: "要検討"
};
function ThemeInput({ pattern, onSelect }) {
    _s();
    const [userTheme, setUserTheme] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [category, setCategory] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [candidates, setCandidates] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [hasYouTubeData, setHasYouTubeData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [pickedIndex, setPickedIndex] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // アコーディオンで開いている候補のインデックス（複数可）
    const [openIndexes, setOpenIndexes] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(new Set());
    function toggleOpen(i) {
        setOpenIndexes((prev)=>{
            const next = new Set(prev);
            if (next.has(i)) next.delete(i);
            else next.add(i);
            return next;
        });
    }
    async function handleResearch() {
        setLoading(true);
        setCandidates([]);
        setPickedIndex(null);
        setOpenIndexes(new Set());
        try {
            if (pattern === "market") {
                const res = await fetch("/api/market-research", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        category
                    })
                });
                const data = await res.json();
                setCandidates(data.candidates ?? []);
                setHasYouTubeData(data.hasYouTubeData ?? false);
            } else {
                const res = await fetch("/api/adapt-theme", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        theme: userTheme
                    })
                });
                const data = await res.json();
                setCandidates(data.candidates ?? []);
            }
        } finally{
            setLoading(false);
        }
    }
    function handleConfirm() {
        if (pickedIndex === null) return;
        onSelect(candidates[pickedIndex]);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-4",
        children: [
            pattern === "market" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: "block text-xs font-medium text-gray-500 mb-1",
                        children: "カテゴリ（空白でも OK）"
                    }, void 0, false, {
                        fileName: "[project]/src/components/ThemeInput.tsx",
                        lineNumber: 91,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "text",
                        value: category,
                        onChange: (e)=>setCategory(e.target.value),
                        placeholder: "例：Gmail, Android, Google フォト",
                        className: "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300",
                        onKeyDown: (e)=>e.key === "Enter" && handleResearch()
                    }, void 0, false, {
                        fileName: "[project]/src/components/ThemeInput.tsx",
                        lineNumber: 94,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/ThemeInput.tsx",
                lineNumber: 90,
                columnNumber: 9
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: "block text-xs font-medium text-gray-500 mb-1",
                        children: "テーマを入力"
                    }, void 0, false, {
                        fileName: "[project]/src/components/ThemeInput.tsx",
                        lineNumber: 105,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "text",
                        value: userTheme,
                        onChange: (e)=>setUserTheme(e.target.value),
                        placeholder: "例：LINEの通知をまとめて管理する方法",
                        className: "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300",
                        onKeyDown: (e)=>e.key === "Enter" && handleResearch()
                    }, void 0, false, {
                        fileName: "[project]/src/components/ThemeInput.tsx",
                        lineNumber: 108,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/ThemeInput.tsx",
                lineNumber: 104,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: handleResearch,
                disabled: loading || pattern === "user-input" && !userTheme.trim(),
                className: `w-full rounded-lg py-2.5 text-sm font-medium transition-all ${loading ? "bg-gray-200 text-gray-400 cursor-not-allowed" : pattern === "market" ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-purple-500 text-white hover:bg-purple-600"}`,
                children: loading ? "AI が分析中…" : pattern === "market" ? "📊 トレンド分析する" : "✨ テーマを改変する"
            }, void 0, false, {
                fileName: "[project]/src/components/ThemeInput.tsx",
                lineNumber: 119,
                columnNumber: 7
            }, this),
            candidates.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "text-[11px] font-bold text-gray-400 uppercase tracking-wider",
                                children: "テーマ候補"
                            }, void 0, false, {
                                fileName: "[project]/src/components/ThemeInput.tsx",
                                lineNumber: 141,
                                columnNumber: 13
                            }, this),
                            pattern === "market" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: `text-[10px] px-2 py-0.5 rounded-full ${hasYouTubeData ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"}`,
                                children: hasYouTubeData ? "YouTube API" : "AI 知識ベース"
                            }, void 0, false, {
                                fileName: "[project]/src/components/ThemeInput.tsx",
                                lineNumber: 145,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/ThemeInput.tsx",
                        lineNumber: 140,
                        columnNumber: 11
                    }, this),
                    candidates.map((c, i)=>{
                        const isPicked = pickedIndex === i;
                        const isOpen = openIndexes.has(i);
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: `border-2 rounded-xl overflow-hidden transition-all ${isPicked ? `${SCORE_BORDER[c.score]} ${SCORE_BG[c.score]} shadow-sm` : "border-gray-200 bg-white hover:border-gray-300"}`,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-start gap-2 p-3",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>setPickedIndex(i),
                                            className: "flex-1 text-left",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-xs text-gray-700 leading-snug",
                                                children: c.title
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/ThemeInput.tsx",
                                                lineNumber: 175,
                                                columnNumber: 21
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/ThemeInput.tsx",
                                            lineNumber: 171,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center gap-1.5 shrink-0 mt-0.5",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: `text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${SCORE_BADGE[c.score]}`,
                                                    children: SCORE_LABEL[c.score]
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/ThemeInput.tsx",
                                                    lineNumber: 180,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    onClick: ()=>toggleOpen(i),
                                                    className: "text-gray-400 hover:text-gray-600 text-xs leading-none w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100 transition-colors",
                                                    "aria-label": "詳細を表示",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: `inline-block transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`,
                                                        children: "▾"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/ThemeInput.tsx",
                                                        lineNumber: 193,
                                                        columnNumber: 23
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/ThemeInput.tsx",
                                                    lineNumber: 188,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/ThemeInput.tsx",
                                            lineNumber: 179,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/ThemeInput.tsx",
                                    lineNumber: 170,
                                    columnNumber: 17
                                }, this),
                                isOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "border-t border-gray-100 px-3 pb-3 pt-2 space-y-2.5 bg-white bg-opacity-60",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1",
                                                    children: "フック"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/ThemeInput.tsx",
                                                    lineNumber: 205,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-xs text-blue-600 italic leading-relaxed",
                                                    children: [
                                                        "「",
                                                        c.hook,
                                                        "」"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/ThemeInput.tsx",
                                                    lineNumber: 208,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/ThemeInput.tsx",
                                            lineNumber: 204,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1",
                                                    children: "視聴者の悩み"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/ThemeInput.tsx",
                                                    lineNumber: 214,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-xs text-gray-700 leading-relaxed",
                                                    children: c.targetPain
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/ThemeInput.tsx",
                                                    lineNumber: 217,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/ThemeInput.tsx",
                                            lineNumber: 213,
                                            columnNumber: 21
                                        }, this),
                                        c.reason && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1",
                                                    children: "選定理由"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/ThemeInput.tsx",
                                                    lineNumber: 224,
                                                    columnNumber: 25
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-xs text-gray-500 leading-relaxed",
                                                    children: c.reason
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/ThemeInput.tsx",
                                                    lineNumber: 227,
                                                    columnNumber: 25
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/ThemeInput.tsx",
                                            lineNumber: 223,
                                            columnNumber: 23
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/ThemeInput.tsx",
                                    lineNumber: 202,
                                    columnNumber: 19
                                }, this)
                            ]
                        }, i, true, {
                            fileName: "[project]/src/components/ThemeInput.tsx",
                            lineNumber: 161,
                            columnNumber: 15
                        }, this);
                    }),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "pt-1",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: handleConfirm,
                            disabled: pickedIndex === null,
                            className: `w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${pickedIndex !== null ? "bg-blue-500 text-white hover:bg-blue-600 shadow-sm active:scale-[0.98]" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`,
                            children: pickedIndex !== null ? "企画書を作成する →" : "候補を選んでください"
                        }, void 0, false, {
                            fileName: "[project]/src/components/ThemeInput.tsx",
                            lineNumber: 240,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/ThemeInput.tsx",
                        lineNumber: 239,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/ThemeInput.tsx",
                lineNumber: 139,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/ThemeInput.tsx",
        lineNumber: 87,
        columnNumber: 5
    }, this);
}
_s(ThemeInput, "yR5+bmzdzfAEHnLpSy8feQAikLs=");
_c = ThemeInput;
var _c;
__turbopack_context__.k.register(_c, "ThemeInput");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/ChatPane.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ChatPane",
    ()=>ChatPane
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
function ChatPane({ theme, sectionLabel, sectionContent, history, onHistoryUpdate, onClose }) {
    _s();
    const [input, setInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [streaming, setStreaming] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const bottomRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    async function handleSend() {
        if (!input.trim() || streaming) return;
        const userMsg = {
            role: "user",
            content: input
        };
        const newHistory = [
            ...history,
            userMsg
        ];
        onHistoryUpdate(newHistory);
        setInput("");
        setStreaming(true);
        const assistantMsg = {
            role: "assistant",
            content: ""
        };
        const withAssistant = [
            ...newHistory,
            assistantMsg
        ];
        onHistoryUpdate(withAssistant);
        const res = await fetch("/api/section-chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                theme,
                sectionLabel,
                sectionContent,
                history: newHistory.slice(0, -1),
                userMessage: input
            })
        });
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let full = "";
        while(reader){
            const { done, value } = await reader.read();
            if (done) break;
            full += decoder.decode(value, {
                stream: true
            });
            onHistoryUpdate([
                ...newHistory,
                {
                    role: "assistant",
                    content: full
                }
            ]);
            bottomRef.current?.scrollIntoView({
                behavior: "smooth"
            });
        }
        setStreaming(false);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-72 border-l border-gray-200 flex flex-col bg-white",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "px-3 py-2 border-b border-gray-200 flex items-center justify-between",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs font-bold text-gray-700",
                                children: "AI と深掘り"
                            }, void 0, false, {
                                fileName: "[project]/src/components/ChatPane.tsx",
                                lineNumber: 61,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[10px] text-gray-400",
                                children: sectionLabel
                            }, void 0, false, {
                                fileName: "[project]/src/components/ChatPane.tsx",
                                lineNumber: 62,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/ChatPane.tsx",
                        lineNumber: 60,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: onClose,
                        className: "text-gray-400 hover:text-gray-600 text-lg leading-none",
                        children: "×"
                    }, void 0, false, {
                        fileName: "[project]/src/components/ChatPane.tsx",
                        lineNumber: 64,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/ChatPane.tsx",
                lineNumber: 59,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 overflow-y-auto p-3 space-y-3",
                children: [
                    history.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-[11px] text-gray-400 bg-gray-50 rounded-lg p-2 leading-relaxed",
                        children: "このセクションについて改善案・別角度・具体例など、何でも聞いてください"
                    }, void 0, false, {
                        fileName: "[project]/src/components/ChatPane.tsx",
                        lineNumber: 71,
                        columnNumber: 11
                    }, this),
                    history.map((msg, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: `flex ${msg.role === "user" ? "justify-end" : "justify-start"}`,
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `max-w-[90%] text-xs rounded-xl px-3 py-2 leading-relaxed whitespace-pre-wrap ${msg.role === "user" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700"}`,
                                children: msg.content || (streaming && i === history.length - 1 ? "▋" : "")
                            }, void 0, false, {
                                fileName: "[project]/src/components/ChatPane.tsx",
                                lineNumber: 77,
                                columnNumber: 13
                            }, this)
                        }, i, false, {
                            fileName: "[project]/src/components/ChatPane.tsx",
                            lineNumber: 76,
                            columnNumber: 11
                        }, this)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        ref: bottomRef
                    }, void 0, false, {
                        fileName: "[project]/src/components/ChatPane.tsx",
                        lineNumber: 88,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/ChatPane.tsx",
                lineNumber: 69,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "p-2 border-t border-gray-200",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex gap-1",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                            type: "text",
                            value: input,
                            onChange: (e)=>setInput(e.target.value),
                            onKeyDown: (e)=>e.key === "Enter" && !e.shiftKey && handleSend(),
                            placeholder: "質問・改善依頼…",
                            className: "flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-blue-300",
                            disabled: streaming
                        }, void 0, false, {
                            fileName: "[project]/src/components/ChatPane.tsx",
                            lineNumber: 93,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: handleSend,
                            disabled: !input.trim() || streaming,
                            className: "bg-blue-500 text-white rounded-lg px-2.5 py-2 text-xs hover:bg-blue-600 disabled:opacity-40 transition-colors",
                            children: "送信"
                        }, void 0, false, {
                            fileName: "[project]/src/components/ChatPane.tsx",
                            lineNumber: 102,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/ChatPane.tsx",
                    lineNumber: 92,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/ChatPane.tsx",
                lineNumber: 91,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/ChatPane.tsx",
        lineNumber: 58,
        columnNumber: 5
    }, this);
}
_s(ChatPane, "egnaCiWSX8AOdcF43ufWCPc92nk=");
_c = ChatPane;
var _c;
__turbopack_context__.k.register(_c, "ChatPane");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/PlanningDoc.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PlanningDoc",
    ()=>PlanningDoc
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ChatPane$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ChatPane.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
;
function PlanningDoc({ candidate, onPlanReady }) {
    _s();
    const [plan, setPlan] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [chatSection, setChatSection] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [chatHistory, setChatHistory] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "PlanningDoc.useEffect": ()=>{
            if (!candidate) return;
            generatePlan();
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }
    }["PlanningDoc.useEffect"], [
        candidate
    ]);
    async function generatePlan() {
        if (!candidate) return;
        setLoading(true);
        setPlan(null);
        setChatSection(null);
        setChatHistory([]);
        const res = await fetch("/api/generate-plan", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                theme: candidate.title,
                hook: candidate.hook,
                targetPain: candidate.targetPain,
                reason: candidate.reason
            })
        });
        const data = await res.json();
        setPlan(data.plan ?? null);
        setLoading(false);
    }
    function update(key, value) {
        if (!plan) return;
        setPlan({
            ...plan,
            [key]: value
        });
    }
    if (!candidate) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "h-full flex items-center justify-center",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-center text-gray-300",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-5xl mb-3",
                        children: "📋"
                    }, void 0, false, {
                        fileName: "[project]/src/components/PlanningDoc.tsx",
                        lineNumber: 66,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm",
                        children: "テーマを選択すると企画書を生成します"
                    }, void 0, false, {
                        fileName: "[project]/src/components/PlanningDoc.tsx",
                        lineNumber: 67,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/PlanningDoc.tsx",
                lineNumber: 65,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/components/PlanningDoc.tsx",
            lineNumber: 64,
            columnNumber: 7
        }, this);
    }
    if (loading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "h-full flex items-center justify-center",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-center",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-4xl mb-3 animate-bounce",
                        children: "✍️"
                    }, void 0, false, {
                        fileName: "[project]/src/components/PlanningDoc.tsx",
                        lineNumber: 77,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm text-gray-500",
                        children: "企画書を生成中…"
                    }, void 0, false, {
                        fileName: "[project]/src/components/PlanningDoc.tsx",
                        lineNumber: 78,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-xs text-gray-400 mt-1",
                        children: "10〜20 秒かかります"
                    }, void 0, false, {
                        fileName: "[project]/src/components/PlanningDoc.tsx",
                        lineNumber: 79,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/PlanningDoc.tsx",
                lineNumber: 76,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/components/PlanningDoc.tsx",
            lineNumber: 75,
            columnNumber: 7
        }, this);
    }
    if (!plan) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex h-full overflow-hidden",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 overflow-y-auto bg-white",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "max-w-2xl mx-auto px-8 py-6 space-y-6",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    value: plan.episodeTitle,
                                    onChange: (e)=>update("episodeTitle", e.target.value),
                                    className: "w-full text-base font-bold text-gray-900 bg-transparent border-0 focus:outline-none",
                                    placeholder: "動画タイトルを入力…"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/PlanningDoc.tsx",
                                    lineNumber: 95,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "border-b-2 border-gray-800 mt-1"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/PlanningDoc.tsx",
                                    lineNumber: 101,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/PlanningDoc.tsx",
                            lineNumber: 94,
                            columnNumber: 11
                        }, this),
                        candidate.hook && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DocSection, {
                            label: "フック（冒頭 30 秒）",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm text-blue-600 italic leading-relaxed",
                                children: [
                                    "「",
                                    candidate.hook,
                                    "」"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/PlanningDoc.tsx",
                                lineNumber: 107,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/PlanningDoc.tsx",
                            lineNumber: 106,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DocSection, {
                            label: "想定視聴者",
                            onChat: ()=>setChatSection({
                                    label: "想定視聴者",
                                    content: plan.targetViewer
                                }),
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AutoResizeTextarea, {
                                value: plan.targetViewer,
                                onChange: (v)=>update("targetViewer", v),
                                placeholder: "想定視聴者を記述…"
                            }, void 0, false, {
                                fileName: "[project]/src/components/PlanningDoc.tsx",
                                lineNumber: 118,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/PlanningDoc.tsx",
                            lineNumber: 114,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DocSection, {
                            label: "視聴者の悩み",
                            onChat: ()=>setChatSection({
                                    label: "視聴者の悩み",
                                    content: plan.pain
                                }),
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AutoResizeTextarea, {
                                value: plan.pain,
                                onChange: (v)=>update("pain", v),
                                placeholder: "悩みを記述…"
                            }, void 0, false, {
                                fileName: "[project]/src/components/PlanningDoc.tsx",
                                lineNumber: 130,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/PlanningDoc.tsx",
                            lineNumber: 126,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DocSection, {
                            label: "動画で提供する価値",
                            onChat: ()=>setChatSection({
                                    label: "動画の約束",
                                    content: plan.promise
                                }),
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AutoResizeTextarea, {
                                value: plan.promise,
                                onChange: (v)=>update("promise", v),
                                placeholder: "視聴者が得る価値を記述…"
                            }, void 0, false, {
                                fileName: "[project]/src/components/PlanningDoc.tsx",
                                lineNumber: 142,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/PlanningDoc.tsx",
                            lineNumber: 138,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DocSection, {
                            label: "コンテンツの核",
                            onChat: ()=>setChatSection({
                                    label: "コンテンツの核",
                                    content: plan.keyPoints.join("\n")
                                }),
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(KeyPointList, {
                                items: plan.keyPoints,
                                onChange: (items)=>update("keyPoints", items)
                            }, void 0, false, {
                                fileName: "[project]/src/components/PlanningDoc.tsx",
                                lineNumber: 156,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/PlanningDoc.tsx",
                            lineNumber: 150,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DocSection, {
                            label: "構成",
                            onChat: ()=>setChatSection({
                                    label: "構成",
                                    content: plan.outline.map((o)=>`${o.section}：${o.content}`).join("\n")
                                }),
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(OutlineEditor, {
                                items: plan.outline,
                                onChange: (items)=>update("outline", items)
                            }, void 0, false, {
                                fileName: "[project]/src/components/PlanningDoc.tsx",
                                lineNumber: 172,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/PlanningDoc.tsx",
                            lineNumber: 163,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DocSection, {
                            label: "競合との差別化",
                            onChat: ()=>setChatSection({
                                    label: "差別化",
                                    content: plan.competitorAnalysis
                                }),
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AutoResizeTextarea, {
                                value: plan.competitorAnalysis,
                                onChange: (v)=>update("competitorAnalysis", v),
                                placeholder: "差別化ポイントを記述…"
                            }, void 0, false, {
                                fileName: "[project]/src/components/PlanningDoc.tsx",
                                lineNumber: 185,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/PlanningDoc.tsx",
                            lineNumber: 179,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DocSection, {
                            label: "想定尺",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                value: plan.estimatedLength,
                                onChange: (e)=>update("estimatedLength", e.target.value),
                                className: "text-sm text-gray-700 bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-400 w-40"
                            }, void 0, false, {
                                fileName: "[project]/src/components/PlanningDoc.tsx",
                                lineNumber: 194,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/PlanningDoc.tsx",
                            lineNumber: 193,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "pt-2 pb-6",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>onPlanReady(plan, plan.episodeTitle),
                                    className: "w-full bg-blue-500 hover:bg-blue-600 active:scale-[0.98] text-white font-semibold text-sm py-3 rounded-xl transition-all shadow-sm",
                                    children: "台本を作成する →"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/PlanningDoc.tsx",
                                    lineNumber: 203,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-center text-[10px] text-gray-400 mt-1.5",
                                    children: "企画書の内容が決まったら押してください"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/PlanningDoc.tsx",
                                    lineNumber: 209,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/PlanningDoc.tsx",
                            lineNumber: 202,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/PlanningDoc.tsx",
                    lineNumber: 91,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/PlanningDoc.tsx",
                lineNumber: 90,
                columnNumber: 7
            }, this),
            chatSection && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ChatPane$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ChatPane"], {
                theme: candidate.title,
                sectionLabel: chatSection.label,
                sectionContent: chatSection.content,
                history: chatHistory,
                onHistoryUpdate: setChatHistory,
                onClose: ()=>setChatSection(null)
            }, void 0, false, {
                fileName: "[project]/src/components/PlanningDoc.tsx",
                lineNumber: 218,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/PlanningDoc.tsx",
        lineNumber: 88,
        columnNumber: 5
    }, this);
}
_s(PlanningDoc, "4KTUbKOjOxuhAeVlUTOGJW/hgfc=");
_c = PlanningDoc;
/* ── ドキュメントセクション ── */ function DocSection({ label, children, onChat }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between pb-1 border-b border-gray-300 mb-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: "text-sm font-semibold text-gray-800",
                        children: label
                    }, void 0, false, {
                        fileName: "[project]/src/components/PlanningDoc.tsx",
                        lineNumber: 244,
                        columnNumber: 9
                    }, this),
                    onChat && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: onChat,
                        className: "text-[10px] text-gray-400 hover:text-blue-500 border border-gray-200 hover:border-blue-300 px-2 py-0.5 rounded-full transition-colors shrink-0 ml-2",
                        children: "AI と深掘り"
                    }, void 0, false, {
                        fileName: "[project]/src/components/PlanningDoc.tsx",
                        lineNumber: 246,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/PlanningDoc.tsx",
                lineNumber: 243,
                columnNumber: 7
            }, this),
            children
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/PlanningDoc.tsx",
        lineNumber: 242,
        columnNumber: 5
    }, this);
}
_c1 = DocSection;
/* ── キーポイントリストエディタ ── */ function KeyPointList({ items, onChange }) {
    _s1();
    const refs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])([]);
    function handleKeyDown(e, index) {
        if (e.key === "Enter") {
            e.preventDefault();
            const next = [
                ...items
            ];
            next.splice(index + 1, 0, "");
            onChange(next);
            setTimeout(()=>refs.current[index + 1]?.focus(), 0);
        } else if (e.key === "Backspace" && items[index] === "" && items.length > 1) {
            e.preventDefault();
            const next = items.filter((_, i)=>i !== index);
            onChange(next);
            setTimeout(()=>refs.current[Math.max(0, index - 1)]?.focus(), 0);
        }
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
        className: "space-y-2",
        children: items.map((point, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                className: "flex items-center gap-2.5",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-gray-500 text-[10px] shrink-0",
                        children: "●"
                    }, void 0, false, {
                        fileName: "[project]/src/components/PlanningDoc.tsx",
                        lineNumber: 288,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        ref: (el)=>{
                            refs.current[i] = el;
                        },
                        value: point,
                        onChange: (e)=>{
                            const next = [
                                ...items
                            ];
                            next[i] = e.target.value;
                            onChange(next);
                        },
                        onKeyDown: (e)=>handleKeyDown(e, i),
                        className: "flex-1 text-sm text-gray-700 bg-transparent border-b border-gray-200 focus:outline-none focus:border-blue-300 py-0.5",
                        placeholder: "ポイントを入力（Enter で追加）"
                    }, void 0, false, {
                        fileName: "[project]/src/components/PlanningDoc.tsx",
                        lineNumber: 289,
                        columnNumber: 11
                    }, this)
                ]
            }, i, true, {
                fileName: "[project]/src/components/PlanningDoc.tsx",
                lineNumber: 287,
                columnNumber: 9
            }, this))
    }, void 0, false, {
        fileName: "[project]/src/components/PlanningDoc.tsx",
        lineNumber: 285,
        columnNumber: 5
    }, this);
}
_s1(KeyPointList, "78a5ZvbznFIFfo3Z5YuaFsj29P0=");
_c2 = KeyPointList;
/* ── 構成エディタ ── */ function OutlineEditor({ items, onChange }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-3",
        children: items.map((item, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex gap-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-36 shrink-0 pt-0.5",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-xs text-gray-400 leading-relaxed",
                            children: item.section
                        }, void 0, false, {
                            fileName: "[project]/src/components/PlanningDoc.tsx",
                            lineNumber: 321,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/PlanningDoc.tsx",
                        lineNumber: 320,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex-1 border-b border-gray-200 pb-1",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AutoResizeTextarea, {
                            value: item.content,
                            onChange: (v)=>{
                                const next = [
                                    ...items
                                ];
                                next[i] = {
                                    ...next[i],
                                    content: v
                                };
                                onChange(next);
                            },
                            placeholder: "内容を記述…"
                        }, void 0, false, {
                            fileName: "[project]/src/components/PlanningDoc.tsx",
                            lineNumber: 325,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/PlanningDoc.tsx",
                        lineNumber: 324,
                        columnNumber: 11
                    }, this)
                ]
            }, i, true, {
                fileName: "[project]/src/components/PlanningDoc.tsx",
                lineNumber: 318,
                columnNumber: 9
            }, this))
    }, void 0, false, {
        fileName: "[project]/src/components/PlanningDoc.tsx",
        lineNumber: 316,
        columnNumber: 5
    }, this);
}
_c3 = OutlineEditor;
/* ── 共通：自動リサイズ textarea ── */ function AutoResizeTextarea({ value, onChange, placeholder }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
        value: value,
        onChange: (e)=>{
            onChange(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${e.target.scrollHeight}px`;
        },
        onFocus: (e)=>{
            e.target.style.height = "auto";
            e.target.style.height = `${e.target.scrollHeight}px`;
        },
        rows: 2,
        placeholder: placeholder,
        className: "w-full text-sm text-gray-700 bg-transparent resize-none overflow-hidden border-0 focus:outline-none leading-relaxed placeholder:text-gray-300"
    }, void 0, false, {
        fileName: "[project]/src/components/PlanningDoc.tsx",
        lineNumber: 352,
        columnNumber: 5
    }, this);
}
_c4 = AutoResizeTextarea;
var _c, _c1, _c2, _c3, _c4;
__turbopack_context__.k.register(_c, "PlanningDoc");
__turbopack_context__.k.register(_c1, "DocSection");
__turbopack_context__.k.register(_c2, "KeyPointList");
__turbopack_context__.k.register(_c3, "OutlineEditor");
__turbopack_context__.k.register(_c4, "AutoResizeTextarea");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/ScriptEditor.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ScriptEditor",
    ()=>ScriptEditor
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
function parseSections(text) {
    if (!text.trim()) return [];
    const lines = text.split("\n");
    const sections = [];
    let current = null;
    for (const line of lines){
        if (line.startsWith("## ")) {
            if (current) sections.push(current);
            current = {
                label: line.replace(/^##\s+/, "").trim(),
                content: ""
            };
        } else {
            if (!current) {
                // ## より前のテキストは「導入」扱い
                current = {
                    label: "導入",
                    content: ""
                };
            }
            current.content += line + "\n";
        }
    }
    if (current) sections.push(current);
    return sections.filter((s)=>s.content.trim());
}
function ScriptEditor({ script, onSave }) {
    _s();
    const [content, setContent] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(script);
    const [charCount, setCharCount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [saved, setSaved] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [copied, setCopied] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ScriptEditor.useEffect": ()=>{
            setContent(script);
            setCharCount(script.replace(/\s/g, "").length);
        }
    }["ScriptEditor.useEffect"], [
        script
    ]);
    const handleChange = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ScriptEditor.useCallback[handleChange]": (value)=>{
            setContent(value);
            setCharCount(value.replace(/\s/g, "").length);
            setSaved(false);
        }
    }["ScriptEditor.useCallback[handleChange]"], []);
    function handleSave() {
        onSave(content);
        setSaved(true);
    }
    async function handleCopy(label, text) {
        await navigator.clipboard.writeText(text.trim());
        setCopied(label);
        setTimeout(()=>setCopied(null), 1500);
    }
    async function handleCopyAll() {
        await navigator.clipboard.writeText(content);
        setCopied("__all__");
        setTimeout(()=>setCopied(null), 1500);
    }
    const sections = parseSections(content);
    const targetMin = 4000;
    const targetMax = 6000;
    const progress = Math.min(charCount / targetMax * 100, 100);
    const progressColor = charCount < targetMin ? "bg-yellow-400" : charCount <= targetMax ? "bg-green-400" : "bg-red-400";
    const countColor = charCount < targetMin ? "text-yellow-600" : charCount <= targetMax ? "text-green-600" : "text-red-600";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col h-full",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "px-4 py-2 border-b border-gray-200 flex items-center justify-between bg-white shrink-0",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: `text-xs font-bold font-mono tabular-nums ${countColor}`,
                                children: [
                                    charCount.toLocaleString(),
                                    " 字"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/ScriptEditor.tsx",
                                lineNumber: 87,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: `h-full ${progressColor} transition-all`,
                                    style: {
                                        width: `${progress}%`
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/src/components/ScriptEditor.tsx",
                                    lineNumber: 91,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/ScriptEditor.tsx",
                                lineNumber: 90,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-[10px] text-gray-400",
                                children: "目標 4,000〜6,000 字"
                            }, void 0, false, {
                                fileName: "[project]/src/components/ScriptEditor.tsx",
                                lineNumber: 93,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/ScriptEditor.tsx",
                        lineNumber: 86,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: handleCopyAll,
                                className: `text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium ${copied === "__all__" ? "bg-green-50 text-green-600 border-green-300" : "border-gray-200 text-gray-600 hover:border-gray-300"}`,
                                children: copied === "__all__" ? "コピー済み ✓" : "全体をコピー"
                            }, void 0, false, {
                                fileName: "[project]/src/components/ScriptEditor.tsx",
                                lineNumber: 96,
                                columnNumber: 11
                            }, this),
                            !saved && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-[10px] text-orange-400",
                                children: "未保存"
                            }, void 0, false, {
                                fileName: "[project]/src/components/ScriptEditor.tsx",
                                lineNumber: 106,
                                columnNumber: 22
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: handleSave,
                                className: "text-xs bg-gray-800 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors font-medium",
                                children: "保存"
                            }, void 0, false, {
                                fileName: "[project]/src/components/ScriptEditor.tsx",
                                lineNumber: 107,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/ScriptEditor.tsx",
                        lineNumber: 95,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/ScriptEditor.tsx",
                lineNumber: 85,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-1 overflow-hidden",
                children: [
                    sections.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-44 shrink-0 border-r border-gray-100 overflow-y-auto bg-gray-50 py-3 px-2 space-y-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1 mb-2",
                                children: "セクション"
                            }, void 0, false, {
                                fileName: "[project]/src/components/ScriptEditor.tsx",
                                lineNumber: 121,
                                columnNumber: 13
                            }, this),
                            sections.map((sec)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>handleCopy(sec.label, sec.content),
                                    title: `「${sec.label}」をコピー`,
                                    className: `w-full text-left rounded-lg px-2.5 py-2 transition-all group ${copied === sec.label ? "bg-green-100 text-green-700" : "hover:bg-white hover:shadow-sm text-gray-600"}`,
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center justify-between gap-1",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-xs leading-snug line-clamp-2 flex-1",
                                                children: sec.label
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/ScriptEditor.tsx",
                                                lineNumber: 136,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: `shrink-0 text-[10px] transition-opacity ${copied === sec.label ? "opacity-100 text-green-600" : "opacity-0 group-hover:opacity-100 text-gray-400"}`,
                                                children: copied === sec.label ? "✓" : "⎘"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/ScriptEditor.tsx",
                                                lineNumber: 139,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/ScriptEditor.tsx",
                                        lineNumber: 135,
                                        columnNumber: 17
                                    }, this)
                                }, sec.label, false, {
                                    fileName: "[project]/src/components/ScriptEditor.tsx",
                                    lineNumber: 125,
                                    columnNumber: 15
                                }, this))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/ScriptEditor.tsx",
                        lineNumber: 120,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex-1 overflow-hidden",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                            value: content,
                            onChange: (e)=>handleChange(e.target.value),
                            className: "w-full h-full p-4 text-sm leading-relaxed text-gray-800 resize-none border-0 focus:outline-none font-mono",
                            placeholder: "台本をここに入力…",
                            spellCheck: false
                        }, void 0, false, {
                            fileName: "[project]/src/components/ScriptEditor.tsx",
                            lineNumber: 156,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/ScriptEditor.tsx",
                        lineNumber: 155,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/ScriptEditor.tsx",
                lineNumber: 117,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/ScriptEditor.tsx",
        lineNumber: 83,
        columnNumber: 5
    }, this);
}
_s(ScriptEditor, "cslN+HUkUmQcJVUIZd2yY67SG70=");
_c = ScriptEditor;
var _c;
__turbopack_context__.k.register(_c, "ScriptEditor");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/ScriptPane.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ScriptPane",
    ()=>ScriptPane
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ScriptEditor$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ScriptEditor.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
function cleanScript(text) {
    const lines = text.split("\n");
    // 冒頭の H1 見出し・ブロッククォート・空行を除去
    let start = 0;
    while(start < lines.length && /^#\s/.test(lines[start]))start++;
    while(start < lines.length && /^>/.test(lines[start]))start++;
    while(start < lines.length && lines[start].trim() === "")start++;
    const body = lines.slice(start);
    // --- 区切り線を除去
    // 【定型締め】系のセクション見出しを除去（本文はそのまままとめに続く）
    const cleaned = body.filter((line)=>!/^---+$/.test(line.trim())).map((line)=>/^##\s*【定型締め】/.test(line) ? "" : line);
    // 連続する空行を最大1行に圧縮
    const result = [];
    let prevBlank = false;
    for (const line of cleaned){
        const isBlank = line.trim() === "";
        if (isBlank && prevBlank) continue;
        result.push(line);
        prevBlank = isBlank;
    }
    return result.join("\n").trim();
}
function ScriptPane({ plan, episodeNumber, episodeSlug, onScriptSaved }) {
    _s();
    const [script, setScript] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [generated, setGenerated] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ScriptPane.useEffect": ()=>{
            if (!episodeNumber || !episodeSlug) return;
            fetch(`/api/files?action=read&number=${episodeNumber}&slug=${episodeSlug}&filename=01-script-draft.md`).then({
                "ScriptPane.useEffect": (r)=>r.json()
            }["ScriptPane.useEffect"]).then({
                "ScriptPane.useEffect": (d)=>{
                    if (d.content) {
                        setScript(cleanScript(d.content));
                        setGenerated(true);
                    }
                }
            }["ScriptPane.useEffect"]);
        }
    }["ScriptPane.useEffect"], [
        episodeNumber,
        episodeSlug
    ]);
    async function handleGenerate() {
        if (!plan) return;
        setLoading(true);
        setScript("");
        setGenerated(false);
        const res = await fetch("/api/generate-script", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                plan,
                streaming: true
            })
        });
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let full = "";
        while(reader){
            const { done, value } = await reader.read();
            if (done) break;
            full += decoder.decode(value, {
                stream: true
            });
            setScript(full);
        }
        setScript(cleanScript(full));
        setGenerated(true);
        setLoading(false);
    }
    async function handleSave(content) {
        if (!episodeNumber) return;
        await fetch("/api/files", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                action: "write",
                number: episodeNumber,
                slug: episodeSlug,
                filename: "01-script-draft.md",
                content
            })
        });
        onScriptSaved();
    }
    if (!plan) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "h-full flex items-center justify-center",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-center text-gray-400",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-4xl mb-3",
                        children: "📝"
                    }, void 0, false, {
                        fileName: "[project]/src/components/ScriptPane.tsx",
                        lineNumber: 120,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm",
                        children: "企画書を作成すると台本を生成できます"
                    }, void 0, false, {
                        fileName: "[project]/src/components/ScriptPane.tsx",
                        lineNumber: 121,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/ScriptPane.tsx",
                lineNumber: 119,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/components/ScriptPane.tsx",
            lineNumber: 118,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col h-full",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "px-4 py-3 border-b border-gray-200 bg-white flex items-center justify-between",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "font-bold text-sm text-gray-700",
                                children: "台本"
                            }, void 0, false, {
                                fileName: "[project]/src/components/ScriptPane.tsx",
                                lineNumber: 131,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs text-gray-400 line-clamp-1",
                                children: plan.episodeTitle
                            }, void 0, false, {
                                fileName: "[project]/src/components/ScriptPane.tsx",
                                lineNumber: 132,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/ScriptPane.tsx",
                        lineNumber: 130,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: handleGenerate,
                        disabled: loading,
                        className: `text-sm font-medium px-4 py-1.5 rounded-lg transition-colors ${loading ? "bg-gray-200 text-gray-400 cursor-not-allowed" : generated ? "bg-orange-500 text-white hover:bg-orange-600" : "bg-blue-500 text-white hover:bg-blue-600"}`,
                        children: loading ? "生成中…" : generated ? "✨ 台本を再生成" : "✨ 台本を生成"
                    }, void 0, false, {
                        fileName: "[project]/src/components/ScriptPane.tsx",
                        lineNumber: 134,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/ScriptPane.tsx",
                lineNumber: 129,
                columnNumber: 7
            }, this),
            loading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-blue-50 border-b border-blue-100 px-4 py-2",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center gap-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "w-2 h-2 bg-blue-400 rounded-full animate-pulse"
                        }, void 0, false, {
                            fileName: "[project]/src/components/ScriptPane.tsx",
                            lineNumber: 152,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-xs text-blue-600",
                            children: "AI が台本を執筆中…リアルタイムで表示されます"
                        }, void 0, false, {
                            fileName: "[project]/src/components/ScriptPane.tsx",
                            lineNumber: 153,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/ScriptPane.tsx",
                    lineNumber: 151,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/ScriptPane.tsx",
                lineNumber: 150,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 overflow-hidden",
                children: script || loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ScriptEditor$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ScriptEditor"], {
                    script: script,
                    onSave: handleSave,
                    episodeTitle: plan.episodeTitle
                }, void 0, false, {
                    fileName: "[project]/src/components/ScriptPane.tsx",
                    lineNumber: 160,
                    columnNumber: 11
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "h-full flex items-center justify-center",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-center",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-5xl mb-4",
                                children: "🎬"
                            }, void 0, false, {
                                fileName: "[project]/src/components/ScriptPane.tsx",
                                lineNumber: 164,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm text-gray-500 mb-1",
                                children: "「台本を生成」ボタンで"
                            }, void 0, false, {
                                fileName: "[project]/src/components/ScriptPane.tsx",
                                lineNumber: 165,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm text-gray-500",
                                children: "企画書から自動で台本を作成します"
                            }, void 0, false, {
                                fileName: "[project]/src/components/ScriptPane.tsx",
                                lineNumber: 166,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs text-gray-400 mt-2",
                                children: "目標 4,000〜6,000 字、約 30 秒"
                            }, void 0, false, {
                                fileName: "[project]/src/components/ScriptPane.tsx",
                                lineNumber: 167,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/ScriptPane.tsx",
                        lineNumber: 163,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/components/ScriptPane.tsx",
                    lineNumber: 162,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/ScriptPane.tsx",
                lineNumber: 158,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/ScriptPane.tsx",
        lineNumber: 128,
        columnNumber: 5
    }, this);
}
_s(ScriptPane, "xVMyI673bvzTpqWxwGrasTs8MFw=");
_c = ScriptPane;
var _c;
__turbopack_context__.k.register(_c, "ScriptPane");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/app/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Home
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$EpisodeList$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/EpisodeList.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$PatternSelector$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/PatternSelector.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ThemeInput$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ThemeInput.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$PlanningDoc$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/PlanningDoc.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ScriptPane$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ScriptPane.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
function Home() {
    _s();
    const [selectedEpisode, setSelectedEpisode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [pattern, setPattern] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("market");
    const [selectedCandidate, setSelectedCandidate] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [currentPlan, setCurrentPlan] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [episodeRefreshKey, setEpisodeRefreshKey] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [newEpisodeMode, setNewEpisodeMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [creatingEpisode, setCreatingEpisode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    async function handlePlanReady(plan, title) {
        if (!selectedEpisode && !creatingEpisode) {
            setCreatingEpisode(true);
            const listRes = await fetch("/api/files?action=list");
            const listData = await listRes.json();
            const maxNumber = Math.max(0, ...listData.episodes.map((e)=>e.number));
            const res = await fetch("/api/files", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    action: "create",
                    episode: {
                        id: String(maxNumber + 1),
                        number: maxNumber + 1,
                        slug: title.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").slice(0, 30) || `episode-${maxNumber + 1}`,
                        title,
                        status: "scripting",
                        themePattern: pattern,
                        hook: selectedCandidate?.hook,
                        targetPain: selectedCandidate?.targetPain,
                        reason: selectedCandidate?.reason
                    }
                })
            });
            const data = await res.json();
            setSelectedEpisode(data.episode);
            setEpisodeRefreshKey((k)=>k + 1);
            setCreatingEpisode(false);
        }
        setCurrentPlan(plan);
        setNewEpisodeMode(false);
    }
    function handleNewEpisode() {
        setSelectedEpisode(null);
        setSelectedCandidate(null);
        setCurrentPlan(null);
        setNewEpisodeMode(true);
    }
    function handleEpisodeSelect(ep) {
        setSelectedEpisode(ep);
        setNewEpisodeMode(false);
        setSelectedCandidate(null);
        setCurrentPlan(null);
    }
    function handleScriptSaved() {
        setEpisodeRefreshKey((k)=>k + 1);
    }
    const showWorkspace = newEpisodeMode || selectedEpisode;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex h-screen overflow-hidden bg-gray-100 font-sans",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-52 shrink-0 border-r border-gray-200 overflow-hidden flex flex-col",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$EpisodeList$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EpisodeList"], {
                    selectedId: selectedEpisode?.id ?? null,
                    onSelect: handleEpisodeSelect,
                    refreshKey: episodeRefreshKey
                }, void 0, false, {
                    fileName: "[project]/src/app/page.tsx",
                    lineNumber: 94,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 93,
                columnNumber: 7
            }, this),
            !showWorkspace ? /* ウェルカム画面 */ /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 flex items-center justify-center bg-white",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-center max-w-sm",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-6xl mb-6",
                            children: "🎬"
                        }, void 0, false, {
                            fileName: "[project]/src/app/page.tsx",
                            lineNumber: 105,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "text-xl font-bold text-gray-700 mb-2",
                            children: "YT_TalkScript Studio"
                        }, void 0, false, {
                            fileName: "[project]/src/app/page.tsx",
                            lineNumber: 106,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-sm text-gray-400 mb-6 leading-relaxed",
                            children: [
                                "企画からトークスクリプトまでを",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                                    fileName: "[project]/src/app/page.tsx",
                                    lineNumber: 109,
                                    columnNumber: 15
                                }, this),
                                "AI と一緒に作成できます"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/page.tsx",
                            lineNumber: 107,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: handleNewEpisode,
                            className: "bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition-colors font-medium text-sm",
                            children: "＋ 新しい企画を始める"
                        }, void 0, false, {
                            fileName: "[project]/src/app/page.tsx",
                            lineNumber: 112,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/page.tsx",
                    lineNumber: 104,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 103,
                columnNumber: 9
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-1 overflow-hidden",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-80 shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-hidden",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "px-4 py-3 border-b border-gray-200 flex items-center justify-between",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "font-bold text-sm text-gray-700",
                                        children: "テーマ選定"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 125,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: handleNewEpisode,
                                        className: "text-[11px] text-gray-400 hover:text-blue-500 border border-gray-200 hover:border-blue-300 px-2 py-0.5 rounded-full transition-colors",
                                        children: "＋ 新規"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 126,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 124,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex-1 overflow-y-auto p-4 space-y-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$PatternSelector$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PatternSelector"], {
                                        pattern: pattern,
                                        onChange: (p)=>{
                                            setPattern(p);
                                            setSelectedCandidate(null);
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 134,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ThemeInput$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ThemeInput"], {
                                        pattern: pattern,
                                        onSelect: (c)=>setSelectedCandidate(c)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 141,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 133,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/page.tsx",
                        lineNumber: 123,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex-1 border-r border-gray-200 bg-gray-50 overflow-hidden flex flex-col",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "px-4 py-3 border-b border-gray-200 bg-white",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "font-bold text-sm text-gray-700",
                                        children: "企画書"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 148,
                                        columnNumber: 15
                                    }, this),
                                    selectedCandidate && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xs text-gray-400 mt-0.5 line-clamp-1",
                                        children: selectedCandidate.title
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 150,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 147,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex-1 overflow-hidden",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$PlanningDoc$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlanningDoc"], {
                                    candidate: selectedCandidate,
                                    onPlanReady: handlePlanReady
                                }, void 0, false, {
                                    fileName: "[project]/src/app/page.tsx",
                                    lineNumber: 154,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 153,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/page.tsx",
                        lineNumber: 146,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex-1 bg-white overflow-hidden flex flex-col",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ScriptPane$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ScriptPane"], {
                            plan: currentPlan,
                            episodeNumber: selectedEpisode?.number ?? null,
                            episodeSlug: selectedEpisode?.slug ?? "",
                            onScriptSaved: handleScriptSaved
                        }, void 0, false, {
                            fileName: "[project]/src/app/page.tsx",
                            lineNumber: 160,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/page.tsx",
                        lineNumber: 159,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 121,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/page.tsx",
        lineNumber: 91,
        columnNumber: 5
    }, this);
}
_s(Home, "ZGy4YI1jafO5y4RXeYcGzgOw9Bk=");
_c = Home;
var _c;
__turbopack_context__.k.register(_c, "Home");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_0_ti-ik._.js.map