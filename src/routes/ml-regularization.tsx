import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { MatrixInput } from "@/components/MatrixInput";
import { AdSlot } from "@/components/AdSlot";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { fromNumbers, type Matrix } from "@/lib/matrix";
import { applyDropout, gridToMatrix, l2WeightDecayStep, matrixToGrid } from "@/lib/mlOps";

export const Route = createFileRoute("/ml-regularization")({
  head: () => ({
    meta: [
      { title: "Regularization Ops — L2 Weight Decay and Dropout" },
      {
        name: "description",
        content:
          "Explore L2 weight decay update math and inverted dropout masking with deterministic masks or random sampling.",
      },
      { property: "og:title", content: "L2 Weight Decay and Dropout Calculator" },
      {
        property: "og:description",
        content:
          "Interactive regularization demos: SGD-style L2 step and inverted dropout scaling.",
      },
    ],
  }),
  component: MlRegularizationPage,
});

function MlRegularizationPage() {
  const [params, setParams] = useState<Matrix>(() =>
    fromNumbers([
      [1.2, -0.8, 0.3],
      [0.5, -1.4, 2],
    ]),
  );
  const [grads, setGrads] = useState<Matrix>(() =>
    fromNumbers([
      [0.1, -0.2, 0.05],
      [0.3, 0.4, -0.1],
    ]),
  );
  const [lrStr, setLrStr] = useState("0.01");
  const [weightDecayStr, setWeightDecayStr] = useState("0.05");

  const [dropInput, setDropInput] = useState<Matrix>(() =>
    fromNumbers([
      [2, 4, 6],
      [1, 3, 5],
    ]),
  );
  const [keepProbStr, setKeepProbStr] = useState("0.8");
  const [useCustomMask, setUseCustomMask] = useState(true);
  const [maskInput, setMaskInput] = useState<Matrix>(() =>
    fromNumbers([
      [1, 1, 0],
      [0, 1, 1],
    ]),
  );

  const l2Result = useMemo(() => {
    try {
      const lr = Number(lrStr);
      const weightDecay = Number(weightDecayStr);
      const out = l2WeightDecayStep(
        matrixToGrid(params, "Parameters"),
        matrixToGrid(grads, "Gradients"),
        lr,
        weightDecay,
      );
      return { output: gridToMatrix(out), error: null as string | null };
    } catch (e) {
      return { output: null as Matrix | null, error: e instanceof Error ? e.message : "Error" };
    }
  }, [params, grads, lrStr, weightDecayStr]);

  const dropoutResult = useMemo(() => {
    try {
      const keepProb = Number(keepProbStr);
      const parsedMask = useCustomMask ? matrixToGrid(maskInput, "Dropout mask") : undefined;
      const out = applyDropout(matrixToGrid(dropInput, "Dropout input"), keepProb, parsedMask);
      return {
        output: gridToMatrix(out.output),
        sampledMask: gridToMatrix(out.mask),
        error: null as string | null,
      };
    } catch (e) {
      return {
        output: null as Matrix | null,
        sampledMask: null as Matrix | null,
        error: e instanceof Error ? e.message : "Error",
      };
    }
  }, [dropInput, keepProbStr, maskInput, useCustomMask]);

  return (
    <PageLayout
      title="Regularization Ops"
      tagline="Compare an L2 weight-decay update and inverted-dropout masking with optional deterministic masks."
      showHowItWorks={false}
    >
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <section className="rounded-lg border border-border bg-card/40 p-6 space-y-4">
          <h2 className="text-xl font-semibold">L2 weight decay step</h2>
          <MatrixInput title="Parameters W" value={params} onChange={setParams} />
          <MatrixInput title="Gradients dW" value={grads} onChange={setGrads} />
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="l2-lr">learning rate (lr)</Label>
              <Input
                id="l2-lr"
                className="font-mono"
                value={lrStr}
                onChange={(e) => setLrStr(e.target.value)}
                inputMode="decimal"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="l2-wd">weight decay (lambda)</Label>
              <Input
                id="l2-wd"
                className="font-mono"
                value={weightDecayStr}
                onChange={(e) => setWeightDecayStr(e.target.value)}
                inputMode="decimal"
              />
            </div>
          </div>
          {l2Result.error ? (
            <p className="text-destructive font-mono text-sm">{l2Result.error}</p>
          ) : (
            l2Result.output && (
              <div className="space-y-2 overflow-x-auto">
                <p className="text-sm text-muted-foreground font-mono">
                  W_next = W - lr * (dW + lambda * W)
                </p>
                <MatrixDisplay m={l2Result.output} />
              </div>
            )
          )}
        </section>

        <section className="rounded-lg border border-border bg-card/40 p-6 space-y-4">
          <h2 className="text-xl font-semibold">Dropout (inverted scaling)</h2>
          <MatrixInput title="Activations X" value={dropInput} onChange={setDropInput} />
          <div className="space-y-1 max-w-56">
            <Label htmlFor="drop-keep-prob">keep probability (p)</Label>
            <Input
              id="drop-keep-prob"
              className="font-mono"
              value={keepProbStr}
              onChange={(e) => setKeepProbStr(e.target.value)}
              inputMode="decimal"
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="use-custom-dropout-mask"
              checked={useCustomMask}
              onCheckedChange={(checked) => setUseCustomMask(checked === true)}
            />
            <Label htmlFor="use-custom-dropout-mask">
              Use custom deterministic mask (turn off for random mask sampling)
            </Label>
          </div>
          {useCustomMask ? (
            <MatrixInput
              title="Mask M (0/1, deterministic)"
              value={maskInput}
              onChange={setMaskInput}
            />
          ) : null}
          {dropoutResult.error ? (
            <p className="text-destructive font-mono text-sm">{dropoutResult.error}</p>
          ) : (
            dropoutResult.output &&
            dropoutResult.sampledMask && (
              <div className="space-y-3 overflow-x-auto">
                <p className="text-sm text-muted-foreground font-mono">Y = (X * M) / p</p>
                <div>
                  <p className="text-sm font-medium mb-1">Applied mask</p>
                  <MatrixDisplay m={dropoutResult.sampledMask} />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Dropout output</p>
                  <MatrixDisplay m={dropoutResult.output} />
                </div>
              </div>
            )
          )}
        </section>
      </div>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold">How these regularizers work</h2>
        <p className="text-sm text-muted-foreground">
          L2 regularization penalizes large weights by adding{" "}
          <span className="font-mono">lambda * W</span> to the gradient. In one SGD-style step:{" "}
          <span className="font-mono">W_next = W - lr * (dW + lambda * W)</span>. This nudges
          parameters toward zero while still following task gradients.
        </p>
        <p className="text-sm text-muted-foreground">
          Dropout randomly drops units with probability <span className="font-mono">1 - p</span>. In
          inverted dropout, train-time output is <span className="font-mono">Y = (X * M) / p</span>{" "}
          where mask entries are 0 or 1. Scaling by <span className="font-mono">1/p</span> keeps
          expected activation magnitude stable, so inference can use raw activations without
          additional scaling.
        </p>
        <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
          <li>L2 regularization is a smooth shrinkage pressure applied every optimizer step.</li>
          <li>Dropout is stochastic structural noise that discourages co-adaptation.</li>
          <li>Supplying a fixed 0/1 mask makes dropout behavior deterministic and testable.</li>
        </ul>
      </section>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}
