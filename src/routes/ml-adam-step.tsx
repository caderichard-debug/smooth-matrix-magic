import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { MatrixInput } from "@/components/MatrixInput";
import { AdSlot } from "@/components/AdSlot";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fromNumbers, type Matrix } from "@/lib/matrix";
import { adamStep, gridToMatrix, matrixToGrid } from "@/lib/mlOps";

export const Route = createFileRoute("/ml-adam-step")({
  head: () => ({
    meta: [
      { title: "Adam Optimizer Step Calculator — Matrix Parameter Update" },
      {
        name: "description",
        content:
          "Run one Adam optimizer update on matrix parameters from gradients, first moments, and second moments with bias correction.",
      },
      { property: "og:title", content: "Adam Optimizer Step Calculator" },
      {
        property: "og:description",
        content:
          "Compute one Adam update with optional decoupled weight decay and view all intermediate matrices.",
      },
    ],
  }),
  component: MlAdamStepPage,
});

function MlAdamStepPage() {
  const [params, setParams] = useState<Matrix>(() =>
    fromNumbers([
      [0.4, -0.8],
      [1.2, -0.5],
    ]),
  );
  const [grads, setGrads] = useState<Matrix>(() =>
    fromNumbers([
      [0.1, -0.2],
      [0.05, -0.1],
    ]),
  );
  const [m, setM] = useState<Matrix>(() =>
    fromNumbers([
      [0, 0],
      [0, 0],
    ]),
  );
  const [v, setV] = useState<Matrix>(() =>
    fromNumbers([
      [0, 0],
      [0, 0],
    ]),
  );

  const [tStr, setTStr] = useState("0");
  const [lrStr, setLrStr] = useState("0.01");
  const [beta1Str, setBeta1Str] = useState("0.9");
  const [beta2Str, setBeta2Str] = useState("0.999");
  const [epsStr, setEpsStr] = useState("1e-8");
  const [weightDecayStr, setWeightDecayStr] = useState("0");

  const result = useMemo(() => {
    try {
      const t = Number(tStr);
      const lr = Number(lrStr);
      const beta1 = Number(beta1Str);
      const beta2 = Number(beta2Str);
      const eps = Number(epsStr);
      const weightDecay = Number(weightDecayStr);
      if (
        !Number.isFinite(t) ||
        !Number.isInteger(t) ||
        !Number.isFinite(lr) ||
        !Number.isFinite(beta1) ||
        !Number.isFinite(beta2) ||
        !Number.isFinite(eps) ||
        !Number.isFinite(weightDecay)
      ) {
        return {
          error: "All scalar controls must be valid numbers.",
          data: null as null | ReturnType<typeof adamStep>,
        };
      }
      const step = adamStep(
        matrixToGrid(params, "Parameters"),
        matrixToGrid(grads, "Gradients"),
        matrixToGrid(m, "First moment m"),
        matrixToGrid(v, "Second moment v"),
        t,
        lr,
        beta1,
        beta2,
        eps,
        weightDecay,
      );
      return { error: null as string | null, data: step };
    } catch (e) {
      return {
        error: e instanceof Error ? e.message : "Error",
        data: null as null | ReturnType<typeof adamStep>,
      };
    }
  }, [params, grads, m, v, tStr, lrStr, beta1Str, beta2Str, epsStr, weightDecayStr]);

  return (
    <PageLayout
      title="Adam Optimizer Step"
      tagline="One update of m, v, bias-corrected moments, and parameters for matrix-shaped weights."
      showHowItWorks={false}
    >
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-4">
          <MatrixInput title="Parameters θ (numeric)" value={params} onChange={setParams} />
          <MatrixInput title="Gradients g (numeric)" value={grads} onChange={setGrads} />
          <MatrixInput title="First moment m (numeric)" value={m} onChange={setM} />
          <MatrixInput title="Second moment v (numeric)" value={v} onChange={setV} />
          <div className="grid sm:grid-cols-3 gap-4">
            <ScalarInput id="adam-t" label="Current step t" value={tStr} onChange={setTStr} />
            <ScalarInput id="adam-lr" label="Learning rate η" value={lrStr} onChange={setLrStr} />
            <ScalarInput id="adam-b1" label="beta1" value={beta1Str} onChange={setBeta1Str} />
            <ScalarInput id="adam-b2" label="beta2" value={beta2Str} onChange={setBeta2Str} />
            <ScalarInput id="adam-eps" label="epsilon" value={epsStr} onChange={setEpsStr} />
            <ScalarInput
              id="adam-wd"
              label="Weight decay λ"
              value={weightDecayStr}
              onChange={setWeightDecayStr}
            />
          </div>
        </div>
        <section className="rounded-lg border border-border bg-card/40 p-6 space-y-4">
          <h2 className="text-xl font-semibold">Updated outputs</h2>
          {result.error ? (
            <p className="text-destructive font-mono text-sm">{result.error}</p>
          ) : (
            result.data && (
              <div className="space-y-4 overflow-x-auto">
                <p className="text-sm text-muted-foreground">Returned step: t = {result.data.t}</p>
                <OutputMatrix
                  title="Updated parameters θ'"
                  matrix={gridToMatrix(result.data.params)}
                />
                <OutputMatrix
                  title="Updated first moment m'"
                  matrix={gridToMatrix(result.data.m)}
                />
                <OutputMatrix
                  title="Updated second moment v'"
                  matrix={gridToMatrix(result.data.v)}
                />
                <OutputMatrix
                  title="Bias-corrected m_hat"
                  matrix={gridToMatrix(result.data.mHat)}
                />
                <OutputMatrix
                  title="Bias-corrected v_hat"
                  matrix={gridToMatrix(result.data.vHat)}
                />
              </div>
            )
          )}
        </section>
      </div>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold">How it works</h2>
        <p className="text-sm text-muted-foreground">
          Adam tracks an exponential moving average of gradients and squared gradients, then applies
          bias correction at step <span className="font-mono">t+1</span>:
          <span className="font-mono"> m' = β1 m + (1-β1)g</span>,{" "}
          <span className="font-mono">v' = β2 v + (1-β2)g^2</span>,{" "}
          <span className="font-mono">m_hat = m'/(1-β1^(t+1))</span>,{" "}
          <span className="font-mono">v_hat = v'/(1-β2^(t+1))</span>.
        </p>
        <p className="text-sm text-muted-foreground">
          The parameter update is{" "}
          <span className="font-mono">
            θ' = θ - η * m_hat / (sqrt(v_hat) + epsilon) - η * λ * θ
          </span>
          , where the final term is optional decoupled weight decay.
        </p>
      </section>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}

function ScalarInput({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="font-mono"
      />
    </div>
  );
}

function OutputMatrix({ title, matrix }: { title: string; matrix: Matrix }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{title}</p>
      <MatrixDisplay m={matrix} />
    </div>
  );
}
