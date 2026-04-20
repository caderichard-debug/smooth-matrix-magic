import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { AdSlot } from "@/components/AdSlot";
import { eigenvaluesNumeric, formatNumber, fromNumbers, type Matrix } from "@/lib/matrix";

export const Route = createFileRoute("/spectral-radius")({
  head: () => ({
    meta: [
      { title: "Spectral Radius Calculator — rho(A)" },
      {
        name: "description",
        content:
          "Compute spectral radius rho(A) = max |lambda_i| from numeric eigenvalues for 1x1 to 3x3 matrices.",
      },
      { property: "og:title", content: "Spectral Radius Matrix Calculator" },
      {
        property: "og:description",
        content: "Find rho(A) from matrix eigenvalues quickly in-browser.",
      },
    ],
  }),
  component: SpectralRadiusPage,
});

function SpectralRadiusPage() {
  const [a, setA] = useState<Matrix>(() =>
    fromNumbers([
      [0, 1, 0],
      [0, 0, 1],
      [1, 0, 0],
    ]),
  );

  const result = useMemo(() => {
    try {
      const eigenvalues = eigenvaluesNumeric(a);
      const spectralRadius = Math.max(...eigenvalues.map((value) => Math.abs(value)));
      return { eigenvalues, spectralRadius, error: null as string | null };
    } catch (e) {
      return {
        eigenvalues: null as number[] | null,
        spectralRadius: null as number | null,
        error: e instanceof Error ? e.message : "Error",
      };
    }
  }, [a]);

  return (
    <PageLayout
      title="Spectral Radius Calculator"
      tagline="Compute rho(A) = max |lambda_i| from numeric eigenvalues (current eigenvalue backend supports up to 3x3)."
      showHowItWorks={false}
    >
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <MatrixInput title="Matrix A (square, numeric)" value={a} onChange={setA} />
        <section className="rounded-lg border border-border bg-card/40 p-6">
          <h2 className="text-xl font-semibold mb-3">Result: Spectral radius rho(A)</h2>
          {result.error ? (
            <p className="text-destructive font-mono text-sm">{result.error}</p>
          ) : (
            result.eigenvalues && (
              <div className="space-y-3">
                <p className="font-mono text-primary text-lg">
                  {formatNumber(result.spectralRadius as number)}
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 font-mono">
                  {result.eigenvalues.map((value, i) => (
                    <li key={`${value}-${i}`}>
                      lambda{i + 1} = {formatNumber(value)} (|lambda| ={" "}
                      {formatNumber(Math.abs(value))})
                    </li>
                  ))}
                </ul>
              </div>
            )
          )}
        </section>
      </div>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold">How spectral radius works</h2>
        <p className="text-sm text-muted-foreground">
          The spectral radius is rho(A) = max_i |lambda_i| over all eigenvalues lambda_i of A. It
          governs asymptotic growth in powers A^k and appears in stability tests for discrete-time
          dynamical systems.
        </p>
        <p className="text-sm text-muted-foreground">
          For iterative methods, rho(A) &lt; 1 is a key contraction condition. This page reports
          both the eigenvalues and the final max absolute value so you can inspect dominant modes
          directly.
        </p>
      </section>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}
