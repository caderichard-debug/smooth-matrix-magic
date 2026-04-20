# LLM Context Notes

## Engineering conventions

- New operations should add a dedicated route file under `src/routes`.
- New reusable matrix logic belongs in `src/lib/matrix.ts`.
- Error messages should be direct and user-readable.
- Keep route components mostly declarative and computation inside `useMemo`.

## UI conventions

- Use `PageLayout` and keep title/tagline concise.
- Use matrix cards with existing visual classes for consistency.
- Include a below-result `AdSlot` for operation pages (currently globally hidden by `ADS_ENABLED = false` in `AdSlot`).
- Keep results readable on narrow screens (`overflow-x-auto` where needed).

## SEO conventions

- Every route should define unique `head` meta content.
- Include operation-specific keywords naturally in title and description.
- Keep copy practical and user-intent focused.

## Current focus for future work

- Expanded operation coverage now includes decomposition and linear-systems tools, plus spectral/space/product pages.
- Keep each page conversion-friendly (clear result, examples, educational copy).
- Maintain speed and polish to differentiate from low-quality competitors.

## Implemented numeric constraints

- `matrixExponential` uses a numeric truncated power series with 20 terms by default.
- `eigenvaluesNumeric` supports only `1x1`, `2x2`, and `3x3` matrices; complex roots are rejected with a clear error.
- `characteristicPolynomial` currently supports numeric square matrices up to `3x3`.
- `solveLinearSystem`, `luDecomposition`, `qrDecomposition`, `gramSchmidtOrthogonalization`, `nullSpaceBasis`, and `columnSpaceBasis` are numeric-only and provide user-readable validation errors.
- `commutator` and `anticommutator` require same-size square matrices.
- `directSum` builds a block diagonal matrix from two inputs of any dimensions.
- `elementWisePower` and `matrixPower` are both exposed and intentionally separated in UX.
- Shape utilities implemented: `reshapeMatrix`, `flattenMatrix`, `resizeMatrix`, concat/slice/permutation/reverse, diagonal and band extraction.
- Generator utilities implemented: zero/ones/random/Toeplitz/circulant/diagonal.
- Metrics implemented: Frobenius, L1, infinity norms, distance, relative error, nullity, and 1-norm condition number.

## Deployment (Vercel)

- **TanStack Start** serves SSR via `hydrateRoot(document, …)`; publishing only `dist/client` (no `index.html`) caused Vercel `NOT_FOUND`. Fix: on Vercel builds (`VERCEL=1`), disable the Cloudflare Vite plugin and enable **Nitro** (`nitro/vite`) so the build emits `.vercel/output` for Vercel Functions + static assets (see `vite.config.ts` and [Vercel TanStack Start docs](https://vercel.com/docs/frameworks/full-stack/tanstack-start)).
- `vercel.json` sets `installCommand` + `buildCommand` only; do **not** set `outputDirectory` to `dist/client` for production—let Nitro/Vercel consume `.vercel/output`.
- Non-Vercel builds keep the default Cloudflare worker output under `dist/`.

## Deployment (GitHub Pages)

- Classic static hosting cannot run the Nitro server; **`.github/workflows/deploy-pages.yml`** runs `VERCEL=1 npm run build`, then **`scripts/prerender-github-pages.mjs`** (invokes the Vercel fallback handler for `/`) and uploads **`gh-pages/`** (includes `CNAME` for `matrixdojo.app`, `.nojekyll`, `404.html` copy of home for SPA-ish refresh).
- Local preview of the Pages bundle: `npm run build:github-pages` then serve the `gh-pages` folder (not committed; listed in `.gitignore`).
- In the repo **Settings → Pages**, set **Build and deployment → Source** to **GitHub Actions** (not “Deploy from a branch”). Until this is set, `*.github.io/...` can 404 even if the workflow file exists.
- After the first run, check **Actions → Deploy GitHub Pages** for failures; if the **`github-pages` environment** waits for approval, approve it once under the run’s “Review deployments” prompt.

## Testing conventions

- Unit tests for matrix operations live in `src/lib/matrix.test.ts`.
- Use numeric assertions with tolerance for decomposition/eigen/exponential routines.
- Sidebar navigation is now organized by operation subsections via accordion dropdowns to match product taxonomy.
