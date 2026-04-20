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

export const Route = createFileRoute("/mahalanobis-distance")({
  head: () => ({
    meta: [
      { title: "Mahalanobis Distance Matrix Calculator" },
      {
        name: "description",
        content:
          "Compute Mahalanobis distance of a query point from a multivariate dataset using sample covariance and its inverse.",
      },
      { property: "og:title", content: "Mahalanobis Distance Calculator" },
      {
        property: "og:description",
        content: "Measure distance from a distribution while accounting for covariance.",
      },
    ],
  }),
  component: MahalanobisDistancePage,
});

function MahalanobisDistancePage() {
  const [data, setData] = useState<Matrix>(() =>
    fromNumbers([
      [2.1, 3.2],
      [3.3, 5.1],
      [4.0, 4.2],
      [5.2, 6.4],
      [6.1, 7.3],
    ]),
  );
  const [query, setQuery] = useState<Matrix>(() => fromNumbers([[4.4, 5.2]]));

  const result = useMemo(() => {
    try {
      const x = toNumericRectangular(data, "Data matrix");
      const q = toNumericRectangular(query, "Query matrix");
      const rows = x.length;
      const cols = x[0].length;
      if (rows < 3) throw new Error("Need at least 3 rows to estimate covariance stably");
      if (q.length !== 1 || q[0].length !== cols) {
        throw new Error(`Query must be a single row with exactly ${cols} columns`);
      }

      const mean = Array.from(
        { length: cols },
        (_, j) => x.reduce((s, row) => s + row[j], 0) / rows,
      );
      const centered = x.map((row) => row.map((v, j) => v - mean[j]));
      const cov = Array.from({ length: cols }, (_, i) =>
        Array.from({ length: cols }, (_, j) => {
          let s = 0;
          for (let r = 0; r < rows; r++) s += centered[r][i] * centered[r][j];
          return s / (rows - 1);
        }),
      );
      const invCov = inverseNumeric(cov);
      const d = q[0].map((v, j) => v - mean[j]);
      const temp = multiplyMatrixVector(invCov, d);
      const sq = dot(d, temp);
      if (sq < -1e-10) throw new Error("Numerical issue: negative squared distance encountered");
      const distance = Math.sqrt(Math.max(0, sq));

      return {
        mean: fromNumbers([mean]),
        covariance: toExprMatrix(cov),
        invCovariance: toExprMatrix(invCov),
        distance,
        error: null as string | null,
      };
    } catch (e) {
      return {
        mean: null as Matrix | null,
        covariance: null as Matrix | null,
        invCovariance: null as Matrix | null,
        distance: 0,
        error: e instanceof Error ? e.message : "Error",
      };
    }
  }, [data, query]);

  return (
    <PageLayout
      title="Mahalanobis Distance"
      tagline="Measure how far a point is from a data cloud while respecting feature scale and correlation."
      showHowItWorks={false}
    >
      <div className="grid lg:grid-cols-2 gap-6">
        <MatrixInput title="Dataset X (rows = observations)" value={data} onChange={setData} />
        <MatrixInput title="Query point x (single row)" value={query} onChange={setQuery} />
      </div>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-4">
        <h2 className="text-xl font-semibold">Mahalanobis outputs</h2>
        {result.error ? (
          <p className="text-sm font-mono text-destructive">{result.error}</p>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              {result.mean && <MatrixDisplay m={result.mean} label="Mean vector mu" />}
              {result.covariance && (
                <MatrixDisplay m={result.covariance} label="Sample covariance S" />
              )}
            </div>
            <div className="space-y-4">
              {result.invCovariance && (
                <MatrixDisplay m={result.invCovariance} label="Inverse covariance S^(-1)" />
              )}
              <div className="rounded-md border border-border bg-background/50 p-3 text-sm text-muted-foreground">
                Mahalanobis distance d(x, mu):{" "}
                <span className="font-mono text-primary">{formatNumber(result.distance)}</span>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="prose-invert max-w-none space-y-3 text-muted-foreground">
        <h2 className="text-foreground text-xl font-semibold">How Mahalanobis distance works</h2>
        <p>
          Euclidean distance treats each feature independently and equally scaled. Mahalanobis
          distance adjusts for both scale and correlation using covariance.
        </p>
        <p>
          The formula is <span className="font-mono">d = sqrt((x-mu)^T S^(-1) (x-mu))</span>, where
          mu is the sample mean and S is sample covariance.
        </p>
        <p>
          The squared form <span className="font-mono">d^2 = (x-mu)^T S^(-1) (x-mu)</span> is a
          quadratic form that measures distance in covariance-whitened coordinates.
        </p>
        <p>
          A larger distance indicates the query point is less typical under the data distribution,
          which makes this metric useful for outlier detection.
        </p>
        <p>
          Ellipses/ellipsoids of constant <span className="font-mono">d^2</span> align with
          covariance eigenvectors, so correlated features are judged jointly instead of
          axis-by-axis.
        </p>
        <p>
          In many applications, compare squared distance against chi-square quantiles (with
          feature-count degrees of freedom) for a more explicit anomaly threshold.
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

function inverseNumeric(a: number[][]): number[][] {
  const n = a.length;
  if (!a.every((row) => row.length === n)) throw new Error("Covariance matrix must be square");
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
    if (Math.abs(aug[pivot][col]) < tol) {
      throw new Error(
        "Covariance matrix is singular; Mahalanobis distance is undefined for this dataset",
      );
    }
    if (pivot !== col) [aug[col], aug[pivot]] = [aug[pivot], aug[col]];

    const pv = aug[col][col];
    for (let j = 0; j < 2 * n; j++) aug[col][j] /= pv;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = aug[r][col];
      if (Math.abs(factor) < tol) continue;
      for (let j = 0; j < 2 * n; j++) aug[r][j] -= factor * aug[col][j];
    }
  }

  return aug.map((row) => row.slice(n));
}

function multiplyMatrixVector(m: number[][], v: number[]): number[] {
  return m.map((row) => row.reduce((s, x, i) => s + x * v[i], 0));
}

function dot(a: number[], b: number[]): number {
  return a.reduce((s, x, i) => s + x * b[i], 0);
}
