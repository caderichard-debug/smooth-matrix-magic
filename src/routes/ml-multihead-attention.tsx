import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdSlot } from "@/components/AdSlot";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { MatrixInput } from "@/components/MatrixInput";
import { PageLayout } from "@/components/PageLayout";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { fromNumbers, type Matrix } from "@/lib/matrix";
import {
  causalMask,
  concatHeads,
  gridToMatrix,
  linearForward,
  matrixToGrid,
  scaledDotProductAttention,
  splitHeads,
} from "@/lib/mlOps";

export const Route = createFileRoute("/ml-multihead-attention")({
  head: () => ({
    meta: [
      { title: "Multi-Head Attention Shape Walkthrough" },
      {
        name: "description",
        content:
          "Learn multi-head attention end-to-end: Q/K/V projections, head splitting, masking, per-head attention, concatenation, and output projection.",
      },
      { property: "og:title", content: "Multi-Head Attention Shape Walkthrough" },
      {
        property: "og:description",
        content:
          "Interactive matrix walkthrough of multi-head attention with additive and causal masking toggles.",
      },
    ],
  }),
  component: MlMultiheadAttentionPage,
});

type HeadStep = {
  q: Matrix;
  k: Matrix;
  v: Matrix;
  scores: Matrix;
  weights: Matrix;
  output: Matrix;
};

function shapeOf(m: number[][]): string {
  return `${m.length} x ${m[0]?.length ?? 0}`;
}

function resizeMask(mask: number[][], rows: number, cols: number): number[][] {
  return Array.from({ length: rows }, (_, i) =>
    Array.from({ length: cols }, (_, j) => mask[i]?.[j] ?? 0),
  );
}

