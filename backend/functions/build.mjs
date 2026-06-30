import esbuild from "esbuild";

const watch = process.argv.includes("--watch");

const buildOptions = {
  entryPoints: ["src/index.ts"],
  outfile: "lib/index.js",
  bundle: true,
  platform: "node",
  format: "cjs",
  sourcemap: true,
  // Keep all deps external. @google-cloud/tasks has a proper CJS build behind
  // its "require" export condition, so Node resolves it correctly at runtime.
  packages: "external",
};

if (watch) {
  const ctx = await esbuild.context({
    ...buildOptions,
    plugins: [
      {
        // esbuild overwrites lib/index.js in place on every rebuild. In dev the
        // Firebase functions emulator points directly at this package (see
        // scripts/dev.mjs) and hot-reloads when the output changes — no isolate
        // step is needed locally; isolate only runs at deploy time (predeploy).
        name: "build-status",
        setup(build) {
          build.onEnd((result) => {
            if (result.errors.length > 0) {
              console.error("[functions] build failed");
            } else {
              console.log("[functions] build complete");
            }
          });
        },
      },
    ],
  });
  await ctx.watch();
  console.log("[functions] watching for changes...");
} else {
  await esbuild.build(buildOptions);
}
