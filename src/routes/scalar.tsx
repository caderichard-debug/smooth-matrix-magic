import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { StepsPanel } from "@/components/StepsPanel";
import { AdSlot } from "@/components/AdSlot";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { scalarMultiply, fromNumbers, type Matrix } from "@/lib/matrix";
import { parse as parseExpr } from "@/lib/expr";
import { scalarSteps } from "@/lib/steps";

export const Route = createFileRoute("/scalar")({
  head: () => ({
    meta: [
      { title: "Scalar × Matrix Calculator — Multiply by a Number or Variable" },
      {
        name: "description",
        content:
          "Multiply every entry of a matrix by a scalar — number, fraction, or variable. Free online scalar multiplication calculator.",
      },
      { property: "og:title", content: "Scalar × Matrix Calculator" },
      { property: "og:description", content: "Multiply a matrix by any scalar — fractions and variables supported." },
    ],
  }),
  component: ScalarPage,
});

function ScalarPage() {
  const [a, setA] = useState<Matrix>(() => fromNumbers([[1, 2, 3], [4, 5, 6]]));
  const [scalarText, setScalarText] = useState("2");

  const { result, error, steps } = useMemo(() => {
    try {
      const s = parseExpr(scalarText.trim() || "0");
      const r = scalarMultiply(a, s);
      return { result: r, error: null as string | null, steps: scalarSteps(a, s) };
    } catch (e) {
      return { result: null as Matrix | null, error: e instanceof Error ? e.message : "Error", steps: [] };
    }
  }, [a, scalarText]);

  return (
    <PageLayout
      title="Scalar × Matrix Calculator"
      tagline="Multiply every entry of a matrix by a scalar — number, fraction (3/4), or variable (k, alpha)."
      showHowItWorks={false}
    >
      <div className="rounded-lg border border-border bg-card/40 p-5 max-w-sm space-y-2">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Scalar k</Label>
        <Input
          value={scalarText}
          onChange={(e) => setScalarText(e.target.value)}
          className="font-mono text-lg"
          placeholder="e.g. 2, 3/4, x, 2k+1"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <MatrixInput title="Matrix A" value={a} onChange={setA} />
        <section className="rounded-lg border border-border bg-card/40 p-6">
          <h2 className="text-xl font-semibold mb-4">Result: k · A</h2>
          {error ? (
            <p className="text-destructive font-mono text-sm">{error}</p>
          ) : (
            result && (
              <div className="overflow-x-auto">
                <MatrixDisplay m={result} />
              </div>
            )
          )}
        </section>
      </div>

      {result && <StepsPanel steps={steps} />}

      <AdSlot label="Ad space — below result" height="h-28" />

      <section className="prose-invert max-w-none space-y-3 text-muted-foreground">
        <h2 className="text-foreground text-xl font-semibold">How scalar multiplication works</h2>
        <p>
          A scalar multiplication scales every entry of the matrix by the same value. If{" "}
          <span className="font-mono text-primary">B = kA</span>, then{" "}
          <span className="font-mono text-primary">Bᵢⱼ = k · Aᵢⱼ</span> for all positions{" "}
          <span className="font-mono text-primary">(i, j)</span>.
        </p>
        <p>
          The matrix shape does not change: an{" "}
          <span className="font-mono text-primary">m×n</span> matrix stays{" "}
          <span className="font-mono text-primary">m×n</span>. If{" "}
          <span className="font-mono text-primary">k = 0</span>, every entry becomes zero.
        </p>
      </section>
    </PageLayout>
  );
}
