import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { AdSlot } from "@/components/AdSlot";
import { commutator, anticommutator, directSum, fromNumbers, type Matrix } from "@/lib/matrix";

export const Route = createFileRoute("/advanced-products")({
  head: () => ({
    meta: [
      { title: "Matrix Commutator, Anticommutator & Direct Sum Calculator" },
      {
        name: "description",
        content:
          "Compute matrix commutator [A,B], anticommutator {A,B}, and direct sum A (+) B online.",
      },
      { property: "og:title", content: "Advanced Matrix Products Calculator" },
      { property: "og:description", content: "Find matrix commutator, anticommutator, and direct sum online." },
    ],
  }),
  component: AdvancedProductsPage,
});

function AdvancedProductsPage() {
  const [a, setA] = useState<Matrix>(() => fromNumbers([
    [1, 2],
    [0, 1],
  ]));
  const [b, setB] = useState<Matrix>(() => fromNumbers([
    [2, 0],
    [1, 3],
  ]));

  const comm = useMemo(() => {
    try {
      return { data: commutator(a, b), error: null as string | null };
    } catch (e) {
      return { data: null as Matrix | null, error: e instanceof Error ? e.message : "Error" };
    }
  }, [a, b]);

  const anti = useMemo(() => {
    try {
      return { data: anticommutator(a, b), error: null as string | null };
    } catch (e) {
      return { data: null as Matrix | null, error: e instanceof Error ? e.message : "Error" };
    }
  }, [a, b]);

  const sum = useMemo(() => directSum(a, b), [a, b]);

  return (
    <PageLayout
      title="Commutator, Anticommutator & Direct Sum"
      tagline="Explore [A,B] = AB - BA, {A,B} = AB + BA, and block-diagonal direct sums from two matrix inputs."
    >
      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <MatrixInput title="Matrix A" value={a} onChange={setA} />
        <MatrixInput title="Matrix B" value={b} onChange={setB} />
        <div className="space-y-4">
          <section className="rounded-lg border border-border bg-card/40 p-6">
            <h2 className="text-xl font-semibold mb-3">Commutator [A,B]</h2>
            {comm.error ? (
              <p className="text-destructive font-mono text-sm">{comm.error}</p>
            ) : comm.data && (
              <div className="overflow-x-auto">
                <MatrixDisplay m={comm.data} />
              </div>
            )}
          </section>

          <section className="rounded-lg border border-border bg-card/40 p-6">
            <h2 className="text-xl font-semibold mb-3">Anticommutator {"{A,B}"}</h2>
            {anti.error ? (
              <p className="text-destructive font-mono text-sm">{anti.error}</p>
            ) : anti.data && (
              <div className="overflow-x-auto">
                <MatrixDisplay m={anti.data} />
              </div>
            )}
          </section>

          <section className="rounded-lg border border-border bg-card/40 p-6">
            <h2 className="text-xl font-semibold mb-3">Direct Sum A (+) B</h2>
            <div className="overflow-x-auto">
              <MatrixDisplay m={sum} />
            </div>
          </section>
        </div>
      </div>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}
