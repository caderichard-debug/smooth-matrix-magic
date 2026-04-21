# Project Overview - Smooth Matrix Magic

## What this project is

Smooth Matrix Magic is a web-based matrix manipulation toolset built for:

- fast in-browser computation
- clean modern UI/UX
- SEO-friendly operation pages
- AdSense-based monetization
- User-facing brand name: `MatrixDojo`

## Core stack

- React + TypeScript
- TanStack Router (file-based routes)
- Tailwind + shadcn/ui components
- Vite build tooling

## Existing operation pages

- Matrix multiplication
- Matrix addition/subtraction
- Scalar multiplication
- Scalar division
- Hadamard product / Kronecker product
- Commutator / anticommutator / direct sum
- Element-wise division / element-wise power
- Matrix power
- Matrix exponential
- Transpose
- Conjugate transpose
- Shape & structure tools (reshape, flatten, concat, reverse, band/diagonal extraction)
- Matrix generators (zero/ones/identity/random/Toeplitz/circulant)
- Norms & metrics (Frobenius/L1/Infinity/distance/relative error/condition number)
- Determinant
- Inverse
- LU / QR / Gram-Schmidt decompositions
- Linear system solver (Ax=b)
- Eigenvalues / characteristic polynomial
- Null space / column space basis
- Trace/rank
- RREF
- ML / neural ops: 2D convolution, 2D cross-correlation, max/avg pooling, row-wise softmax
- Optimizer math op: Adam one-step update (`/ml-adam-step`) with moment and bias-correction outputs

## Backlog implementation status (Apr 2026)

- LU decomposition, QR decomposition, and Gram-Schmidt are live in `src/routes/decompositions.tsx`.
- Linear system solver with classification (`unique` / `infinite` / `none`) is live in `src/routes/linear-system.tsx`.
- Eigenvalues (numeric) and characteristic polynomial are live in `src/routes/eigen-characteristic.tsx`.
- Null-space and column-space basis tools are live in `src/routes/spaces.tsx`.
- Matrix exponential (`e^A`) is live in `src/routes/matrix-exponential.tsx` using a truncated series (20 terms).
- Hadamard and Kronecker products are live in `src/routes/matrix-products.tsx`.
- Commutator, anticommutator, and direct sum are live in `src/routes/advanced-products.tsx`.
- Element-wise division and explicit element-wise-vs-matrix power are live in `src/routes/elementwise.tsx`.
- Shape and structural operations are grouped in `src/routes/structure-tools.tsx`.
- Matrix creation utilities are grouped in `src/routes/generators.tsx`.
- Norms and metrics are grouped in `src/routes/norms-metrics.tsx`.
- Added route pages: `split-partition`, `stack-unstack-blocks`, `triangular-extraction`, `symmetrize-skew`,
  `sparse-constructors`, `vandermonde-pascal-hilbert`, `block-matrix-builder`, `pseudoinverse`,
  `adjugate-cofactor`, and `determinant-expansion`.
- Boolean comparison/masking, boolean multiplication, reachability/transitive closure, and logical reduction tools are live as dedicated routes.
- Descriptive-statistics and preprocessing tools are live: mean/variance/covariance/correlation, standardize/normalize, PCA-from-covariance, and Mahalanobis distance.
- Additional sidebar pages now implemented as live tools: Gaussian elimination steps, pivot/free-variable analyzer, REF with partial pivoting, CSR/CSC conversions, sparse add/multiply, sparse bandwidth profile, and sparse iterative solve.
- New transform and stochastic/graph pages are live: `transform-matrices-2d-3d`, `rotation-reflection-shear`,
  `homogeneous-coordinates`, `compose-decompose-transforms`, `householder-givens`, `companion-fiedler`,
  `markov-chain-tools`, and `graph-laplacian`.
