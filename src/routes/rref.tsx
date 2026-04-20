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
      {
        property: "og:description",
        content: "Find the reduced row echelon form of a matrix online — free.",
      },
    ],
  }),
  component: RrefPage,
});

function RrefPage() {
  const [a, setA] = useState<Matrix>(() =>
    fromNumbers([
      [1.5, 2, -1, -4.5],
      [2, 3.5, -1, -11],
      [-2, 0.5, -3, 22],
    ]),
  );

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
      showHowItWorks={false}
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

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold">How RREF works</h2>
        <p className="text-sm text-muted-foreground">
          RREF is produced with elementary row operations that preserve row-equivalence and rank, so
          the reduced form keeps the same solution set as the original system.
        </p>
        <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
          <li>
            Use Gauss-Jordan elimination: swap rows, scale rows, and add multiples of rows to
            eliminate entries.
          </li>
          <li>In RREF, each pivot is 1 and is the only nonzero value in its column.</li>
          <li>Columns without pivots are free-variable columns; pivot count equals rank.</li>
          <li>Each pivot in a lower row appears to the right of pivots above it.</li>
          <li>All-zero rows (if any) move to the bottom.</li>
          <li>RREF(A) = I exactly when A is square and invertible.</li>
        </ul>
        <p className="text-sm text-muted-foreground">
          RREF is unique for a matrix, so it gives a stable way to compare systems, find
          dependencies, and read solution structure.
        </p>
        <p className="text-sm text-muted-foreground">
          Practical caveat: entries extremely close to zero may be rounding artifacts in numeric
          elimination, not exact symbolic zeros.
        </p>
      </section>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}
