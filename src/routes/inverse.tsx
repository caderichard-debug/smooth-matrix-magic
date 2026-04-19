import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { AdSlot } from "@/components/AdSlot";
import { inverse, type Matrix } from "@/lib/matrix";

export const Route = createFileRoute("/inverse")({
  head: () => ({
    meta: [
      { title: "Matrix Inverse Calculator — Free Online" },
      {
        name: "description",
        content:
          "Compute the inverse of any square matrix online. Free inverse matrix calculator using Gauss-Jordan elimination.",
      },
      { property: "og:title", content: "Matrix Inverse Calculator" },
      { property: "og:description", content: "Find the inverse of a matrix online instantly." },
    ],
  }),
  component: InversePage,
});

function InversePage() {
  const [a, setA] = useState<Matrix>([
    [4, 7],
    [2, 6],
  ]);

  const { result, error } = useMemo(() => {
    try {
      return { result: inverse(a), error: null as string | null };
    } catch (e) {
      return { result: null as Matrix | null, error: e instanceof Error ? e.message : "Error" };
    }
  }, [a]);

  return (
    <PageLayout
      title="Matrix Inverse Calculator"
      tagline="The inverse A⁻¹ satisfies A · A⁻¹ = I. Only square, non-singular matrices have an inverse."
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

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}
