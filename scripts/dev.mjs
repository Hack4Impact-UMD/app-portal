import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

// In dev the Firebase functions emulator points directly at the workspace
// package (backend/functions) instead of the isolated copy. esbuild's watcher
// overwrites lib/index.js in place, so the emulator hot-reloads without us
// re-running `isolate`/`pnpm install` on every change. `isolate` is still used
// for real deploys via the predeploy hook in firebase.json.
//
// Rather than duplicate firebase.json (and risk drift), we read it, swap the
// functions source, and write a throwaway dev config that the emulator uses.
const DEV_CONFIG = path.join(repoRoot, "firebase.dev.json");

function writeDevConfig() {
  const config = JSON.parse(fs.readFileSync(path.join(repoRoot, "firebase.json"), "utf8"));
  const functions = Array.isArray(config.functions) ? config.functions : [config.functions];
  for (const fn of functions) {
    if (fn) {
      fn.source = "backend/functions";
      // The predeploy isolate steps are deploy-only; the emulator never runs them.
      delete fn.predeploy;
    }
  }
  fs.writeFileSync(DEV_CONFIG, JSON.stringify(config, null, 2));
}

// Emulator data directory to import on startup. Override with
// `--import <dir>` / `--import=<dir>` (or `pnpm dev -- --import <dir>`).
function parseImportDir(argv, fallback) {
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--import" || arg === "--import-dir") return argv[i + 1] ?? fallback;
    if (arg.startsWith("--import=")) return arg.slice("--import=".length);
    if (arg.startsWith("--import-dir=")) return arg.slice("--import-dir=".length);
  }
  return fallback;
}

const importDir = parseImportDir(process.argv.slice(2), "./backend/emulator_data5");

const colors = {
  functions: "\x1b[36m", // cyan
  emulators: "\x1b[33m", // yellow
  frontend: "\x1b[35m", // magenta
  reset: "\x1b[0m",
  green: "\x1b[32m",
  bold: "\x1b[1m",
};

const children = [];
let shuttingDown = false;

function shutdown(code) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

function start({ name, command, args, readyPattern }) {
  const color = colors[name] ?? "";
  const prefix = `${color}[${name}]${colors.reset} `;
  const child = spawn(command, args, { cwd: repoRoot, env: process.env });
  children.push(child);

  let ready = false;
  const readyPromise = new Promise((resolve) => {
    const scan = (line) => {
      process.stdout.write(prefix + line + "\n");
      if (!ready && readyPattern.test(line)) {
        ready = true;
        resolve();
      }
    };
    readline.createInterface({ input: child.stdout }).on("line", scan);
    readline.createInterface({ input: child.stderr }).on("line", scan);
  });

  child.on("error", (error) => {
    console.error(`${prefix}failed to start: ${error.message}`);
    shutdown(1);
  });
  child.on("exit", (code) => {
    if (!shuttingDown) {
      console.error(`${prefix}exited with code ${code}, shutting down...`);
      shutdown(code ?? 1);
    }
  });

  return readyPromise;
}

// 1. Cloud functions build in watch mode. esbuild overwrites lib/index.js in
//    place on each change; the emulator hot-reloads from it. Wait for the first
//    build so the functions emulator has code to load on startup.
const functionsReady = start({
  name: "functions",
  command: "pnpm",
  args: ["--filter", "functions", "build:watch"],
  readyPattern: /build complete/,
});

await functionsReady;

// 2. Firebase emulators at the repo root, using the generated dev config that
//    points functions at the workspace package.
writeDevConfig();
const emulatorsReady = start({
  name: "emulators",
  command: "firebase",
  args: ["emulators:start", "--config", DEV_CONFIG, "--import", importDir],
  readyPattern: /All emulators ready/i,
});

// 3. Frontend dev server.
const frontendReady = start({
  name: "frontend",
  command: "pnpm",
  args: ["--filter", "frontend", "dev"],
  readyPattern: /ready in|Local:\s+http/i,
});

// 4. Wait for everything to be ready, then announce.
await Promise.all([emulatorsReady, frontendReady]);

console.log(
  `\n${colors.green}${colors.bold}` +
    "🚀 Dev environment is live!\n" +
    `${colors.reset}${colors.green}` +
    "   • functions:  watching (hot-reload on change)\n" +
    "   • emulators:  http://localhost:4000\n" +
    "   • frontend:   http://localhost:5173\n" +
    `${colors.reset}`,
);
