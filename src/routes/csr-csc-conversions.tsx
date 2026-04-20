import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { AdSlot } from "@/components/AdSlot";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { denseToSparse, parseNumericMatrixText, toCSC, toCSR } from "@/lib/sparse";

export const Route = createFileRoute("/csr-csc-conversions")({
  head: () => ({
    meta: [
      { title: "CSR & CSC Conversion Tool — Sparse Index Arrays" },
      {
        name: "description",
        content:
          "Convert dense numeric matrix input to sparse COO, CSR, and CSC views with index/value arrays for implementation workflows.",
      },
      { property: "og:title", content: "CSR and CSC Conversion Tool" },
      {
        property: "og:description",
        content: "Generate COO/CSR/CSC arrays from matrix input instantly.",
      },
    ],
  }),
  component: CsrCscConversionsPage,
});

function CsrCscConversionsPage() {
  const [matrixText, setMatrixText] = useState(
    "10.5 0 0 2.25\n3.5 9.25 0 0\n0 7.75 8.5 7.25\n3.25 0 8.1 7.6",
  );

  const conversion = useMemo(() => {
    try {
      const dense = parseNumericMatrixText(matrixText);
      const sparse = denseToSparse(dense);
      return {
        sparse,
        csr: toCSR(sparse),
        csc: toCSC(sparse),
        error: null as string | null,
      };
    } catch (error) {
      return {
        sparse: null,
        csr: null,
        csc: null,
        error: error instanceof Error ? error.message : "Error",
      };
    }
  }, [matrixText]);

  return (
    <PageLayout
      title="CSR / CSC Conversions"
      tagline="Convert matrix input into storage-ready sparse index arrays for downstream solvers."
      showHowItWorks={false}
    >
      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
          Parsing assumptions: dense numeric rows; delimiters can be spaces, commas, or semicolons
        </Label>
        <Textarea
          value={matrixText}
          onChange={(e) => setMatrixText(e.target.value)}
          className="font-mono min-h-[140px]"
          spellCheck={false}
        />
      </section>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-4">
        <h2 className="text-xl font-semibold">Sparse conversion output</h2>
        {conversion.error ? (
          <p className="text-destructive font-mono text-sm">{conversion.error}</p>
        ) : (
          <div className="grid lg:grid-cols-3 gap-4 text-sm">
            <Card
              label="COO entries (row,col,val)"
              value={formatEntries(conversion.sparse!.entries)}
            />
            <Card
              label="CSR arrays"
              value={`values=[${conversion.csr!.values.join(", ")}]\ncolIdx=[${conversion.csr!.colIndices.join(", ")}]\nrowPtr=[${conversion.csr!.rowPtr.join(", ")}]`}
            />
            <Card
              label="CSC arrays"
              value={`values=[${conversion.csc!.values.join(", ")}]\nrowIdx=[${conversion.csc!.rowIndices.join(", ")}]\ncolPtr=[${conversion.csc!.colPtr.join(", ")}]`}
            />
          </div>
        )}
      </section>

      <section className="prose-invert max-w-none space-y-3 text-muted-foreground">
        <h2 className="text-foreground text-xl font-semibold">How csr and csc conversions works</h2>
        <p>
          Non-zeros are first listed as COO triplets (i, j, a_ij). CSR stores values/colIdx/rowPtr;
          CSC stores values/rowIdx/colPtr.
        </p>
        <p>
          CSR invariants: rowPtr[0]=0, rowPtr[m]=nnz, and rowPtr[r+1]-rowPtr[r] equals non-zeros in
          row r. CSC mirrors this by columns with colPtr[0]=0 and colPtr[n]=nnz.
        </p>
        <p>
          SpMV in CSR is y_i = sum(p=rowPtr[i]..rowPtr[i+1]-1) values[p] * x[colIdx[p]]. Use CSR for
          row-wise kernels and CSC for column-oriented factorizations.
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
