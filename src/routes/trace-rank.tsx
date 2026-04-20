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
      {
        property: "og:description",
        content: "Find the trace and rank of any matrix online — free.",
      },
    ],
  }),
  component: TraceRankPage,
});

function TraceRankPage() {
  const [a, setA] = useState<Matrix>(() =>
    fromNumbers([
      [1.1, 2.2, 3.3],
      [4.4, 5.5, 6.6],
      [7.7, 8.8, 9.9],
    ]),
  );

  const { traceVal, traceErr } = useMemo(() => {
    try {
      return { traceVal: trace(a), traceErr: null as string | null };
    } catch (e) {
      return { traceVal: null, traceErr: e instanceof Error ? e.message : "Error" };
    }
  }, [a]);

  const { rankVal, rankErr } = useMemo(() => {
    try {
      return { rankVal: rank(a), rankErr: null as string | null };
    } catch (e) {
      return { rankVal: null, rankErr: e instanceof Error ? e.message : "Error" };
    }
  }, [a]);

  return (
    <PageLayout
      title="Matrix Trace & Rank Calculator"
      tagline="Trace = sum of the diagonal entries. Rank = number of linearly independent rows (or columns)."
      showHowItWorks={false}
    >
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <MatrixInput title="Matrix A" value={a} onChange={setA} />
        <div className="space-y-4">
          <section className="rounded-lg border border-border bg-card/40 p-6">
            <h2 className="text-xl font-semibold mb-2">Trace</h2>
            {traceErr ? (
              <p className="text-destructive font-mono text-sm">{traceErr}</p>
            ) : (
              traceVal !== null && (
                <p className="font-mono text-3xl text-primary glow-text break-words">
                  {formatExpr(traceVal)}
                </p>
              )
            )}
          </section>
          <section className="rounded-lg border border-border bg-card/40 p-6">
            <h2 className="text-xl font-semibold mb-2">Rank</h2>
            {rankErr ? (
              <p className="text-destructive font-mono text-sm">{rankErr}</p>
            ) : (
              rankVal !== null && (
                <p className="font-mono text-3xl text-primary glow-text">{rankVal}</p>
              )
            )}
          </section>
        </div>
      </div>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold">How trace and rank works</h2>
        <p className="text-sm text-muted-foreground">
          Trace for square matrices is{" "}
          <span className="font-mono text-primary">tr(A) = Σᵢ aᵢᵢ</span>, while rank is the
          dimension of the row/column space, read as the number of pivots in echelon form.
        </p>
        <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
          <li>Trace is defined only for square matrices: tr(A) = a11 + a22 + ... + ann.</li>
          <li>Rank is the number of pivot rows in row-echelon form, so rank(A) &lt;= min(m, n).</li>
          <li>For square A, det(A) != 0 implies full rank n; det(A) = 0 implies rank &lt; n.</li>
          <li>Trace linearity: tr(A + B) = tr(A) + tr(B), tr(kA) = k tr(A).</li>
          <li>Cyclic trace identity: tr(AB) = tr(BA) when both products are defined.</li>
          <li>Rank inequality: rank(AB) &lt;= min(rank(A), rank(B)).</li>
          <li>Rank-nullity (A is m×n): rank(A) + nullity(A) = n.</li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Rank links directly to solvability: more independent pivots means fewer free variables in
          Ax = b.
        </p>
        <p className="text-sm text-muted-foreground">
          Trace is similarity-invariant (same under basis change), while rank is invariant under row
          and column operations that preserve linear independence. So both metrics are stable
          summaries of matrix structure.
        </p>
      </section>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}
