/**
 * GitHub Pages build.
 * - Build app
 * - Render one HTML shell via local build-time server
 * - Publish static assets + prerendered shell
 */
import { spawnSync } from "node:child_process";
import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pagesPrefix = "/";
const outDir = join(root, "gh-pages");
const clientAssets = join(root, "dist/client/assets");
const serverEntry = join(root, "dist/server/server.js");

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

const { default: server } = await import(serverEntry);
if (!server?.fetch) {
  throw new Error("dist/server/server.js does not export a fetch handler");
}

const routePath = pagesPrefix === "/" ? "/" : `${pagesPrefix}/`;
const res = await server.fetch(new Request(`https://example.com${routePath}`));
if (!res.ok) {
  throw new Error(`SSR shell fetch failed: ${res.status} ${res.statusText}`);
}
let html = await res.text();

// Ensure client boot always happens via an external module script.
// Some environments can block inline module scripts, which leaves a static (non-interactive) page.
const entryMatch = html.match(/import\("([^"]*\/assets\/index-[^"]+\.js)"\)/);
if (entryMatch?.[1] && !html.includes(`src="${entryMatch[1]}"`)) {
  const bootTag = `<script type="module" src="${entryMatch[1]}"></script>`;
  html = html.replace("</body></html>", `${bootTag}</body></html>`);
}

await writeFile(join(outDir, "index.html"), html, "utf8");
await writeFile(join(outDir, "404.html"), html, "utf8");
await writeFile(join(outDir, ".nojekyll"), "", "utf8");
console.log("Done: gh-pages/ (index.html, 404.html, .nojekyll, assets/)");
