import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { MatrixInput } from "@/components/MatrixInput";
import { AdSlot } from "@/components/AdSlot";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fromNumbers, type Matrix } from "@/lib/matrix";
import {
  dilatedConvolve2d,
  gridToMatrix,
  matrixToGrid,
  separableConvolve2d,
  transposedConv2dOutputShape,
} from "@/lib/mlOps";

export const Route = createFileRoute("/ml-convolution-extras")({
  head: () => ({
    meta: [
      { title: "Convolution Extras Calculator — Dilated, Separable, Transposed Sizing" },
      {
        name: "description",
        content:
          "Explore atrous (dilated) convolution, depthwise+pointwise separable convolution, and transposed-convolution output-size equations with interactive numeric examples.",
      },
      { property: "og:title", content: "Convolution Extras Calculator" },
      {
        property: "og:description",
        content:
          "Interactive formulas and examples for dilated kernels, separable conv, and transposed-conv shape math.",
      },
    ],
  }),
  component: MlConvolutionExtrasPage,
});

function MlConvolutionExtrasPage() {
  const [feature, setFeature] = useState<Matrix>(() =>
    fromNumbers([
      [1, 2, 0, 1, 3],
      [0, 1, 3, 2, 1],
      [4, 0, 1, 0, 2],
      [0, 2, 1, 1, 0],
      [1, 0, 2, 3, 1],
    ]),
  );
  const [kernel, setKernel] = useState<Matrix>(() =>
    fromNumbers([
      [1, 0, -1],
      [0, 1, 0],
      [1, 0, -1],
    ]),
  );
  const [strideStr, setStrideStr] = useState("1");
  const [padStr, setPadStr] = useState("1");
  const [dilationStr, setDilationStr] = useState("2");
  const [outputPaddingStr, setOutputPaddingStr] = useState("0");

  const [pointwiseWeightStr, setPointwiseWeightStr] = useState("0.75");
  const [pointwiseBiasStr, setPointwiseBiasStr] = useState("0.5");

  const parseIntStrict = (raw: string): number | null => {
    if (!/^-?\d+$/.test(raw.trim())) return null;
    const value = Number(raw);
    return Number.isInteger(value) ? value : null;
  };

  const dilatedResult = useMemo(() => {
    try {
      const stride = parseIntStrict(strideStr);
      const pad = parseIntStrict(padStr);
      const dilation = parseIntStrict(dilationStr);
      if (stride === null || pad === null || dilation === null) {
        return {
          matrix: null as Matrix | null,
          error: "Stride, padding, and dilation must be integers.",
        };
      }
      const out = dilatedConvolve2d(
        matrixToGrid(feature, "Feature map"),
        matrixToGrid(kernel, "Kernel"),
        stride,
        pad,
        dilation,
      );
      return { matrix: gridToMatrix(out), error: null as string | null };
    } catch (e) {
      return { matrix: null as Matrix | null, error: e instanceof Error ? e.message : "Error" };
    }
  }, [feature, kernel, strideStr, padStr, dilationStr]);

  const separableResult = useMemo(() => {
    try {
      const stride = parseIntStrict(strideStr);
      const pad = parseIntStrict(padStr);
      const dilation = parseIntStrict(dilationStr);
      const pointwiseWeight = Number.parseFloat(pointwiseWeightStr);
      const pointwiseBias = Number.parseFloat(pointwiseBiasStr);
      if (
        stride === null ||
        pad === null ||
        dilation === null ||
        ![pointwiseWeight, pointwiseBias].every((n) => Number.isFinite(n))
      ) {
        return {
          depthwise: null as Matrix | null,
          output: null as Matrix | null,
          error: "Provide valid numeric convolution and pointwise parameters.",
        };
      }
      const out = separableConvolve2d(
        matrixToGrid(feature, "Feature map"),
        matrixToGrid(kernel, "Depthwise kernel"),
        pointwiseWeight,
        pointwiseBias,
        stride,
        pad,
        dilation,
      );
      return {
        depthwise: gridToMatrix(out.depthwise),
        output: gridToMatrix(out.output),
        error: null as string | null,
      };
    } catch (e) {
      return {
        depthwise: null as Matrix | null,
        output: null as Matrix | null,
        error: e instanceof Error ? e.message : "Error",
      };
    }
  }, [feature, kernel, pointwiseWeightStr, pointwiseBiasStr, strideStr, padStr, dilationStr]);

  const transposedSizing = useMemo(() => {
    try {
      const inGrid = matrixToGrid(feature, "Feature map");
      const kerGrid = matrixToGrid(kernel, "Kernel");
      const stride = parseIntStrict(strideStr);
      const pad = parseIntStrict(padStr);
      const dilation = parseIntStrict(dilationStr);
      const outputPadding = parseIntStrict(outputPaddingStr);
      if (stride === null || pad === null || dilation === null || outputPadding === null) {
        return {
          value: null as ReturnType<typeof transposedConv2dOutputShape> | null,
          error: "Stride, padding, dilation, and output padding must be integers.",
        };
      }
      return {
        value: transposedConv2dOutputShape(
          inGrid.length,
          inGrid[0].length,
          kerGrid.length,
          kerGrid[0].length,
          stride,
          stride,
          pad,
          pad,
          dilation,
          dilation,
          outputPadding,
          outputPadding,
        ),
        error: null as string | null,
      };
    } catch (e) {
      return {
        value: null as ReturnType<typeof transposedConv2dOutputShape> | null,
        error: e instanceof Error ? e.message : "Error",
      };
    }
  }, [feature, kernel, strideStr, padStr, dilationStr, outputPaddingStr]);

  return (
    <PageLayout
      title="Convolution Extras"
      tagline="Dilated convolution, depthwise+pointwise separable convolution, and transposed-convolution shape math in one place."
      showHowItWorks={false}
    >
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-4">
          <MatrixInput title="Feature map (numeric)" value={feature} onChange={setFeature} />
          <MatrixInput title="Kernel (numeric)" value={kernel} onChange={setKernel} />
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label htmlFor="convx-stride">Stride</Label>
              <Input
                id="convx-stride"
                value={strideStr}
                onChange={(e) => setStrideStr(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="convx-pad">Padding</Label>
              <Input id="convx-pad" value={padStr} onChange={(e) => setPadStr(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="convx-dilation">Dilation</Label>
              <Input
                id="convx-dilation"
                value={dilationStr}
                onChange={(e) => setDilationStr(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1 max-w-56">
            <Label htmlFor="convx-output-padding">Output padding (transposed conv)</Label>
            <Input
              id="convx-output-padding"
              value={outputPaddingStr}
              onChange={(e) => setOutputPaddingStr(e.target.value)}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="convx-pointwise-w">Pointwise weight (1x1)</Label>
              <Input
                id="convx-pointwise-w"
                value={pointwiseWeightStr}
                onChange={(e) => setPointwiseWeightStr(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="convx-pointwise-b">Pointwise bias</Label>
              <Input
                id="convx-pointwise-b"
                value={pointwiseBiasStr}
                onChange={(e) => setPointwiseBiasStr(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <section className="rounded-lg border border-border bg-card/40 p-5">
            <h2 className="text-lg font-semibold mb-2">Dilated convolution output</h2>
            {dilatedResult.error ? (
              <p className="text-destructive font-mono text-sm">{dilatedResult.error}</p>
            ) : (
              dilatedResult.matrix && <MatrixDisplay m={dilatedResult.matrix} />
            )}
          </section>
          <section className="rounded-lg border border-border bg-card/40 p-5">
            <h2 className="text-lg font-semibold mb-2">Separable convolution output</h2>
            {separableResult.error ? (
              <p className="text-destructive font-mono text-sm">{separableResult.error}</p>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                    Depthwise stage
                  </p>
                  {separableResult.depthwise && <MatrixDisplay m={separableResult.depthwise} />}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                    Pointwise (1x1) stage
                  </p>
                  {separableResult.output && <MatrixDisplay m={separableResult.output} />}
                </div>
              </div>
            )}
          </section>
          <section className="rounded-lg border border-border bg-card/40 p-5">
            <h2 className="text-lg font-semibold mb-2">Transposed convolution output shape</h2>
            {transposedSizing.error ? (
              <p className="text-destructive font-mono text-sm">{transposedSizing.error}</p>
            ) : (
              transposedSizing.value && (
                <p className="text-sm font-mono">
                  Output: {transposedSizing.value.outputHeight} x{" "}
                  {transposedSizing.value.outputWidth}
                </p>
              )
            )}
          </section>
        </div>
      </div>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold">Equations</h2>
        <p className="text-sm text-muted-foreground">
          Dilated convolution uses an effective kernel size k_eff = d(k - 1) + 1. Spatial output
          then follows out = floor((H + 2p - k_eff) / s) + 1.
        </p>
        <p className="text-sm text-muted-foreground">
          Depthwise + pointwise separable convolution factorizes cost: first do a spatial
          per-channel filter (depthwise), then a 1x1 mixing step (pointwise). In this single-channel
          demo: y = w_pw * depthwise(x) + b_pw.
        </p>
        <p className="text-sm text-muted-foreground">
          Transposed-convolution sizing per axis: out = (in - 1) * s - 2p + d(k - 1) + outputPadding
          + 1. This page evaluates that formula for height and width from your current inputs.
        </p>
      </section>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}
