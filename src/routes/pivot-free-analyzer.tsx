import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { AdSlot } from "@/components/AdSlot";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { parseNumericMatrixText } from "@/lib/sparse";

export const Route = createFileRoute("/pivot-free-analyzer")({
  head: () => ({
    meta: [
      { title: "Pivot-Free Analyzer — Free Variables and Pivot Health" },
      {
        name: "description",
        content:
          "Analyze pivot columns, free columns, and potential zero-pivot risks for linear systems before solving.",
      },
      { property: "og:title", content: "Pivot-Free Analyzer" },
      {
        property: "og:description",
        content: "Detect pivot columns, free variables, and unstable columns quickly.",
      },
    ],
  }),
  component: PivotFreeAnalyzerPage,
});

function PivotFreeAnalyzerPage() {
  const [matrixText, setMatrixText] = useState("1 2 3 4\n2 4 6 8\n1 1 0 2");

  const analysis = useMemo(() => {
    try {
      const matrix = parseNumericMatrixText(matrixText);
      return { data: analyzePivots(matrix), error: null as string | null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : "Error" };
    }
  }, [matrixText]);

  return (
    <PageLayout
      title="Pivot-Free Analyzer"
      tagline="Identify free columns early to classify rank-deficiency and underdetermined systems."
      showHowItWorks={false}
    >
      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
          Numeric matrix input (rows by newline; spaces/commas/semicolons between values)
        </Label>
        <Textarea
          value={matrixText}
          onChange={(e) => setMatrixText(e.target.value)}
          className="font-mono min-h-[140px]"
          spellCheck={false}
        />
      </section>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-4">
        <h2 className="text-xl font-semibold">Pivot report</h2>
        {analysis.error ? (
          <p className="text-destructive font-mono text-sm">{analysis.error}</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <Metric label="Rank estimate" value={`${analysis.data!.rank}`} />
            <Metric
              label="Pivot columns (1-based)"
              value={analysis.data!.pivotColumns.join(", ") || "none"}
            />
            <Metric
              label="Free columns (1-based)"
              value={analysis.data!.freeColumns.join(", ") || "none"}
            />
            <Metric
              label="Zero-pivot warnings"
              value={analysis.data!.zeroPivotWarnings.join(" | ") || "none"}
            />
            <Metric label="System status note" value={analysis.data!.note} />
          </div>
        )}
      </section>

      <section className="prose-invert max-w-none space-y-3 text-muted-foreground">
        <h2 className="text-foreground text-xl font-semibold">How pivot-free analyzer works</h2>
        <p>
          The analyzer runs elimination with partial pivoting and marks a pivot in column j only if
          max(i &gt;= k)|a_ij| &gt; tol at the current pivot row k. Columns without such a pivot are
          free columns.
        </p>
        <p>
          Rank is the number of pivot columns. If pivots &lt; number of columns, nullity is n -
          rank, so Ax = b is typically parametric (or inconsistent for some b). Zero-pivot warnings
          can indicate true dependence or just scaling/tolerance sensitivity.
        </p>
        <p>
          Important distinction: this page analyzes A only, so it cannot by itself prove
          inconsistency for Ax=b (that needs augmented matrix [A|b]). It does report structural
          signals that strongly affect uniqueness and free-variable count.
        </p>
      </section>

      <p>
        If free columns appear, columns of A are linearly dependent; that same signal explains why
        unique solutions can fail for some right-hand sides.
      </p>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background/50 p-3">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="font-mono text-primary">{value}</div>
    </div>
  );
}

function analyzePivots(matrixInput: number[][]): {
  rank: number;
  pivotColumns: number[];
  freeColumns: number[];
  zeroPivotWarnings: string[];
  note: string;
} {
  const matrix = matrixInput.map((row) => row.slice());
  const rows = matrix.length;
  const cols = matrix[0].length;
  const tolerance = 1e-10;
  let pivotRow = 0;
  const pivotColumns: number[] = [];
  const zeroPivotWarnings: string[] = [];

  for (let col = 0; col < cols && pivotRow < rows; col++) {
    let pivot = -1;
    let bestAbs = tolerance;
    for (let row = pivotRow; row < rows; row++) {
      const candidate = Math.abs(matrix[row][col]);
      if (candidate > bestAbs) {
        bestAbs = candidate;
        pivot = row;
      }
    }
    if (pivot === -1) {
      zeroPivotWarnings.push(`Column ${col + 1} has no stable pivot`);
      continue;
    }
    if (pivot !== pivotRow) [matrix[pivotRow], matrix[pivot]] = [matrix[pivot], matrix[pivotRow]];

    const pivotValue = matrix[pivotRow][col];
    for (let row = pivotRow + 1; row < rows; row++) {
      const factor = matrix[row][col] / pivotValue;
      if (Math.abs(factor) <= tolerance) continue;
      for (let j = col; j < cols; j++) matrix[row][j] -= factor * matrix[pivotRow][j];
      matrix[row][col] = 0;
    }

    pivotColumns.push(col + 1);
    pivotRow++;
  }

  const freeColumns = Array.from({ length: cols }, (_, idx) => idx + 1).filter(
    (col) => !pivotColumns.includes(col),
  );
  const note = freeColumns.length
    ? "Free columns detected: expect parametric solutions for Ax=b unless extra constraints are added."
    : "No free columns detected in this matrix shape; full-column pivot structure found.";

  return { rank: pivotColumns.length, pivotColumns, freeColumns, zeroPivotWarnings, note };
}
