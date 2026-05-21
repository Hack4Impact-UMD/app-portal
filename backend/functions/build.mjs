import esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/index.ts"],
  outfile: "lib/index.js",
  bundle: true,
  platform: "node",
  format: "cjs",
  sourcemap: true,
  // Keep all deps external except @google-cloud/tasks, which is ESM-only
  // and needs to be bundled so esbuild can handle the ESM→CJS conversion.
  external: [
    "firebase-admin",
    "firebase-functions",
    "@app-portal/shared",
    "body-parser",
    "cors",
    "express",
    "uuid",
    "zod",
  ],
});