- The advanced route cluster (decomposition, transforms, spectral, block/structured tools) received a concise explanatory-copy refresh while preserving lean UI and decimal-first defaults.
- Follow-up copy pass enriched "How ... works" blurbs on decomposition/spectral routes with compact mathematical properties, constraints, and diagnostic interpretation notes, preserving existing runtime behavior.
- Follow-up explanatory-copy refresh expanded "How ... works" sections on product/structure/classical-identity pages with concise equations and dimension constraints (`matrix-products`, `advanced-products`, `elementwise`, `structure-tools`, `split-partition`, `stack-unstack-blocks`, `triangular-extraction`, `symmetrize-skew`, `block-matrix-builder`, `adjugate-cofactor`, `determinant-expansion`, `vandermonde-pascal-hilbert`).
- ML / neural-style grid ops (sidebar section 15): `ml-convolution` (true 2D conv with flip), `ml-cross-correlation` (sliding dot product as in many CNNs), `ml-pooling` (max/avg), `ml-softmax` (row-wise). Shared numerics live in `src/lib/mlOps.ts`.
- ML attention tool added: `ml-attention` now visualizes scaled dot-product attention internals (`scores`, `softmax weights`, `output`) with optional additive masking, backed by reusable `scaledDotProductAttention` in `src/lib/mlOps.ts`.
- Multi-head attention walkthrough added: `ml-multihead-attention` now demonstrates `X -> Q/K/V projections -> split heads -> masked per-head attention -> concat -> W_O projection` with optional additive and causal masking toggles.
- `src/lib/mlOps.ts` now includes reusable attention-shape helpers `splitHeads`, `concatHeads`, and `causalMask` for educational routes and tests.
- Added `ml-sequence-ops` route for sequence-model matrix primitives: sinusoidal positional-encoding matrix generation and causal-mask construction.
- `src/lib/mlOps.ts` now includes reusable `sinusoidalPositionalEncoding(seqLen, dModel, base?)` alongside exported `causalMask(...)` for transformer-style sequence walkthroughs.
- Added optimizer-step page `ml-adam-step` in section 15 with reusable `adamStep(...)` logic in `src/lib/mlOps.ts` and tests in `src/lib/mlOps.test.ts`.
- Added optimizer-comparison page `ml-optimizer-steps` in section 15 to show one-step matrix updates side-by-side for SGD, Momentum, and Adam.
- `src/lib/mlOps.ts` now includes reusable `sgdStep(params, grads, lr)` and `momentumStep(params, grads, velocity, lr, momentum)` helpers in addition to `adamStep`.
- ML linear utilities are now live in `src/lib/mlOps.ts`: `linearForward(X, W, b?)` and `linearBackward(X, W, dY)` with numeric/shape validation and a dedicated route `ml-linear-layer` for forward/backward gradient intuition.
- Added loss-gradient fundamentals route `ml-loss-gradients` covering MSE loss/gradient, cross-entropy from logits with row-mean loss, per-row softmax Jacobian, and linear-backward recap. Shared helpers now include `mseLoss`, `mseGrad`, `crossEntropyFromLogits`, `crossEntropyGradFromLogits`, and `softmaxJacobianRow` in `src/lib/mlOps.ts`.
- ML vector similarity/distance page is live: `ml-similarity-distance` (row-vector cosine similarity and pairwise Euclidean/Manhattan distances, with optional A-vs-B mode) backed by `cosineSimilarityMatrix` and `pairwiseDistanceMatrix` in `src/lib/mlOps.ts`.
- Added `ml-normalization` route for BatchNorm inference and row-wise LayerNorm, backed by reusable `batchNormInference` and `layerNorm` helpers in `src/lib/mlOps.ts`.
- `ml-normalization` now also includes row-wise RMSNorm output/explanation, backed by reusable `rmsNorm(X, gamma, eps)` in `src/lib/mlOps.ts` (gamma scale only, no beta).
- ML normalization test coverage in `src/lib/mlOps.test.ts` now exercises extra BatchNorm/LayerNorm/RMSNorm edge paths (finite vectors, epsilon checks, cap-limit validation) and constant/zero-row behavior.
- Added `ml-regularization` route for regularization fundamentals: an L2 weight-decay parameter step demo and inverted-dropout mask application demo.
- `src/lib/mlOps.ts` now includes reusable `l2WeightDecayStep(params, grads, lr, weightDecay)` and `applyDropout(input, keepProb, mask?)` helpers, including deterministic optional mask support for reproducible dropout walkthroughs.
- Added `ml-svd-pca-low-rank` educational route for truncated SVD decomposition, rank-k reconstruction, and PCA via SVD projection in one workflow.
- `src/lib/mlOps.ts` now includes reusable SVD/PCA helpers for small dense numeric matrices: `truncatedSvd`, `reconstructFromTruncatedSvd`, `lowRankApproximation`, and `pcaFromSvd`.
- `src/lib/mlOps.test.ts` dimensionality-reduction coverage now includes edge-path tests for rank-deficient default `truncatedSvd` behavior, `reconstructFromTruncatedSvd` singular-value validation (`NaN`/negative rejection), and documented `pcaFromSvd` zero-variance failure behavior.
- Added `ml-convolution-extras` route under section `15) ML / Neural Ops` with interactive walkthroughs for dilated convolution, depthwise+pointwise separable convolution, and transposed-convolution output sizing.
- `src/lib/mlOps.ts` now includes reusable convolution-extras helpers: `dilatedConvolve2d`, `separableConvolve2d`, `transposedConv1dOutputSize`, and `transposedConv2dOutputShape`.
- `src/lib/mlOps.test.ts` now covers convolution-extras numerics and validation for dilation, separable pointwise parameters, and transposed-convolution output-padding constraints.
- Convolution-extras tests were expanded with additional behavior locks: `dilation=1` parity against `convolve2d`, separable-convolution stride/pad/dilation passthrough checks, full `transposedConv1dOutputSize` field assertions, independent-axis 2D sizing checks, and extra validation for non-positive transposed output size / non-integer stride.
- Added `ml-sequence-ops` route with interactive sequence-model matrix primitives: sinusoidal positional encoding matrix generation and causal attention-mask construction, including equation-level explanation.
- `src/lib/mlOps.ts` now includes reusable `sinusoidalPositionalEncoding(seqLen, dModel, base?)` alongside existing exported `causalMask(...)`.
- `src/lib/mlOps.test.ts` now includes sequence-op coverage for positional-encoding numerics (default/custom base) plus validation-path tests for positional encoding constraints.

## Architecture notes

- `src/lib/matrix.ts` contains core matrix operations.
- Route pages in `src/routes` are thin UI wrappers around math functions.
- `PageLayout` centralizes shared shell (header, hero, ad slot, footer).
- `SiteHeader` is the source of truth for top-level operation navigation.
- SEO baseline now includes root-level canonical/OG/Twitter metadata defaults and site JSON-LD in `src/routes/__root.tsx`.
- SEO structured data is now route-aware in `src/routes/__root.tsx`, adding per-path `WebPage`, `SoftwareApplication`, and `FAQPage` JSON-LD payloads derived from route slugs.
- GitHub Pages output now includes generated `sitemap.xml` and `robots.txt` via `scripts/github-pages-build.mjs`.

## Product priorities

1. Keep interactions instant and reliable.
2. Add high-intent matrix operations for SEO growth.
3. Preserve visual smoothness and consistency.
4. Keep ad placements easy to toggle (currently hidden via feature flag in `AdSlot`).
5. Maintain comprehensive unit tests for matrix operations in `src/lib/matrix.test.ts`.
