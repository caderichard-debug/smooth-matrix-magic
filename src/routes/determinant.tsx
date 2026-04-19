import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { StepsPanel } from "@/components/StepsPanel";
import { AdSlot } from "@/components/AdSlot";
import { determinant, formatExpr, fromNumbers, type Matrix } from "@/lib/matrix";
import { determinantSteps } from "@/lib/steps";

export const Route = createFileRoute("/determinant")({
  head: () => ({
    meta: [
      { title: "Matrix Determinant Calculator — Free Online" },
      {
        name: "description",
        content:
          "Calculate the determinant of any square matrix online. Supports fractions, variables, and step-by-step cofactor expansion.",
      },
      { property: "og:title", content: "Matrix Determinant Calculator" },
      { property: "og:description", content: "Compute the determinant of a square matrix online — symbolic and step-by-step." },
    ],
  }),
  component: DeterminantPage,
});

function DeterminantPage() {
  const [a, setA] = useState<Matrix>(() => fromNumbers([
    [1, 2, 3],
    [0, 1, 4],
    [5, 6, 0],
  ]));

  const { value, error } = useMemo(() => {
    try {
      return { value: determinant(a), error: null as string | null };
    } catch (e) {
      return { value: null, error: e instanceof Error ? e.message : "Error" };
    }
  }, [a]);

  const steps = useMemo(() => (value ? determinantSteps(a) : []), [a, value]);

  return (
    <PageLayout
      title="Matrix Determinant Calculator"
      tagline="The determinant is a single value that tells you whether a matrix is invertible and how it scales space."
    >
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <MatrixInput title="Matrix A" value={a} onChange={setA} />
        <section className="rounded-lg border border-border bg-card/40 p-6 min-h-[10rem]">
          <h2 className="text-xl font-semibold mb-4">Result: det(A)</h2>
          {error ? (
            <p className="text-destructive font-mono text-sm">{error}</p>
          ) : (
            value !== null && (
              <p className="font-mono text-3xl md:text-4xl text-primary glow-text break-words">
                {formatExpr(value)}
              </p>
            )
          )}
        </section>
      </div>

      {value && <StepsPanel steps={steps} />}

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}
