import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { AdSlot } from "@/components/AdSlot";
import {
  asNumber,
  dims,
  eigenvaluesNumeric,
  formatNumber,
  fromNumbers,
  isFullyNumeric,
  parseExpr,
  type Matrix,
} from "@/lib/matrix";

export const Route = createFileRoute("/graph-laplacian")({
  head: () => ({
    meta: [
      { title: "Graph Laplacian Calculator — Degree, Laplacian, and Connectivity" },
      {
        name: "description",
        content:
          "Build degree and Laplacian matrices from a weighted adjacency matrix, with normalized Laplacian and connectivity indicators.",
      },
      { property: "og:title", content: "Graph Laplacian Matrix Calculator" },
      {
        property: "og:description",
        content: "Compute D, L=D-A, normalized Laplacian, and component diagnostics.",
      },
    ],
  }),
  component: GraphLaplacianPage,
});

function GraphLaplacianPage() {
  const [a, setA] = useState<Matrix>(() =>
    fromNumbers([
      [0, 1, 1, 0],
      [1, 0, 1, 0],
      [1, 1, 0, 0],
      [0, 0, 0, 0],
    ]),
  );

  const computed = useMemo(() => {
    try {
      if (!isFullyNumeric(a))
        throw new Error("Graph Laplacian currently requires a fully numeric adjacency matrix");
      const ad = dims(a);
      if (ad.rows !== ad.cols) throw new Error("Adjacency matrix must be square");
      const n = ad.rows;
      const num = a.map((row) => row.map((value) => asNumber(value) as number));
      const tol = 1e-10;
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          if (num[i][j] < -tol)
            throw new Error("Adjacency entries must be non-negative for this tool");
        }
      }
      const deg = Array.from({ length: n }, (_, i) =>
        num[i].reduce((sum, value) => sum + value, 0),
      );
      const d = Array.from({ length: n }, (_, i) =>
        Array.from({ length: n }, (_, j) => (i === j ? deg[i] : 0)),
      );
      const l = Array.from({ length: n }, (_, i) =>
        Array.from({ length: n }, (_, j) => d[i][j] - num[i][j]),
      );
      const lSym = Array.from({ length: n }, (_, i) =>
        Array.from({ length: n }, (_, j) => {
          if (i === j && deg[i] < tol) return 0;
          if (deg[i] < tol || deg[j] < tol) return 0;
          const inv = 1 / Math.sqrt(deg[i] * deg[j]);
          const base = i === j ? deg[i] - num[i][j] : -num[i][j];
          return inv * base;
        }),
      );
      const components = countComponentsUndirected(num, tol);
      const eig =
        n <= 3
          ? eigenvaluesNumeric(toExprMatrix(l))
              .map((value) => formatNumber(value))
              .join(", ")
          : "Eigenvalue preview limited to n <= 3";
      return {
        d: toExprMatrix(d),
        l: toExprMatrix(l),
        lSym: toExprMatrix(lSym),
        components,
        eig,
        error: null as string | null,
      };
    } catch (e) {
      return {
        d: null as Matrix | null,
        l: null as Matrix | null,
        lSym: null as Matrix | null,
        components: 0,
        eig: "",
        error: e instanceof Error ? e.message : "Error",
      };
    }
  }, [a]);

  return (
    <PageLayout
      title="Graph Laplacian Tools"
      tagline="Compute degree and Laplacian matrices from a weighted adjacency matrix with connectivity diagnostics."
      showHowItWorks={false}
    >
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <MatrixInput title="Adjacency matrix A (square, non-negative)" value={a} onChange={setA} />
        <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
          <h2 className="text-xl font-semibold">Connectivity summary</h2>
          {computed.error ? (
            <p className="text-destructive font-mono text-sm">{computed.error}</p>
          ) : (
            <>
              <p className="text-sm">
                Connected components (treated undirected):{" "}
                <span className="font-mono text-primary">{computed.components}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Laplacian eigenvalue preview: <span className="font-mono">{computed.eig}</span>
              </p>
            </>
          )}
        </section>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Panel title="Degree matrix D">{computed.d && <MatrixDisplay m={computed.d} />}</Panel>
        <Panel title="Combinatorial Laplacian L = D - A">
          {computed.l && <MatrixDisplay m={computed.l} />}
        </Panel>
        <Panel title="Normalized Laplacian L_sym">
          {computed.lSym && <MatrixDisplay m={computed.lSym} />}
        </Panel>
      </div>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold">How graph Laplacians work</h2>
        <p className="text-sm text-muted-foreground">
          For adjacency matrix A and degree matrix D (diagonal of row sums), the combinatorial
          Laplacian is <span className="font-mono">L = D - A</span>. It is positive semidefinite for
          undirected non-negative graphs.
        </p>
        <p className="text-sm text-muted-foreground">
          The normalized Laplacian is{" "}
          <span className="font-mono">L_sym = I - D^(-1/2) A D^(-1/2)</span> on non-isolated nodes.
          The multiplicity of eigenvalue 0 equals the number of connected components in the
          undirected case.
        </p>
      </section>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card/40 p-6">
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

function toExprMatrix(values: number[][]): Matrix {
  return values.map((row) => row.map((value) => parseExpr(formatNumber(value))));
}

function countComponentsUndirected(a: number[][], tol: number): number {
  const n = a.length;
  const visited = Array.from({ length: n }, () => false);
  let components = 0;
  for (let start = 0; start < n; start++) {
    if (visited[start]) continue;
    components++;
    const queue = [start];
    visited[start] = true;
    while (queue.length > 0) {
      const node = queue.shift() as number;
      for (let j = 0; j < n; j++) {
        const linked = a[node][j] > tol || a[j][node] > tol;
        if (!visited[j] && linked) {
          visited[j] = true;
          queue.push(j);
        }
      }
    }
  }
  return components;
}
