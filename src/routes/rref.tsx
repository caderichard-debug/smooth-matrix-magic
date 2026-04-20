import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { AdSlot } from "@/components/AdSlot";
import { rref, fromNumbers, type Matrix } from "@/lib/matrix";

export const Route = createFileRoute("/rref")({
  head: () => ({
    meta: [
      { title: "Matrix RREF Calculator — Free Online" },
      {
        name: "description",
        content:
          "Compute reduced row echelon form (RREF) of a matrix online using Gauss-Jordan elimination.",
      },
      { property: "og:title", content: "Matrix RREF Calculator" },
      { property: "og:description", content: "Find the reduced row echelon form of a matrix online — free." },
    ],
  }),
  component: RrefPage,
});

function RrefPage() {
  const [a, setA] = useState<Matrix>(() => fromNumbers([
    [1, 2, -1, -4],
    [2, 3, -1, -11],
    [-2, 0, -3, 22],
  ]));

  const { result, error } = useMemo(() => {
    try {
      return { result: rref(a), error: null as string | null };
    } catch (e) {
      return { result: null as Matrix | null, error: e instanceof Error ? e.message : "Error" };
    }
  }, [a]);

  return (
    <PageLayout
      title="Matrix RREF Calculator"
      tagline="Reduced row echelon form makes pivots equal to 1 with zeros above and below each pivot."
    >
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <MatrixInput title="Matrix A" value={a} onChange={setA} />
        <section className="rounded-lg border border-border bg-card/40 p-6">
          <h2 className="text-xl font-semibold mb-4">Result: RREF(A)</h2>
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

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}
