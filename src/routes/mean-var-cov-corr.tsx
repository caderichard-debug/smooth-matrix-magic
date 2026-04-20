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

export const Route = createFileRoute("/mean-var-cov-corr")({
  head: () => ({
    meta: [
      { title: "Mean, Variance, Covariance & Correlation Matrix Calculator" },
      {
        name: "description",
        content:
          "Use a data matrix to compute feature means, sample variances, covariance matrix, and correlation matrix.",
      },
      { property: "og:title", content: "Mean, Variance, Covariance & Correlation Calculator" },
      {
        property: "og:description",
        content: "Compute core descriptive statistics from matrix-shaped datasets.",
      },
    ],
  }),
  component: MeanVarCovCorrPage,
});

function MeanVarCovCorrPage() {
  const [x, setX] = useState<Matrix>(() =>
    fromNumbers([
      [170.5, 65.2, 30.1],
      [175.2, 72.6, 35.4],
      [168.4, 60.1, 28.3],
      [180.1, 80.4, 40.2],
    ]),
  );

  const stats = useMemo(() => {
    try {
      const m = toNumericRectangular(x, "Data matrix X");
      const rows = m.length;
      const cols = m[0].length;
      if (rows < 2)
        throw new Error("Need at least 2 observations (rows) to compute sample covariance");
      if (cols < 1) throw new Error("Need at least 1 feature (column)");

      const means = Array.from(
        { length: cols },
        (_, j) => m.reduce((s, row) => s + row[j], 0) / rows,
      );
      const centered = m.map((row) => row.map((v, j) => v - means[j]));
      const variances = Array.from({ length: cols }, (_, j) => {
        const ss = centered.reduce((s, row) => s + row[j] * row[j], 0);
        return ss / (rows - 1);
      });
      const stds = variances.map((v) => Math.sqrt(Math.max(v, 0)));

      const covariance = Array.from({ length: cols }, (_, i) =>
        Array.from({ length: cols }, (_, j) => {
          let s = 0;
          for (let r = 0; r < rows; r++) s += centered[r][i] * centered[r][j];
          return s / (rows - 1);
        }),
      );

      const correlation = Array.from({ length: cols }, (_, i) =>
        Array.from({ length: cols }, (_, j) => {
          const denom = stds[i] * stds[j];
          if (denom < 1e-12) return i === j ? 1 : 0;
          return covariance[i][j] / denom;
        }),
      );

      return {
        means: fromNumbers([means]),
        variances: fromNumbers([variances]),
        covariance: toExprMatrix(covariance),
        correlation: toExprMatrix(correlation),
        error: null as string | null,
      };
    } catch (e) {
      return {
        means: null as Matrix | null,
        variances: null as Matrix | null,
        covariance: null as Matrix | null,
        correlation: null as Matrix | null,
        error: e instanceof Error ? e.message : "Error",
      };
    }
  }, [x]);

  return (
    <PageLayout
      title="Mean, Variance, Covariance & Correlation"
      tagline="Treat rows as observations and columns as features to compute core descriptive statistics."
      showHowItWorks={false}
    >
      <MatrixInput
        title="Data matrix X (rows = observations, cols = features)"
        value={x}
        onChange={setX}
      />

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-4">
        <h2 className="text-xl font-semibold">Statistical summaries</h2>
        {stats.error ? (
          <p className="text-sm font-mono text-destructive">{stats.error}</p>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              {stats.means && <MatrixDisplay m={stats.means} label="Column means" />}
              {stats.variances && (
                <MatrixDisplay m={stats.variances} label="Column sample variances" />
              )}
            </div>
            <div className="space-y-4">
              {stats.covariance && (
                <MatrixDisplay m={stats.covariance} label="Sample covariance matrix" />
              )}
              {stats.correlation && (
                <MatrixDisplay m={stats.correlation} label="Correlation matrix" />
              )}
            </div>
          </div>
        )}
      </section>

      <section className="prose-invert max-w-none space-y-3 text-muted-foreground">
        <h2 className="text-foreground text-xl font-semibold">
          How mean, variance, covariance, and correlation works
        </h2>
        <p>
          For each feature column, the mean is the average value. Variance measures spread around
          that mean, using the sample denominator <span className="font-mono">n-1</span>.
        </p>
        <p>
          With observations <span className="font-mono">x_1,...,x_n</span>, sample covariance is{" "}
          <span className="font-mono">S = (1/(n-1)) sum_k (x_k-mu)(x_k-mu)^T</span>, so diagonal
          entries are variances and off-diagonal entries capture pairwise co-movement.
        </p>
        <p>
          Covariance compares two features together: positive values mean they tend to increase
          together, negative values mean one tends to decrease when the other increases.
        </p>
        <p>
          Correlation rescales covariance into the range [-1, 1], making relationships comparable
          across features with different units.
        </p>
        <p>
          Correlation uses <span className="font-mono">r_ij = cov(i,j)/(sigma_i sigma_j)</span>;
          values near <span className="font-mono">+/-1</span> indicate strong linear association,
          while values near 0 indicate weak linear relation.
        </p>
        <p>
          Strong correlation does not imply causation; use it as a screening signal, then validate
          with domain context, residual analysis, or controlled experiments.
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
