import { spawn } from "node:child_process";

const STUDIO_URL = "http://localhost:3001";
const PORT = "3001";

function printStudioUrl(reason) {
  const suffix = reason ? ` (${reason})` : "";
  console.log(`\n  ScriptStudio: ${STUDIO_URL}${suffix}\n`);
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
