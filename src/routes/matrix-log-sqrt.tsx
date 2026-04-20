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

export const Route = createFileRoute("/matrix-log-sqrt")({
  head: () => ({
    meta: [
      { title: "Matrix Log and Matrix Square Root Calculator (SPD 2x2)" },
      {
        name: "description",
        content:
          "Compute principal matrix square root and principal matrix logarithm for symmetric positive-definite 2x2 matrices.",
      },
      { property: "og:title", content: "Matrix Log and Matrix Square Root Calculator" },
      {
        property: "og:description",
        content: "Principal log(A) and sqrt(A) via spectral decomposition.",
      },
    ],
  }),
  component: MatrixLogSqrtPage,
});

function MatrixLogSqrtPage() {
  const [a, setA] = useState<Matrix>(() =>
    fromNumbers([
      [4, 1.2],
      [1.2, 3.5],
    ]),
  );

  const result = useMemo(() => {
    try {
      return { data: logAndSqrt2x2Spd(a), error: null as string | null };
    } catch (e) {
      return {
        data: null as { sqrtA: Matrix; logA: Matrix; eigenvalues: [number, number] } | null,
        error: e instanceof Error ? e.message : "Error",
      };
    }
  }, [a]);

  return (
    <PageLayout
      title="Matrix Log & Square Root (SPD 2x2)"
      tagline="Principal matrix functions for symmetric positive-definite 2x2 input using eigen decomposition."
      showHowItWorks={false}
    >
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <MatrixInput
          title="Matrix A (2x2 symmetric positive-definite, numeric)"
          value={a}
          onChange={setA}
        />
        <section className="rounded-lg border border-border bg-card/40 p-6">
          <h2 className="text-xl font-semibold mb-3">Results: sqrt(A) and log(A)</h2>
          {result.error ? (
            <p className="text-destructive font-mono text-sm">{result.error}</p>
          ) : (
            result.data && (
              <div className="space-y-4 overflow-x-auto">
                <p className="text-sm text-muted-foreground font-mono">
                  Eigenvalues: {formatNumber(result.data.eigenvalues[0])},{" "}
                  {formatNumber(result.data.eigenvalues[1])}
                </p>
                <MatrixDisplay m={result.data.sqrtA} label="sqrt(A)" />
                <MatrixDisplay m={result.data.logA} label="log(A)" />
              </div>
            )
          )}
        </section>
      </div>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold">How matrix log and matrix square root work</h2>
        <p className="text-sm text-muted-foreground">
          For symmetric positive-definite A, spectral decomposition gives A = Q diag(lambda1,
          lambda2) Q^T with positive eigenvalues. Principal matrix functions are then applied
          entrywise on this diagonal spectrum with orthogonal Q.
        </p>
        <p className="text-sm text-muted-foreground">
          Specifically, sqrt(A) = Q diag(sqrt(lambda1), sqrt(lambda2)) Q^T and log(A) = Q
          diag(log(lambda1), log(lambda2)) Q^T. Positivity is required so principal logarithm stays
          real, and sqrt(A) is the unique SPD square root.
        </p>
        <p className="text-sm text-muted-foreground">
          Interpretation note: these are principal branches, so exp(log(A)) = A and sqrt(A)^2 = A up
          to rounding; non-principal branches are not represented here.
        </p>
      </section>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}

function logAndSqrt2x2Spd(a: Matrix): {
  sqrtA: Matrix;
  logA: Matrix;
  eigenvalues: [number, number];
} {
  const { rows, cols } = dims(a);
  if (rows !== 2 || cols !== 2) throw new Error("This page currently supports only 2x2 matrices");
  if (!isFullyNumeric(a)) throw new Error("Matrix log/sqrt requires a fully numeric matrix");
  const m = a.map((row) => row.map((value) => asNumber(value) as number));
  if (Math.abs(m[0][1] - m[1][0]) > 1e-10)
    throw new Error("Matrix log/sqrt panel requires a symmetric matrix");
  const tr = m[0][0] + m[1][1];
  const det = m[0][0] * m[1][1] - m[0][1] * m[1][0];
  const disc = tr * tr - 4 * det;
  if (disc < 0) throw new Error("Expected real eigenvalues for symmetric input");
  const root = Math.sqrt(disc);
  const l1 = (tr + root) / 2;
  const l2 = (tr - root) / 2;
  if (l1 <= 0 || l2 <= 0)
    throw new Error("Principal log/sqrt requires positive eigenvalues (SPD matrix)");

  const q1 = normalize2(eigenvectorSymmetric2x2(m, l1));
  const q2: [number, number] = [-q1[1], q1[0]];
  const q = [
    [q1[0], q2[0]],
    [q1[1], q2[1]],
  ];
  const qt = [
    [q[0][0], q[1][0]],
    [q[0][1], q[1][1]],
  ];
  const sqrtDiag = [
    [Math.sqrt(l1), 0],
    [0, Math.sqrt(l2)],
  ];
  const logDiag = [
    [Math.log(l1), 0],
    [0, Math.log(l2)],
  ];
  const sqrtA = multiplyNum(multiplyNum(q, sqrtDiag), qt);
  const logA = multiplyNum(multiplyNum(q, logDiag), qt);
  return { sqrtA: toExpr(sqrtA), logA: toExpr(logA), eigenvalues: [l1, l2] };
}

function eigenvectorSymmetric2x2(m: number[][], lambda: number): [number, number] {
  const a = m[0][0] - lambda;
  const b = m[0][1];
  if (Math.abs(a) + Math.abs(b) < 1e-12) return [1, 0];
  return [-b, a];
}

function normalize2(v: [number, number]): [number, number] {
  const n = Math.hypot(v[0], v[1]);
  if (n < 1e-12) throw new Error("Failed to build stable eigenvector basis");
  return [v[0] / n, v[1] / n];
}

function multiplyNum(a: number[][], b: number[][]): number[][] {
  return a.map((row) =>
    b[0].map((_, j) => row.reduce((sum, value, k) => sum + value * b[k][j], 0)),
  );
}

function toExpr(values: number[][]): Matrix {
  return values.map((row) =>
    row.map((value) => parseExpr(formatNumber(Math.abs(value) < 1e-10 ? 0 : value))),
  );
}
