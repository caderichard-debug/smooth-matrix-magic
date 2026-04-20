# Smooth Matrix Magic - Agent Style Guide

This project is an SEO-focused matrix calculator suite designed to feel faster and cleaner than typical utility tools, while monetizing with AdSense placements.

## Product intent

- Build trust with accurate math, instant feedback, and clear error states.
- Keep interactions smooth and lightweight; every operation should feel immediate.
- Balance utility and monetization without making ads intrusive.
- Ship operation-specific pages that can rank for long-tail search terms.

## UX and visual rules

- Reuse `PageLayout` for all operation pages.
- Keep the hero structure consistent: operation title + one-sentence tagline.
- Use card sections with `border-border bg-card/40` for inputs and outputs.
- Preserve responsive behavior and overflow handling (`overflow-x-auto`) for matrix output.
- Prefer clear labels like `Result: det(A)` or `Result: RREF(A)`.

## Navigation and IA

- Every new operation page should be added to `SiteHeader` nav.
- Keep labels short and scannable (`RREF`, `LU`, `Eigenvalues`).
- New routes should use file-based TanStack route conventions in `src/routes`.
- Ensure route generation is refreshed when adding new route files.

## Page template for new operations

1. Create `src/routes/<operation>.tsx` with `createFileRoute`.
2. Add SEO metadata:
   - title with "Matrix <Operation> Calculator"
   - short description with user intent and operation name
   - Open Graph title/description
3. Add one or more `MatrixInput` panels as needed.
4. Compute result in `useMemo` with try/catch and friendly error handling.
5. Render output in a card using `MatrixDisplay` or scalar text.
6. Add `StepsPanel` when explanatory steps are practical.
7. Add `AdSlot` below results.
8. Add route to header nav.

## Math and implementation rules

- Put reusable math logic in `src/lib/matrix.ts` (not inside route files).
- Keep parsing and expression behavior aligned with existing `Expr` helpers.
- Throw specific, user-readable errors for dimension or domain issues.
- For numeric-only algorithms, gate with `isFullyNumeric` and explain why in error text.
- Use tolerance-based comparisons (`1e-10`) for numeric elimination algorithms.

## SEO and content guidelines

- Each page should target one operation keyword cluster.
- Keep copy practical and beginner-friendly; define what operation means.
- Mention accepted input forms where relevant (fractions, variables, expressions).
- Use unique metadata per page; avoid duplicate meta descriptions.

## Monetization guidelines

- Keep default ad structure:
  - header ad in `PageLayout`
  - below-result ad in each operation page
- Never block core interactions with ad containers.
- Maintain enough breathing room around ads for readability and trust.

## Quality checks before finishing

- Run build and relevant lint/type checks.
- Verify no lints in changed files with `ReadLints`.
- Confirm navbar link and route load correctly.
- Confirm mobile layout and matrix overflow behavior still work.

## Candidate operations backlog

- Row echelon form (REF) with pivot markers
