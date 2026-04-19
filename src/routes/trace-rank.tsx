import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { AdSlot } from "@/components/AdSlot";
import { trace, rank, formatExpr, fromNumbers, type Matrix } from "@/lib/matrix";

export const Route = createFileRoute("/trace-rank")({
  head: () => ({
    meta: [
      { title: "Matrix Trace & Rank Calculator — Free Online" },
      {
        name: "description",
        content:
          "Compute the trace (sum of diagonal entries) and rank (number of independent rows) of a matrix instantly.",
      },
      { property: "og:title", content: "Matrix Trace & Rank Calculator" },
      { property: "og:description", content: "Find the trace and rank of any matrix online — free." },
    ],
  }),
  component: TraceRankPage,
});

function TraceRankPage() {
  const [a, setA] = useState<Matrix>(() => fromNumbers([
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
  ]));

  const { traceVal, traceErr } = useMemo(() => {
    try { return { traceVal: trace(a), traceErr: null as string | null }; }
    catch (e) { return { traceVal: null, traceErr: e instanceof Error ? e.message : "Error" }; }
  }, [a]);

  const { rankVal, rankErr } = useMemo(() => {
    try { return { rankVal: rank(a), rankErr: null as string | null }; }
    catch (e) { return { rankVal: null, rankErr: e instanceof Error ? e.message : "Error" }; }
  }, [a]);

  return (
    <PageLayout
      title="Matrix Trace & Rank Calculator"
      tagline="Trace = sum of the diagonal entries. Rank = number of linearly independent rows (or columns)."
    >
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <MatrixInput title="Matrix A" value={a} onChange={setA} />
        <div className="space-y-4">
          <section className="rounded-lg border border-border bg-card/40 p-6">
            <h2 className="text-xl font-semibold mb-2">Trace</h2>
            {traceErr ? (
              <p className="text-destructive font-mono text-sm">{traceErr}</p>
            ) : traceVal !== null && (
              <p className="font-mono text-3xl text-primary glow-text break-words">{formatExpr(traceVal)}</p>
            )}
          </section>
          <section className="rounded-lg border border-border bg-card/40 p-6">
            <h2 className="text-xl font-semibold mb-2">Rank</h2>
            {rankErr ? (
              <p className="text-destructive font-mono text-sm">{rankErr}</p>
            ) : rankVal !== null && (
              <p className="font-mono text-3xl text-primary glow-text">{rankVal}</p>
            )}
          </section>
        </div>
      </div>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}
