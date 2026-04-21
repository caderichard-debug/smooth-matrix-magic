import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { AdSlot } from "@/components/AdSlot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fromNumbers, type Matrix } from "@/lib/matrix";
import { avgPool2d, gridToMatrix, matrixToGrid, maxPool2d } from "@/lib/mlOps";

export const Route = createFileRoute("/ml-pooling")({
  head: () => ({
    meta: [
      { title: "Max & Average Pooling Calculator — 2D Downsampling" },
      {
        name: "description",
        content:
          "Downsample a numeric 2D feature map with max pooling or average pooling, configurable window and stride.",
      },
      { property: "og:title", content: "2D Max / Average Pooling Calculator" },
      {
        property: "og:description",
        content: "Max pool and average pool with window size and stride for small numeric grids.",
      },
    ],
  }),
  component: MlPoolingPage,
});

function MlPoolingPage() {
  const [feature, setFeature] = useState<Matrix>(() =>
    fromNumbers([
      [1, 3, 2, 0],
      [0, 4, 1, 2],
      [2, 1, 3, 1],
      [0, 0, 2, 4],
    ]),
  );
  const [mode, setMode] = useState<"max" | "avg">("max");
  const [poolHStr, setPoolHStr] = useState("2");
  const [poolWStr, setPoolWStr] = useState("2");
  const [strideHStr, setStrideHStr] = useState("2");
  const [strideWStr, setStrideWStr] = useState("2");

  const result = useMemo(() => {
    try {
      const poolH = Number.parseInt(poolHStr, 10);
      const poolW = Number.parseInt(poolWStr, 10);
      const strideH = Number.parseInt(strideHStr, 10);
      const strideW = Number.parseInt(strideWStr, 10);
      if (
        ![poolH, poolW, strideH, strideW].every((n) => Number.isFinite(n)) ||
        [poolHStr, poolWStr, strideHStr, strideWStr].some((s) => s.trim() === "")
      ) {
        return { matrix: null as Matrix | null, error: "Pool and stride values must be integers." };
      }
      const fin = matrixToGrid(feature, "Feature map");
      const grid =
        mode === "max"
          ? maxPool2d(fin, poolH, poolW, strideH, strideW)
          : avgPool2d(fin, poolH, poolW, strideH, strideW);
      return { matrix: gridToMatrix(grid), error: null as string | null };
    } catch (e) {
      return {
        matrix: null as Matrix | null,
        error: e instanceof Error ? e.message : "Error",
      };
    }
  }, [feature, mode, poolHStr, poolWStr, strideHStr, strideWStr]);

  return (
    <PageLayout
      title="2D Max / Average Pooling"
      tagline="Local aggregation over rectangular windows: max keeps sharp activations; average smooths."
      showHowItWorks={false}
    >
      <div className="flex gap-2 mb-4">
        <Button variant={mode === "max" ? "default" : "secondary"} onClick={() => setMode("max")}>
          Max pool
        </Button>
        <Button variant={mode === "avg" ? "default" : "secondary"} onClick={() => setMode("avg")}>
          Average pool
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-4">
          <MatrixInput title="Feature map (numeric)" value={feature} onChange={setFeature} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label htmlFor="ph">Pool height</Label>
              <Input
                id="ph"
                className="font-mono"
                value={poolHStr}
                onChange={(e) => setPoolHStr(e.target.value)}
                inputMode="numeric"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pw">Pool width</Label>
              <Input
                id="pw"
                className="font-mono"
                value={poolWStr}
                onChange={(e) => setPoolWStr(e.target.value)}
                inputMode="numeric"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sh">Stride H</Label>
              <Input
                id="sh"
                className="font-mono"
                value={strideHStr}
                onChange={(e) => setStrideHStr(e.target.value)}
                inputMode="numeric"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sw">Stride W</Label>
              <Input
                id="sw"
                className="font-mono"
                value={strideWStr}
                onChange={(e) => setStrideWStr(e.target.value)}
                inputMode="numeric"
              />
            </div>
          </div>
        </div>
        <section className="rounded-lg border border-border bg-card/40 p-6">
          <h2 className="text-xl font-semibold mb-3">Pooled map</h2>
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
        <h2 className="text-xl font-semibold">How pooling works</h2>
        <p className="text-sm text-muted-foreground">
          Pooling partitions the input into non-overlapping or overlapping blocks (controlled by
          stride). Max pooling returns the largest value in each window, encouraging translation
          tolerance and sparser strong features. Average pooling returns the mean, which low-pass
          filters the map.
        </p>
        <p className="text-sm text-muted-foreground">
          Output size: with input height H, pool height p_h, and vertical stride s_h (assuming the
          window fits the map), the number of rows is{" "}
          <span className="font-mono">⌊(H − p_h) / s_h⌋ + 1</span>.
        </p>
        <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
          <li>
            Max pooling is non-linear and preserves strongest activations; average pooling is linear
            averaging over each local window.
          </li>
          <li>
            Larger stride increases downsampling and reduces spatial detail in exchange for smaller
            feature maps.
          </li>
          <li>
            Pooling is channel-wise in CNNs: each channel is pooled independently with the same
            window/stride settings.
          </li>
        </ul>
      </section>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}
