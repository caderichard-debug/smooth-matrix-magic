import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { AdSlot } from "@/components/AdSlot";
import {
  conditionNumber1,
  distanceFrobenius,
  formatNumber,
  frobeniusNorm,
  fromNumbers,
  infinityNorm,
  l1Norm,
  nullity,
  rank,
  relativeError,
  type Matrix,
} from "@/lib/matrix";

export const Route = createFileRoute("/norms-metrics")({
  head: () => ({
    meta: [
      { title: "Matrix Norms & Metrics Calculator — Frobenius, L1, Infinity, Condition Number" },
      {
        name: "description",
        content:
          "Compute common matrix norms and metrics, including distance, relative error, rank/nullity, and 1-norm condition number.",
      },
      { property: "og:title", content: "Matrix Norms & Metrics Calculator" },
      { property: "og:description", content: "Frobenius, L1, infinity norm, distance, relative error, nullity and condition number." },
    ],
  }),
  component: NormsMetricsPage,
});

function NormsMetricsPage() {
  const [a, setA] = useState<Matrix>(() => fromNumbers([[2, 1], [1, 2]]));
  const [b, setB] = useState<Matrix>(() => fromNumbers([[2, 1], [1, 3]]));

  const metrics = useMemo(() => {
    try {
      return {
        fro: frobeniusNorm(a),
        l1: l1Norm(a),
        inf: infinityNorm(a),
        rk: rank(a),
        nul: nullity(a),
        cond1: conditionNumber1(a),
        dist: distanceFrobenius(a, b),
        rel: relativeError(a, b),
        error: null as string | null,
      };
    } catch (e) {
      return {
        fro: null,
        l1: null,
        inf: null,
        rk: null,
        nul: null,
        cond1: null,
        dist: null,
        rel: null,
        error: e instanceof Error ? e.message : "Error",
      };
    }
  }, [a, b]);

  return (
    <PageLayout
      title="Matrix Norms & Metrics"
      tagline="Evaluate size, stability, and approximation quality with practical norms and error measures."
    >
      <div className="grid lg:grid-cols-2 gap-6">
        <MatrixInput title="Matrix A (reference)" value={a} onChange={setA} />
        <MatrixInput title="Matrix B (comparison)" value={b} onChange={setB} />
      </div>

      <section className="rounded-lg border border-border bg-card/40 p-6">
        <h2 className="text-xl font-semibold mb-4">Results</h2>
        {metrics.error ? (
          <p className="text-destructive font-mono text-sm">{metrics.error}</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            <Metric label="Frobenius norm ||A||F" value={formatNumber(metrics.fro!)} />
            <Metric label="L1 norm ||A||1" value={formatNumber(metrics.l1!)} />
            <Metric label="Infinity norm ||A||∞" value={formatNumber(metrics.inf!)} />
            <Metric label="Rank(A)" value={String(metrics.rk)} />
            <Metric label="Nullity(A)" value={String(metrics.nul)} />
            <Metric label="Condition number κ1(A)" value={formatNumber(metrics.cond1!)} />
            <Metric label="Distance ||A-B||F" value={formatNumber(metrics.dist!)} />
            <Metric label="Relative error ||A-B||F / ||A||F" value={formatNumber(metrics.rel!)} />
          </div>
        )}
      </section>

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
