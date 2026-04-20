import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { AdSlot } from "@/components/AdSlot";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatNumber, parseExpr, type Matrix } from "@/lib/matrix";

export const Route = createFileRoute("/companion-fiedler")({
  head: () => ({
    meta: [
      { title: "Companion & Fiedler Matrix Builder — Polynomial Tools" },
      {
        name: "description",
        content:
          "Build a Frobenius companion matrix and a Fiedler-like linearization from polynomial coefficients with explicit monic constraints.",
      },
      { property: "og:title", content: "Companion Fiedler Matrix Calculator" },
      {
        property: "og:description",
        content:
          "Convert polynomial coefficients into structured matrices for eigenvalue analysis.",
      },
    ],
  }),
  component: CompanionFiedlerPage,
});

function CompanionFiedlerPage() {
  const [coeffText, setCoeffText] = useState("1, -6, 11, -6");

  const computed = useMemo(() => {
    try {
      const coeffs = coeffText.split(",").map((token) => Number(token.trim()));
      if (coeffs.length < 2 || coeffs.some((value) => !Number.isFinite(value))) {
        throw new Error("Enter coefficients as comma-separated finite numbers, e.g. 1,-6,11,-6");
      }
      if (Math.abs(coeffs[0]) < 1e-12) throw new Error("Leading coefficient must be non-zero");

      const leading = coeffs[0];
      const monic = coeffs.map((value) => value / leading);
      const n = monic.length - 1;
      const a = monic.slice(1);
      const companion = Array.from({ length: n }, () => Array.from({ length: n }, () => 0));
      for (let i = 1; i < n; i++) companion[i][i - 1] = 1;
      for (let i = 0; i < n; i++) companion[i][n - 1] = -a[n - i - 1];

      const fiedlerLike = Array.from({ length: n }, () => Array.from({ length: n }, () => 0));
      for (let i = 0; i < n - 1; i++) fiedlerLike[i][i + 1] = 1;
      for (let i = 0; i < n; i++) fiedlerLike[i][0] = -a[n - i - 1];

      const constantTerm = monic[n];
      const detCompanion = (n % 2 === 0 ? 1 : -1) * constantTerm;
      const traceCompanion = -a[0];
      return {
        degree: n,
        monic,
        companion: toExprMatrix(companion),
        fiedlerLike: toExprMatrix(fiedlerLike),
        detCompanion,
        traceCompanion,
        error: null as string | null,
      };
    } catch (e) {
      return {
        degree: 0,
        monic: [] as number[],
        companion: null as Matrix | null,
        fiedlerLike: null as Matrix | null,
        detCompanion: 0,
        traceCompanion: 0,
        error: e instanceof Error ? e.message : "Error",
      };
    }
  }, [coeffText]);

  return (
    <PageLayout
      title="Companion & Fiedler Matrices"
      tagline="Linearize a polynomial into structured matrices commonly used for eigenvalue computations."
      showHowItWorks={false}
    >
      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-4">
        <div className="space-y-2">
          <Label>Polynomial coefficients (highest degree to constant)</Label>
          <Input
            value={coeffText}
            onChange={(e) => setCoeffText(e.target.value)}
            className="font-mono"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Example: <span className="font-mono">1,-6,11,-6</span> means λ^3 - 6λ^2 + 11λ - 6.
        </p>
      </section>

      <section className="rounded-lg border border-border bg-card/40 p-6">
        <h2 className="text-xl font-semibold mb-4">Results</h2>
        {computed.error ? (
          <p className="text-destructive font-mono text-sm">{computed.error}</p>
        ) : (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-3 gap-3 text-sm">
              <Metric label="Degree n" value={String(computed.degree)} />
              <Metric label="trace(C)" value={formatNumber(computed.traceCompanion)} />
              <Metric label="det(C)" value={formatNumber(computed.detCompanion)} />
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <section>
                <h3 className="font-semibold mb-2">Frobenius companion matrix C</h3>
                <div className="overflow-x-auto">
                  <MatrixDisplay m={computed.companion!} />
                </div>
              </section>
              <section>
                <h3 className="font-semibold mb-2">Fiedler-like variant F</h3>
                <div className="overflow-x-auto">
                  <MatrixDisplay m={computed.fiedlerLike!} />
                </div>
              </section>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold">How companion and Fiedler-style matrices work</h2>
        <p className="text-sm text-muted-foreground">
          For a monic polynomial{" "}
          <span className="font-mono">p(lambda)=lambda^n + a_(n-1)lambda^(n-1)+...+a_0</span>, the
          Frobenius companion matrix has characteristic polynomial exactly{" "}
          <span className="font-mono">p(lambda)</span>.
        </p>
        <p className="text-sm text-muted-foreground">
          This means polynomial roots are eigenvalues of the companion matrix, turning root finding
          into an eigenvalue problem.
        </p>
        <p className="text-sm text-muted-foreground">
          Fiedler families are alternative linearizations that preserve eigenvalues while changing
          sparsity pattern. This page shows one practical Fiedler-like form for experimentation and
          structure comparison.
        </p>
        <p className="text-sm text-muted-foreground">
          Basic invariants help sanity-check construction:{" "}
          <span className="font-mono">trace(C) = -a_(n-1)</span> and{" "}
          <span className="font-mono">det(C) = (-1)^n a_0</span> for the monic form.
        </p>
      </section>

      <p className="text-sm text-muted-foreground">
        Eigenvalues of either linearization approximate polynomial roots, so these matrices connect
        root-finding with standard matrix eigensolvers.
      </p>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background/50 p-3">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="font-mono text-primary">{value}</div>
    </div>
  );
}

function toExprMatrix(values: number[][]): Matrix {
  return values.map((row) => row.map((value) => parseExpr(formatNumber(value))));
}
