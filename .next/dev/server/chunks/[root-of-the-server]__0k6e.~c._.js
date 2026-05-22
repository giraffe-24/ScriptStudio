module.exports = [
"[externals]/node:fs [external] (node:fs, cjs, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "server/chunks/[externals]_node_fs_0~5d6ws._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[externals]/node:fs [external] (node:fs, cjs)");
    });
});
}),
"[externals]/node:path [external] (node:path, cjs, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "server/chunks/[externals]_node_path_0_6x7pv._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[externals]/node:path [external] (node:path, cjs)");
    });
});
}),
"[project]/node_modules/@anthropic-ai/sdk/tools/agent-toolset/node.mjs [app-route] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "server/chunks/[root-of-the-server]__0tdyjfz._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[project]/node_modules/@anthropic-ai/sdk/tools/agent-toolset/node.mjs [app-route] (ecmascript)");
    });
});
}),
"[project]/src/app/api/generate-plan/route.ts [app-route] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.resolve().then(() => {
        return parentImport("[project]/src/app/api/generate-plan/route.ts [app-route] (ecmascript)");
    });
});
}),
];