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
  VITE_ROUTER_BASEPATH: "/smooth-matrix-magic",
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

const req = new Request("https://example.com/", {
  headers: { "user-agent": "github-pages-prerender" },
});
let res = await handler.fetch(req, {});
if (res.status >= 300 && res.status < 400) {
  const location = res.headers.get("location");
  if (!location) {
    throw new Error(`SSR redirect missing location header: ${res.status}`);
  }
  const redirected = new URL(location, req.url).toString();
  res = await handler.fetch(
    new Request(redirected, { headers: { "user-agent": "github-pages-prerender" } }),
    {},
  );
}
if (!res.ok) {
  throw new Error(`SSR failed: ${res.status} ${res.statusText}`);
}
let html = await res.text();
const pagesPrefix = "/smooth-matrix-magic";

// SSR output is rooted at "/" by default; rewrite root-relative URLs for project pages.
html = html.replaceAll(/([("'`])\/(?!\/)/g, `$1${pagesPrefix}/`);

// Copy Nitro static output directly into gh-pages root.
// staticSrc already contains an `assets/` directory.
await cp(staticSrc, outDir, { recursive: true });
await writeFile(join(outDir, "index.html"), html, "utf8");
await writeFile(join(outDir, "404.html"), html, "utf8");
await writeFile(join(outDir, ".nojekyll"), "", "utf8");

console.log("Done: gh-pages/ (index.html, 404.html, .nojekyll, assets/)");
