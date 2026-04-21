import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { AdSlot } from "@/components/AdSlot";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fromNumbers, type Matrix } from "@/lib/matrix";
import { convolve2d, gridToMatrix, matrixToGrid } from "@/lib/mlOps";

export const Route = createFileRoute("/ml-convolution")({
  head: () => ({
    meta: [
      { title: "2D Convolution Calculator — Feature Map & Kernel" },
      {
        name: "description",
        content:
          "Compute discrete 2D convolution with zero padding and stride. Numeric feature maps and kernels up to modest sizes, ideal for coursework and intuition.",
      },
      { property: "og:title", content: "2D Convolution Calculator" },
      {
        property: "og:description",
        content:
          "True 2D convolution (kernel flipped vs cross-correlation) with padding and stride in the browser.",
      },
    ],
  }),
  component: MlConvolutionPage,
});

function MlConvolutionPage() {
  const [feature, setFeature] = useState<Matrix>(() =>
    fromNumbers([
      [1, 2, 0, 1],
      [0, 1, 3, 2],
      [4, 0, 1, 0],
      [0, 2, 1, 1],
    ]),
  );
  const [kernel, setKernel] = useState<Matrix>(() =>
    fromNumbers([
      [1, 0, -1],
      [0, 1, 0],
      [-1, 0, 1],
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
      const grid = convolve2d(fin, ker, stride, pad);
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
      title="2D Convolution"
      tagline="Discrete full 2D convolution: slide a spatially flipped kernel, sum products, with zero padding and stride."
      showHowItWorks={false}
    >
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-4">
          <MatrixInput title="Feature map (numeric)" value={feature} onChange={setFeature} />
          <MatrixInput title="Kernel (numeric)" value={kernel} onChange={setKernel} />
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1">
              <Label htmlFor="conv-stride">Stride</Label>
              <Input
                id="conv-stride"
                className="w-24 font-mono"
                value={strideStr}
                onChange={(e) => setStrideStr(e.target.value)}
                inputMode="numeric"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="conv-pad">Zero padding (per side)</Label>
              <Input
                id="conv-pad"
                className="w-24 font-mono"
                value={padStr}
                onChange={(e) => setPadStr(e.target.value)}
                inputMode="numeric"
              />
            </div>
          </div>
        </div>
        <section className="rounded-lg border border-border bg-card/40 p-6">
          <h2 className="text-xl font-semibold mb-3">Output feature map</h2>
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
        <h2 className="text-xl font-semibold">How 2D convolution works</h2>
        <p className="text-sm text-muted-foreground">
          Let I be the input map and K the kernel. True convolution forms I * K by flipping K both
          vertically and horizontally, then computing the 2D cross-correlation (sliding inner
          product) between the flipped kernel and I. With zero padding p and stride s, each output
          cell accumulates products over the kernel support on the padded map I&apos;.
        </p>
        <p className="text-sm text-muted-foreground">
          Output height and width follow the usual formula: with padded size H&apos; = H + 2p and
          kernel height k_h, the number of vertical positions is{" "}
          <span className="font-mono">⌊(H&apos; − k_h) / s⌋ + 1</span> (and similarly for width).
          Many deep-learning libraries expose <em>cross-correlation</em> under the name
          &quot;convolution&quot;; this page uses the mathematical convolution (kernel flip) so you
          can compare both conventions on the cross-correlation tool.
        </p>
        <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
          <li>
            Linearity: (aI1 + bI2) * K = a(I1 * K) + b(I2 * K), so convolution distributes over sums.
          </li>
          <li>
            Shift behavior: translating the input translates the response (away from boundary effects).
          </li>
          <li>
            Boundary handling matters: zero padding adds implicit zeros, which can attenuate edge
            responses compared with valid-only windows.
          </li>
        </ul>
      </section>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}
