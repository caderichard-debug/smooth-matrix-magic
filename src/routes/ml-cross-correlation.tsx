import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { AdSlot } from "@/components/AdSlot";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fromNumbers, type Matrix } from "@/lib/matrix";
import { correlate2d, gridToMatrix, matrixToGrid } from "@/lib/mlOps";

export const Route = createFileRoute("/ml-cross-correlation")({
  head: () => ({
    meta: [
      { title: "2D Cross-Correlation Calculator — Sliding Dot Product" },
      {
        name: "description",
        content:
          "Compute 2D cross-correlation (no kernel flip) between a numeric feature map and filter, with stride and zero padding.",
      },
      { property: "og:title", content: "2D Cross-Correlation Calculator" },
      {
        property: "og:description",
        content:
          "Sliding dot product used in many CNN implementations, distinct from mathematical convolution.",
      },
    ],
  }),
  component: MlCrossCorrelationPage,
});

function MlCrossCorrelationPage() {
  const [feature, setFeature] = useState<Matrix>(() =>
    fromNumbers([
      [1, 0, 2],
      [0, 1, 1],
      [3, 2, 0],
    ]),
  );
  const [kernel, setKernel] = useState<Matrix>(() =>
    fromNumbers([
      [1, -1],
      [0, 1],
    ]),
  );
  const [strideStr, setStrideStr] = useState("1");
  const [padStr, setPadStr] = useState("0");

  const result = useMemo(() => {
    try {
      const stride = Number.parseInt(strideStr, 10);
      const pad = Number.parseInt(padStr, 10);
      if (!Number.isFinite(stride) || !Number.isFinite(pad)) {
        return { matrix: null as Matrix | null, error: "Stride and padding must be integers." };
      }
      const fin = matrixToGrid(feature, "Feature map");
      const ker = matrixToGrid(kernel, "Kernel");
      const grid = correlate2d(fin, ker, stride, pad);
      return { matrix: gridToMatrix(grid), error: null as string | null };
    } catch (e) {
      return {
        matrix: null as Matrix | null,
        error: e instanceof Error ? e.message : "Error",
      };
    }
  }, [feature, kernel, strideStr, padStr]);

  return (
    <PageLayout
      title="2D Cross-Correlation"
      tagline="Sliding inner product without flipping the kernel — the operation most CNN toolkits call convolution."
      showHowItWorks={false}
    >
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-4">
          <MatrixInput title="Feature map (numeric)" value={feature} onChange={setFeature} />
          <MatrixInput title="Filter / kernel (numeric)" value={kernel} onChange={setKernel} />
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1">
              <Label htmlFor="xcorr-stride">Stride</Label>
              <Input
                id="xcorr-stride"
                className="w-24 font-mono"
                value={strideStr}
                onChange={(e) => setStrideStr(e.target.value)}
                inputMode="numeric"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="xcorr-pad">Zero padding (per side)</Label>
              <Input
                id="xcorr-pad"
                className="w-24 font-mono"
                value={padStr}
                onChange={(e) => setPadStr(e.target.value)}
                inputMode="numeric"
              />
            </div>
          </div>
        </div>
        <section className="rounded-lg border border-border bg-card/40 p-6">
          <h2 className="text-xl font-semibold mb-3">Response map</h2>
          {result.error ? (
            <p className="text-destructive font-mono text-sm">{result.error}</p>
          ) : (
            result.matrix && (
              <div className="overflow-x-auto">
                <MatrixDisplay m={result.matrix} />
              </div>
            )
          )}
        </section>
      </div>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold">How cross-correlation differs from convolution</h2>
        <p className="text-sm text-muted-foreground">
          Cross-correlation aligns the kernel with the input without reversing it. For each output
          position, you multiply overlapping entries and sum. Mathematical convolution uses the same
          sliding pattern after flipping the kernel in both spatial dimensions.
        </p>
        <p className="text-sm text-muted-foreground">
          When a kernel is symmetric (for example, a Gaussian or Laplacian mask), convolution and
          cross-correlation coincide. For asymmetric filters, the two maps are related by a fixed
          spatial flip of the weights.
        </p>
        <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
          <li>
            Formula: (I ⊙ K)[y,x] = sum_i sum_j I&apos;[y*s+i, x*s+j] K[i,j] with no kernel reversal.
          </li>
          <li>
            Template matching view: larger output values indicate stronger local similarity to K.
          </li>
          <li>
            If K is rotated 180 degrees first, this operation becomes mathematical convolution.
          </li>
        </ul>
      </section>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}
