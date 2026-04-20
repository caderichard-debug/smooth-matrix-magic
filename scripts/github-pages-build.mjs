/**
 * Single entry for GitHub Pages: Nitro build + prerender `gh-pages/`.
 * Run: `npm run build:github-pages` (CI uses the same command).
 */
import { spawnSync } from "node:child_process";
import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const env = {
  ...process.env,
  GITHUB_PAGES: "1",
  NITRO_PRESET: "vercel",
};

const r = spawnSync("npm", ["run", "build"], { cwd: root, env, stdio: "inherit" });
if (r.status !== 0) process.exit(r.status ?? 1);

const fallbackEntry = join(root, ".vercel/output/functions/__fallback.func/index.mjs");
const staticSrc = join(root, ".vercel/output/static");
const outDir = join(root, "gh-pages");

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

const mod = await import(fallbackEntry);
const handler = mod.default;
if (!handler?.fetch) {
  throw new Error("Nitro handler missing .fetch — build may have failed or used the wrong preset");
}

const req = new Request("https://matrixdojo.app/", {
  headers: { "user-agent": "github-pages-prerender" },
});
const res = await handler.fetch(req, {});
if (!res.ok) {
  throw new Error(`SSR failed: ${res.status} ${res.statusText}`);
}
const html = await res.text();

// Copy Nitro static output directly into gh-pages root.
// staticSrc already contains an `assets/` directory.
await cp(staticSrc, outDir, { recursive: true });
await writeFile(join(outDir, "index.html"), html, "utf8");
await writeFile(join(outDir, "404.html"), html, "utf8");
await writeFile(join(outDir, "CNAME"), "matrixdojo.app\n", "utf8");
await writeFile(join(outDir, ".nojekyll"), "", "utf8");

console.log("Done: gh-pages/ (index.html, 404.html, CNAME, .nojekyll, assets/)");
