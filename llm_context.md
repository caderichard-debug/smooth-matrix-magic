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

## Testing conventions

- Unit tests for matrix operations live in `src/lib/matrix.test.ts`.
- Use numeric assertions with tolerance for decomposition/eigen/exponential routines.
