/**
 * Pure client-side GitHub Pages build.
 * - No Nitro
 * - No server prerender
 * - Browser-only app boot
 */
import { spawnSync } from "node:child_process";
import { cp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pagesPrefix = "/smooth-matrix-magic";
const outDir = join(root, "gh-pages");
const clientAssets = join(root, "dist/client/assets");

const env = {
  ...process.env,
  GITHUB_PAGES: "1",
  VITE_ROUTER_BASEPATH: pagesPrefix,
};

const build = spawnSync("npm", ["run", "build"], { cwd: root, env, stdio: "inherit" });
if (build.status !== 0) process.exit(build.status ?? 1);

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });
await cp(clientAssets, join(outDir, "assets"), { recursive: true });

const files = await readdir(clientAssets);
const entryJs = files.find((f) => /^index-.*\.js$/.test(f));
const stylesCss = files.find((f) => /^styles-.*\.css$/.test(f));
if (!entryJs) {
  throw new Error("Could not find entry JS chunk in dist/client/assets");
}

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Matrix Calculator</title>
    ${stylesCss ? `<link rel="stylesheet" href="${pagesPrefix}/assets/${stylesCss}" />` : ""}
  </head>
  <body>
    <script type="module" src="${pagesPrefix}/assets/${entryJs}"></script>
  </body>
</html>
`;

await writeFile(join(outDir, "index.html"), html, "utf8");
await writeFile(join(outDir, "404.html"), html, "utf8");
await writeFile(join(outDir, ".nojekyll"), "", "utf8");
console.log("Done: gh-pages/ (index.html, 404.html, .nojekyll, assets/)");
