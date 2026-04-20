// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
//
// Vercel: TanStack Start needs Nitro for SSR (see https://vercel.com/docs/frameworks/full-stack/tanstack-start).
// GitHub Pages: CI uses the same Nitro build (`VERCEL=1`) then `scripts/prerender-github-pages.mjs` to emit static HTML.
// Cloudflare's Vite plugin is disabled for Nitro builds so Nitro can emit deploy output.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { nitro } from "nitro/vite";

const useNitro = process.env.VERCEL === "1";

export default defineConfig({
  cloudflare: useNitro ? false : undefined,
  vite: {
    plugins: useNitro ? [nitro()] : [],
  },
});
