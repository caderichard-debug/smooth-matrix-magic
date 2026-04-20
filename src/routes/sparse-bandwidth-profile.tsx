import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { AdSlot } from "@/components/AdSlot";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { denseToSparse, parseNumericMatrixText, sparseBandwidthProfile } from "@/lib/sparse";

export const Route = createFileRoute("/sparse-bandwidth-profile")({
  head: () => ({
    meta: [
      { title: "Sparse Bandwidth & Profile Analyzer — Skyline Metrics" },
      {
        name: "description",
        content:
          "Measure lower/upper bandwidth, total bandwidth, and row profile metrics for sparse matrices from dense input.",
      },
      { property: "og:title", content: "Sparse Bandwidth Profile Analyzer" },
      {
        property: "og:description",
        content: "Compute skyline/profile metrics for sparse matrix structure.",
      },
    ],
  }),
  component: SparseBandwidthProfilePage,
});

function SparseBandwidthProfilePage() {
  const [matrixText, setMatrixText] = useState(
    "10.2 2.1 0 0 0\n3.4 9.3 4.2 0 0\n0 7.6 8.4 5.1 0\n0 0 6.3 7.2 1.5\n0 0 0 2.4 6.8",
  );

  const analysis = useMemo(() => {
    try {
      const dense = parseNumericMatrixText(matrixText);
      const sparse = denseToSparse(dense);
      return { sparse, metrics: sparseBandwidthProfile(sparse), error: null as string | null };
    } catch (error) {
      return {
        sparse: null,
        metrics: null,
        error: error instanceof Error ? error.message : "Error",
      };
    }
  }, [matrixText]);

  return (
    <PageLayout
      title="Sparse Bandwidth Profile"
      tagline="Quantify matrix structure for ordering, storage planning, and iterative solver expectations."
      showHowItWorks={false}
    >
      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
          Parsing assumptions: dense numeric matrix rows; explicit zeros are treated as structural
          zeros
        </Label>
        <Textarea
          value={matrixText}
          onChange={(e) => setMatrixText(e.target.value)}
          className="font-mono min-h-[140px]"
          spellCheck={false}
        />
      </section>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-4">
        <h2 className="text-xl font-semibold">Profile metrics</h2>
        {analysis.error ? (
          <p className="text-destructive font-mono text-sm">{analysis.error}</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            <Metric label="Non-zero count (nnz)" value={`${analysis.sparse!.entries.length}`} />
            <Metric label="Lower bandwidth" value={`${analysis.metrics!.lowerBandwidth}`} />
            <Metric label="Upper bandwidth" value={`${analysis.metrics!.upperBandwidth}`} />
            <Metric label="Total bandwidth" value={`${analysis.metrics!.bandwidth}`} />
            <Metric label="Skyline/profile sum" value={`${analysis.metrics!.profile}`} />
            <Metric label="Row profile vector" value={analysis.metrics!.rowProfile.join(", ")} />
          </div>
        )}
      </section>

      <section className="prose-invert max-w-none space-y-3 text-muted-foreground">
        <h2 className="text-foreground text-xl font-semibold">
          How sparse bandwidth profile works
        </h2>
        <p>
          Over all non-zero coordinates (i, j), lower bandwidth is max(i-j), upper bandwidth is
          max(j-i), and total bandwidth is b = l+u+1.
        </p>
        <p>
          Row profile uses leftmost non-zero j_min(i): p_i = i-j_min(i) (or 0 if row i is empty),
          then profile = sum_i p_i. Smaller profile usually means less fill and better cache
          locality in sparse factorizations.
        </p>
        <p>
          Values themselves do not change these structure metrics, so use this page to evaluate
          reordering effects (AMD, RCM, domain-specific permutations) before expensive numeric
          factorization steps.
        </p>
      </section>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background/50 p-3">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="font-mono text-primary break-words">{value}</div>
    </div>
  );
}
