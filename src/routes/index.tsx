import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { AdSlot } from "@/components/AdSlot";
import { multiply, type Matrix } from "@/lib/matrix";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Matrix Multiplication Calculator — Free Online Tool" },
      {
        name: "description",
        content:
          "Multiply two matrices instantly online. Step-free, fast, and accurate. Supports any size up to 10×10. Free matrix multiplication calculator.",
      },
      { property: "og:title", content: "Matrix Multiplication Calculator" },
      { property: "og:description", content: "Multiply matrices online — fast, free, no signup." },
    ],
  }),
  component: MultiplyPage,
});

function MultiplyPage() {
  const [a, setA] = useState<Matrix>([
    [1, 2, 3],
    [4, 5, 6],
  ]);
  const [b, setB] = useState<Matrix>([
    [7, 8],
    [9, 10],
    [11, 12],
  ]);

  const { result, error } = useMemo(() => {
    try {
      return { result: multiply(a, b), error: null as string | null };
    } catch (e) {
      return { result: null as Matrix | null, error: e instanceof Error ? e.message : "Error" };
    }
  }, [a, b]);

  return (
    <PageLayout
      title="Matrix Multiplication Calculator"
      tagline="Enter two matrices and get the product instantly. Resize the grids, paste values, or generate random data — everything updates as you type."
    >
      <div className="grid lg:grid-cols-2 gap-6">
        <MatrixInput title="Matrix A" value={a} onChange={setA} />
        <MatrixInput title="Matrix B" value={b} onChange={setB} />
      </div>

      <section className="rounded-lg border border-border bg-card/40 p-6">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-xl font-semibold">Result: A × B</h2>
          {result && (
            <span className="text-xs text-muted-foreground font-mono">
              {result.length} × {result[0].length}
            </span>
          )}
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
          This calculator runs entirely in your browser — no data is uploaded — so it's safe to use
          for homework, engineering work, or quick sanity checks.
        </p>
      </section>
    </PageLayout>
  );
}
