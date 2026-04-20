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
  transpose,
  type Matrix,
} from "@/lib/matrix";

export const Route = createFileRoute("/polar-decomposition")({
  head: () => ({
    meta: [
      { title: "Polar Decomposition Calculator — Matrix A = UP" },
      {
        name: "description",
        content:
          "Compute numerical polar decomposition A = UP for invertible square matrices using Newton iteration.",
      },
      { property: "og:title", content: "Polar Decomposition Matrix Calculator" },
      {
        property: "og:description",
        content: "Find orthogonal U and symmetric positive-semidefinite P from A = UP.",
      },
    ],
  }),
  component: PolarDecompositionPage,
});

function PolarDecompositionPage() {
  const [a, setA] = useState<Matrix>(() =>
    fromNumbers([
      [3, 1],
      [1, 2],
    ]),
  );

  const result = useMemo(() => {
    try {
      return { data: polarDecompositionNewton(a, 20), error: null as string | null };
    } catch (e) {
      return {
        data: null as { u: Matrix; p: Matrix; residual: number } | null,
        error: e instanceof Error ? e.message : "Error",
      };
    }
  }, [a]);

  return (
    <PageLayout
      title="Polar Decomposition Calculator"
      tagline="Numeric right polar decomposition for invertible square matrices: A = U P with orthogonal U and symmetric P."
      showHowItWorks={false}
    >
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <MatrixInput title="Matrix A (square, numeric, invertible)" value={a} onChange={setA} />
        <section className="rounded-lg border border-border bg-card/40 p-6">
          <h2 className="text-xl font-semibold mb-3">Result: A = U P</h2>
          {result.error ? (
            <p className="text-destructive font-mono text-sm">{result.error}</p>
          ) : (
            result.data && (
              <div className="space-y-4 overflow-x-auto">
                <p className="text-sm text-muted-foreground">
                  Reconstruction residual ||A - U P||_F: {formatNumber(result.data.residual)}
                </p>
                <MatrixDisplay m={result.data.u} label="U" />
                <MatrixDisplay m={result.data.p} label="P" />
              </div>
            )
          )}
        </section>
      </div>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold">How polar decomposition works</h2>
        <p className="text-sm text-muted-foreground">
          Any invertible real square matrix A can be factored as A = U P, where U is orthogonal (U^T
          U = I) and P is symmetric positive-definite. Geometrically, U is a pure
          rotation/reflection and P is pure stretch; also P = (A^T A)^(1/2).
        </p>
        <p className="text-sm text-muted-foreground">
          This page uses Newton iteration for the unitary factor:
          <span className="font-mono"> X_(k+1) = 0.5 * (X_k + X_k^(-T))</span>, starting from X_0 =
          A. Then P is formed as U^T A and symmetrized numerically.
        </p>
        <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
          <li>Algorithm sketch: set X0=A, iterate Newton map, set U=Xk, set P=U^T A.</li>
          <li>Convergence is best when A is invertible and not severely ill-conditioned.</li>
          <li>Useful checks: ||A-UP||_F near 0, ||U^T U-I||_F near 0, and P approximately symmetric.</li>
          <li>The complementary left form is A=P&apos;U with P&apos;=(A A^T)^(1/2).</li>
        </ul>
      </section>

      <p className="text-sm text-muted-foreground">
        A small residual means the computed factors numerically reconstruct A well; larger residuals
        often indicate ill-conditioning, weak invertibility, or too few Newton iterations.
      </p>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}

function polarDecompositionNewton(
  a: Matrix,
  iterations: number,
): { u: Matrix; p: Matrix; residual: number } {
  const n = requireSquare(a, "Polar decomposition");
  const m = toNumeric(a, "Polar decomposition");
  let x = m.map((row) => row.slice());
  for (let i = 0; i < iterations; i++) {
    const invXT = transposeNum(inverseNum(x));
    x = addNum(scaleNum(x, 0.5), scaleNum(invXT, 0.5));
  }
  const u = x;
  const p = multiplyNum(transposeNum(u), m);
  const up = multiplyNum(u, p);
  const residual = frobeniusNorm(subNum(m, up));
  return { u: toExpr(u), p: toExpr(symmetrize(p)), residual };

  function symmetrize(mat: number[][]): number[][] {
    return mat.map((row, i) => row.map((value, j) => 0.5 * (value + mat[j][i])));
  }
}

function toNumeric(a: Matrix, context: string): number[][] {
  if (!isFullyNumeric(a)) throw new Error(`${context} requires a fully numeric matrix`);
  return a.map((row) => row.map((value) => asNumber(value) as number));
}

function toExpr(values: number[][]): Matrix {
  return values.map((row) =>
    row.map((value) => parseExpr(formatNumber(Math.abs(value) < 1e-10 ? 0 : value))),
  );
}

function requireSquare(a: Matrix, context: string): number {
  const { rows, cols } = dims(a);
  if (rows !== cols) throw new Error(`${context} requires a square matrix`);
  return rows;
}

function multiplyNum(a: number[][], b: number[][]): number[][] {
  return a.map((row) =>
    b[0].map((_, j) => row.reduce((sum, value, k) => sum + value * b[k][j], 0)),
  );
}

function addNum(a: number[][], b: number[][]): number[][] {
  return a.map((row, i) => row.map((value, j) => value + b[i][j]));
}

function subNum(a: number[][], b: number[][]): number[][] {
  return a.map((row, i) => row.map((value, j) => value - b[i][j]));
}

function scaleNum(a: number[][], scalar: number): number[][] {
  return a.map((row) => row.map((value) => value * scalar));
}

function transposeNum(a: number[][]): number[][] {
  return a[0].map((_, j) => a.map((row) => row[j]));
}

function inverseNum(a: number[][]): number[][] {
  const n = a.length;
  const aug = a.map((row, i) => [
    ...row,
    ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  ]);
  const tol = 1e-10;
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(aug[r][col]) > Math.abs(aug[pivot][col])) pivot = r;
    }
    if (Math.abs(aug[pivot][col]) < tol)
      throw new Error("Polar decomposition requires an invertible matrix");
    if (pivot !== col) [aug[col], aug[pivot]] = [aug[pivot], aug[col]];
    const pv = aug[col][col];
    for (let j = 0; j < 2 * n; j++) aug[col][j] /= pv;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = aug[r][col];
      for (let j = 0; j < 2 * n; j++) aug[r][j] -= factor * aug[col][j];
    }
  }
  return aug.map((row) => row.slice(n));
}

function frobeniusNorm(a: number[][]): number {
  let sum = 0;
  for (const row of a) for (const value of row) sum += value * value;
  return Math.sqrt(sum);
}
