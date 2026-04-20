# LLM Context Notes

## Engineering conventions

- New operations should add a dedicated route file under `src/routes`.
- New reusable matrix logic belongs in `src/lib/matrix.ts`.
- Error messages should be direct and user-readable.
- Keep route components mostly declarative and computation inside `useMemo`.

## UI conventions

- Use `PageLayout` and keep title/tagline concise.
- `PageLayout` now appends a default "How <operation> works" blurb to each page unless `showHowItWorks={false}` is passed.
- Use matrix cards with existing visual classes for consistency.
- Sidebar nav now supports a global `Expand all` / `Collapse all` toggle for accordion sections.
- Include a below-result `AdSlot` for operation pages (currently globally hidden by `ADS_ENABLED = false` in `AdSlot`).
- Keep results readable on narrow screens (`overflow-x-auto` where needed).
- Brand copy uses `MatrixDojo` (replace legacy lowercase-dot brand references when touched).

## SEO conventions

- Every route should define unique `head` meta content.
- Include operation-specific keywords naturally in title and description.
- Keep copy practical and user-intent focused.

## Current focus for future work

- Expanded operation coverage now includes decomposition and linear-systems tools, plus spectral/space/product pages.
- Keep each page conversion-friendly (clear result, examples, educational copy).
- Maintain speed and polish to differentiate from low-quality competitors.
- New transform/probability/graph route cluster now includes:
  - `transform-matrices-2d-3d` (T·x, determinant scaling, invertibility status)
  - `rotation-reflection-shear` (parameterized 2D transform constructors)
  - `homogeneous-coordinates` (3x3 affine composition and homogeneous/cartesian mapping)
  - `compose-decompose-transforms` (affine composition + approximate TRSS decomposition)
  - `householder-givens` (orthogonal reflection/rotation builders)
  - `companion-fiedler` (companion and Fiedler-like polynomial linearizations)
  - `markov-chain-tools` (row-stochastic validation, n-step evolution, stationary estimate)
  - `graph-laplacian` (D, L, normalized Laplacian, undirected component count)
- Shape and creation coverage now also includes dedicated pages for split/partition, stack/unstack, triangular extraction,
  symmetrize/skew decomposition, sparse COO constructors, Vandermonde/Pascal/Hilbert generation, and block matrix building.
- Linear algebra core coverage now also includes pseudoinverse (full-rank formulas), adjugate/cofactor matrices, and
  determinant expansion by chosen row/column with explicit term output.

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
- Eigen/space/norms/generators/structure pages now use custom operation-specific "How ... works" sections in-route and disable the generic `PageLayout` blurb via `showHowItWorks={false}`.
- Added spectral/decomposition sidebar route pages:
  - `src/routes/cholesky-svd-schur.tsx`: Cholesky (SPD), exact numeric 2x2 SVD, and QR-iteration Schur approximation.
  - `src/routes/polar-decomposition.tsx`: right polar decomposition `A = U P` via Newton iteration (invertible square numeric matrices).
  - `src/routes/jordan-form.tsx`: real 2x2 Jordan classification (distinct, repeated-defective, and real canonical complex block).
  - `src/routes/diagonalization.tsx`: real 2x2 diagonalization `A = P D P^-1` for distinct real eigenvalues.
  - `src/routes/spectral-radius.tsx`: `rho(A)` from numeric eigenvalues (current eigen backend limits apply).
  - `src/routes/matrix-functions-spectrum.tsx`: spectral function reconstruction `f(A) = P f(D) P^-1` for diagonalizable real 2x2 matrices.
  - `src/routes/matrix-log-sqrt.tsx`: principal `sqrt(A)` and `log(A)` for SPD 2x2 matrices.
  - `src/routes/sylvester-lyapunov.tsx`: direct Kronecker-system solver for `AX + XB = C` and `A^T X + X A = -Q` on small numeric systems.
- New analytics/sidebar routes now implemented: `boolean-comparisons-masking`, `boolean-matrix-multiply`, `reachability-transitive-closure`, `logical-reductions`, `mean-var-cov-corr`, `standardize-normalize`, `pca-covariance`, and `mahalanobis-distance`.
- These new pages follow `PageLayout` + route-level custom "How ... works" sections + below-result `AdSlot`, with friendly numeric/shape validation and in-browser computation.
- Newly added route tools: Gaussian elimination step logger, pivot/free-variable analyzer, REF with partial pivoting, CSR/CSC conversion, sparse add/multiply, sparse bandwidth profile, and sparse Jacobi iterative solve.
- Sparse tooling now uses `src/lib/sparse.ts` for dense numeric parsing assumptions, sparse entry extraction, CSR/CSC conversion, bandwidth/profile metrics, and Jacobi residual-history reporting.
- April 2026 copy pass: decomposition/transform/structure pages now include one extra concise explanatory paragraph each, while keeping defaults decimal-first (no non-essential fraction-prefilled inputs in that route cluster).
- April 2026 spectral/decomposition copy refinement: "How ... works" sections on advanced linear-algebra routes now include concise equation-level properties (spectral mapping, SPD/orthogonality conditions, convergence caveats, and residual interpretation checks) without behavior changes.
- April 2026 copy pass (follow-up): expanded "How ... works" sections for matrix product/structure/block/classical determinant pages with concise formulas for dimension constraints, identities, and cofactor/multilinearity relations in:
  - `matrix-products`, `advanced-products`, `elementwise`, `structure-tools`, `split-partition`, `stack-unstack-blocks`,
    `triangular-extraction`, `symmetrize-skew`, `block-matrix-builder`, `adjugate-cofactor`,
    `determinant-expansion`, and `vandermonde-pascal-hilbert`.

## Deployment (GitHub Pages)

- **One command:** `npm run build:github-pages` runs **`scripts/github-pages-build.mjs`** (client-only `vite build` with `GITHUB_PAGES=1`, then emits **`gh-pages/`** from `dist/client/assets` plus a static shell `index.html`).
- SEO hardening (Apr 2026): root route now emits canonical URLs, normalized MatrixDojo Open Graph/Twitter defaults, and site-level JSON-LD (`WebSite` + `WebApplication`) in `src/routes/__root.tsx`.
- SEO structured-data follow-up (Apr 2026): root shell now emits route-aware JSON-LD per pathname in `src/routes/__root.tsx` (`WebPage` and `FAQPage`) with operation-name derivation from route slug; `SoftwareApplication` schema was removed to avoid Rich Results `aggregateRating` warnings.
- SEO hardening (Apr 2026): GitHub Pages build now auto-generates `gh-pages/sitemap.xml` from `src/routeTree.gen.ts` routes and writes `gh-pages/robots.txt` with sitemap reference.
- SEO assets added under `public/`: `robots.txt`, `site.webmanifest`, `favicon.svg`, and `social-preview.svg`.
- No backend/server runtime is used for GitHub Pages deployment; rendering and calculations run in the browser.
- Default **`npm run build`** (no env) keeps the standard local output under `dist/`.
- **Settings → Pages → Source:** **GitHub Actions** (required before `deploy-pages` can run). If the deploy step fails with **HttpError: Not Found** / “Creating Pages deployment failed”, Pages is not enabled or source is still “Deploy from a branch”—open **Settings → Pages**, set source to **GitHub Actions**, save, then **re-run failed jobs** on the workflow.
- First deploy may ask to approve the **`github-pages`** environment once.

## Testing conventions

- Unit tests for matrix operations live in `src/lib/matrix.test.ts`.
- Use numeric assertions with tolerance for decomposition/eigen/exponential routines.
- Sidebar navigation is now organized by operation subsections via accordion dropdowns to match product taxonomy.
