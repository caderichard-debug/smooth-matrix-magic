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
  const [a, setA] = useState<Matrix>(() =>
    fromNumbers([
      [1.2, 0.5],
      [-0.3, 0.9],
    ]),
  );
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
      showHowItWorks={false}
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
          <h2 className="text-xl font-semibold mb-4">
            Result: A<sup>{n}</sup>
          </h2>
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

      <section className="prose-invert max-w-none space-y-3 text-muted-foreground">
        <h2 className="text-foreground text-xl font-semibold">How matrix power works</h2>
        <p>
          Matrix powers are repeated matrix multiplication:{" "}
          <span className="font-mono text-primary">A² = A·A</span>,{" "}
          <span className="font-mono text-primary">A³ = A·A·A</span>, and in general{" "}
          <span className="font-mono text-primary">Aⁿ</span> multiplies{" "}
          <span className="font-mono text-primary">A</span> by itself{" "}
          <span className="font-mono text-primary">n</span> times.
        </p>
        <p>
          This is only defined for square matrices because each multiplication needs matching inner
          dimensions. Special cases: <span className="font-mono text-primary">A⁰ = I</span>{" "}
          (identity matrix of the same size) and{" "}
          <span className="font-mono text-primary">A¹ = A</span>.
        </p>
        <p>
          Growth behavior depends on the matrix: some powers get large quickly, while others shrink
          toward zero. In applications, <span className="font-mono text-primary">Aⁿ</span> often
          models repeated transitions over <span className="font-mono text-primary">n</span> steps.
        </p>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>Exponent law for one matrix: A^m A^n = A^(m+n).</li>
          <li>(A^m)^n = A^(mn), valid for non-negative integers m, n.</li>
          <li>If A is invertible, A^-n = (A^-1)^n.</li>
          <li>In general (A + B)^n is not A^n + B^n, and (AB)^n = A^nB^n only when AB = BA.</li>
        </ul>
      </section>
    </PageLayout>
  );
}
