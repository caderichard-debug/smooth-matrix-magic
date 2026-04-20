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

## Architecture notes

- `src/lib/matrix.ts` contains core matrix operations.
- Route pages in `src/routes` are thin UI wrappers around math functions.
- `PageLayout` centralizes shared shell (header, hero, ad slot, footer).
- `SiteHeader` is the source of truth for top-level operation navigation.

## Product priorities

1. Keep interactions instant and reliable.
2. Add high-intent matrix operations for SEO growth.
3. Preserve visual smoothness and consistency.
4. Keep ad placements easy to toggle (currently hidden via feature flag in `AdSlot`).
5. Maintain comprehensive unit tests for matrix operations in `src/lib/matrix.test.ts`.
