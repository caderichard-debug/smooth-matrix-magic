import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { AdSlot } from "@/components/AdSlot";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { parseNumericMatrixText } from "@/lib/sparse";

export const Route = createFileRoute("/gaussian-elimination-steps")({
  head: () => ({
    meta: [
      { title: "Gaussian Elimination Steps Calculator — Row Operations Walkthrough" },
      {
        name: "description",
        content:
          "Run Gaussian elimination with explicit row-operation steps, pivot tracking, and row echelon output for numeric matrices.",
      },
      { property: "og:title", content: "Gaussian Elimination Steps Calculator" },
      {
        property: "og:description",
        content: "Step-by-step row reductions with pivot positions and echelon form.",
      },
    ],
  }),
  component: GaussianEliminationStepsPage,
});

function GaussianEliminationStepsPage() {
  const [matrixText, setMatrixText] = useState("2 1 -1 8\n-3 -1 2 -11\n-2 1 2 -3");

  const result = useMemo(() => {
    try {
      const matrix = parseNumericMatrixText(matrixText);
      const steps: string[] = [];
      const ref = gaussianEliminationWithSteps(matrix, steps);
      return { ref, steps, error: null as string | null };
    } catch (error) {
      return {
        ref: null,
        steps: [] as string[],
        error: error instanceof Error ? error.message : "Error",
      };
    }
  }, [matrixText]);

  return (
    <PageLayout
      title="Gaussian Elimination Steps"
      tagline="Inspect each elimination pivot and row update so you can audit the full reduction flow."
      showHowItWorks={false}
    >
      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
          Augmented or standard matrix (rows by newline; values separated by spaces/commas)
        </Label>
        <Textarea
          value={matrixText}
          onChange={(e) => setMatrixText(e.target.value)}
          className="font-mono min-h-[140px]"
          spellCheck={false}
        />
      </section>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-4">
        <h2 className="text-xl font-semibold">Elimination output</h2>
        {result.error ? (
          <p className="text-destructive font-mono text-sm">{result.error}</p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-md border border-border bg-background/40 p-3">
              <pre className="font-mono text-sm whitespace-pre-wrap">
                {formatMatrix(result.ref!)}
              </pre>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Row operation steps
              </h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                {result.steps.map((step, idx) => (
                  <li key={`${idx}-${step}`} className="font-mono">
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </>
        )}
      </section>

      <section className="prose-invert max-w-none space-y-3 text-muted-foreground">
        <h2 className="text-foreground text-xl font-semibold">
          How gaussian elimination steps works
        </h2>
        <p>
          At pivot column k, partial pivoting picks p = argmax(i &gt;= k)|a_ik|. If p is not k we swap
          rows, then eliminate below with
          <span className="font-mono"> R_i = R_i - (a_ik/a_kk)R_k </span>
          so all entries under a_kk become 0.
        </p>
        <p>
          This produces REF where pivot indices strictly move right as rows increase. If no
          candidate exceeds tolerance, that column is skipped (a free/non-pivot column). The step
          log prints every swap and multiplier.
        </p>
        <p>
          This page outputs REF (not fully reduced RREF): pivots are below-eliminated but not
          normalized to 1 or cleared above. In the step log, &quot;no pivot found&quot; usually means
          near-zero column magnitude under the current tolerance.
        </p>
      </section>

      <p>
        Use augmented matrices to track linear-system solving directly, or plain coefficient
        matrices to study rank and pivot structure in isolation.
      </p>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}

function gaussianEliminationWithSteps(input: number[][], steps: string[]): number[][] {
  const matrix = input.map((row) => row.slice());
  const rowCount = matrix.length;
  const colCount = matrix[0].length;
  const tolerance = 1e-10;
  let pivotRow = 0;

  for (let col = 0; col < colCount && pivotRow < rowCount; col++) {
    let bestRow = pivotRow;
    let bestAbs = Math.abs(matrix[pivotRow][col]);
    for (let row = pivotRow + 1; row < rowCount; row++) {
      const candidate = Math.abs(matrix[row][col]);
      if (candidate > bestAbs) {
        bestAbs = candidate;
        bestRow = row;
      }
    }
    if (bestAbs <= tolerance) {
      steps.push(`Column ${col + 1}: no pivot found, move to next column`);
      continue;
    }

    if (bestRow !== pivotRow) {
      [matrix[pivotRow], matrix[bestRow]] = [matrix[bestRow], matrix[pivotRow]];
      steps.push(`Swap R${pivotRow + 1} <-> R${bestRow + 1}`);
    }

    const pivotValue = matrix[pivotRow][col];
    steps.push(`Pivot at (row ${pivotRow + 1}, col ${col + 1}) = ${formatNumber(pivotValue)}`);

    for (let row = pivotRow + 1; row < rowCount; row++) {
      const factor = matrix[row][col] / pivotValue;
      if (Math.abs(factor) <= tolerance) continue;
      for (let j = col; j < colCount; j++) matrix[row][j] -= factor * matrix[pivotRow][j];
      matrix[row][col] = 0;
      steps.push(`R${row + 1} <- R${row + 1} - (${formatNumber(factor)}) * R${pivotRow + 1}`);
    }
    pivotRow++;
  }

  return matrix.map((row) => row.map((value) => normalize(value)));
}

function formatMatrix(matrix: number[][]): string {
  return matrix.map((row) => row.map((value) => formatNumber(value)).join("\t")).join("\n");
}

function normalize(value: number): number {
  if (Math.abs(value) < 1e-10) return 0;
  return value;
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  const rounded = Math.round(value * 1e8) / 1e8;
  if (Math.abs(rounded) < 1e-10) return "0";
  return `${rounded}`;
}