function MlMultiheadAttentionPage() {
  const [x, setX] = useState<Matrix>(() =>
    fromNumbers([
      [1, 0, 1, 0],
      [0, 1, 1, 0],
      [1, 1, 0, 1],
    ]),
  );
  const [wQ, setWQ] = useState<Matrix>(() =>
    fromNumbers([
      [1, 0, 0, 1],
      [0, 1, 1, 0],
      [1, 0, 1, 0],
      [0, 1, 0, 1],
    ]),
  );
  const [wK, setWK] = useState<Matrix>(() =>
    fromNumbers([
      [1, 1, 0, 0],
      [0, 1, 1, 0],
      [1, 0, 1, 0],
      [0, 0, 1, 1],
    ]),
  );
  const [wV, setWV] = useState<Matrix>(() =>
    fromNumbers([
      [1, 0, 1, 0],
      [0, 1, 0, 1],
      [1, 1, 0, 0],
      [0, 0, 1, 1],
    ]),
  );
  const [wO, setWO] = useState<Matrix>(() =>
    fromNumbers([
      [1, 0, 0, 1],
      [0, 1, 1, 0],
      [1, 0, 1, 0],
      [0, 1, 0, 1],
    ]),
  );
  const [numHeadsStr, setNumHeadsStr] = useState("2");
  const [useAdditiveMask, setUseAdditiveMask] = useState(false);
  const [useCausalMask, setUseCausalMask] = useState(false);
  const [additiveMask, setAdditiveMask] = useState<Matrix>(() =>
    fromNumbers([
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ]),
  );

  const result = useMemo(() => {
    try {
      const xGrid = matrixToGrid(x, "X");
      const wQGrid = matrixToGrid(wQ, "W_Q");
      const wKGrid = matrixToGrid(wK, "W_K");
      const wVGrid = matrixToGrid(wV, "W_V");
      const wOGrid = matrixToGrid(wO, "W_O");

      const qProj = linearForward(xGrid, wQGrid);
      const kProj = linearForward(xGrid, wKGrid);
      const vProj = linearForward(xGrid, wVGrid);
      const parsedHeads = Number(numHeadsStr);
      if (!Number.isInteger(parsedHeads) || parsedHeads < 1) {
        throw new Error("Number of heads must be a positive integer.");
      }
      if (qProj[0].length % parsedHeads !== 0) {
        throw new Error(
          `Projection width (${qProj[0].length}) must be divisible by number of heads (${parsedHeads}).`,
        );
      }

      const qHeads = splitHeads(qProj, parsedHeads);
      const kHeads = splitHeads(kProj, parsedHeads);
      const vHeads = splitHeads(vProj, parsedHeads);

      const maskAdd = useAdditiveMask
        ? resizeMask(matrixToGrid(additiveMask, "Additive mask"), qProj.length, kProj.length)
        : undefined;
      const maskCausal = useCausalMask ? causalMask(qProj.length, kProj.length) : undefined;
      const combinedMask =
        maskAdd || maskCausal
          ? Array.from({ length: qProj.length }, (_, i) =>
              Array.from(
                { length: kProj.length },
                (_, j) => (maskAdd?.[i]?.[j] ?? 0) + (maskCausal?.[i]?.[j] ?? 0),
              ),
            )
          : undefined;

      const headSteps: HeadStep[] = qHeads.map((qHead, idx) => {
        const kHead = kHeads[idx];
        const vHead = vHeads[idx];
        const attention = scaledDotProductAttention(qHead, kHead, vHead, {
          additiveMask: combinedMask,
        });
        return {
          q: gridToMatrix(qHead),
          k: gridToMatrix(kHead),
          v: gridToMatrix(vHead),
          scores: gridToMatrix(attention.scores),
          weights: gridToMatrix(attention.weights),
          output: gridToMatrix(attention.output),
        };
      });

      const perHeadOut = headSteps.map((h) => matrixToGrid(h.output, "head output"));
      const concat = concatHeads(perHeadOut);
      const finalOut = linearForward(concat, wOGrid);

      return {
        x: gridToMatrix(xGrid),
        qProj: gridToMatrix(qProj),
        kProj: gridToMatrix(kProj),
        vProj: gridToMatrix(vProj),
        qProjShape: shapeOf(qProj),
        kProjShape: shapeOf(kProj),
        vProjShape: shapeOf(vProj),
        headShape: shapeOf(qHeads[0]),
        headCount: qHeads.length,
        combinedMask: combinedMask ? gridToMatrix(combinedMask) : null,
        headSteps,
        concat: gridToMatrix(concat),
        concatShape: shapeOf(concat),
        output: gridToMatrix(finalOut),
        outputShape: shapeOf(finalOut),
        error: null as string | null,
      };
    } catch (e) {
      return {
        x: null as Matrix | null,
        qProj: null as Matrix | null,
        kProj: null as Matrix | null,
        vProj: null as Matrix | null,
        qProjShape: "",
        kProjShape: "",
        vProjShape: "",
        headShape: "",
        headCount: 0,
        combinedMask: null as Matrix | null,
        headSteps: [] as HeadStep[],
        concat: null as Matrix | null,
        concatShape: "",
        output: null as Matrix | null,
        outputShape: "",
        error: e instanceof Error ? e.message : "Error",
      };
    }
  }, [x, wQ, wK, wV, wO, numHeadsStr, useAdditiveMask, useCausalMask, additiveMask]);

  return (
    <PageLayout
      title="Multi-Head Attention Walkthrough"
      tagline="Step through projections, head splits, masking, per-head attention, and final output projection."
      showHowItWorks={false}
    >
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-4">
          <MatrixInput title="X (tokens x d_model)" value={x} onChange={setX} />
          <MatrixInput title="W_Q (d_model x d_model)" value={wQ} onChange={setWQ} />
          <MatrixInput title="W_K (d_model x d_model)" value={wK} onChange={setWK} />
          <MatrixInput title="W_V (d_model x d_model)" value={wV} onChange={setWV} />
          <MatrixInput title="W_O (d_model x d_model)" value={wO} onChange={setWO} />
          <div className="rounded-lg border border-border bg-card/40 p-3 space-y-2">
            <Label htmlFor="num-heads">Number of heads</Label>
            <input
              id="num-heads"
              type="number"
              min={1}
              max={8}
              step={1}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={numHeadsStr}
              onChange={(e) => setNumHeadsStr(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              `d_model` (projection width) must be divisible by heads.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="use-additive-mask"
              checked={useAdditiveMask}
              onCheckedChange={(checked) => setUseAdditiveMask(checked === true)}
            />
            <Label htmlFor="use-additive-mask">Use additive mask</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="use-causal-mask"
              checked={useCausalMask}
              onCheckedChange={(checked) => setUseCausalMask(checked === true)}
            />
            <Label htmlFor="use-causal-mask">Apply causal mask (no future tokens)</Label>
          </div>
          {useAdditiveMask ? (
            <MatrixInput
              title="Additive mask (tokens x tokens)"
              value={additiveMask}
              onChange={setAdditiveMask}
            />
          ) : null}
        </div>

        <section className="rounded-lg border border-border bg-card/40 p-6 space-y-5">
          <h2 className="text-xl font-semibold">Step-by-step result</h2>
          {result.error ? (
            <p className="text-destructive font-mono text-sm">{result.error}</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Projections: Q {result.qProjShape}, K {result.kProjShape}, V {result.vProjShape}
              </p>
              <p className="text-sm text-muted-foreground">
                Split into {result.headCount} heads, each head shape {result.headShape}
              </p>
              {result.combinedMask ? (
                <div>
                  <h3 className="font-medium mb-2">Combined mask used in all heads</h3>
                  <div className="overflow-x-auto">
                    <MatrixDisplay m={result.combinedMask} />
                  </div>
                </div>
              ) : null}
              {result.qProj ? (
                <div>
                  <h3 className="font-medium mb-2">Q projection</h3>
                  <div className="overflow-x-auto">
                    <MatrixDisplay m={result.qProj} />
                  </div>
                </div>
              ) : null}
              {result.kProj ? (
                <div>
                  <h3 className="font-medium mb-2">K projection</h3>
                  <div className="overflow-x-auto">
                    <MatrixDisplay m={result.kProj} />
                  </div>
                </div>
              ) : null}
              {result.vProj ? (
                <div>
                  <h3 className="font-medium mb-2">V projection</h3>
                  <div className="overflow-x-auto">
                    <MatrixDisplay m={result.vProj} />
                  </div>
                </div>
              ) : null}
              {result.headSteps.map((head, idx) => (
                <div key={`head-${idx}`} className="space-y-3 border-t border-border/70 pt-4">
                  <h3 className="font-medium">Head {idx + 1}</h3>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Q_h</p>
                    <div className="overflow-x-auto">
                      <MatrixDisplay m={head.q} />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">K_h</p>
                    <div className="overflow-x-auto">
                      <MatrixDisplay m={head.k} />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">V_h</p>
                    <div className="overflow-x-auto">
                      <MatrixDisplay m={head.v} />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Scores_h</p>
                    <div className="overflow-x-auto">
                      <MatrixDisplay m={head.scores} />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Weights_h</p>
                    <div className="overflow-x-auto">
                      <MatrixDisplay m={head.weights} />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Output_h</p>
                    <div className="overflow-x-auto">
                      <MatrixDisplay m={head.output} />
                    </div>
                  </div>
                </div>
              ))}
              {result.concat ? (
                <div className="border-t border-border/70 pt-4">
                  <h3 className="font-medium mb-2">Concatenate heads ({result.concatShape})</h3>
                  <div className="overflow-x-auto">
                    <MatrixDisplay m={result.concat} />
                  </div>
                </div>
              ) : null}
              {result.output ? (
                <div>
                  <h3 className="font-medium mb-2">
                    Final output = Concat * W_O ({result.outputShape})
                  </h3>
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
          Multi-head attention applies separate scaled dot-product attention blocks in parallel over
          lower-dimensional head slices:
          <span className="font-mono">
            {" "}
            head_i = Attention(Q_i, K_i, V_i), then output = Concat(head_i)W_O
          </span>
          .
        </p>
        <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
          <li>Q, K, and V projections are linear maps from X using W_Q, W_K, and W_V.</li>
          <li>d_model must divide evenly by the head count so each head has width d_k.</li>
          <li>Additive masks and causal masks are added to scores before row-wise softmax.</li>
          <li>Causal masking sets future-token logits to a large negative value.</li>
        </ul>
      </section>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}
