import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { AdSlot } from "@/components/AdSlot";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { fromNumbers, type Matrix } from "@/lib/matrix";
import { gridToMatrix, linearBackward, linearForward, matrixToGrid } from "@/lib/mlOps";

export const Route = createFileRoute("/ml-linear-layer")({
  head: () => ({
    meta: [
      { title: "Linear Layer (Forward & Backward) Calculator" },
      {
        name: "description",
        content:
          "Compute linear layer forward pass Y = XW + b and backward gradients dW, dX, db for small numeric matrices.",
      },
      { property: "og:title", content: "Linear Layer (Forward & Backward) Calculator" },
      {
        property: "og:description",
        content: "Explore affine layer math with matrix inputs and explicit gradient outputs.",
      },
    ],
  }),
  component: MlLinearLayerPage,
});

function MlLinearLayerPage() {
  const [x, setX] = useState<Matrix>(() =>
    fromNumbers([
      [1, 2, -1],
      [0, 3, 1],
    ]),
  );
  const [w, setW] = useState<Matrix>(() =>
    fromNumbers([
      [2, -1],
      [0, 3],
      [1, 2],
    ]),
  );
  const [dY, setDY] = useState<Matrix>(() =>
    fromNumbers([
      [1, 4],
      [2, -1],
    ]),
  );
  const [includeBias, setIncludeBias] = useState(true);
  const [b, setB] = useState<Matrix>(() => fromNumbers([[0.5, -1]]));

  const result = useMemo(() => {
    try {
      const xGrid = matrixToGrid(x, "X");
      const wGrid = matrixToGrid(w, "W");
      const dyGrid = matrixToGrid(dY, "dY");
      const bVector = includeBias ? matrixToGrid(b, "b")[0] : undefined;

      if (includeBias && matrixToGrid(b, "b").length !== 1) {
        return {
          y: null as Matrix | null,
          dW: null as Matrix | null,
          dX: null as Matrix | null,
          db: null as Matrix | null,
          error: "b must be a single row matrix (1 x out_features).",
        };
      }

      const y = linearForward(xGrid, wGrid, bVector);
      const back = linearBackward(xGrid, wGrid, dyGrid);
      return {
        y: gridToMatrix(y),
        dW: gridToMatrix(back.dW),
        dX: gridToMatrix(back.dX),
        db: gridToMatrix([back.db]),
        error: null as string | null,
      };
    } catch (e) {
      return {
        y: null as Matrix | null,
        dW: null as Matrix | null,
        dX: null as Matrix | null,
        db: null as Matrix | null,
        error: e instanceof Error ? e.message : "Error",
      };
    }
  }, [x, w, dY, includeBias, b]);

  return (
    <PageLayout
      title="Linear Layer (Forward & Backward)"
      tagline="Affine transform Y = XW + b plus gradients dW, dX, and db for backprop."
      showHowItWorks={false}
    >
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-4">
          <MatrixInput title="X (batch x in_features, numeric)" value={x} onChange={setX} />
          <MatrixInput title="W (in_features x out_features, numeric)" value={w} onChange={setW} />
          <MatrixInput title="dY (batch x out_features, numeric)" value={dY} onChange={setDY} />
          <div className="flex items-center gap-2">
            <Checkbox
              id="use-bias"
              checked={includeBias}
              onCheckedChange={(checked) => setIncludeBias(checked === true)}
            />
            <Label htmlFor="use-bias">Include bias b</Label>
          </div>
          {includeBias ? (
            <MatrixInput title="b (1 x out_features, numeric)" value={b} onChange={setB} />
          ) : null}
        </div>

        <section className="rounded-lg border border-border bg-card/40 p-6 space-y-5">
          <h2 className="text-xl font-semibold">Outputs</h2>
          {result.error ? (
            <p className="text-destructive font-mono text-sm">{result.error}</p>
          ) : (
            <>
              {result.y ? (
                <div>
                  <h3 className="font-medium mb-2">Y = XW + b</h3>
                  <div className="overflow-x-auto">
                    <MatrixDisplay m={result.y} />
                  </div>
                </div>
              ) : null}
              {result.dW ? (
                <div>
                  <h3 className="font-medium mb-2">dW = X^T dY</h3>
                  <div className="overflow-x-auto">
                    <MatrixDisplay m={result.dW} />
                  </div>
                </div>
              ) : null}
              {result.dX ? (
                <div>
                  <h3 className="font-medium mb-2">dX = dY W^T</h3>
                  <div className="overflow-x-auto">
                    <MatrixDisplay m={result.dX} />
                  </div>
                </div>
              ) : null}
              {result.db ? (
                <div>
                  <h3 className="font-medium mb-2">db = row-wise sum(dY)</h3>
                  <div className="overflow-x-auto">
                    <MatrixDisplay m={result.db} />
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
          For a batch matrix X in R^(N x d_in) and weights W in R^(d_in x d_out), the linear layer
          produces Y = XW + b where b is broadcast across rows if present.
        </p>
        <p className="text-sm text-muted-foreground">
          Given upstream gradient dY = dL/dY, backprop through the affine map gives: dW = X^T dY, dX
          = dY W^T, and db_j = sum_i dY_(i,j).
        </p>
        <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
          <li>Shape checks: X columns must equal W rows; dY must match output shape N x d_out.</li>
          <li>dW accumulates feature-gradient correlations across the batch.</li>
          <li>
            db is the batch-wise reduction over output gradients, one value per output feature.
          </li>
        </ul>
      </section>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}
