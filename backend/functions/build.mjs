import esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/index.ts"],
  outfile: "lib/index.js",
  bundle: true,
  platform: "node",
  format: "cjs",
  sourcemap: true,
  // Keep all deps external. @google-cloud/tasks has a proper CJS build behind
  // its "require" export condition, so Node resolves it correctly at runtime.
  packages: "external",
});
