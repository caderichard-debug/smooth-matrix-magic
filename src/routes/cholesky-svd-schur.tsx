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
  identity,
  isFullyNumeric,
  multiply,
  parseExpr,
  transpose,
  type Matrix,
} from "@/lib/matrix";

export const Route = createFileRoute("/cholesky-svd-schur")({
  head: () => ({
    meta: [
      { title: "Cholesky, SVD, and Schur Matrix Calculator — Free Online" },
      {
        name: "description",
        content:
          "Compute Cholesky factorization, compact 2x2 SVD, and QR-based Schur form approximation for numeric matrices.",
      },
      { property: "og:title", content: "Cholesky, SVD, and Schur Matrix Calculator" },
      {
        property: "og:description",
        content: "Three decomposition tools on one page for fast numeric matrix analysis.",
      },
    ],
  }),
  component: CholeskySvdSchurPage,
});

function CholeskySvdSchurPage() {
  const [a, setA] = useState<Matrix>(() =>
    fromNumbers([
      [4, 2],
      [2, 3],
    ]),
  );

  const cholesky = useMemo(() => {
    try {
      return { data: choleskyLower(a), error: null as string | null };
    } catch (e) {
      return { data: null as Matrix | null, error: e instanceof Error ? e.message : "Error" };
    }
  }, [a]);

  const svd = useMemo(() => {
    try {
      return { data: svd2x2(a), error: null as string | null };
    } catch (e) {
      return {
        data: null as { u: Matrix; s: Matrix; vT: Matrix; singularValues: number[] } | null,
        error: e instanceof Error ? e.message : "Error",
      };
    }
  }, [a]);

  const schur = useMemo(() => {
    try {
      return { data: schurByQrIteration(a, 60), error: null as string | null };
    } catch (e) {
      return {
        data: null as { q: Matrix; t: Matrix; offDiagL1: number } | null,
        error: e instanceof Error ? e.message : "Error",
      };
    }
  }, [a]);

  return (
    <PageLayout
      title="Cholesky, SVD & Schur Tools"
      tagline="Compute three classic decomposition views: SPD Cholesky, compact 2x2 SVD, and QR-iteration Schur approximation."
      showHowItWorks={false}
    >
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <MatrixInput title="Matrix A (numeric)" value={a} onChange={setA} />
        <div className="space-y-4">
          <section className="rounded-lg border border-border bg-card/40 p-6">
            <h2 className="text-xl font-semibold mb-3">Cholesky (A = LL^T)</h2>
            {cholesky.error ? (
              <p className="text-destructive font-mono text-sm">{cholesky.error}</p>
            ) : (
              cholesky.data && (
                <div className="overflow-x-auto">
                  <MatrixDisplay m={cholesky.data} label="L" />
                </div>
              )
            )}
          </section>

          <section className="rounded-lg border border-border bg-card/40 p-6">
            <h2 className="text-xl font-semibold mb-3">Compact SVD for 2x2 (A = U S V^T)</h2>
            {svd.error ? (
              <p className="text-destructive font-mono text-sm">{svd.error}</p>
            ) : (
              svd.data && (
                <div className="space-y-3 overflow-x-auto">
                  <p className="text-sm text-muted-foreground">
                    Singular values:{" "}
                    {svd.data.singularValues.map((v) => formatNumber(v)).join(", ")}
                  </p>
                  <MatrixDisplay m={svd.data.u} label="U" />
                  <MatrixDisplay m={svd.data.s} label="S" />
                  <MatrixDisplay m={svd.data.vT} label="V^T" />
                </div>
              )
            )}
          </section>

          <section className="rounded-lg border border-border bg-card/40 p-6">
            <h2 className="text-xl font-semibold mb-3">QR Schur Approximation (A ≈ Q T Q^T)</h2>
            {schur.error ? (
              <p className="text-destructive font-mono text-sm">{schur.error}</p>
            ) : (
              schur.data && (
                <div className="space-y-3 overflow-x-auto">
                  <p className="text-sm text-muted-foreground">
                    Off-diagonal L1 residual after iteration: {formatNumber(schur.data.offDiagL1)}
                  </p>
                  <MatrixDisplay m={schur.data.q} label="Q" />
                  <MatrixDisplay m={schur.data.t} label="T" />
                </div>
              )
            )}
          </section>
        </div>
      </div>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold">How these factorizations work</h2>
        <p className="text-sm text-muted-foreground">
          Cholesky applies only to symmetric positive-definite matrices and returns a lower
          triangular factor L such that A = LL^T. If A is not SPD, the decomposition is undefined
          and this page shows a direct error.
        </p>
        <p className="text-sm text-muted-foreground">
          SVD writes A = U S V^T with orthogonal U, V and nonnegative singular values on S. This
          route computes a mathematically exact numeric SVD for 2x2 real input by diagonalizing A^T
          A.
        </p>
        <p className="text-sm text-muted-foreground">
          The Schur panel runs unshifted QR iteration and accumulates orthogonal similarity
          transforms. After enough iterations, A_k trends toward a Schur-like upper form T with A ≈
          Q T Q^T.
        </p>
      </section>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
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

function multiplyNum(a: number[][], b: number[][]): number[][] {
  return a.map((row) =>
    b[0].map((_, j) => row.reduce((sum, value, k) => sum + value * b[k][j], 0)),
  );
}

function choleskyLower(a: Matrix): Matrix {
  const n = requireSquare(a, "Cholesky decomposition");
  const m = toNumeric(a, "Cholesky decomposition");
  const tol = 1e-10;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (Math.abs(m[i][j] - m[j][i]) > tol)
        throw new Error("Cholesky decomposition requires a symmetric matrix");
    }
  }
  const l = Array.from({ length: n }, () => Array.from({ length: n }, () => 0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = m[i][j];
      for (let k = 0; k < j; k++) sum -= l[i][k] * l[j][k];
      if (i === j) {
        if (sum <= tol)
          throw new Error("Matrix is not positive-definite, so Cholesky does not exist");
        l[i][j] = Math.sqrt(sum);
      } else {
        l[i][j] = sum / l[j][j];
      }
    }
  }
  return toExpr(l);
}

