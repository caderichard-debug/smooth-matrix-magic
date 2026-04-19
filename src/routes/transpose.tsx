import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { AdSlot } from "@/components/AdSlot";
import { transpose, type Matrix } from "@/lib/matrix";

export const Route = createFileRoute("/transpose")({
  head: () => ({
    meta: [
      { title: "Matrix Transpose Calculator — Free Online" },
      {
        name: "description",
        content:
          "Transpose any matrix online instantly. Swap rows and columns with one click. Free matrix transpose calculator.",
      },
      { property: "og:title", content: "Matrix Transpose Calculator" },
      { property: "og:description", content: "Transpose a matrix online instantly." },
    ],
  }),
  component: TransposePage,
});

function TransposePage() {
  const [a, setA] = useState<Matrix>([
    [1, 2, 3],
    [4, 5, 6],
  ]);

  const result = useMemo(() => transpose(a), [a]);

  return (
    <PageLayout
      title="Matrix Transpose Calculator"
      tagline="The transpose flips a matrix over its diagonal — rows become columns and columns become rows."
    >
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <MatrixInput title="Matrix A" value={a} onChange={setA} />
        <section className="rounded-lg border border-border bg-card/40 p-6">
          <h2 className="text-xl font-semibold mb-4">
            Result: A<sup>T</sup>
          </h2>
          <div className="overflow-x-auto">
            <MatrixDisplay m={result} />
          </div>
        </section>
      </div>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}
