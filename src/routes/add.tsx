import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { StepsPanel } from "@/components/StepsPanel";
import { AdSlot } from "@/components/AdSlot";
import { Button } from "@/components/ui/button";
import { add, subtract, fromNumbers, type Matrix } from "@/lib/matrix";
import { addSteps } from "@/lib/steps";

export const Route = createFileRoute("/add")({
  head: () => ({
    meta: [
      { title: "Matrix Addition & Subtraction Calculator" },
      {
        name: "description",
        content:
          "Add or subtract two matrices online. Supports fractions, variables, and step-by-step solutions. Free up to 10×10.",
      },
      { property: "og:title", content: "Matrix Addition & Subtraction Calculator" },
      {
        property: "og:description",
        content: "Add or subtract matrices online — symbolic and step-by-step.",
      },
    ],
  }),
  component: AddPage,
});

function AddPage() {
  const [a, setA] = useState<Matrix>(() =>
    fromNumbers([
      [1.2, -0.8],
      [3.5, 2.1],
    ]),
  );
  const [b, setB] = useState<Matrix>(() =>
    fromNumbers([
      [0.4, 5.6],
      [-1.3, 4.2],
    ]),
  );
  const [op, setOp] = useState<"add" | "sub">("add");

  const { result, error } = useMemo(() => {
    try {
      return {
        result: op === "add" ? add(a, b) : subtract(a, b),
        error: null as string | null,
      };
    } catch (e) {
      return { result: null as Matrix | null, error: e instanceof Error ? e.message : "Error" };
    }
  }, [a, b, op]);

  const steps = useMemo(
    () => (result ? addSteps(a, b, op === "add" ? "+" : "-") : []),
    [a, b, op, result],
  );

  return (
    <PageLayout
      title="Matrix Addition & Subtraction"
      tagline="Add or subtract two matrices of equal dimensions. Switch operations with a click."
      showHowItWorks={false}
    >
      <div className="flex gap-2">
        <Button variant={op === "add" ? "default" : "secondary"} onClick={() => setOp("add")}>
          A + B
        </Button>
        <Button variant={op === "sub" ? "default" : "secondary"} onClick={() => setOp("sub")}>
          A − B
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <MatrixInput title="Matrix A" value={a} onChange={setA} />
        <MatrixInput title="Matrix B" value={b} onChange={setB} />
      </div>

      <section className="rounded-lg border border-border bg-card/40 p-6">
        <h2 className="text-xl font-semibold mb-4">Result: {op === "add" ? "A + B" : "A − B"}</h2>
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

      <AdSlot label="Ad space — below result" height="h-28" />

      <section className="prose-invert max-w-none space-y-3 text-muted-foreground">
        <h2 className="text-foreground text-xl font-semibold">
          How matrix addition and subtraction works
        </h2>
        <p>
          Matrix addition and subtraction are entry-by-entry operations. For each position{" "}
          <span className="font-mono text-primary">(i, j)</span>, compute{" "}
          <span className="font-mono text-primary">(A ± B)ᵢⱼ = Aᵢⱼ ± Bᵢⱼ</span>.
        </p>
        <p>
          Both matrices must have exactly the same dimensions (same number of rows and columns). If
          sizes differ, the operation is undefined and the calculator shows an error.
        </p>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>Addition is commutative: A + B = B + A.</li>
          <li>Addition is associative: (A + B) + C = A + (B + C).</li>
          <li>Additive identity and inverse: A + 0 = A and A + (-A) = 0.</li>
          <li>Subtraction is not commutative: A − B = -(B − A) in general.</li>
          <li>Scalar distribution: k(A ± B) = kA ± kB.</li>
        </ul>
      </section>
    </PageLayout>
  );
}
