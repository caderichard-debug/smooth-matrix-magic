import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { StepsPanel } from "@/components/StepsPanel";
import { AdSlot } from "@/components/AdSlot";
import { Button } from "@/components/ui/button";
import { multiply, fromNumbers, type Matrix } from "@/lib/matrix";
import { multiplySteps } from "@/lib/steps";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Matrix Multiplication Calculator — Free Online Tool" },
      {
        name: "description",
        content:
          "Multiply two matrices instantly online. Supports fractions, variables, and step-by-step solutions. Free matrix multiplication calculator up to 10×10.",
      },
      { property: "og:title", content: "Matrix Multiplication Calculator" },
      { property: "og:description", content: "Multiply matrices online — fractions, variables, step-by-step. Free, no signup." },
    ],
  }),
  component: MultiplyPage,
});

function MultiplyPage() {
  const [a, setA] = useState<Matrix>(() => fromNumbers([
    [1, 2, 3],
    [4, 5, 6],
  ]));
  const [b, setB] = useState<Matrix>(() => fromNumbers([
    [7, 8],
    [9, 10],
    [11, 12],
  ]));

  const { result, error } = useMemo(() => {
    try {
      return { result: multiply(a, b), error: null as string | null };
    } catch (e) {
      return { result: null as Matrix | null, error: e instanceof Error ? e.message : "Error" };
    }
  }, [a, b]);

  const steps = useMemo(() => (result ? multiplySteps(a, b) : []), [a, b, result]);

  return (
    <PageLayout
      title="Matrix Multiplication Calculator"
      tagline="Enter two matrices and get the product instantly. Supports fractions, variables, and shows the full working."
      showHowItWorks={false}
    >
      <div className="grid lg:grid-cols-2 gap-6">
        <MatrixInput title="Matrix A" value={a} onChange={setA} />
        <MatrixInput title="Matrix B" value={b} onChange={setB} />
      </div>

      <section className="rounded-lg border border-border bg-card/40 p-6">
        <div className="flex items-baseline justify-between mb-4 gap-3 flex-wrap">
          <h2 className="text-xl font-semibold">Result: A × B</h2>
          <div className="flex items-center gap-3">
            {result && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setA(result)}
              >
                <ArrowLeft className="size-4" /> Use answer as Matrix A
              </Button>
            )}
            {result && (
              <span className="text-xs text-muted-foreground font-mono">
                {result.length} × {result[0].length}
              </span>
            )}
          </div>
        </div>
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

      {result && <StepsPanel steps={steps} />}

      <AdSlot label="Ad space — below result (responsive)" height="h-28" />

      <section className="prose-invert max-w-none space-y-3 text-muted-foreground">
        <h2 className="text-foreground text-xl font-semibold">How matrix multiplication works</h2>
        <p>
          To multiply matrix <span className="text-primary font-mono">A</span> (size m×n) by matrix{" "}
          <span className="text-primary font-mono">B</span> (size n×p), the number of columns in A
          must equal the number of rows in B. Each entry of the resulting m×p matrix is the dot
          product of the corresponding row of A and column of B.
        </p>
        <p>
          This calculator supports fractions like <span className="font-mono text-primary">3/4</span>,
          variables like <span className="font-mono text-primary">x</span> or{" "}
          <span className="font-mono text-primary">alpha</span>, and full expressions like{" "}
          <span className="font-mono text-primary">2x + 1</span>. Everything runs in your browser —
          no data is uploaded.
        </p>
      </section>
    </PageLayout>
  );
}
