import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { MatrixInput } from "@/components/MatrixInput";
import { AdSlot } from "@/components/AdSlot";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fromNumbers, type Matrix } from "@/lib/matrix";
import { adamStep, gridToMatrix, matrixToGrid, momentumStep, sgdStep } from "@/lib/mlOps";

export const Route = createFileRoute("/ml-optimizer-steps")({
  head: () => ({
    meta: [
      { title: "Optimizer Step Math — SGD vs Momentum vs Adam" },
      {
        name: "description",
        content:
          "Compare one-step parameter updates for SGD, Momentum, and Adam on the same matrix gradients.",
      },
      { property: "og:title", content: "Optimizer Step Comparison Calculator" },
      {
        property: "og:description",
        content:
          "Side-by-side SGD, Momentum, and Adam update equations with matrix outputs and optimizer state.",
      },
    ],
  }),
  component: MlOptimizerStepsPage,
});

function MlOptimizerStepsPage() {
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
  const [velocity, setVelocity] = useState<Matrix>(() =>
    fromNumbers([
      [0, 0],
      [0, 0],
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

  const [lrStr, setLrStr] = useState("0.01");
  const [momentumStr, setMomentumStr] = useState("0.9");
  const [tStr, setTStr] = useState("0");
  const [beta1Str, setBeta1Str] = useState("0.9");
  const [beta2Str, setBeta2Str] = useState("0.999");
  const [epsStr, setEpsStr] = useState("1e-8");

  const result = useMemo(() => {
    try {
      const lr = Number(lrStr);
      const momentum = Number(momentumStr);
      const t = Number(tStr);
      const beta1 = Number(beta1Str);
      const beta2 = Number(beta2Str);
      const eps = Number(epsStr);
      if (
        !Number.isFinite(lr) ||
        !Number.isFinite(momentum) ||
        !Number.isFinite(t) ||
        !Number.isFinite(beta1) ||
        !Number.isFinite(beta2) ||
        !Number.isFinite(eps)
      ) {
        return { error: "All scalar controls must be valid numbers.", data: null };
      }

      const numericParams = matrixToGrid(params, "Parameters");
      const numericGrads = matrixToGrid(grads, "Gradients");
      const numericVelocity = matrixToGrid(velocity, "Velocity");
      const numericM = matrixToGrid(m, "First moment m");
      const numericV = matrixToGrid(v, "Second moment v");

      const sgd = sgdStep(numericParams, numericGrads, lr);
      const momentumOut = momentumStep(numericParams, numericGrads, numericVelocity, lr, momentum);
      const adam = adamStep(
        numericParams,
        numericGrads,
        numericM,
        numericV,
        t,
        lr,
        beta1,
        beta2,
        eps,
      );
      return {
        error: null as string | null,
        data: { sgd, momentumOut, adam },
      };
    } catch (e) {
      return {
        error: e instanceof Error ? e.message : "Error",
        data: null,
      };
    }
  }, [params, grads, velocity, m, v, lrStr, momentumStr, tStr, beta1Str, beta2Str, epsStr]);

  return (
    <PageLayout
      title="Optimizer Step Math"
      tagline="Compare one matrix update step from SGD, Momentum, and Adam under the same gradients."
      showHowItWorks={false}
    >
      <div className="grid xl:grid-cols-2 gap-6 items-start">
        <div className="space-y-4">
          <MatrixInput title="Parameters θ (numeric)" value={params} onChange={setParams} />
          <MatrixInput title="Gradients g (numeric)" value={grads} onChange={setGrads} />
          <MatrixInput
            title="Momentum velocity v (numeric)"
            value={velocity}
            onChange={setVelocity}
          />
          <MatrixInput title="Adam first moment m (numeric)" value={m} onChange={setM} />
          <MatrixInput title="Adam second moment v (numeric)" value={v} onChange={setV} />
          <div className="grid sm:grid-cols-3 gap-4">
            <ScalarInput id="opt-lr" label="Learning rate η" value={lrStr} onChange={setLrStr} />
            <ScalarInput
              id="opt-momentum"
              label="Momentum μ"
              value={momentumStr}
              onChange={setMomentumStr}
            />
            <ScalarInput id="opt-t" label="Adam step t" value={tStr} onChange={setTStr} />
            <ScalarInput id="opt-b1" label="Adam beta1" value={beta1Str} onChange={setBeta1Str} />
            <ScalarInput id="opt-b2" label="Adam beta2" value={beta2Str} onChange={setBeta2Str} />
            <ScalarInput id="opt-eps" label="Adam epsilon" value={epsStr} onChange={setEpsStr} />
          </div>
        </div>

        <section className="rounded-lg border border-border bg-card/40 p-6 space-y-4">
          <h2 className="text-xl font-semibold">One-step outputs</h2>
          {result.error ? (
            <p className="text-destructive font-mono text-sm">{result.error}</p>
          ) : (
            result.data && (
              <div className="grid md:grid-cols-3 gap-4 overflow-x-auto">
                <OptimizerResultCard
                  title="SGD"
                  equation="θ' = θ - ηg"
                  matrix={gridToMatrix(result.data.sgd)}
                />
                <OptimizerResultCard
                  title="Momentum"
                  equation="v' = μv + g, θ' = θ - ηv'"
                  matrix={gridToMatrix(result.data.momentumOut.params)}
                  auxLabel="Updated velocity v'"
                  auxMatrix={gridToMatrix(result.data.momentumOut.velocity)}
                />
                <OptimizerResultCard
                  title="Adam"
                  equation="θ' = θ - η * m_hat / (sqrt(v_hat) + eps)"
                  matrix={gridToMatrix(result.data.adam.params)}
                  auxLabel={`Returned t = ${result.data.adam.t}`}
                />
              </div>
            )
          )}
        </section>
      </div>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold">How these updates differ</h2>
        <p className="text-sm text-muted-foreground">
          SGD takes a direct gradient step per parameter element. Momentum smooths noisy directions
          by carrying a velocity state that accumulates gradients over time.
        </p>
        <p className="text-sm text-muted-foreground">
          Adam tracks first and second moments, then bias-corrects both and applies an adaptive
          per-parameter step size through <span className="font-mono">sqrt(v_hat) + eps</span> in
          the denominator.
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

function OptimizerResultCard({
  title,
  equation,
  matrix,
  auxLabel,
  auxMatrix,
}: {
  title: string;
  equation: string;
  matrix: Matrix;
  auxLabel?: string;
  auxMatrix?: Matrix;
}) {
  return (
    <div className="rounded-md border border-border/70 bg-background/50 p-3 space-y-2 min-w-[220px]">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="text-xs text-muted-foreground font-mono">{equation}</p>
      <MatrixDisplay m={matrix} />
      {auxLabel ? <p className="text-xs text-muted-foreground">{auxLabel}</p> : null}
      {auxMatrix ? <MatrixDisplay m={auxMatrix} /> : null}
    </div>
  );
}
