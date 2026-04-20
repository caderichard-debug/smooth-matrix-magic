import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { StepsPanel } from "@/components/StepsPanel";
import { AdSlot } from "@/components/AdSlot";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { scalarMultiply, fromNumbers, noteFractionInput, type Matrix } from "@/lib/matrix";
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
      {
        property: "og:description",
        content: "Multiply a matrix by any scalar — fractions and variables supported.",
      },
    ],
  }),
  component: ScalarPage,
});

function ScalarPage() {
  const [a, setA] = useState<Matrix>(() =>
    fromNumbers([
      [1.5, -2.2, 0.4],
      [3.1, 0.8, -1.7],
    ]),
  );
  const [scalarText, setScalarText] = useState("1.5");

  const { result, error, steps } = useMemo(() => {
    try {
      const s = parseExpr(scalarText.trim() || "0");
      const r = scalarMultiply(a, s);
      return { result: r, error: null as string | null, steps: scalarSteps(a, s) };
    } catch (e) {
      return {
        result: null as Matrix | null,
        error: e instanceof Error ? e.message : "Error",
        steps: [],
      };
    }
  }, [a, scalarText]);

  return (
    <PageLayout
      title="Scalar × Matrix Calculator"
      tagline="Multiply every entry of a matrix by a scalar — decimal, integer, or variable (k, alpha)."
      showHowItWorks={false}
    >
      <div className="rounded-lg border border-border bg-card/40 p-5 max-w-sm space-y-2">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Scalar k</Label>
        <Input
          value={scalarText}
          onChange={(e) => {
            noteFractionInput(e.target.value);
            setScalarText(e.target.value);
          }}
          className="font-mono text-lg"
          placeholder="e.g. 2, 0.75, x, 2k+1"
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
          The matrix shape does not change: an <span className="font-mono text-primary">m×n</span>{" "}
          matrix stays <span className="font-mono text-primary">m×n</span>. If{" "}
          <span className="font-mono text-primary">k = 0</span>, every entry becomes zero.
        </p>
        <p>
          A quick sign check helps catch mistakes: if{" "}
          <span className="font-mono text-primary">k &lt; 0</span>, every non-zero entry flips sign;
          if <span className="font-mono text-primary">|k| &gt; 1</span>, magnitudes grow; and if{" "}
          <span className="font-mono text-primary">0 &lt; |k| &lt; 1</span>, magnitudes shrink.
        </p>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>Distributive over matrix addition: k(A + B) = kA + kB.</li>
          <li>Distributive over scalar addition: (k + c)A = kA + cA.</li>
          <li>Compatible with scalar products: (kc)A = k(cA).</li>
          <li>Compatible with transpose: (kA)ᵀ = kAᵀ.</li>
        </ul>
      </section>
    </PageLayout>
  );
}
