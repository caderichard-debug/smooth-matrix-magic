import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { AdSlot } from "@/components/AdSlot";
import {
  asNumber,
  dims,
  formatNumber,
  fromNumbers,
  isFullyNumeric,
  parseExpr,
  type Matrix,
} from "@/lib/matrix";

export const Route = createFileRoute("/jordan-form")({
  head: () => ({
    meta: [
      { title: "Jordan Form Calculator (2x2 Real) — MatrixDojo" },
      {
        name: "description",
        content:
          "Classify and compute the real Jordan normal form for numeric 2x2 matrices, including repeated-eigenvalue defective cases.",
      },
      { property: "og:title", content: "Jordan Form Calculator (2x2)" },
      {
        property: "og:description",
        content:
          "Find the Jordan form of a real 2x2 matrix and classify diagonalizable vs defective.",
      },
    ],
  }),
  component: JordanFormPage,
});

function JordanFormPage() {
  const [a, setA] = useState<Matrix>(() =>
    fromNumbers([
      [5, 1],
      [0, 5],
    ]),
  );

  const result = useMemo(() => {
    try {
      return { data: jordan2x2(a), error: null as string | null };
    } catch (e) {
      return {
        data: null as { j: Matrix; classification: string; eigenvalues: [number, number] } | null,
        error: e instanceof Error ? e.message : "Error",
      };
    }
  }, [a]);

  return (
    <PageLayout
      title="Jordan Form (2x2 Real Matrices)"
      tagline="Classifies a real 2x2 matrix as diagonalizable, Jordan block, or complex-eigenvalue case and returns the corresponding real Jordan form."
      showHowItWorks={false}
    >
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <MatrixInput title="Matrix A (2x2 numeric)" value={a} onChange={setA} />
        <section className="rounded-lg border border-border bg-card/40 p-6">
          <h2 className="text-xl font-semibold mb-3">Result: Jordan form J</h2>
          {result.error ? (
            <p className="text-destructive font-mono text-sm">{result.error}</p>
          ) : (
            result.data && (
              <div className="space-y-3 overflow-x-auto">
                <p className="text-sm text-muted-foreground">
                  Classification: {result.data.classification}
                </p>
                <p className="font-mono text-sm text-muted-foreground">
                  Eigenvalues: {formatNumber(result.data.eigenvalues[0])},{" "}
                  {formatNumber(result.data.eigenvalues[1])}
                </p>
                <MatrixDisplay m={result.data.j} label="J" />
              </div>
            )
          )}
        </section>
      </div>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold">How Jordan form works here</h2>
        <p className="text-sm text-muted-foreground">
          Jordan form places eigenvalues on the diagonal and uses 1s on superdiagonal positions when
          independent eigenvectors are missing. For a 2x2 matrix with repeated eigenvalue lambda,
          either J = diag(lambda, lambda) (diagonalizable) or J = [[lambda, 1], [0, lambda]]
          (defective).
        </p>
        <p className="text-sm text-muted-foreground">
          This route is intentionally scoped to real 2x2 numeric input. For complex-conjugate
          eigenvalues, a real canonical block [[a, b], [-b, a]] is returned instead of complex
          Jordan entries.
        </p>
      </section>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}

function jordan2x2(a: Matrix): {
  j: Matrix;
  classification: string;
  eigenvalues: [number, number];
} {
  const { rows, cols } = dims(a);
  if (rows !== 2 || cols !== 2)
    throw new Error("Jordan form on this page currently supports only 2x2 matrices");
  if (!isFullyNumeric(a)) throw new Error("Jordan form requires a fully numeric matrix");
  const m = a.map((row) => row.map((value) => asNumber(value) as number));
  const tr = m[0][0] + m[1][1];
  const det = m[0][0] * m[1][1] - m[0][1] * m[1][0];
  const disc = tr * tr - 4 * det;
  const tol = 1e-10;

  if (disc < -tol) {
    const real = tr / 2;
    const imag = Math.sqrt(-disc) / 2;
    const j = [
      [real, imag],
      [-imag, real],
    ];
    return {
      j: toExpr(j),
      classification: "Real canonical block for complex-conjugate eigenvalues",
      eigenvalues: [real, real],
    };
  }

  const root = Math.sqrt(Math.max(0, disc));
  const l1 = (tr + root) / 2;
  const l2 = (tr - root) / 2;
  if (Math.abs(l1 - l2) > tol) {
    return {
      j: toExpr([
        [l1, 0],
        [0, l2],
      ]),
      classification: "Distinct real eigenvalues (diagonal Jordan form)",
      eigenvalues: [l1, l2],
    };
  }

  const lambda = l1;
  const b = m[0][1];
  const c = m[1][0];
  const a11 = m[0][0] - lambda;
  const d = m[1][1] - lambda;
  const allZero =
    Math.abs(a11) < tol && Math.abs(b) < tol && Math.abs(c) < tol && Math.abs(d) < tol;
  if (allZero) {
    return {
      j: toExpr([
        [lambda, 0],
        [0, lambda],
      ]),
      classification: "Repeated eigenvalue with two eigenvectors (already diagonal)",
      eigenvalues: [lambda, lambda],
    };
  }

  return {
    j: toExpr([
      [lambda, 1],
      [0, lambda],
    ]),
    classification: "Repeated eigenvalue with one eigenvector (defective Jordan block)",
    eigenvalues: [lambda, lambda],
  };
}

function toExpr(values: number[][]): Matrix {
  return values.map((row) =>
    row.map((value) => parseExpr(formatNumber(Math.abs(value) < 1e-10 ? 0 : value))),
  );
}
