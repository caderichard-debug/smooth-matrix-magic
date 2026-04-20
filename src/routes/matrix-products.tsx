import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { AdSlot } from "@/components/AdSlot";
import { hadamardProduct, kroneckerProduct, fromNumbers, type Matrix } from "@/lib/matrix";

export const Route = createFileRoute("/matrix-products")({
  head: () => ({
    meta: [
      { title: "Hadamard & Kronecker Product Calculator — Free Online" },
      {
        name: "description",
        content:
          "Compute Hadamard (element-wise) and Kronecker (tensor) products of two matrices online.",
      },
      { property: "og:title", content: "Hadamard & Kronecker Product Calculator" },
      { property: "og:description", content: "Find matrix Hadamard and Kronecker products online — free." },
    ],
  }),
  component: MatrixProductsPage,
});

function MatrixProductsPage() {
  const [a, setA] = useState<Matrix>(() => fromNumbers([
    [1, 2],
    [3, 4],
  ]));
  const [b, setB] = useState<Matrix>(() => fromNumbers([
    [0, 5],
    [6, 7],
  ]));

  const had = useMemo(() => {
    try {
      return { data: hadamardProduct(a, b), error: null as string | null };
    } catch (e) {
      return { data: null as Matrix | null, error: e instanceof Error ? e.message : "Error" };
    }
  }, [a, b]);

  const kron = useMemo(() => {
    try {
      return { data: kroneckerProduct(a, b), error: null as string | null };
    } catch (e) {
      return { data: null as Matrix | null, error: e instanceof Error ? e.message : "Error" };
    }
  }, [a, b]);

  return (
    <PageLayout
      title="Hadamard & Kronecker Product Calculator"
      tagline="Compare element-wise multiplication and tensor-style matrix expansion from the same two inputs."
    >
      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <MatrixInput title="Matrix A" value={a} onChange={setA} />
        <MatrixInput title="Matrix B" value={b} onChange={setB} />
        <div className="space-y-4">
          <section className="rounded-lg border border-border bg-card/40 p-6">
            <h2 className="text-xl font-semibold mb-3">Hadamard Product A .* B</h2>
            {had.error ? (
              <p className="text-destructive font-mono text-sm">{had.error}</p>
            ) : had.data && (
              <div className="overflow-x-auto">
                <MatrixDisplay m={had.data} />
              </div>
            )}
          </section>

          <section className="rounded-lg border border-border bg-card/40 p-6">
            <h2 className="text-xl font-semibold mb-3">Kronecker Product A (x) B</h2>
            {kron.error ? (
              <p className="text-destructive font-mono text-sm">{kron.error}</p>
            ) : kron.data && (
              <div className="overflow-x-auto">
                <MatrixDisplay m={kron.data} />
              </div>
            )}
          </section>
        </div>
      </div>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}
