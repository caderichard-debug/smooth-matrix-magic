import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { AdSlot } from "@/components/AdSlot";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ZERO, dims, isZero, makeMatrix, parseExpr, type Matrix } from "@/lib/matrix";

export const Route = createFileRoute("/sparse-constructors")({
  head: () => ({
    meta: [
      { title: "Sparse Matrix Constructor (COO Triplets)" },
      {
        name: "description",
        content:
          "Build a sparse matrix from coordinate triplets (row, col, value), validate indices, and inspect density statistics.",
      },
      { property: "og:title", content: "Sparse Matrix Constructor (COO Triplets)" },
      { property: "og:description", content: "Create sparse matrices from nonzero entries and preview dense form." },
    ],
  }),
  component: SparseConstructorsPage,
});

function SparseConstructorsPage() {
  const [rows, setRows] = useState("5");
  const [cols, setCols] = useState("5");
  const [triplets, setTriplets] = useState("1,1,10\n1,4,3\n3,3,5\n5,2,-2");

  const sample = () => {
    setRows("6");
    setCols("6");
    setTriplets("1,1,12\n1,6,1\n2,2,8\n3,5,-4\n4,3,7\n6,6,9");
  };

  const out = useMemo(() => {
    try {
      const r = Number.parseInt(rows, 10);
      const c = Number.parseInt(cols, 10);
      if (!Number.isInteger(r) || r < 1) throw new Error("Rows must be a positive integer");
      if (!Number.isInteger(c) || c < 1) throw new Error("Columns must be a positive integer");
      const m = makeMatrix(r, c, ZERO);
      const lines = triplets.split("\n").map((line) => line.trim()).filter(Boolean);
      let nonzeros = 0;
      lines.forEach((line, idx) => {
        const [iText, jText, valueText] = line.split(",").map((p) => p.trim());
        const i = Number.parseInt(iText ?? "", 10);
        const j = Number.parseInt(jText ?? "", 10);
        if (!Number.isInteger(i) || !Number.isInteger(j)) {
          throw new Error(`Line ${idx + 1}: row and column must be integers`);
        }
        if (i < 1 || i > r || j < 1 || j > c) {
          throw new Error(`Line ${idx + 1}: index (${i},${j}) is outside ${r}x${c}`);
        }
        if (!valueText) throw new Error(`Line ${idx + 1}: missing value`);
        m[i - 1][j - 1] = parseExpr(valueText);
      });
      for (const row of m) for (const value of row) if (!isZero(value)) nonzeros++;
      const { rows: rr, cols: cc } = dims(m);
      return { matrix: m, nnz: nonzeros, density: nonzeros / (rr * cc), error: null as string | null };
    } catch (e) {
      return { matrix: null, nnz: 0, density: 0, error: e instanceof Error ? e.message : "Error" };
    }
  }, [rows, cols, triplets]);

  return (
    <PageLayout
      title="Sparse Constructors"
      tagline="Construct sparse matrices from coordinate triplets and check nonzero structure before downstream solves."
      showHowItWorks={false}
    >
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card/40 p-6 space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Rows</Label>
          <Input value={rows} onChange={(e) => setRows(e.target.value)} className="font-mono" />
        </div>
        <div className="rounded-lg border border-border bg-card/40 p-6 space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Columns</Label>
          <Input value={cols} onChange={(e) => setCols(e.target.value)} className="font-mono" />
        </div>
      </div>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Triplets (row,col,value), one per line</Label>
          <Button type="button" variant="secondary" onClick={sample}>Load sample pattern</Button>
        </div>
        <textarea
          className="w-full min-h-44 rounded-md border border-border bg-background/70 p-3 font-mono text-sm"
          value={triplets}
          onChange={(e) => setTriplets(e.target.value)}
        />
      </section>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-4">
        <h2 className="text-xl font-semibold">Dense preview</h2>
        {out.error ? (
          <p className="text-sm font-mono text-destructive">{out.error}</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Nonzeros: <span className="font-mono">{out.nnz}</span> | Density: <span className="font-mono">{(100 * out.density).toFixed(2)}%</span>
            </p>
            {out.matrix && <div className="overflow-x-auto"><MatrixDisplay m={out.matrix} label="Resulting sparse matrix (dense view)" /></div>}
          </>
        )}
      </section>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold">How sparse constructors works</h2>
        <p className="text-sm text-muted-foreground">
          The COO format stores only nonzero entries as triplets <span className="font-mono">(i, j, value)</span>. This avoids
          filling memory with explicit zeros for large sparse systems.
        </p>
        <p className="text-sm text-muted-foreground">
          Here indices are 1-based for readability. Repeated coordinates overwrite earlier values, and density is
          <span className="font-mono"> nnz/(rows*cols)</span>, a quick predictor of sparse algorithm efficiency.
        </p>
      </section>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}
