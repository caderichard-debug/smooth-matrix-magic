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
    "10 2 0 0 0\n3 9 4 0 0\n0 7 8 5 0\n0 0 6 7 1\n0 0 0 2 6",
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
          Lower bandwidth is max(i-j) over non-zero entries; upper bandwidth is max(j-i). Total
          bandwidth is lower+upper+1, showing diagonal envelope width.
        </p>
        <p>
          Row profile uses the first non-zero in each row and sums row distance to that column.
          Lower profile values often improve sparse factorization memory behavior and cache
          locality.
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
