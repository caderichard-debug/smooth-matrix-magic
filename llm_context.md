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
- ML operations cluster: `SiteHeader` section `15) ML / Neural Ops` links to `ml-convolution`, `ml-cross-correlation`, `ml-pooling`, `ml-softmax`, `ml-attention`, and `ml-adam-step`. Use `matrixToGrid` / `gridToMatrix` from `src/lib/mlOps.ts` with numeric-only `MatrixInput` values; caps `ML_MAX_INPUT_DIM` / `ML_MAX_KERNEL_DIM` keep workloads small.
- `src/lib/mlOps.ts` now includes reusable `scaledDotProductAttention(Q, K, V, { additiveMask? })`, returning `scores`, row-wise `weights`, and final `output`, with explicit shape checks for Q/K/V compatibility and mask dimensions.
- Multi-head attention educational support added in `src/lib/mlOps.ts`: `splitHeads(x, numHeads)`, `concatHeads(heads)`, and `causalMask(qRows, kRows, blockedValue?)` for shape walkthroughs and score masking.
- Sequence-model primitives now include `sinusoidalPositionalEncoding(seqLen, dModel, base?)` and reusable `causalMask(...)` exposure in `src/lib/mlOps.ts`, with route UI at `src/routes/ml-sequence-ops.tsx`.
- New route `src/routes/ml-multihead-attention.tsx` walks through self-attention projections (`XW_Q`, `XW_K`, `XW_V`), head splitting, optional additive+causal masking, per-head scaled dot-product attention, head concatenation, and final output projection via `W_O`.
- `src/lib/mlOps.ts` now includes reusable `adamStep(params, grads, m, v, t, lr, beta1, beta2, eps, weightDecay?)` returning updated parameters/moments, bias-corrected moments, and incremented step index.
- Optimizer-step comparison support is now in `src/lib/mlOps.ts` via `sgdStep` and `momentumStep` so matrix-shaped parameter updates can be shown side-by-side with `adamStep`.
- Route `ml-optimizer-steps` compares one-step SGD, Momentum, and Adam outputs from shared matrix inputs and optimizer-state controls.
- Linear-layer support added to `src/lib/mlOps.ts` for reusable `linearForward` and `linearBackward` computations (`dW = X^T dY`, `dX = dY W^T`, `db = row-wise sum(dY)`), plus a route-level teaching UI at `src/routes/ml-linear-layer.tsx`.
- Loss/gradient fundamentals support added to `src/lib/mlOps.ts`: `mseLoss`, `mseGrad`, `crossEntropyFromLogits`, `crossEntropyGradFromLogits`, and `softmaxJacobianRow`, with route UI `src/routes/ml-loss-gradients.tsx` and test coverage in `src/lib/mlOps.test.ts`.
- ML similarity/distance route: `ml-similarity-distance` computes row-wise cosine similarity and pairwise distances (Euclidean/Manhattan) for matrix rows as vectors, supporting both self (`A` vs `A`) and cross (`A` vs `B`) modes with numeric/shape validation in `src/lib/mlOps.ts`.
- ML normalization coverage added: `ml-normalization` route computes BatchNorm inference (running stats) and row-wise LayerNorm using shared `batchNormInference` / `layerNorm` with finite-value checks, vector-length validation against feature dimension, non-negative running variance, and positive finite epsilon.
- ML normalization coverage now also includes row-wise RMSNorm on `ml-normalization`, backed by reusable `rmsNorm(X, gamma, eps)` in `src/lib/mlOps.ts` (RMS-only denominator, gamma scale, no beta, finite/shape/epsilon validation).
- `src/lib/mlOps.test.ts` normalization coverage now includes additional BatchNorm/LayerNorm/RMSNorm edge validation (finite parameter vectors, epsilon validity, 16x16 cap checks) plus constant-row and zero-row numeric behavior assertions.
- ML regularization coverage added: `ml-regularization` route demonstrates both L2 weight decay updates and inverted dropout output scaling with deterministic optional masks.
- `src/lib/mlOps.ts` now includes `l2WeightDecayStep(params, grads, lr, weightDecay)` for standalone SGD-style L2 updates and `applyDropout(input, keepProb, mask?)` returning `{ output, mask }` with optional deterministic 0/1 mask input.
- Added `ml-svd-pca-low-rank` route under `15) ML / Neural Ops` to teach truncated SVD factors (`U, S, V^T`), rank-k low-rank approximation, and PCA projections from SVD on centered data.
- `src/lib/mlOps.ts` now includes reusable educational helpers for dense numeric dimensionality reduction workflows: `truncatedSvd`, `reconstructFromTruncatedSvd`, `lowRankApproximation`, and `pcaFromSvd`.
- `src/lib/mlOps.test.ts` now includes additional dimensionality-reduction tests covering: rank-deficient default `truncatedSvd` reconstruction path, `reconstructFromTruncatedSvd` rejection of invalid singular values, and the current zero-variance `pcaFromSvd` throw behavior.
- Added route `src/routes/ml-convolution-extras.tsx` under `15) ML / Neural Ops` with three interactive sections: dilated convolution output, depthwise+pointwise separable convolution stages, and transposed-convolution output-shape sizing.
- `src/lib/mlOps.ts` now exposes reusable convolution-extras helpers `dilatedConvolve2d`, `separableConvolve2d`, `transposedConv1dOutputSize`, and `transposedConv2dOutputShape` with explicit integer/finite validation.
- `src/lib/mlOps.test.ts` now includes coverage for convolution-extras numeric outputs and edge validations (invalid dilation, non-finite pointwise parameters, and transposed-convolution output-padding bounds).
- Follow-up convolution-extras test hardening now also asserts: `dilatedConvolve2d(..., dilation=1)` parity with `convolve2d`, separable-convolution parameter passthrough for stride/pad/dilation, full `transposedConv1dOutputSize` breakdown fields, independent per-axis `transposedConv2dOutputShape` behavior, and additional rejection of non-positive transposed output size plus non-integer stride.
- Sequence-model primitives now include route `ml-sequence-ops`, which demonstrates sinusoidal positional encoding matrix construction and causal mask generation with explicit equations and parameterized controls.
- `src/lib/mlOps.ts` now exposes `sinusoidalPositionalEncoding(seqLen, dModel, base?)` for reusable sequence-position embeddings; `causalMask` remains exported for additive attention masking.
- `src/lib/mlOps.test.ts` now validates positional encoding default/custom-base values and edge constraints (dimensions/base/cap), in addition to existing causal-mask tests.

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
- Unit tests for ML operation utilities live in `src/lib/mlOps.test.ts`.
- Use numeric assertions with tolerance for decomposition/eigen/exponential routines.
- Sidebar navigation is now organized by operation subsections via accordion dropdowns to match product taxonomy.
