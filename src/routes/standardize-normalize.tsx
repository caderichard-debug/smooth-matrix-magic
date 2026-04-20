import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { AdSlot } from "@/components/AdSlot";
import { asNumber, formatNumber, isConstant, parseExpr, type Matrix } from "@/lib/matrix";

export const Route = createFileRoute("/standardize-normalize")({
  head: () => ({
    meta: [
      { title: "Standardize & Normalize Matrix Data Calculator" },
      {
        name: "description",
        content:
          "Apply per-column z-score standardization and min-max normalization to matrix-shaped datasets.",
      },
      { property: "og:title", content: "Standardize & Normalize Matrix Data" },
      {
        property: "og:description",
        content: "Transform matrix features with z-scores and min-max scaling.",
      },
    ],
  }),
  component: StandardizeNormalizePage,
});

function StandardizeNormalizePage() {
  const [x, setX] = useState<Matrix>(() => [
    [parseExpr("10.5"), parseExpr("1.2")],
    [parseExpr("12.4"), parseExpr("3.1")],
    [parseExpr("18.2"), parseExpr("2.4")],
    [parseExpr("20.1"), parseExpr("4.3")],
  ]);

  const transformed = useMemo(() => {
    try {
      const m = toNumericRectangular(x, "Data matrix X");
      const rows = m.length;
      const cols = m[0].length;
      if (rows < 2)
        throw new Error("Need at least 2 rows to compute standard deviation for z-scores");

      const means = Array.from(
        { length: cols },
        (_, j) => m.reduce((s, row) => s + row[j], 0) / rows,
      );
      const vars = Array.from({ length: cols }, (_, j) => {
        let s = 0;
        for (let i = 0; i < rows; i++) s += (m[i][j] - means[j]) ** 2;
        return s / (rows - 1);
      });
      const stds = vars.map((v) => Math.sqrt(Math.max(v, 0)));
      const mins = Array.from({ length: cols }, (_, j) => Math.min(...m.map((row) => row[j])));
      const maxs = Array.from({ length: cols }, (_, j) => Math.max(...m.map((row) => row[j])));

      const zscore = m.map((row) =>
        row.map((v, j) => {
          if (stds[j] < 1e-12) return 0;
          return (v - means[j]) / stds[j];
        }),
      );
      const minmax = m.map((row) =>
        row.map((v, j) => {
          const denom = maxs[j] - mins[j];
          if (Math.abs(denom) < 1e-12) return 0;
          return (v - mins[j]) / denom;
        }),
      );

      return {
        zscore: toExprMatrix(zscore),
        minmax: toExprMatrix(minmax),
        columnSummary: means.map(
          (mean, j) =>
            `col ${j + 1}: mean=${formatNumber(mean)}, std=${formatNumber(stds[j])}, min=${formatNumber(mins[j])}, max=${formatNumber(maxs[j])}`,
        ),
        error: null as string | null,
      };
    } catch (e) {
      return {
        zscore: null as Matrix | null,
        minmax: null as Matrix | null,
        columnSummary: [] as string[],
        error: e instanceof Error ? e.message : "Error",
      };
    }
  }, [x]);

  return (
    <PageLayout
      title="Standardize & Normalize"
      tagline="Rescale feature columns with z-scores and min-max normalization for better comparability."
      showHowItWorks={false}
    >
      <MatrixInput
        title="Data matrix X (rows = samples, cols = features)"
        value={x}
        onChange={setX}
      />

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-4">
        <h2 className="text-xl font-semibold">Transformed matrices</h2>
        {transformed.error ? (
          <p className="text-sm font-mono text-destructive">{transformed.error}</p>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              {transformed.zscore && (
                <MatrixDisplay m={transformed.zscore} label="Z-score standardized columns" />
              )}
            </div>
            <div className="space-y-3">
              {transformed.minmax && (
                <MatrixDisplay m={transformed.minmax} label="Min-max normalized columns [0,1]" />
              )}
            </div>
            <div className="lg:col-span-2 rounded-md border border-border bg-background/50 p-3 text-sm text-muted-foreground">
              {transformed.columnSummary.map((line) => (
                <div key={line} className="font-mono">
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="prose-invert max-w-none space-y-3 text-muted-foreground">
        <h2 className="text-foreground text-xl font-semibold">
          How standardization and normalization works
        </h2>
        <p>
          Z-score standardization transforms each feature with
          <span className="font-mono"> z = (x - mean) / std </span>, giving columns centered near 0
          with spread near 1.
        </p>
        <p>
          Min-max normalization maps each feature into [0,1] using
          <span className="font-mono"> (x - min) / (max - min)</span>. It preserves order and is
          easy to interpret.
        </p>
        <p>
          Standardization is shift-and-scale invariant within a feature, while min-max scaling is
          bounded but sensitive to extreme values that stretch{" "}
          <span className="font-mono">max-min</span>.
        </p>
        <p>
          Both operations are done per column because each column usually represents a different
          feature scale.
        </p>
        <p>
          If a column has near-zero spread (<span className="font-mono">std approx 0</span> or{" "}
          <span className="font-mono">max=min</span>), this tool returns 0 for that transformed
          column to avoid unstable division.
        </p>
        <p>
          Fit scaling parameters on training data only, then reuse those same parameters on
          validation/test data to avoid leakage and inflated model quality estimates.
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
