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

## Deployment (GitHub Pages)

- **One command:** `npm run build:github-pages` runs **`scripts/github-pages-build.mjs`** (Nitro build with `GITHUB_PAGES=1`, then prerender into **`gh-pages/`**). CI runs the same after `npm ci` + `npm test`.
- Default **`npm run build`** (no env) keeps the Cloudflare worker output under `dist/`.
- **Settings → Pages → Source:** **GitHub Actions** (required before `deploy-pages` can run). If the deploy step fails with **HttpError: Not Found** / “Creating Pages deployment failed”, Pages is not enabled or source is still “Deploy from a branch”—open **Settings → Pages**, set source to **GitHub Actions**, save, then **re-run failed jobs** on the workflow.
- First deploy may ask to approve the **`github-pages`** environment once.

## Testing conventions

- Unit tests for matrix operations live in `src/lib/matrix.test.ts`.
- Use numeric assertions with tolerance for decomposition/eigen/exponential routines.
- Sidebar navigation is now organized by operation subsections via accordion dropdowns to match product taxonomy.
