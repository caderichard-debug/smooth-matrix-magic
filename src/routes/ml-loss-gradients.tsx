import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { MatrixInput } from "@/components/MatrixInput";
import { AdSlot } from "@/components/AdSlot";
import { fromNumbers, formatNumber, type Matrix } from "@/lib/matrix";
import {
  crossEntropyFromLogits,
  crossEntropyGradFromLogits,
  gridToMatrix,
  linearBackward,
  matrixToGrid,
  mseGrad,
  mseLoss,
  softmaxJacobianRow,
} from "@/lib/mlOps";

export const Route = createFileRoute("/ml-loss-gradients")({
  head: () => ({
    meta: [
      { title: "Loss + Gradient Basics (MSE, CE Logits, Jacobian)" },
      {
        name: "description",
        content:
          "Interactive loss-and-gradient playground for MSE, cross-entropy from logits, softmax Jacobian, and linear-layer backward recap.",
      },
      { property: "og:title", content: "Loss + Gradient Basics Calculator" },
      {
        property: "og:description",
        content: "Understand common ML gradients with compact matrix examples and equations.",
      },
    ],
  }),
  component: MlLossGradientsPage,
});

function MlLossGradientsPage() {
  const [msePred, setMsePred] = useState<Matrix>(() =>
    fromNumbers([
      [1.2, -0.3],
      [0.5, 2.0],
    ]),
  );
  const [mseTarget, setMseTarget] = useState<Matrix>(() =>
    fromNumbers([
      [1, 0],
      [0, 1],
    ]),
  );
  const [ceLogits, setCeLogits] = useState<Matrix>(() =>
    fromNumbers([
      [2, 1, 0],
      [0, 1, 2],
    ]),
  );
  const [ceTargets, setCeTargets] = useState<Matrix>(() =>
    fromNumbers([
      [1, 0, 0],
      [0, 0, 1],
    ]),
  );
  const [softmaxRow, setSoftmaxRow] = useState<Matrix>(() => fromNumbers([[2, 1, 0]]));
  const [linX, setLinX] = useState<Matrix>(() =>
    fromNumbers([
      [1, 2],
      [3, 4],
    ]),
  );
  const [linW, setLinW] = useState<Matrix>(() =>
    fromNumbers([
      [0.5, -0.5, 1],
      [1.5, 0.5, -1],
    ]),
  );
  const [linDY, setLinDY] = useState<Matrix>(() =>
    fromNumbers([
      [1, 0, 2],
      [0, -1, 1],
    ]),
  );

  const mseResult = useMemo(() => {
    try {
      const pred = matrixToGrid(msePred, "Prediction");
      const target = matrixToGrid(mseTarget, "Target");
      return {
        loss: mseLoss(pred, target),
        grad: gridToMatrix(mseGrad(pred, target)),
        error: null as string | null,
      };
    } catch (e) {
      return {
        loss: null as number | null,
        grad: null as Matrix | null,
        error: e instanceof Error ? e.message : "Error",
      };
    }
  }, [msePred, mseTarget]);

  const ceResult = useMemo(() => {
    try {
      const logits = matrixToGrid(ceLogits, "Logits");
      const targets = matrixToGrid(ceTargets, "Targets");
      return {
        loss: crossEntropyFromLogits(logits, targets),
        grad: gridToMatrix(crossEntropyGradFromLogits(logits, targets)),
        error: null as string | null,
      };
    } catch (e) {
      return {
        loss: null as number | null,
        grad: null as Matrix | null,
        error: e instanceof Error ? e.message : "Error",
      };
    }
  }, [ceLogits, ceTargets]);

  const jacobianResult = useMemo(() => {
    try {
      const row = matrixToGrid(softmaxRow, "Softmax row");
      if (row.length !== 1) {
        return { jacobian: null as Matrix | null, error: "Softmax row input must be 1 x C." };
      }
      return {
        jacobian: gridToMatrix(softmaxJacobianRow(row[0])),
        error: null as string | null,
      };
    } catch (e) {
      return {
        jacobian: null as Matrix | null,
        error: e instanceof Error ? e.message : "Error",
      };
    }
  }, [softmaxRow]);

  const linearRecap = useMemo(() => {
    try {
      const x = matrixToGrid(linX, "X");
      const w = matrixToGrid(linW, "W");
      const dY = matrixToGrid(linDY, "dY");
      const out = linearBackward(x, w, dY);
      return {
        dW: gridToMatrix(out.dW),
        dX: gridToMatrix(out.dX),
        db: gridToMatrix([out.db]),
        error: null as string | null,
      };
    } catch (e) {
      return {
        dW: null as Matrix | null,
        dX: null as Matrix | null,
        db: null as Matrix | null,
        error: e instanceof Error ? e.message : "Error",
      };
    }
  }, [linX, linW, linDY]);

  return (
    <PageLayout
      title="Loss + Gradient Basics"
      tagline="MSE, cross-entropy from logits, softmax Jacobian, and linear-layer backprop in one compact playground."
      showHowItWorks={false}
    >
      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-2">
        <h2 className="text-xl font-semibold">Core equations</h2>
        <p className="text-sm text-muted-foreground font-mono">
          L_MSE = (1 / (N*C)) * sum((y_hat - y)^2), dL/dy_hat = (2 / (N*C)) * (y_hat - y)
        </p>
        <p className="text-sm text-muted-foreground font-mono">
          L_CE = -(1/N) * sum_i sum_j t_ij * log(softmax(z_i)_j), dL/dz = (softmax(z) - t) / N
        </p>
        <p className="text-sm text-muted-foreground font-mono">
          J_softmax(s)_ij = s_i * (delta_ij - s_j), where s = softmax(z)
        </p>
        <p className="text-sm text-muted-foreground font-mono">
          Linear recap: dW = X^T dY, dX = dY W^T, db = row-wise sum(dY)
        </p>
      </section>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-4">
          <MatrixInput title="MSE prediction y_hat (N x C)" value={msePred} onChange={setMsePred} />
          <MatrixInput title="MSE target y (N x C)" value={mseTarget} onChange={setMseTarget} />
        </div>
        <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
          <h3 className="text-lg font-semibold">MSE output (N x C)</h3>
          {mseResult.error ? (
            <p className="text-destructive font-mono text-sm">{mseResult.error}</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Mean squared error:{" "}
                <span className="font-mono text-foreground">
                  {formatNumber(mseResult.loss ?? 0)}
                </span>
              </p>
              {mseResult.grad ? (
                <div className="space-y-1 overflow-x-auto">
                  <p className="text-sm text-muted-foreground font-mono">MSE gradient dL/dy_hat</p>
                  <MatrixDisplay m={mseResult.grad} />
                </div>
              ) : null}
            </>
          )}
        </section>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-4">
          <MatrixInput title="CE logits z (N x C)" value={ceLogits} onChange={setCeLogits} />
          <MatrixInput
            title="CE targets t (N x C, rows sum to 1; one-hot or soft labels)"
            value={ceTargets}
            onChange={setCeTargets}
          />
        </div>
        <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
          <h3 className="text-lg font-semibold">Cross-entropy from logits (N x C)</h3>
          {ceResult.error ? (
            <p className="text-destructive font-mono text-sm">{ceResult.error}</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Row-wise mean CE:{" "}
                <span className="font-mono text-foreground">
                  {formatNumber(ceResult.loss ?? 0)}
                </span>
              </p>
              {ceResult.grad ? (
                <div className="space-y-1 overflow-x-auto">
                  <p className="text-sm text-muted-foreground font-mono">
                    Cross-entropy gradient dL/dz
                  </p>
                  <MatrixDisplay m={ceResult.grad} />
                </div>
              ) : null}
            </>
          )}
        </section>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <MatrixInput
          title="Softmax logits row z (1 x C)"
          value={softmaxRow}
          onChange={setSoftmaxRow}
        />
        <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
          <h3 className="text-lg font-semibold">Softmax Jacobian</h3>
          {jacobianResult.error ? (
            <p className="text-destructive font-mono text-sm">{jacobianResult.error}</p>
          ) : jacobianResult.jacobian ? (
            <MatrixDisplay m={jacobianResult.jacobian} />
          ) : null}
        </section>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-4">
          <MatrixInput
            title="Linear recap X (batch x in_features)"
            value={linX}
            onChange={setLinX}
          />
          <MatrixInput
            title="Linear recap W (in_features x out_features)"
            value={linW}
            onChange={setLinW}
          />
          <MatrixInput
            title="Linear recap dY (batch x out_features)"
            value={linDY}
            onChange={setLinDY}
          />
        </div>
        <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
          <h3 className="text-lg font-semibold">Linear backward recap</h3>
          {linearRecap.error ? (
            <p className="text-destructive font-mono text-sm">{linearRecap.error}</p>
          ) : (
            <>
              {linearRecap.dW ? (
                <div className="space-y-1 overflow-x-auto">
                  <p className="text-sm text-muted-foreground font-mono">dW = X^T dY</p>
                  <MatrixDisplay m={linearRecap.dW} />
                </div>
              ) : null}
              {linearRecap.dX ? (
                <div className="space-y-1 overflow-x-auto">
                  <p className="text-sm text-muted-foreground font-mono">dX = dY W^T</p>
                  <MatrixDisplay m={linearRecap.dX} />
                </div>
              ) : null}
              {linearRecap.db ? (
                <div className="space-y-1 overflow-x-auto">
                  <p className="text-sm text-muted-foreground font-mono">db = row-wise sum(dY)</p>
                  <MatrixDisplay m={linearRecap.db} />
                </div>
              ) : null}
            </>
          )}
        </section>
      </div>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}
