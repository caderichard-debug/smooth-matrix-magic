import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { AdSlot } from "@/components/AdSlot";
import { matrixExponential, fromNumbers, type Matrix } from "@/lib/matrix";

export const Route = createFileRoute("/matrix-exponential")({
  head: () => ({
    meta: [
      { title: "Matrix Exponential e^A Calculator — Free Online" },
      {
        name: "description",
        content: "Compute matrix exponential e^A numerically using a truncated power series.",
      },
      { property: "og:title", content: "Matrix Exponential e^A Calculator" },
      { property: "og:description", content: "Find e^A for a square matrix online — free." },
    ],
  }),
  component: MatrixExponentialPage,
});

function MatrixExponentialPage() {
  const [a, setA] = useState<Matrix>(() =>
    fromNumbers([
      [0, 0.5],
      [-0.5, 0],
    ]),
  );

  const { result, error } = useMemo(() => {
    try {
      return { result: matrixExponential(a, 20), error: null as string | null };
    } catch (e) {
      return { result: null as Matrix | null, error: e instanceof Error ? e.message : "Error" };
    }
  }, [a]);

  return (
    <PageLayout
      title="Matrix Exponential Calculator"
      tagline="Computes e^A using a 20-term numeric power series approximation; square numeric matrices only."
      showHowItWorks={false}
    >
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <MatrixInput title="Matrix A (square, numeric)" value={a} onChange={setA} />
        <section className="rounded-lg border border-border bg-card/40 p-6">
          <h2 className="text-xl font-semibold mb-3">Result: e^A</h2>
          <p className="text-xs text-muted-foreground mb-3">
            Numeric approximation using sum(k=0..20) A^k / k!.
          </p>
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
        <h2 className="text-xl font-semibold">How matrix exponential works</h2>
        <p className="text-sm text-muted-foreground">
          The matrix exponential is defined by the infinite series
          <span className="font-mono"> e^A = sum(k=0..inf) A^k / k!</span>. This page computes a
          numeric approximation with the first 20 terms.
        </p>
        <p className="text-sm text-muted-foreground">
          Matrix powers require square matrices, so A must be n x n. Inputs are numeric-only because
          the series is evaluated numerically term-by-term. If A = P D P^(-1), then
          <span className="font-mono"> e^A = P e^D P^(-1)</span> with exponentials on diagonal
          entries.
        </p>
        <p className="text-sm text-muted-foreground">
          The result appears in linear systems and differential equations, for example in
          <span className="font-mono"> x(t) = e^(tA) x(0)</span>, and satisfies
          <span className="font-mono"> d/dt e^(tA) = A e^(tA)</span>.
        </p>
        <p className="text-sm text-muted-foreground">
          Practical caveat: for large-norm or non-normal matrices, a fixed truncation can lose
          accuracy; scaling-and-squaring or more terms improves convergence.
        </p>
      </section>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}
