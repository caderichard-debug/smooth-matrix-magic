import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { AdSlot } from "@/components/AdSlot";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fromNumbers, formatNumber, type Matrix } from "@/lib/matrix";
import { batchNormInference, gridToMatrix, layerNorm, matrixToGrid, rmsNorm } from "@/lib/mlOps";

export const Route = createFileRoute("/ml-normalization")({
  head: () => ({
    meta: [
      { title: "Normalization Calculator — BatchNorm, LayerNorm, RMSNorm" },
      {
        name: "description",
        content:
          "Apply BatchNorm inference, row-wise LayerNorm, or row-wise RMSNorm on numeric matrices with configurable gamma, beta, running statistics, and epsilon.",
      },
      { property: "og:title", content: "BatchNorm, LayerNorm & RMSNorm Calculator" },
      {
        property: "og:description",
        content:
          "Feature-wise BatchNorm inference and row-wise LayerNorm/RMSNorm with affine scaling.",
      },
    ],
  }),
  component: MlNormalizationPage,
});

function MlNormalizationPage() {
  const [x, setX] = useState<Matrix>(() =>
    fromNumbers([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ]),
  );
  const [gammaM, setGammaM] = useState<Matrix>(() => fromNumbers([[1, 1, 1]]));
  const [betaM, setBetaM] = useState<Matrix>(() => fromNumbers([[0, 0, 0]]));
  const [runningMeanM, setRunningMeanM] = useState<Matrix>(() => fromNumbers([[4, 5, 6]]));
  const [runningVarM, setRunningVarM] = useState<Matrix>(() => fromNumbers([[6, 6, 6]]));
  const [epsStr, setEpsStr] = useState("1e-5");

  const result = useMemo(() => {
    try {
      const eps = Number(epsStr);
      if (!Number.isFinite(eps)) {
        return {
          batchNorm: null as Matrix | null,
          layerNorm: null as Matrix | null,
          rmsNorm: null as Matrix | null,
          batchError: "eps must be a number.",
          layerError: "eps must be a number.",
          rmsError: "eps must be a number.",
        };
      }
      const xGrid = matrixToGrid(x, "Input matrix X");
      const gammaGrid = matrixToGrid(gammaM, "gamma");
      const betaGrid = matrixToGrid(betaM, "beta");
      const runningMeanGrid = matrixToGrid(runningMeanM, "runningMean");
      const runningVarGrid = matrixToGrid(runningVarM, "runningVar");
      if (
        gammaGrid.length !== 1 ||
        betaGrid.length !== 1 ||
        runningMeanGrid.length !== 1 ||
        runningVarGrid.length !== 1
      ) {
        return {
          batchNorm: null as Matrix | null,
          layerNorm: null as Matrix | null,
          rmsNorm: null as Matrix | null,
          batchError: "gamma, beta, runningMean, and runningVar must be 1×D row vectors.",
          layerError: "gamma, beta, runningMean, and runningVar must be 1×D row vectors.",
          rmsError: "gamma, beta, runningMean, and runningVar must be 1×D row vectors.",
        };
      }

      let batch: number[][] | null = null;
      let layer: number[][] | null = null;
      let rms: number[][] | null = null;
      let batchError: string | null = null;
      let layerError: string | null = null;
      let rmsError: string | null = null;
      try {
        batch = batchNormInference(
          xGrid,
          gammaGrid[0],
          betaGrid[0],
          runningMeanGrid[0],
          runningVarGrid[0],
          eps,
        );
      } catch (e) {
        batchError = e instanceof Error ? e.message : "BatchNorm error";
      }
      try {
        layer = layerNorm(xGrid, gammaGrid[0], betaGrid[0], eps);
      } catch (e) {
        layerError = e instanceof Error ? e.message : "LayerNorm error";
      }
      try {
        rms = rmsNorm(xGrid, gammaGrid[0], eps);
      } catch (e) {
        rmsError = e instanceof Error ? e.message : "RMSNorm error";
      }
      return {
        batchNorm: batch ? gridToMatrix(batch) : null,
        layerNorm: layer ? gridToMatrix(layer) : null,
        rmsNorm: rms ? gridToMatrix(rms) : null,
        batchError,
        layerError,
        rmsError,
      };
    } catch (e) {
      return {
        batchNorm: null as Matrix | null,
        layerNorm: null as Matrix | null,
        rmsNorm: null as Matrix | null,
        batchError: e instanceof Error ? e.message : "Error",
        layerError: e instanceof Error ? e.message : "Error",
        rmsError: e instanceof Error ? e.message : "Error",
      };
    }
  }, [x, gammaM, betaM, runningMeanM, runningVarM, epsStr]);

  return (
    <PageLayout
      title="BatchNorm Inference + LayerNorm + RMSNorm"
      tagline="Compare BatchNorm, LayerNorm, and RMSNorm normalization styles side-by-side."
      showHowItWorks={false}
    >
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-4">
          <MatrixInput title="Input X (N×D, numeric)" value={x} onChange={setX} />
          <MatrixInput title="gamma (1×D scale)" value={gammaM} onChange={setGammaM} />
          <MatrixInput title="beta (1×D shift)" value={betaM} onChange={setBetaM} />
          <MatrixInput
            title="runningMean (1×D, BatchNorm inference)"
            value={runningMeanM}
            onChange={setRunningMeanM}
          />
          <MatrixInput
            title="runningVar (1×D, non-negative)"
            value={runningVarM}
            onChange={setRunningVarM}
          />
          <div className="space-y-1 max-w-48">
            <Label htmlFor="norm-eps">epsilon (eps)</Label>
            <Input
              id="norm-eps"
              className="font-mono"
              value={epsStr}
              onChange={(e) => setEpsStr(e.target.value)}
              inputMode="decimal"
            />
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-lg border border-border bg-card/40 p-6">
            <h2 className="text-xl font-semibold mb-3">BatchNorm inference output</h2>
            {result.batchError ? (
              <p className="text-destructive font-mono text-sm">{result.batchError}</p>
            ) : (
              result.batchNorm && (
                <div className="overflow-x-auto">
                  <MatrixDisplay m={result.batchNorm} />
                </div>
              )
            )}
          </section>

          <section className="rounded-lg border border-border bg-card/40 p-6">
            <h2 className="text-xl font-semibold mb-3">LayerNorm output (row-wise)</h2>
            {result.layerError ? (
              <p className="text-destructive font-mono text-sm">{result.layerError}</p>
            ) : (
              result.layerNorm && (
                <div className="overflow-x-auto">
                  <MatrixDisplay m={result.layerNorm} />
                </div>
              )
            )}
          </section>

          <section className="rounded-lg border border-border bg-card/40 p-6">
            <h2 className="text-xl font-semibold mb-3">RMSNorm output (row-wise, no beta)</h2>
            {result.rmsError ? (
              <p className="text-destructive font-mono text-sm">{result.rmsError}</p>
            ) : (
              result.rmsNorm && (
                <div className="overflow-x-auto">
                  <MatrixDisplay m={result.rmsNorm} />
                </div>
              )
            )}
          </section>
        </div>
      </div>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold">How normalization works</h2>
        <p className="text-sm text-muted-foreground">
          BatchNorm and LayerNorm standardize activations before an affine transform. For a scalar
          activation x, one normalized value is{" "}
          <span className="font-mono">x̂ = (x - μ) / sqrt(σ² + ε)</span>, then output is{" "}
          <span className="font-mono">y = γx̂ + β</span>. The small epsilon{" "}
          <span className="font-mono">{formatNumber(1e-5)}</span> (or your chosen value) prevents
          division by zero when variance is tiny.
        </p>
        <p className="text-sm text-muted-foreground">
          BatchNorm inference uses stored per-feature running statistics: for feature index j and
          sample i,{" "}
          <span className="font-mono">
            y[i,j] = γ[j] * (X[i,j] - μ_running[j]) / sqrt(σ²_running[j] + ε) + β[j]
          </span>
          . Statistics are fixed at inference time.
        </p>
        <p className="text-sm text-muted-foreground">
          LayerNorm normalizes each row independently (across features). For row i with D features,
          <span className="font-mono"> μ_i = (1/D) Σ_j X[i,j]</span> and{" "}
          <span className="font-mono">σ²_i = (1/D) Σ_j (X[i,j] - μ_i)²</span>, then apply{" "}
          <span className="font-mono">y[i,j] = γ[j] * x̂[i,j] + β[j]</span>.
        </p>
        <p className="text-sm text-muted-foreground">
          RMSNorm removes mean-centering and normalizes by root-mean-square magnitude only. For row
          i, define <span className="font-mono">RMS_i = sqrt((1/D) Σ_j X[i,j]² + ε)</span>, then
          compute <span className="font-mono">y[i,j] = γ[j] * X[i,j] / RMS_i</span>. There is no
          additive beta term, so RMSNorm keeps sign structure while stabilizing feature scale.
        </p>
        <p className="text-sm text-muted-foreground">
          Note: the <span className="font-mono">beta</span> input applies to BatchNorm and
          LayerNorm. RMSNorm uses only <span className="font-mono">gamma</span>.
        </p>
        <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
          <li>
            BatchNorm couples samples through global running feature statistics; LayerNorm does not.
          </li>
          <li>
            Both return the same shape as X and preserve feature indexing for affine parameters.
          </li>
          <li>
            RMSNorm is often used in transformer blocks because it is simpler than LayerNorm while
            still controlling row activation scale.
          </li>
          <li>When gamma is ones and beta is zeros, outputs are purely normalized activations.</li>
        </ul>
      </section>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}
