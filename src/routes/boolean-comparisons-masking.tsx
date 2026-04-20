import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { AdSlot } from "@/components/AdSlot";
import {
  asNumber,
  formatNumber,
  fromNumbers,
  isConstant,
  parseExpr,
  type Matrix,
} from "@/lib/matrix";

export const Route = createFileRoute("/boolean-comparisons-masking")({
  head: () => ({
    meta: [
      { title: "Boolean Matrix Comparisons & Masking Calculator" },
      {
        name: "description",
        content:
          "Create matrix comparison masks (>, <, ==) and apply them to keep or zero selected entries with simple boolean logic.",
      },
      { property: "og:title", content: "Boolean Matrix Comparisons & Masking Calculator" },
      {
        property: "og:description",
        content: "Compare two matrices and build practical boolean masks in your browser.",
      },
    ],
  }),
  component: BooleanComparisonsMaskingPage,
});

function BooleanComparisonsMaskingPage() {
  const [a, setA] = useState<Matrix>(() =>
    fromNumbers([
      [3, 1, 5],
      [0, 4, 2],
    ]),
  );
  const [b, setB] = useState<Matrix>(() =>
    fromNumbers([
      [1, 1, 3],
      [2, 2, 2],
    ]),
  );

  const result = useMemo(() => {
    try {
      const an = toNumericMatrix(a, "Matrix A");
      const bn = toNumericMatrix(b, "Matrix B");
      if (an.length !== bn.length || an[0]?.length !== bn[0]?.length) {
        throw new Error("Boolean comparisons require A and B to have the same dimensions");
      }
      const rows = an.length;
      const cols = an[0]?.length ?? 0;
      const gtMask = Array.from({ length: rows }, (_, i) =>
        Array.from({ length: cols }, (_, j) => (an[i][j] > bn[i][j] ? 1 : 0)),
      );
      const eqMask = Array.from({ length: rows }, (_, i) =>
        Array.from({ length: cols }, (_, j) => (Math.abs(an[i][j] - bn[i][j]) < 1e-10 ? 1 : 0)),
      );
      const bandMask = Array.from({ length: rows }, (_, i) =>
        Array.from({ length: cols }, (_, j) => (Math.abs(i - j) <= 1 ? 1 : 0)),
      );
      const maskedByGreater = Array.from({ length: rows }, (_, i) =>
        Array.from({ length: cols }, (_, j) => an[i][j] * gtMask[i][j]),
      );
      const maskedByBand = Array.from({ length: rows }, (_, i) =>
        Array.from({ length: cols }, (_, j) => an[i][j] * bandMask[i][j]),
      );
      return {
        gtMask: fromNumbers(gtMask),
        eqMask: fromNumbers(eqMask),
        bandMask: fromNumbers(bandMask),
        maskedByGreater: toExprMatrix(maskedByGreater),
        maskedByBand: toExprMatrix(maskedByBand),
        selectedCount: gtMask.flat().reduce((s, x) => s + x, 0),
        error: null as string | null,
      };
    } catch (e) {
      return {
        gtMask: null as Matrix | null,
        eqMask: null as Matrix | null,
        bandMask: null as Matrix | null,
        maskedByGreater: null as Matrix | null,
        maskedByBand: null as Matrix | null,
        selectedCount: 0,
        error: e instanceof Error ? e.message : "Error",
      };
    }
  }, [a, b]);

  return (
    <PageLayout
      title="Boolean Comparisons & Masking"
      tagline="Turn matrix comparisons into 0/1 masks, then use those masks to keep or remove selected entries."
      showHowItWorks={false}
    >
      <div className="grid lg:grid-cols-2 gap-6">
        <MatrixInput title="Matrix A (data)" value={a} onChange={setA} />
        <MatrixInput title="Matrix B (threshold/reference)" value={b} onChange={setB} />
      </div>

      {result.error ? (
        <section className="rounded-lg border border-border bg-card/40 p-6">
          <p className="text-sm font-mono text-destructive">{result.error}</p>
        </section>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          <section className="rounded-lg border border-border bg-card/40 p-6 space-y-4">
            <h2 className="text-xl font-semibold">Comparison masks (0/1)</h2>
            {result.gtMask && <MatrixDisplay m={result.gtMask} label="Mask: A > B" />}
            {result.eqMask && (
              <MatrixDisplay m={result.eqMask} label="Mask: A == B (within tolerance)" />
            )}
            {result.bandMask && (
              <MatrixDisplay m={result.bandMask} label="Example structural mask: |i-j| <= 1" />
            )}
          </section>
          <section className="rounded-lg border border-border bg-card/40 p-6 space-y-4">
            <h2 className="text-xl font-semibold">Masked outputs</h2>
            {result.maskedByGreater && (
              <MatrixDisplay m={result.maskedByGreater} label="A .* (A > B)" />
            )}
            {result.maskedByBand && <MatrixDisplay m={result.maskedByBand} label="A .* bandMask" />}
            <p className="text-sm text-muted-foreground">
              Entries selected by <span className="font-mono">A &gt; B</span>:{" "}
              <span className="font-mono text-primary">{formatNumber(result.selectedCount)}</span>
            </p>
          </section>
        </div>
      )}

      <section className="prose-invert max-w-none space-y-3 text-muted-foreground">
        <h2 className="text-foreground text-xl font-semibold">
          How boolean comparisons and masking works
        </h2>
        <p>
          A comparison mask is a matrix of 0s and 1s built entry-by-entry from a rule like
          <span className="font-mono"> a_ij &gt; b_ij </span> or{" "}
          <span className="font-mono">a_ij = b_ij</span>. A 1 means "keep this position"; a 0 means
          "ignore it."
        </p>
        <p>
          To apply a mask, multiply entries element-wise:{" "}
          <span className="font-mono">masked = A .* mask</span>. Positions with 0 become zero, and
          positions with 1 keep the original value.
        </p>
        <p>
          This is useful for thresholding, highlighting differences, and selecting diagonal or
          banded structure before later matrix operations.
        </p>
      </section>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}

function toNumericMatrix(m: Matrix, label: string): number[][] {
  if (!m.length || !m[0]?.length) throw new Error(`${label} must not be empty`);
  if (!m.every((row) => row.length === m[0].length))
    throw new Error(`${label} must be rectangular`);
  if (!m.every((row) => row.every((entry) => isConstant(entry)))) {
    throw new Error(`${label} must contain only numeric entries for boolean comparisons`);
  }
  return m.map((row) => row.map((entry) => asNumber(entry) as number));
}

function toExprMatrix(m: number[][]): Matrix {
  return m.map((row) => row.map((value) => parseExpr(formatNumber(value))));
}
