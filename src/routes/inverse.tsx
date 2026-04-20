import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { StepsPanel } from "@/components/StepsPanel";
import { AdSlot } from "@/components/AdSlot";
import { inverse, fromNumbers, type Matrix } from "@/lib/matrix";
import { inverseSteps } from "@/lib/steps";

export const Route = createFileRoute("/inverse")({
  head: () => ({
    meta: [
      { title: "Matrix Inverse Calculator — Free Online" },
      {
        name: "description",
        content:
          "Compute the inverse of any square matrix online. Symbolic, supports fractions and variables, with step-by-step working.",
      },
      { property: "og:title", content: "Matrix Inverse Calculator" },
      { property: "og:description", content: "Find the inverse of a matrix online — symbolic and step-by-step." },
    ],
  }),
  component: InversePage,
});

function InversePage() {
  const [a, setA] = useState<Matrix>(() => fromNumbers([[4, 7], [2, 6]]));

  const { result, error } = useMemo(() => {
    try {
      return { result: inverse(a), error: null as string | null };
    } catch (e) {
      return { result: null as Matrix | null, error: e instanceof Error ? e.message : "Error" };
    }
  }, [a]);

  const steps = useMemo(() => (result ? inverseSteps(a) : []), [a, result]);

  return (
    <PageLayout
      title="Matrix Inverse Calculator"
      tagline="The inverse A⁻¹ satisfies A · A⁻¹ = I. Only square, non-singular matrices have an inverse."
      showHowItWorks={false}
    >
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <MatrixInput title="Matrix A" value={a} onChange={setA} />
        <section className="rounded-lg border border-border bg-card/40 p-6">
          <h2 className="text-xl font-semibold mb-4">
            Result: A<sup>−1</sup>
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

      {result && <StepsPanel steps={steps} />}

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold">How inverse works</h2>
        <p className="text-sm text-muted-foreground">
          A matrix inverse A^-1 exists only when A is square and det(A) != 0. If det(A) = 0, A is singular and
          the equation A x = b cannot be solved by x = A^-1 b.
        </p>
        <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
          <li>Definition: A A^-1 = A^-1 A = I.</li>
          <li>2x2 formula: A^-1 = (1 / det(A)) * [[d, -b], [-c, a]] for A = [[a, b], [c, d]].</li>
          <li>In practice, Gauss-Jordan solves [A|I] -&gt; [I|A^-1] using row operations.</li>
        </ul>
      </section>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}
