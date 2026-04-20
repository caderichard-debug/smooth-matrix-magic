// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
//
// `GITHUB_PAGES=1` enables Nitro for static prerender (see `scripts/github-pages-build.mjs`).
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { nitro } from "nitro/vite";

const githubPages = process.env.GITHUB_PAGES === "1";

export default defineConfig({
  // GitHub project pages are served from /<repo>/.
  base: githubPages ? "/smooth-matrix-magic/" : undefined,
  vite: {
    plugins: githubPages ? [nitro()] : [],
  },
});
