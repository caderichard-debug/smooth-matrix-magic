import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { AdSlot } from "@/components/AdSlot";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { parseNumericMatrixText } from "@/lib/sparse";

export const Route = createFileRoute("/ref-partial-pivoting")({
  head: () => ({
    meta: [
      { title: "REF with Partial Pivoting — Numerical Stability Row Reduction" },
      {
        name: "description",
        content:
          "Compute row echelon form using partial pivoting with swap logs, pivot magnitudes, and elimination details.",
      },
      { property: "og:title", content: "REF with Partial Pivoting" },
      {
        property: "og:description",
        content: "Stable REF computation with explicit swap and elimination notes.",
      },
    ],
  }),
  component: RefPartialPivotingPage,
});

function RefPartialPivotingPage() {
  const [matrixText, setMatrixText] = useState("0.0001 1 1\n1 1 2\n2 3 4");

  const result = useMemo(() => {
    try {
      const matrix = parseNumericMatrixText(matrixText);
      return { data: toRefWithPartialPivoting(matrix), error: null as string | null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : "Error" };
    }
  }, [matrixText]);

  return (
    <PageLayout
      title="REF with Partial Pivoting"
      tagline="Prefer numerically stronger pivots to reduce instability in elimination pipelines."
      showHowItWorks={false}
    >
      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
          Numeric matrix input (dense rows; split by spaces/commas/semicolons)
        </Label>
        <Textarea
          value={matrixText}
          onChange={(e) => setMatrixText(e.target.value)}
          className="font-mono min-h-[140px]"
          spellCheck={false}
        />
      </section>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-4">
        <h2 className="text-xl font-semibold">REF output</h2>
        {result.error ? (
          <p className="text-destructive font-mono text-sm">{result.error}</p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-md border border-border bg-background/40 p-3">
              <pre className="font-mono text-sm whitespace-pre-wrap">
                {formatMatrix(result.data!.ref)}
              </pre>
            </div>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <Metric label="Pivot count" value={`${result.data!.pivotMagnitudes.length}`} />
              <Metric
                label="Pivot magnitudes"
                value={result.data!.pivotMagnitudes.map((x) => x.toFixed(6)).join(", ") || "none"}
              />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Partial pivoting log
              </h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {result.data!.steps.map((step, idx) => (
                  <li key={`${idx}-${step}`} className="font-mono">
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </section>

      <section className="prose-invert max-w-none space-y-3 text-muted-foreground">
        <h2 className="text-foreground text-xl font-semibold">
          How ref with partial pivoting works
        </h2>
        <p>
          For each pivot column k, choose p = argmax(i ge k)|a_ik| and swap R_k with R_p. This keeps
          the elimination multipliers m_ik = a_ik/a_kk smaller on average, improving stability.
        </p>
        <p>
          Elimination uses <span className="font-mono">R_i = R_i - m_ik R_k</span> for i &gt; k,
          yielding REF (not RREF). If every candidate pivot in a column is below tolerance, that
          column is skipped and no pivot is recorded there.
        </p>
      </section>

      <p>
        Comparing pivot magnitudes across steps helps spot poorly scaled systems where rescaling or
        reordering variables may improve numerical behavior.
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

function toRefWithPartialPivoting(input: number[][]): {
  ref: number[][];
  steps: string[];
  pivotMagnitudes: number[];
} {
  const matrix = input.map((row) => row.slice());
  const rows = matrix.length;
  const cols = matrix[0].length;
  const tolerance = 1e-10;
  const steps: string[] = [];
  const pivotMagnitudes: number[] = [];
  let pivotRow = 0;

  for (let col = 0; col < cols && pivotRow < rows; col++) {
    let bestRow = pivotRow;
    let bestAbs = Math.abs(matrix[pivotRow][col]);
    for (let row = pivotRow + 1; row < rows; row++) {
      const abs = Math.abs(matrix[row][col]);
      if (abs > bestAbs) {
        bestAbs = abs;
        bestRow = row;
      }
    }
    if (bestAbs <= tolerance) {
      steps.push(`Column ${col + 1}: skipped (all candidates below tolerance)`);
      continue;
    }
    if (bestRow !== pivotRow) {
      [matrix[pivotRow], matrix[bestRow]] = [matrix[bestRow], matrix[pivotRow]];
      steps.push(`Swap R${pivotRow + 1} with R${bestRow + 1} for stronger pivot`);
    }

    const pivotValue = matrix[pivotRow][col];
    pivotMagnitudes.push(Math.abs(pivotValue));
    for (let row = pivotRow + 1; row < rows; row++) {
      const factor = matrix[row][col] / pivotValue;
      if (Math.abs(factor) <= tolerance) continue;
      for (let j = col; j < cols; j++) matrix[row][j] -= factor * matrix[pivotRow][j];
      matrix[row][col] = 0;
      steps.push(`R${row + 1} <- R${row + 1} - (${formatNumber(factor)}) * R${pivotRow + 1}`);
    }
    pivotRow++;
  }

  return {
    ref: matrix.map((row) => row.map((value) => (Math.abs(value) < tolerance ? 0 : value))),
    steps,
    pivotMagnitudes,
  };
}

function formatMatrix(matrix: number[][]): string {
  return matrix.map((row) => row.map((value) => formatNumber(value)).join("\t")).join("\n");
}

function formatNumber(value: number): string {
  const rounded = Math.round(value * 1e8) / 1e8;
  if (Math.abs(rounded) < 1e-10) return "0";
  return `${rounded}`;
}
