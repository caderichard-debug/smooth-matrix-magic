import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { AdSlot } from "@/components/AdSlot";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addSparse, denseToSparse, multiplySparse, parseNumericMatrixText } from "@/lib/sparse";

export const Route = createFileRoute("/sparse-add-multiply")({
  head: () => ({
    meta: [
      { title: "Sparse Add & Multiply Calculator — COO Result Lists" },
      {
        name: "description",
        content:
          "Perform sparse matrix addition and multiplication with concise non-zero outputs and density comparisons.",
      },
      { property: "og:title", content: "Sparse Add and Multiply Calculator" },
      {
        property: "og:description",
        content: "Compute A+B and A*B with sparse index/value output.",
      },
    ],
  }),
  component: SparseAddMultiplyPage,
});

function SparseAddMultiplyPage() {
  const [aText, setAText] = useState("1 0 0\n0 2 0\n3 0 4");
  const [bText, setBText] = useState("0 5 0\n0 0 6\n7 0 0");

  const result = useMemo(() => {
    try {
      const denseA = parseNumericMatrixText(aText);
      const denseB = parseNumericMatrixText(bText);
      const sparseA = denseToSparse(denseA);
      const sparseB = denseToSparse(denseB);
      return {
        sparseA,
        sparseB,
        sum: addSparse(sparseA, sparseB),
        product: multiplySparse(sparseA, sparseB),
        error: null as string | null,
      };
    } catch (error) {
      return {
        sparseA: null,
        sparseB: null,
        sum: null,
        product: null,
        error: error instanceof Error ? error.message : "Error",
      };
    }
  }, [aText, bText]);

  return (
    <PageLayout
      title="Sparse Add & Multiply"
      tagline="Run core sparse arithmetic and keep outputs compact with non-zero coordinate lists."
      showHowItWorks={false}
    >
      <div className="grid lg:grid-cols-2 gap-6">
        <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Matrix A assumptions: numeric dense rows, zeros allowed explicitly
          </Label>
          <Textarea
            value={aText}
            onChange={(e) => setAText(e.target.value)}
            className="font-mono min-h-[140px]"
            spellCheck={false}
          />
        </section>
        <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Matrix B assumptions: same parser; A+B needs same shape, A*B needs A.cols=B.rows
          </Label>
          <Textarea
            value={bText}
            onChange={(e) => setBText(e.target.value)}
            className="font-mono min-h-[140px]"
            spellCheck={false}
          />
        </section>
      </div>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-4">
        <h2 className="text-xl font-semibold">Sparse arithmetic output</h2>
        {result.error ? (
          <p className="text-destructive font-mono text-sm">{result.error}</p>
        ) : (
          <div className="grid lg:grid-cols-2 gap-4 text-sm">
            <Card
              label={`A non-zeros (${result.sparseA!.entries.length})`}
              value={formatEntries(result.sparseA!.entries)}
            />
            <Card
              label={`B non-zeros (${result.sparseB!.entries.length})`}
              value={formatEntries(result.sparseB!.entries)}
            />
            <Card
              label={`A + B non-zeros (${result.sum!.entries.length})`}
              value={formatEntries(result.sum!.entries)}
            />
            <Card
              label={`A * B non-zeros (${result.product!.entries.length})`}
              value={formatEntries(result.product!.entries)}
            />
          </div>
        )}
      </section>

      <section className="prose-invert max-w-none space-y-3 text-muted-foreground">
        <h2 className="text-foreground text-xl font-semibold">How sparse add and multiply works</h2>
        <p>
          Inputs are parsed as dense numeric matrices, then converted into sparse coordinate
          entries. Addition merges matching coordinates; multiplication accumulates products only
          where non-zero row/column links exist.
        </p>
        <p>
          Results are returned as compact (row, col, value) lines to help compare non-zero growth
          before pushing data into CSR/CSC pipelines or iterative solvers.
        </p>
      </section>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background/50 p-3">
      <div className="text-xs text-muted-foreground mb-2">{label}</div>
      <pre className="font-mono text-xs whitespace-pre-wrap">{value}</pre>
    </div>
  );
}

function formatEntries(entries: Array<{ row: number; col: number; value: number }>): string {
  if (!entries.length) return "[]";
  return entries.map((entry) => `(${entry.row}, ${entry.col}, ${entry.value})`).join("\n");
}
