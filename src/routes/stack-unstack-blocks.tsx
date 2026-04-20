import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { AdSlot } from "@/components/AdSlot";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { concatHorizontal, concatVertical, dims, fromNumbers, sliceMatrix, type Matrix } from "@/lib/matrix";

export const Route = createFileRoute("/stack-unstack-blocks")({
  head: () => ({
    meta: [
      { title: "Stack & Unstack Matrix Blocks Calculator" },
      {
        name: "description",
        content:
          "Stack matrices horizontally/vertically and unstack a matrix into top-bottom and left-right blocks with cut indices.",
      },
      { property: "og:title", content: "Stack & Unstack Matrix Blocks Calculator" },
      { property: "og:description", content: "Compose and decompose block matrices with shape-aware validation." },
    ],
  }),
  component: StackUnstackBlocksPage,
});

function StackUnstackBlocksPage() {
  const [a, setA] = useState<Matrix>(() => fromNumbers([[1, 2], [3, 4]]));
  const [b, setB] = useState<Matrix>(() => fromNumbers([[5, 6], [7, 8]]));
  const [c, setC] = useState<Matrix>(() => fromNumbers([[1, 2, 3], [4, 5, 6], [7, 8, 9]]));
  const [rowCut, setRowCut] = useState("1");
  const [colCut, setColCut] = useState("1");

  const built = useMemo(() => {
    try {
      return {
        hStack: concatHorizontal(a, b),
        vStack: concatVertical(a, b),
        error: null as string | null,
      };
    } catch (e) {
      return { hStack: null, vStack: null, error: e instanceof Error ? e.message : "Error" };
    }
  }, [a, b]);

  const unstacked = useMemo(() => {
    try {
      const { rows, cols } = dims(c);
      const r = Number.parseInt(rowCut, 10);
      const k = Number.parseInt(colCut, 10);
      if (!Number.isInteger(r) || r < 1 || r >= rows) throw new Error(`Row cut must be an integer in [1, ${rows - 1}]`);
      if (!Number.isInteger(k) || k < 1 || k >= cols) throw new Error(`Column cut must be an integer in [1, ${cols - 1}]`);
      return {
        top: sliceMatrix(c, 0, r, 0, cols),
        bottom: sliceMatrix(c, r, rows, 0, cols),
        left: sliceMatrix(c, 0, rows, 0, k),
        right: sliceMatrix(c, 0, rows, k, cols),
        error: null as string | null,
      };
    } catch (e) {
      return { top: null, bottom: null, left: null, right: null, error: e instanceof Error ? e.message : "Error" };
    }
  }, [c, rowCut, colCut]);

  return (
    <PageLayout
      title="Stack / Unstack Blocks"
      tagline="Build larger block matrices by stacking inputs, then recover block pieces with row and column cuts."
      showHowItWorks={false}
    >
      <div className="grid lg:grid-cols-2 gap-6">
        <MatrixInput title="Matrix A (for stacking)" value={a} onChange={setA} />
        <MatrixInput title="Matrix B (for stacking)" value={b} onChange={setB} />
      </div>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-4">
        <h2 className="text-xl font-semibold">Stack results</h2>
        {built.error ? (
          <p className="text-sm font-mono text-destructive">{built.error}</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {built.hStack && <div className="overflow-x-auto"><MatrixDisplay m={built.hStack} label="Horizontal stack [A|B]" /></div>}
            {built.vStack && <div className="overflow-x-auto"><MatrixDisplay m={built.vStack} label="Vertical stack [A;B]" /></div>}
          </div>
        )}
      </section>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card/40 p-6 space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Row cut for unstack (1-based)</Label>
          <Input value={rowCut} onChange={(e) => setRowCut(e.target.value)} className="font-mono" />
        </div>
        <div className="rounded-lg border border-border bg-card/40 p-6 space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Column cut for unstack (1-based)</Label>
          <Input value={colCut} onChange={(e) => setColCut(e.target.value)} className="font-mono" />
        </div>
      </div>

      <MatrixInput title="Matrix C (to unstack)" value={c} onChange={setC} />

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-4">
        <h2 className="text-xl font-semibold">Unstack results</h2>
        {unstacked.error ? (
          <p className="text-sm font-mono text-destructive">{unstacked.error}</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {unstacked.top && <div className="overflow-x-auto"><MatrixDisplay m={unstacked.top} label="Top rows" /></div>}
            {unstacked.bottom && <div className="overflow-x-auto"><MatrixDisplay m={unstacked.bottom} label="Bottom rows" /></div>}
            {unstacked.left && <div className="overflow-x-auto"><MatrixDisplay m={unstacked.left} label="Left columns" /></div>}
            {unstacked.right && <div className="overflow-x-auto"><MatrixDisplay m={unstacked.right} label="Right columns" /></div>}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold">How stack and unstack blocks works</h2>
        <p className="text-sm text-muted-foreground">
          Horizontal stacking concatenates columns and requires equal row counts. Vertical stacking concatenates rows and
          requires equal column counts.
        </p>
        <p className="text-sm text-muted-foreground">
          Unstacking is the inverse idea: pick cut indices and split one matrix into top/bottom and left/right pieces.
          These block views are useful for deriving block multiplication and elimination formulas.
        </p>
      </section>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}
