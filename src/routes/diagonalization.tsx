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
  inverse,
  isFullyNumeric,
  multiply,
  parseExpr,
  type Matrix,
} from "@/lib/matrix";

export const Route = createFileRoute("/diagonalization")({
  head: () => ({
    meta: [
      { title: "Matrix Diagonalization Calculator (2x2) — A = P D P^-1" },
      {
        name: "description",
        content:
          "Diagonalize real 2x2 matrices with distinct real eigenvalues and verify A = P D P^-1 numerically.",
      },
      { property: "og:title", content: "Matrix Diagonalization Calculator (2x2)" },
      {
        property: "og:description",
        content: "Compute eigenvector matrix P and diagonal eigenvalue matrix D for 2x2 input.",
      },
    ],
  }),
  component: DiagonalizationPage,
});

function DiagonalizationPage() {
  const [a, setA] = useState<Matrix>(() =>
    fromNumbers([
      [4, 1],
      [2, 3],
    ]),
  );

  const result = useMemo(() => {
    try {
      return { data: diagonalize2x2(a), error: null as string | null };
    } catch (e) {
      return {
        data: null as { p: Matrix; d: Matrix; pInv: Matrix; reconstructionError: number } | null,
        error: e instanceof Error ? e.message : "Error",
      };
    }
  }, [a]);

  return (
    <PageLayout
      title="Matrix Diagonalization (2x2)"
      tagline="Find P, D, and P^-1 so that A = P D P^-1 for diagonalizable real 2x2 matrices."
      showHowItWorks={false}
    >
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <MatrixInput title="Matrix A (2x2 numeric)" value={a} onChange={setA} />
        <section className="rounded-lg border border-border bg-card/40 p-6">
          <h2 className="text-xl font-semibold mb-3">Result: A = P D P^-1</h2>
          {result.error ? (
            <p className="text-destructive font-mono text-sm">{result.error}</p>
          ) : (
            result.data && (
              <div className="space-y-4 overflow-x-auto">
                <p className="text-sm text-muted-foreground">
                  Reconstruction residual ||A - P D P^-1||_F:{" "}
                  {formatNumber(result.data.reconstructionError)}
                </p>
                <MatrixDisplay m={result.data.p} label="P" />
                <MatrixDisplay m={result.data.d} label="D" />
                <MatrixDisplay m={result.data.pInv} label="P^-1" />
              </div>
            )
          )}
        </section>
      </div>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold">How diagonalization works</h2>
        <p className="text-sm text-muted-foreground">
          A matrix is diagonalizable if it has enough linearly independent eigenvectors to form an
          invertible matrix P. Then D = P^(-1) A P is diagonal and contains eigenvalues.
        </p>
        <p className="text-sm text-muted-foreground">
          This calculator targets real 2x2 input with distinct real eigenvalues, which guarantees
          two independent eigenvectors. When that condition fails, the page shows a clear domain
          limitation error. A numeric quality check is
          <span className="font-mono"> ||A - P D P^(-1)||_F</span> near zero.
        </p>
        <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
          <li>In this 2x2 scope: distinct real eigenvalues imply diagonalizable over the reals.</li>
          <li>
            A repeated eigenvalue can still be diagonalizable, but that needs eigenspace-dimension
            checks not included in this panel.
          </li>
          <li>Quick verification: det(P) != 0 and ||A - P D P^(-1)||_F is close to 0.</li>
          <li>Once diagonalized, powers are efficient via A^k = P D^k P^(-1).</li>
        </ul>
      </section>

      <p className="text-sm text-muted-foreground">
        When diagonalization succeeds, powers and exponentials of A become much easier to compute by
        applying the operation entrywise to diagonal matrix D:
        <span className="font-mono"> A^k = P D^k P^(-1)</span> and
        <span className="font-mono"> e^A = P e^D P^(-1)</span>.
      </p>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}

function diagonalize2x2(a: Matrix): {
  p: Matrix;
  d: Matrix;
  pInv: Matrix;
  reconstructionError: number;
} {
  const { rows, cols } = dims(a);
  if (rows !== 2 || cols !== 2)
    throw new Error("Diagonalization on this page currently supports only 2x2 matrices");
  if (!isFullyNumeric(a)) throw new Error("Diagonalization requires a fully numeric matrix");
  const m = a.map((row) => row.map((value) => asNumber(value) as number));
  const tr = m[0][0] + m[1][1];
  const det = m[0][0] * m[1][1] - m[0][1] * m[1][0];
  const disc = tr * tr - 4 * det;
  if (disc < 0) throw new Error("Diagonalization here requires real eigenvalues");
  const root = Math.sqrt(disc);
  const l1 = (tr + root) / 2;
  const l2 = (tr - root) / 2;
  if (Math.abs(l1 - l2) < 1e-10) {
    throw new Error("Repeated eigenvalue case is not handled in this diagonalization panel");
  }

  const v1 = eigenvector2x2(m, l1);
  const v2 = eigenvector2x2(m, l2);
  const pNum = [
    [v1[0], v2[0]],
    [v1[1], v2[1]],
  ];
  const p = toExpr(pNum);
  const d = toExpr([
    [l1, 0],
    [0, l2],
  ]);
  const pInv = inverse(p);
  const reconstructed = multiply(multiply(p, d), pInv);
  const reconstructionError = frobeniusDiff(a, reconstructed);
  return { p, d, pInv, reconstructionError };
}

function eigenvector2x2(m: number[][], lambda: number): [number, number] {
  const a = m[0][0] - lambda;
  const b = m[0][1];
  const c = m[1][0];
  const d = m[1][1] - lambda;
  const vec: [number, number] =
    Math.abs(a) + Math.abs(b) > Math.abs(c) + Math.abs(d) ? [-b, a] : [-d, c];
  const n = Math.hypot(vec[0], vec[1]);
  if (n < 1e-10) throw new Error("Failed to build eigenvector numerically");
  return [vec[0] / n, vec[1] / n];
}

function toExpr(values: number[][]): Matrix {
  return values.map((row) =>
    row.map((value) => parseExpr(formatNumber(Math.abs(value) < 1e-10 ? 0 : value))),
  );
}

function frobeniusDiff(a: Matrix, b: Matrix): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < a[0].length; j++) {
      const av = asNumber(a[i][j]) as number;
      const bv = asNumber(b[i][j]) as number;
      const d = av - bv;
      sum += d * d;
    }
  }
  return Math.sqrt(sum);
}
