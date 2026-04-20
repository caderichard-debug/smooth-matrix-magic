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

export const Route = createFileRoute("/pca-covariance")({
  head: () => ({
    meta: [
      { title: "PCA from Covariance Matrix Calculator" },
      {
        name: "description",
        content:
          "Center data, form covariance matrix, and compute the first principal component direction with explained variance ratio.",
      },
      { property: "og:title", content: "PCA Covariance Calculator" },
      {
        property: "og:description",
        content: "Compute first principal direction from covariance in-browser.",
      },
    ],
  }),
  component: PcaCovariancePage,
});

function PcaCovariancePage() {
  const [x, setX] = useState<Matrix>(() =>
    fromNumbers([
      [2.55, 2.35],
      [0.55, 0.75],
      [2.25, 2.95],
      [1.95, 2.25],
      [3.15, 3.05],
      [2.35, 2.75],
      [2.05, 1.65],
      [1.05, 1.15],
      [1.55, 1.65],
      [1.15, 0.95],
    ]),
  );

  const pca = useMemo(() => {
    try {
      const m = toNumericRectangular(x, "Data matrix X");
      const rows = m.length;
      const cols = m[0].length;
      if (rows < 2) throw new Error("PCA needs at least 2 rows (observations)");
      if (cols < 2) throw new Error("PCA needs at least 2 columns (features)");

      const means = Array.from(
        { length: cols },
        (_, j) => m.reduce((s, row) => s + row[j], 0) / rows,
      );
      const centered = m.map((row) => row.map((v, j) => v - means[j]));
      const cov = Array.from({ length: cols }, (_, i) =>
        Array.from({ length: cols }, (_, j) => {
          let s = 0;
          for (let r = 0; r < rows; r++) s += centered[r][i] * centered[r][j];
          return s / (rows - 1);
        }),
      );

      const { value: lambda1, vector: pc1 } = dominantEigenPair(cov);
      const totalVariance = trace(cov);
      const explained = totalVariance <= 0 ? 0 : lambda1 / totalVariance;

      return {
        covariance: toExprMatrix(cov),
        means: fromNumbers([means]),
        pc1: toExprMatrix(pc1.map((v) => [v])),
        eigenvalue1: lambda1,
        explainedRatio: explained,
        error: null as string | null,
      };
    } catch (e) {
      return {
        covariance: null as Matrix | null,
        means: null as Matrix | null,
        pc1: null as Matrix | null,
        eigenvalue1: 0,
        explainedRatio: 0,
        error: e instanceof Error ? e.message : "Error",
      };
    }
  }, [x]);

  return (
    <PageLayout
      title="PCA from Covariance"
      tagline="Compute covariance and the first principal direction to capture the largest variance trend."
      showHowItWorks={false}
    >
      <MatrixInput
        title="Data matrix X (rows = observations, cols = features)"
        value={x}
        onChange={setX}
      />

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-4">
        <h2 className="text-xl font-semibold">PCA outputs</h2>
        {pca.error ? (
          <p className="text-sm font-mono text-destructive">{pca.error}</p>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              {pca.means && <MatrixDisplay m={pca.means} label="Column means (for centering)" />}
              {pca.covariance && (
                <MatrixDisplay m={pca.covariance} label="Sample covariance matrix" />
              )}
            </div>
            <div className="space-y-4">
              {pca.pc1 && (
                <MatrixDisplay m={pca.pc1} label="First principal component (unit vector)" />
              )}
              <div className="rounded-md border border-border bg-background/50 p-3 text-sm text-muted-foreground">
                Dominant eigenvalue (variance on PC1):{" "}
                <span className="font-mono text-primary">{formatNumber(pca.eigenvalue1)}</span>
                <br />
                Explained variance ratio (PC1):{" "}
                <span className="font-mono text-primary">
                  {(100 * pca.explainedRatio).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="prose-invert max-w-none space-y-3 text-muted-foreground">
        <h2 className="text-foreground text-xl font-semibold">How PCA from covariance works</h2>
        <p>
          PCA starts by centering each feature column (subtracting the column mean), then building
          the covariance matrix to capture joint variation between features.
        </p>
        <p>
          The covariance matrix is{" "}
          <span className="font-mono">S = (1/(n-1)) X_centered^T X_centered</span>; it is symmetric
          and positive semidefinite, so eigenvalues are non-negative up to numerical tolerance.
        </p>
        <p>
          Principal components are eigenvectors of the covariance matrix. The first principal
          component points in the direction of maximum variance in the data.
        </p>
        <p>
          The corresponding eigenvalue tells how much variance lies on that direction, and the
          explained variance ratio compares it to total variance.
        </p>
        <p>
          For PC1, this ratio is <span className="font-mono">lambda_1 / trace(S)</span>; a larger
          value means more total variance is captured by a single direction.
        </p>
        <p>
          A high PC1 ratio suggests one dominant trend, but review later components before dropping
          dimensions so you do not discard smaller yet decision-critical variation.
        </p>
      </section>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}

function toNumericRectangular(m: Matrix, label: string): number[][] {
  if (!m.length || !m[0]?.length) throw new Error(`${label} must not be empty`);
  if (!m.every((row) => row.length === m[0].length))
    throw new Error(`${label} must be rectangular`);
  if (!m.every((row) => row.every((entry) => isConstant(entry))))
    throw new Error(`${label} must be fully numeric`);
  return m.map((row) => row.map((entry) => asNumber(entry) as number));
}

function toExprMatrix(m: number[][]): Matrix {
  return m.map((row) => row.map((value) => parseExpr(formatNumber(value))));
}

function trace(m: number[][]): number {
  const n = Math.min(m.length, m[0]?.length ?? 0);
  let s = 0;
  for (let i = 0; i < n; i++) s += m[i][i];
  return s;
}

function dominantEigenPair(cov: number[][]): { value: number; vector: number[] } {
  const n = cov.length;
  let v = Array.from({ length: n }, (_, i) => (i === 0 ? 1 : 0));
  const maxIters = 100;
  for (let iter = 0; iter < maxIters; iter++) {
    const next = multiplyMatrixVector(cov, v);
    const norm = Math.sqrt(next.reduce((s, x) => s + x * x, 0));
    if (norm < 1e-12) throw new Error("PCA failed: covariance appears near-zero in all directions");
    v = next.map((x) => x / norm);
  }
  const cv = multiplyMatrixVector(cov, v);
  const lambda = dot(v, cv);
  return { value: lambda, vector: v };
}

function multiplyMatrixVector(m: number[][], v: number[]): number[] {
  return m.map((row) => row.reduce((s, x, i) => s + x * v[i], 0));
}

function dot(a: number[], b: number[]): number {
  return a.reduce((s, x, i) => s + x * b[i], 0);
}
