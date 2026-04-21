import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { AdSlot } from "@/components/AdSlot";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { fromNumbers, type Matrix } from "@/lib/matrix";
import { gridToMatrix, matrixToGrid, scaledDotProductAttention } from "@/lib/mlOps";

export const Route = createFileRoute("/ml-attention")({
  head: () => ({
    meta: [
      { title: "Scaled Dot-Product Attention Calculator" },
      {
        name: "description",
        content:
          "Compute scaled dot-product attention with optional additive mask: scores, softmax weights, and weighted value output.",
      },
      { property: "og:title", content: "Scaled Dot-Product Attention Calculator" },
      {
        property: "og:description",
        content:
          "Explore attention internals with numeric Q, K, V matrices and optional mask in the browser.",
      },
    ],
  }),
  component: MlAttentionPage,
});

function MlAttentionPage() {
  const [q, setQ] = useState<Matrix>(() =>
    fromNumbers([
      [1, 0, 1],
      [0, 1, 1],
    ]),
  );
  const [k, setK] = useState<Matrix>(() =>
    fromNumbers([
      [1, 0, 1],
      [0, 1, 1],
      [1, 1, 0],
    ]),
  );
  const [v, setV] = useState<Matrix>(() =>
    fromNumbers([
      [1, 2],
      [2, 1],
      [3, 3],
    ]),
  );
  const [useMask, setUseMask] = useState(false);
  const [mask, setMask] = useState<Matrix>(() =>
    fromNumbers([
      [0, 0, 0],
      [0, 0, 0],
    ]),
  );

  const result = useMemo(() => {
    try {
      const qGrid = matrixToGrid(q, "Q");
      const kGrid = matrixToGrid(k, "K");
      const vGrid = matrixToGrid(v, "V");
      const maskGrid = useMask ? matrixToGrid(mask, "Mask") : undefined;
      const attention = scaledDotProductAttention(qGrid, kGrid, vGrid, {
        additiveMask: maskGrid,
      });
      return {
        scores: gridToMatrix(attention.scores),
        weights: gridToMatrix(attention.weights),
        output: gridToMatrix(attention.output),
        error: null as string | null,
      };
    } catch (e) {
      return {
        scores: null as Matrix | null,
        weights: null as Matrix | null,
        output: null as Matrix | null,
        error: e instanceof Error ? e.message : "Error",
      };
    }
  }, [q, k, v, useMask, mask]);

  return (
    <PageLayout
      title="Scaled Dot-Product Attention"
      tagline="Compute attention as softmax(QK^T / sqrt(d_k))V with optional additive masking."
      showHowItWorks={false}
    >
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-4">
          <MatrixInput title="Q (queries, numeric: n_q x d_k)" value={q} onChange={setQ} />
          <MatrixInput title="K (keys, numeric: n_k x d_k)" value={k} onChange={setK} />
          <MatrixInput title="V (values, numeric: n_k x d_v)" value={v} onChange={setV} />
          <div className="flex items-center gap-2">
            <Checkbox
              id="use-mask"
              checked={useMask}
              onCheckedChange={(checked) => setUseMask(checked === true)}
            />
            <Label htmlFor="use-mask">Use additive mask (same shape as score matrix)</Label>
          </div>
          {useMask ? (
            <MatrixInput
              title="Mask (n_q x n_k; use large negative values to suppress positions)"
              value={mask}
              onChange={setMask}
            />
          ) : null}
        </div>

        <section className="rounded-lg border border-border bg-card/40 p-6 space-y-5">
          <h2 className="text-xl font-semibold">Intermediate matrices</h2>
          {result.error ? (
            <p className="text-destructive font-mono text-sm">{result.error}</p>
          ) : (
            <>
              {result.scores ? (
                <div>
                  <h3 className="font-medium mb-2">Scaled scores: S = QK^T / sqrt(d_k)</h3>
                  <div className="overflow-x-auto">
                    <MatrixDisplay m={result.scores} />
                  </div>
                </div>
              ) : null}
              {result.weights ? (
                <div>
                  <h3 className="font-medium mb-2">Attention weights: A = softmax(S + mask)</h3>
                  <div className="overflow-x-auto">
                    <MatrixDisplay m={result.weights} />
                  </div>
                </div>
              ) : null}
              {result.output ? (
                <div>
                  <h3 className="font-medium mb-2">Output: O = AV</h3>
                  <div className="overflow-x-auto">
                    <MatrixDisplay m={result.output} />
                  </div>
                </div>
              ) : null}
            </>
          )}
        </section>
      </div>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold">How it works</h2>
        <p className="text-sm text-muted-foreground">
          Given queries Q in R^(n_q x d_k), keys K in R^(n_k x d_k), and values V in R^(n_k x d_v),
          scaled dot-product attention computes:
          <span className="font-mono"> Attention(Q,K,V) = softmax(QK^T / sqrt(d_k) + M)V</span>,
          where M is an optional additive mask.
        </p>
        <p className="text-sm text-muted-foreground">
          Dividing by <span className="font-mono">sqrt(d_k)</span> keeps score magnitudes from
          growing too large, which stabilizes the softmax and gradients. The softmax is applied
          row-wise so each query row gets a probability distribution over key positions.
        </p>
        <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
          <li>Shape rules: Q and K share d_k, while K and V share n_k rows.</li>
          <li>
            Masking: large negative mask entries push corresponding softmax weights near zero.
          </li>
          <li>Each output row is a weighted combination of V rows selected by one query.</li>
          <li>Every attention-weight row sums to 1 after softmax.</li>
        </ul>
      </section>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}
