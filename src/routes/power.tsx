import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { StepsPanel } from "@/components/StepsPanel";
import { AdSlot } from "@/components/AdSlot";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { matrixPower, fromNumbers, type Matrix } from "@/lib/matrix";
import { powerSteps } from "@/lib/steps";

export const Route = createFileRoute("/power")({
  head: () => ({
    meta: [
      { title: "Matrix Power Calculator — A to the n" },
      {
        name: "description",
        content:
          "Raise a square matrix to a non-negative integer power. Free online matrix power calculator with step-by-step working.",
      },
      { property: "og:title", content: "Matrix Power Calculator" },
      { property: "og:description", content: "Compute A^n for any square matrix online." },
    ],
  }),
  component: PowerPage,
});

function PowerPage() {
  const [a, setA] = useState<Matrix>(() => fromNumbers([[1, 1], [1, 0]]));
  const [n, setN] = useState(5);

  const { result, error } = useMemo(() => {
    try {
      return { result: matrixPower(a, n), error: null as string | null };
    } catch (e) {
      return { result: null as Matrix | null, error: e instanceof Error ? e.message : "Error" };
    }
  }, [a, n]);

  return (
    <PageLayout
      title="Matrix Power Calculator"
      tagline="Raise a square matrix to a non-negative integer power: A⁰ = I, A¹ = A, A² = A·A, and so on."
    >
      <div className="rounded-lg border border-border bg-card/40 p-5 max-w-xs space-y-2">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Exponent n</Label>
        <Input
          type="number"
          min={0}
          max={20}
          value={n}
          onChange={(e) => setN(Math.max(0, Math.min(20, parseInt(e.target.value, 10) || 0)))}
          className="font-mono w-24"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <MatrixInput title="Matrix A" value={a} onChange={setA} />
        <section className="rounded-lg border border-border bg-card/40 p-6">
          <h2 className="text-xl font-semibold mb-4">Result: A<sup>{n}</sup></h2>
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

      {result && <StepsPanel steps={powerSteps(n)} />}

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}
