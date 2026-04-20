import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { AdSlot } from "@/components/AdSlot";
import { asNumber, fromNumbers, isConstant, type Matrix } from "@/lib/matrix";

export const Route = createFileRoute("/logical-reductions")({
  head: () => ({
    meta: [
      { title: "Logical Reductions on Matrices Calculator" },
      {
        name: "description",
        content:
          "Compute row-wise and column-wise any/all logical reductions on a 0/1 matrix, plus total true counts.",
      },
      { property: "og:title", content: "Logical Reductions Matrix Calculator" },
      {
        property: "og:description",
        content: "Find row/column any and all reductions for boolean matrices.",
      },
    ],
  }),
  component: LogicalReductionsPage,
});

function LogicalReductionsPage() {
  const [a, setA] = useState<Matrix>(() =>
    fromNumbers([
      [1, 0, 1, 1],
      [0, 0, 0, 1],
      [1, 1, 1, 1],
    ]),
  );

  const reduced = useMemo(() => {
    try {
      const m = toBinaryMatrix(a, "Input matrix");
      const rows = m.length;
      const cols = m[0]?.length ?? 0;
      const rowAny = m.map((row) => (row.some((v) => v === 1) ? 1 : 0));
      const rowAll = m.map((row) => (row.every((v) => v === 1) ? 1 : 0));
      const colAny = Array.from({ length: cols }, (_, j) =>
        m.some((row) => row[j] === 1) ? 1 : 0,
      );
      const colAll = Array.from({ length: cols }, (_, j) =>
        m.every((row) => row[j] === 1) ? 1 : 0,
      );
      const trueCount = m.flat().reduce((s, v) => s + v, 0);
      const density = rows * cols === 0 ? 0 : trueCount / (rows * cols);
      return {
        rowAny: fromNumbers(rowAny.map((x) => [x])),
        rowAll: fromNumbers(rowAll.map((x) => [x])),
        colAny: fromNumbers([colAny]),
        colAll: fromNumbers([colAll]),
        trueCount,
        density,
        error: null as string | null,
      };
    } catch (e) {
      return {
        rowAny: null as Matrix | null,
        rowAll: null as Matrix | null,
        colAny: null as Matrix | null,
        colAll: null as Matrix | null,
        trueCount: 0,
        density: 0,
        error: e instanceof Error ? e.message : "Error",
      };
    }
  }, [a]);

  return (
    <PageLayout
      title="Logical Reductions"
      tagline="Summarize boolean matrix structure with row and column any/all reductions."
      showHowItWorks={false}
    >
      <MatrixInput title="Boolean matrix A (0/1)" value={a} onChange={setA} />

      <section className="rounded-lg border border-border bg-card/40 p-6">
        <h2 className="text-xl font-semibold mb-4">Reduction results</h2>
        {reduced.error ? (
          <p className="text-sm font-mono text-destructive">{reduced.error}</p>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              {reduced.rowAny && (
                <MatrixDisplay m={reduced.rowAny} label="Row-wise any (OR over each row)" />
              )}
              {reduced.rowAll && (
                <MatrixDisplay m={reduced.rowAll} label="Row-wise all (AND over each row)" />
              )}
            </div>
            <div className="space-y-4">
              {reduced.colAny && (
                <MatrixDisplay m={reduced.colAny} label="Column-wise any (OR over each column)" />
              )}
              {reduced.colAll && (
                <MatrixDisplay m={reduced.colAll} label="Column-wise all (AND over each column)" />
              )}
              <div className="rounded-md border border-border bg-background/50 p-3 text-sm text-muted-foreground">
                True entries count:{" "}
                <span className="font-mono text-primary">{reduced.trueCount}</span>
                <br />
                Density of ones:{" "}
                <span className="font-mono text-primary">
                  {(100 * reduced.density).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="prose-invert max-w-none space-y-3 text-muted-foreground">
        <h2 className="text-foreground text-xl font-semibold">How logical reductions works</h2>
        <p>
          A logical reduction combines multiple boolean values into one summary value. Row-wise
          <span className="font-mono"> any </span> checks if a row has at least one 1, while
          row-wise
          <span className="font-mono"> all </span> checks if every entry in that row is 1.
        </p>
        <p>
          Column reductions do the same down each column. These summaries are helpful for quickly
          identifying active rows, fully-satisfied constraints, or sparse patterns.
        </p>
        <p>
          The true-count and density give a compact global summary: how many entries are 1 and what
          fraction of the matrix is active.
        </p>
      </section>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}

function toBinaryMatrix(m: Matrix, label: string): number[][] {
  if (!m.length || !m[0]?.length) throw new Error(`${label} must not be empty`);
  if (!m.every((row) => row.length === m[0].length))
    throw new Error(`${label} must be rectangular`);
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
