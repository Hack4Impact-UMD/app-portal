import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONFIG = path.join(repoRoot, "firebase.e2e.json");

function run(command, args, env = process.env) {
  const result = spawnSync(command, args, { cwd: repoRoot, env, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function writeConfig() {
  const config = JSON.parse(
    fs.readFileSync(path.join(repoRoot, "firebase.json"), "utf8"),
  );
  for (const fn of [config.functions].flat()) {
    fn.source = "backend/functions";
    delete fn.predeploy;
  }
  config.emulators.ui = { enabled: false };
  fs.writeFileSync(CONFIG, JSON.stringify(config, null, 2));
}

run("pnpm", ["--filter", "shared", "build"]);
run("pnpm", ["--filter", "functions", "build"]);
writeConfig();

const playwrightArgs = process.argv.slice(2).map((a) => JSON.stringify(a));
run(
  "firebase",
  [
    "emulators:exec",
    "--config",
    CONFIG,
    "--only",
    "auth,firestore,functions",
    "--project",
    "h4i-applications",
    ["pnpm --filter e2e exec playwright test", ...playwrightArgs].join(" "),
  ],
  { ...process.env, APPCHECK_EMULATOR_BYPASS: "true" },
);
