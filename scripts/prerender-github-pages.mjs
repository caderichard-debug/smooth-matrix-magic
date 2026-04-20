/**
 * After `VERCEL=1 npm run build`, calls the Nitro/Vercel fallback handler to SSR `/`
 * and writes static HTML + copies assets into `gh-pages/` for GitHub Pages.
 */
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const fallbackEntry = join(root, ".vercel/output/functions/__fallback.func/index.mjs");
const staticSrc = join(root, ".vercel/output/static");
const outDir = join(root, "gh-pages");

async function main() {
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  const mod = await import(fallbackEntry);
  const handler = mod.default;
  if (!handler?.fetch) {
    throw new Error("Expected Vercel fallback handler with .fetch — run VERCEL=1 npm run build first");
  }

  const url = "https://matrixdojo.app/";
  const req = new Request(url, { headers: { "user-agent": "gh-pages-prerender" } });
  const res = await handler.fetch(req, {});
  if (!res.ok) {
    throw new Error(`SSR fetch failed: ${res.status} ${res.statusText}`);
  }
  const html = await res.text();

  await cp(staticSrc, join(outDir, "assets"), { recursive: true });
  await writeFile(join(outDir, "index.html"), html, "utf8");
  await writeFile(join(outDir, "404.html"), html, "utf8");
  await writeFile(join(outDir, "CNAME"), "matrixdojo.app\n", "utf8");
  await writeFile(join(outDir, ".nojekyll"), "", "utf8");

  console.log("Wrote gh-pages/ with index.html, 404.html, CNAME, .nojekyll, and assets/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
