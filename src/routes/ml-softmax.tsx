import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { AdSlot } from "@/components/AdSlot";
import { fromNumbers, formatNumber, type Matrix } from "@/lib/matrix";
import { gridToMatrix, matrixToGrid, softmaxRows } from "@/lib/mlOps";

export const Route = createFileRoute("/ml-softmax")({
  head: () => ({
    meta: [
      { title: "Softmax Calculator — Row-wise Probabilities" },
      {
        name: "description",
        content:
          "Apply softmax independently to each row of a numeric matrix. Useful for logits in classification heads and attention-style sketches.",
      },
      { property: "og:title", content: "Row-wise Softmax Calculator" },
      {
        property: "og:description",
        content: "Stable softmax per row with numeric matrix input.",
      },
    ],
  }),
  component: MlSoftmaxPage,
});

function MlSoftmaxPage() {
  const [logits, setLogits] = useState<Matrix>(() =>
    fromNumbers([
      [2, 1, 0],
      [0, 0, 3],
      [1, 1, 1],
    ]),
  );

  const result = useMemo(() => {
    try {
      const grid = matrixToGrid(logits, "Logits");
      const sm = softmaxRows(grid);
      const rowSums = sm.map((row) => row.reduce((a, b) => a + b, 0));
      return {
        matrix: gridToMatrix(sm),
        rowSums,
        error: null as string | null,
      };
    } catch (e) {
      return {
        matrix: null as Matrix | null,
        rowSums: [] as number[],
        error: e instanceof Error ? e.message : "Error",
      };
    }
  }, [logits]);

  return (
    <PageLayout
      title="Softmax (row-wise)"
      tagline="Turn each row of logits into a probability vector: stable exp-shift, normalize by sum."
      showHowItWorks={false}
    >
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <MatrixInput title="Logits (numeric, each row softmaxed separately)" value={logits} onChange={setLogits} />
        <section className="rounded-lg border border-border bg-card/40 p-6">
          <h2 className="text-xl font-semibold mb-3">Probabilities</h2>
          {result.error ? (
            <p className="text-destructive font-mono text-sm">{result.error}</p>
          ) : (
            result.matrix && (
              <div className="space-y-3 overflow-x-auto">
                <MatrixDisplay m={result.matrix} />
                <p className="text-sm text-muted-foreground">
                  Row sums (should be 1):{" "}
                  {result.rowSums.map((s) => formatNumber(s)).join(", ")}
                </p>
              </div>
            )
          )}
        </section>
      </div>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold">How softmax works</h2>
        <p className="text-sm text-muted-foreground">
          For a row vector z, softmax is{" "}
          <span className="font-mono">σ(z)_i = exp(z_i) / Σ_j exp(z_j)</span>. Subtracting{" "}
          <span className="font-mono">max(z)</span> before exponentiating improves numerical stability
          without changing the result.
        </p>
        <p className="text-sm text-muted-foreground">
          Rows are independent here; column-wise or flattened softmax would use the same formula on
          a different layout of the same numbers.
        </p>
        <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
          <li>Each row output is a probability distribution: entries are positive and sum to 1.</li>
          <li>
            Adding a constant c to every logit in a row leaves probabilities unchanged (shift
            invariance).
          </li>
          <li>
            With temperature T, softmax(z/T) sharpens as T→0 and flattens as T grows (not exposed
            here, but same formula family).
          </li>
        </ul>
      </section>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}
