#!/usr/bin/env node
// .env.op の op:// 参照を 1Password から解決し、.env.local に書き込む。
// dev 起動のたびに 1Password の認証が出るのを避けるため、dev スクリプトは op を通さず
// .env.local を読むだけにしてある。キーを更新した時だけ `npm run env:sync` を実行する。
import { execFileSync } from "node:child_process";
import { chmodSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const opFile = resolve(root, ".env.op");
const localFile = resolve(root, ".env.local");
const BEGIN = "# --- 1Password 同期ここから（npm run env:sync が管理。手で編集しない） ---";
const END = "# --- 1Password 同期ここまで ---";

if (!existsSync(opFile)) {
  console.error(".env.op が見つかりません: " + opFile);
  process.exit(1);
}

const refs = readFileSync(opFile, "utf8")
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith("#") && line.includes("="))
  .map((line) => {
    const i = line.indexOf("=");
    return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
  })
  .filter(([key, ref]) => key && ref.startsWith("op://"));

if (refs.length === 0) {
  console.error(".env.op に op:// 参照がありません");
  process.exit(1);
}

const resolved = refs.map(([key, ref]) => {
  const value = execFileSync("op", ["read", ref], { encoding: "utf8" }).trim();
  if (!value) throw new Error(`${key} の値が空です（参照: ${ref}）`);
  return [key, /[\s#"']/.test(value) ? JSON.stringify(value) : value];
});

const managed = new Set(resolved.map(([key]) => key));
const kept = [];
let inBlock = false;
for (const line of existsSync(localFile) ? readFileSync(localFile, "utf8").split(/\r?\n/) : []) {
  if (line === BEGIN) { inBlock = true; continue; }
  if (line === END) { inBlock = false; continue; }
  if (inBlock) continue;
  // ブロック外に同名キーが残っていると勝敗が読めなくなるので取り除く
  const hit = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/);
  if (hit && managed.has(hit[1])) continue;
  kept.push(line);
}
while (kept.length > 0 && kept[kept.length - 1].trim() === "") kept.pop();

const body = [
  ...kept,
  "",
  BEGIN,
  ...resolved.map(([key, value]) => `${key}=${value}`),
  END,
  "",
].join("\n");

writeFileSync(localFile, body, { mode: 0o600 });
chmodSync(localFile, 0o600);
console.log(".env.local を更新しました: " + resolved.map(([key]) => key).join(", "));
