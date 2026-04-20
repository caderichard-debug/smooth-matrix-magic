import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { AdSlot } from "@/components/AdSlot";
import { asNumber, fromNumbers, isConstant, type Matrix } from "@/lib/matrix";

export const Route = createFileRoute("/reachability-transitive-closure")({
  head: () => ({
    meta: [
      { title: "Reachability & Transitive Closure Matrix Calculator" },
      {
        name: "description",
        content:
          "Build transitive closure from a 0/1 adjacency matrix to find all reachable node pairs in a directed graph.",
      },
      { property: "og:title", content: "Reachability & Transitive Closure Calculator" },
      {
        property: "og:description",
        content: "Find all-reachable pairs using Warshall-style boolean closure.",
      },
    ],
  }),
  component: ReachabilityTransitiveClosurePage,
});

function ReachabilityTransitiveClosurePage() {
  const [adj, setAdj] = useState<Matrix>(() =>
    fromNumbers([
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
      [0, 0, 0, 0],
    ]),
  );

  const closure = useMemo(() => {
    try {
      const g = toBinarySquareMatrix(adj, "Adjacency matrix");
      const n = g.length;
      const out = g.map((row) => row.slice());
      for (let i = 0; i < n; i++) out[i][i] = 1;

      for (let k = 0; k < n; k++) {
        for (let i = 0; i < n; i++) {
          if (!out[i][k]) continue;
          for (let j = 0; j < n; j++) {
            out[i][j] = out[i][j] || (out[i][k] && out[k][j]) ? 1 : 0;
          }
        }
      }

      const reachPairs = out.flat().reduce((s, v) => s + v, 0);
      return { data: fromNumbers(out), pairCount: reachPairs, error: null as string | null };
    } catch (e) {
      return {
        data: null as Matrix | null,
        pairCount: 0,
        error: e instanceof Error ? e.message : "Error",
      };
    }
  }, [adj]);

  return (
    <PageLayout
      title="Reachability & Transitive Closure"
      tagline="From an adjacency matrix, compute every pair of nodes connected by any path length."
      showHowItWorks={false}
    >
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <MatrixInput title="Adjacency matrix A (0/1, square)" value={adj} onChange={setAdj} />
        <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
          <h2 className="text-xl font-semibold">Result: Transitive closure T</h2>
          {closure.error ? (
            <p className="text-sm font-mono text-destructive">{closure.error}</p>
          ) : (
            <>
              {closure.data && (
                <div className="overflow-x-auto">
                  <MatrixDisplay m={closure.data} />
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Reachable ordered pairs (including each node to itself):{" "}
                <span className="font-mono text-primary">{closure.pairCount}</span>
              </p>
            </>
          )}
        </section>
      </div>

      <section className="prose-invert max-w-none space-y-3 text-muted-foreground">
        <h2 className="text-foreground text-xl font-semibold">
          How reachability and transitive closure works
        </h2>
        <p>
          In an adjacency matrix, <span className="font-mono">a_ij = 1</span> means there is a
          direct edge i to j. Transitive closure expands this to include indirect paths too: if i
          reaches k and k reaches j, then i reaches j.
        </p>
        <p>
          This page uses Warshall-style boolean updates, repeatedly applying
          <span className="font-mono"> t_ij = t_ij OR (t_ik AND t_kj)</span> for each intermediate
          node k.
        </p>
        <p>
          The output is still 0/1 and answers reachability questions instantly, which is useful for
          prerequisite graphs, dependency graphs, and state-transition analysis.
        </p>
      </section>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}

function toBinarySquareMatrix(m: Matrix, label: string): number[][] {
  if (!m.length || !m[0]?.length) throw new Error(`${label} must not be empty`);
  if (!m.every((row) => row.length === m[0].length))
    throw new Error(`${label} must be rectangular`);
  const rows = m.length;
  const cols = m[0].length;
  if (rows !== cols) throw new Error(`${label} must be square`);
  if (!m.every((row) => row.every((entry) => isConstant(entry))))
    throw new Error(`${label} must be numeric`);
  const out = m.map((row) => row.map((entry) => asNumber(entry) as number));
  for (const row of out) {
    for (const value of row) {
      if (!(Math.abs(value) < 1e-10 || Math.abs(value - 1) < 1e-10)) {
        throw new Error(`${label} must contain only 0 or 1 values`);
      }
    }
  }
  return out.map((row) => row.map((value) => (Math.abs(value) < 1e-10 ? 0 : 1)));
}
