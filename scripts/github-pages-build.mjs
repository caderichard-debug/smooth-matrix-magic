/**
 * Single entry for GitHub Pages: build + prerender into `gh-pages/`.
 * Run: `npm run build:github-pages` (CI uses the same command).
 */
import { spawn, spawnSync } from "node:child_process";
import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pagesPrefix = "/smooth-matrix-magic";
const outDir = join(root, "gh-pages");
const staticSrc = join(root, ".output/public");
const serverEntry = join(root, ".output/server/index.mjs");
const host = "127.0.0.1";
const port = String(await getFreePort());

const env = {
  ...process.env,
  GITHUB_PAGES: "1",
  VITE_ROUTER_BASEPATH: pagesPrefix,
};

const r = spawnSync("npm", ["run", "build"], { cwd: root, env, stdio: "inherit" });
if (r.status !== 0) process.exit(r.status ?? 1);

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

const serverProc = spawn("node", [serverEntry], {
  cwd: root,
  env: { ...env, NITRO_HOST: host, NITRO_PORT: port },
  stdio: "ignore",
});
let serverExited = false;
serverProc.on("exit", () => {
  serverExited = true;
});

async function getFreePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, host, resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Unable to resolve free local port");
  }
  const freePort = address.port;
  await new Promise((resolve) => server.close(resolve));
  return freePort;
}

async function waitForServer(timeoutMs = 20000) {
  const start = Date.now();
  const probeUrls = [
    `http://${host}:${port}${pagesPrefix}/`,
    `http://${host}:${port}/`,
  ];
  while (Date.now() - start < timeoutMs) {
    if (serverExited) {
      throw new Error("Local prerender server exited before becoming ready");
    }
    try {
      for (const url of probeUrls) {
        const res = await fetch(url);
        if (res.ok) return url;
      }
    } catch {
      // Ignore until server is ready.
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error("Timed out waiting for local prerender server");
}

try {
  const readyUrl = await waitForServer();
  const res = await fetch(readyUrl);
  if (!res.ok) {
    throw new Error(`SSR failed: ${res.status} ${res.statusText}`);
  }
  const html = await res.text();

  await cp(staticSrc, outDir, { recursive: true });
  await writeFile(join(outDir, "index.html"), html, "utf8");
  await writeFile(join(outDir, "404.html"), html, "utf8");
  await writeFile(join(outDir, ".nojekyll"), "", "utf8");
  console.log("Done: gh-pages/ (index.html, 404.html, .nojekyll, assets/)");
} finally {
  serverProc.kill("SIGTERM");
}
