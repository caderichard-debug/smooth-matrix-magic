import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { AdSlot } from "@/components/AdSlot";
import { solveLinearSystem, fromNumbers, type Matrix } from "@/lib/matrix";

export const Route = createFileRoute("/linear-system")({
  head: () => ({
    meta: [
      { title: "Linear System Solver (Ax=b) — Free Online" },
      {
        name: "description",
        content:
          "Solve linear systems Ax=b online, classify solutions as unique/infinite/none, and view the augmented RREF.",
      },
      { property: "og:title", content: "Linear System Solver (Ax=b)" },
      { property: "og:description", content: "Solve Ax=b and classify solution type online — free." },
    ],
  }),
  component: LinearSystemPage,
});

function LinearSystemPage() {
  const [a, setA] = useState<Matrix>(() => fromNumbers([
    [2, 1, -1],
    [-3, -1, 2],
    [-2, 1, 2],
  ]));
  const [b, setB] = useState<Matrix>(() => fromNumbers([[8], [-11], [-3]]));

  const result = useMemo(() => {
    try {
      return { data: solveLinearSystem(a, b), error: null as string | null };
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : "Error" };
    }
  }, [a, b]);

  return (
    <PageLayout
      title="Linear System Solver (Ax=b)"
      tagline="Enter matrix A and column vector b to classify whether a system has a unique solution, infinitely many, or none."
    >
      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <MatrixInput title="Matrix A (coefficients)" value={a} onChange={setA} />
        <MatrixInput title="Matrix b (single column)" value={b} onChange={setB} />

        <section className="rounded-lg border border-border bg-card/40 p-6 space-y-4">
          <h2 className="text-xl font-semibold">Result</h2>
          {result.error ? (
            <p className="text-destructive font-mono text-sm">{result.error}</p>
          ) : result.data && (
            <>
              <p className="font-medium">
                Classification:{" "}
                <span className="text-primary">
                  {result.data.classification === "unique"
                    ? "Unique solution"
                    : result.data.classification === "infinite"
                      ? "Infinitely many solutions"
                      : "No solution"}
                </span>
              </p>

              <div>
                <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">RREF([A|b])</h3>
                <div className="overflow-x-auto">
                  <MatrixDisplay m={result.data.rrefAugmented} />
                </div>
              </div>

              {result.data.particularSolution && (
                <div>
                  <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">Solution vector x</h3>
                  <div className="overflow-x-auto">
                    <MatrixDisplay m={result.data.particularSolution} />
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}
