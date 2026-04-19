import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { AdSlot } from "@/components/AdSlot";
import { determinant, formatNumber, type Matrix } from "@/lib/matrix";

export const Route = createFileRoute("/determinant")({
  head: () => ({
    meta: [
      { title: "Matrix Determinant Calculator — Free Online" },
      {
        name: "description",
        content:
          "Calculate the determinant of any square matrix online. Fast, accurate, free determinant calculator up to 10×10.",
      },
      { property: "og:title", content: "Matrix Determinant Calculator" },
      { property: "og:description", content: "Compute the determinant of a square matrix online." },
    ],
  }),
  component: DeterminantPage,
});

function DeterminantPage() {
  const [a, setA] = useState<Matrix>([
    [1, 2, 3],
    [0, 1, 4],
    [5, 6, 0],
  ]);

  const { value, error } = useMemo(() => {
    try {
      return { value: determinant(a), error: null as string | null };
    } catch (e) {
      return { value: null as number | null, error: e instanceof Error ? e.message : "Error" };
    }
  }, [a]);

  return (
    <PageLayout
      title="Matrix Determinant Calculator"
      tagline="The determinant is a single scalar that tells you whether a matrix is invertible and how it scales space."
    >
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <MatrixInput title="Matrix A" value={a} onChange={setA} />
        <section className="rounded-lg border border-border bg-card/40 p-6 min-h-[10rem]">
          <h2 className="text-xl font-semibold mb-4">Result: det(A)</h2>
          {error ? (
            <p className="text-destructive font-mono text-sm">{error}</p>
          ) : (
            value !== null && (
              <p className="font-mono text-5xl text-primary glow-text tabular-nums">
                {formatNumber(value)}
              </p>
            )
          )}
        </section>
      </div>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}