function svd2x2(a: Matrix): { u: Matrix; s: Matrix; vT: Matrix; singularValues: number[] } {
  const { rows, cols } = dims(a);
  if (rows !== 2 || cols !== 2)
    throw new Error("This SVD panel currently supports only 2x2 matrices");
  const m = toNumeric(a, "SVD");
  const at = transpose(a);
  const ata = toNumeric(multiply(at, a), "SVD");
  const tr = ata[0][0] + ata[1][1];
  const det = ata[0][0] * ata[1][1] - ata[0][1] * ata[1][0];
  const disc = Math.max(0, tr * tr - 4 * det);
  const lambda1 = (tr + Math.sqrt(disc)) / 2;
  const lambda2 = (tr - Math.sqrt(disc)) / 2;
  const s1 = Math.sqrt(Math.max(0, lambda1));
  const s2 = Math.sqrt(Math.max(0, lambda2));

  const v1 = normalize2(eigenvectorSymmetric2x2(ata, lambda1));
  const v2Raw: [number, number] = [-v1[1], v1[0]];
  const v2 = normalize2(v2Raw);
  const v = [
    [v1[0], v2[0]],
    [v1[1], v2[1]],
  ];

  const u1 = s1 > 1e-10 ? normalize2(multiplyVector2(m, v1)) : ([1, 0] as [number, number]);
  const u2 =
    s2 > 1e-10 ? normalize2(multiplyVector2(m, v2)) : ([-u1[1], u1[0]] as [number, number]);
  const u = [
    [u1[0], u2[0]],
    [u1[1], u2[1]],
  ];
  const s = [
    [s1, 0],
    [0, s2],
  ];
  const vT = [
    [v[0][0], v[1][0]],
    [v[0][1], v[1][1]],
  ];

  return { u: toExpr(u), s: toExpr(s), vT: toExpr(vT), singularValues: [s1, s2] };
}

function schurByQrIteration(
  a: Matrix,
  iterations: number,
): { q: Matrix; t: Matrix; offDiagL1: number } {
  const n = requireSquare(a, "Schur approximation");
  const m = toNumeric(a, "Schur approximation");
  let t = m.map((row) => row.slice());
  let qTotal = toNumeric(identity(n), "Schur approximation");
  for (let i = 0; i < iterations; i++) {
    const { q, r } = qrNumeric(t);
    t = multiplyNum(r, q);
    qTotal = multiplyNum(qTotal, q);
  }
  let offDiagL1 = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j) offDiagL1 += Math.abs(t[i][j]);
    }
  }
  return { q: toExpr(qTotal), t: toExpr(t), offDiagL1 };
}

function qrNumeric(a: number[][]): { q: number[][]; r: number[][] } {
  const rows = a.length;
  const cols = a[0]?.length ?? 0;
  const qCols: number[][] = [];
  const r = Array.from({ length: cols }, () => Array.from({ length: cols }, () => 0));
  const getCol = (j: number) => a.map((row) => row[j]);
  const dot = (u: number[], v: number[]) => u.reduce((sum, value, i) => sum + value * v[i], 0);
  const norm = (v: number[]) => Math.sqrt(dot(v, v));
  for (let j = 0; j < cols; j++) {
    const col = getCol(j);
    const v = col.slice();
    for (let i = 0; i < qCols.length; i++) {
      const proj = dot(qCols[i], col);
      r[i][j] = proj;
      for (let k = 0; k < rows; k++) v[k] -= proj * qCols[i][k];
    }
    const vNorm = norm(v);
    if (vNorm < 1e-12)
      throw new Error(
        "QR factorization failed during Schur iteration (linearly dependent columns)",
      );
    r[j][j] = vNorm;
    qCols.push(v.map((value) => value / vNorm));
  }
  const q = Array.from({ length: rows }, (_, i) =>
    Array.from({ length: cols }, (_, j) => qCols[j][i]),
  );
  return { q, r };
}

function eigenvectorSymmetric2x2(m: number[][], lambda: number): [number, number] {
  const a = m[0][0] - lambda;
  const b = m[0][1];
  const c = m[1][0];
  const d = m[1][1] - lambda;
  if (Math.abs(a) + Math.abs(b) > Math.abs(c) + Math.abs(d)) return normalize2([-b, a]);
  return normalize2([-d, c]);
}

function multiplyVector2(m: number[][], v: [number, number]): [number, number] {
  return [m[0][0] * v[0] + m[0][1] * v[1], m[1][0] * v[0] + m[1][1] * v[1]];
}

function normalize2(v: [number, number]): [number, number] {
  const n = Math.hypot(v[0], v[1]);
  if (n < 1e-12) throw new Error("Encountered degenerate vector in decomposition");
  return [v[0] / n, v[1] / n];
}

function requireSquare(a: Matrix, context: string): number {
  const { rows, cols } = dims(a);
  if (rows !== cols) throw new Error(`${context} requires a square matrix`);
  return rows;
}
