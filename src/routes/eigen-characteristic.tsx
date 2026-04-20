import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { AdSlot } from "@/components/AdSlot";
import { characteristicPolynomial, eigenvaluesNumeric, formatNumber, fromNumbers, type Matrix } from "@/lib/matrix";

export const Route = createFileRoute("/eigen-characteristic")({
  head: () => ({
    meta: [
      { title: "Eigenvalues & Characteristic Polynomial Calculator — Free" },
      {
        name: "description",
        content:
          "Compute numeric eigenvalues (up to 3x3) and characteristic polynomial for square matrices online.",
      },
      { property: "og:title", content: "Eigenvalues & Characteristic Polynomial Calculator" },
      { property: "og:description", content: "Find eigenvalues and characteristic polynomial online — free." },
    ],
  }),
  component: EigenCharacteristicPage,
});

function EigenCharacteristicPage() {
  const [a, setA] = useState<Matrix>(() => fromNumbers([
    [2, 1, 0],
    [1, 2, 1],
    [0, 1, 2],
  ]));

  const poly = useMemo(() => {
    try {
      return { data: characteristicPolynomial(a), error: null as string | null };
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : "Error" };
    }
  }, [a]);

  const eigen = useMemo(() => {
    try {
      return { data: eigenvaluesNumeric(a), error: null as string | null };
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : "Error" };
    }
  }, [a]);

  return (
    <PageLayout
      title="Eigenvalues & Characteristic Polynomial"
      tagline="Numeric-only eigenvalue support is provided for 1x1 to 3x3 square matrices; characteristic polynomial currently supports up to 3x3."
      showHowItWorks={false}
    >
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <MatrixInput title="Matrix A (square, numeric)" value={a} onChange={setA} />

        <div className="space-y-4">
          <section className="rounded-lg border border-border bg-card/40 p-6">
            <h2 className="text-xl font-semibold mb-2">Characteristic Polynomial</h2>
            {poly.error ? (
              <p className="text-destructive font-mono text-sm">{poly.error}</p>
            ) : poly.data && (
              <div className="space-y-2">
                <p className="font-mono text-primary break-all">p(lambda) = {poly.data.expression}</p>
                <p className="text-sm text-muted-foreground">
                  Coefficients: [{poly.data.coefficients.map((c) => formatNumber(c)).join(", ")}]
                </p>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-border bg-card/40 p-6">
            <h2 className="text-xl font-semibold mb-2">Eigenvalues (numeric)</h2>
            {eigen.error ? (
              <p className="text-destructive font-mono text-sm">{eigen.error}</p>
            ) : eigen.data && (
              <ul className="font-mono text-primary space-y-1">
                {eigen.data.map((value, idx) => (
                  <li key={`${value}-${idx}`}>lambda{idx + 1} = {formatNumber(value)}</li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <section className="prose-invert max-w-none space-y-3 text-muted-foreground">
        <h2 className="text-foreground text-xl font-semibold">How eigenvalues and characteristic polynomial works</h2>
        <p>
          For a square matrix A, the characteristic polynomial is p(lambda) = det(lambda I - A). Its roots are the
          eigenvalues, meaning values lambda where A - lambda I is singular.
        </p>
        <p>
          If v is a nonzero vector and Av = lambda v, then lambda is an eigenvalue and v is an eigenvector.
          Equivalent checks are det(A - lambda I) = 0 or p(lambda) = 0.
        </p>
        <p>
          This page returns numeric eigenvalues for 1x1 to 3x3 matrices and a symbolic-form characteristic polynomial
          up to 3x3. Complex roots are currently rejected, so some real matrices may report a limitation.
        </p>
      </section>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}
