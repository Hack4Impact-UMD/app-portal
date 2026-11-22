import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    conditions: ["source"],
  },
  ssr: {
    resolve: {
      conditions: ["source", "node", "import", "default"],
    },
  },
  test: {
    name: "functions",
    include: ["test/**/*.test.ts"],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
    env: {
      FUNCTIONS_EMULATOR: "true",
      APPCHECK_EMULATOR_BYPASS: "true",
    },
  },
});
