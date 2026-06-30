import { spawn } from "node:child_process";
import { createServer } from "node:net";

const PORT = process.env.PORT ?? "3300";
const STUDIO_URL = `http://localhost:${PORT}`;

function printStudioUrl(reason) {
  const suffix = reason ? ` (${reason})` : "";
  console.log(`\n  ScriptStudio: ${STUDIO_URL}${suffix}\n`);
}

// strictPort 相当：3300 が使用中なら別ポートへ自動フォールバックさせず、明確に失敗させる。
function assertPortFree(port) {
  return new Promise((resolve, reject) => {
    const tester = createServer();
    tester.once("error", (err) => {
      if (err.code === "EADDRINUSE") {
        reject(
          new Error(
            `ポート ${port} は使用中です。固定ポート（strictPort）のため起動を中止しました。\n` +
              `  使用中プロセスの確認: lsof -i :${port}\n` +
              `  別ポートで一時起動する場合: PORT=<番号> npm run studio`,
          ),
        );
      } else {
        reject(err);
      }
    });
    tester.once("listening", () => {
      tester.close(() => resolve());
    });
    tester.listen(Number(port), "0.0.0.0");
  });
}

try {
  await assertPortFree(PORT);
} catch (err) {
  console.error(`\n  ✗ ${err.message}\n`);
  process.exit(1);
}

printStudioUrl("起動中");

const child = spawn("npx", ["next", "dev", "--port", PORT], {
  stdio: ["inherit", "pipe", "pipe"],
  shell: process.platform === "win32",
  env: process.env,
});

function relay(chunk, stream) {
  const text = chunk.toString();
  stream.write(text);
  if (
    /Ready in|✓ Compiled|Compiled successfully|Local:\s+http|started server/i.test(
      text,
    )
  ) {
    printStudioUrl();
  }
}

child.stdout.on("data", (chunk) => relay(chunk, process.stdout));
child.stderr.on("data", (chunk) => relay(chunk, process.stderr));

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
