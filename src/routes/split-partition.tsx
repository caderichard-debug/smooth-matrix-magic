import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { AdSlot } from "@/components/AdSlot";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { dims, fromNumbers, sliceMatrix, type Matrix } from "@/lib/matrix";

export const Route = createFileRoute("/split-partition")({
  head: () => ({
    meta: [
      { title: "Split & Partition Matrix Calculator" },
      {
        name: "description",
        content:
          "Split a matrix by row/column cut indices and inspect top-bottom, left-right, and 2x2 block partitions.",
      },
      { property: "og:title", content: "Split & Partition Matrix Calculator" },
      {
        property: "og:description",
        content:
          "Cut matrices into useful blocks for elimination, Schur complements, and block algebra.",
      },
    ],
  }),
  component: SplitPartitionPage,
});

function SplitPartitionPage() {
  const [a, setA] = useState<Matrix>(() =>
    fromNumbers([
      [1.2, 2.4, 3.6],
      [4.8, 5.1, 6.3],
      [7.5, 8.7, 9.9],
    ]),
  );
  const [rowCut, setRowCut] = useState("1");
  const [colCut, setColCut] = useState("1");

  const result = useMemo(() => {
    try {
      const { rows, cols } = dims(a);
      const r = Number.parseInt(rowCut, 10);
      const c = Number.parseInt(colCut, 10);
      if (!Number.isInteger(r) || r < 1 || r >= rows)
        throw new Error(`Row cut must be an integer in [1, ${rows - 1}]`);
      if (!Number.isInteger(c) || c < 1 || c >= cols)
        throw new Error(`Column cut must be an integer in [1, ${cols - 1}]`);
      return {
        top: sliceMatrix(a, 0, r, 0, cols),
        bottom: sliceMatrix(a, r, rows, 0, cols),
        left: sliceMatrix(a, 0, rows, 0, c),
        right: sliceMatrix(a, 0, rows, c, cols),
        tl: sliceMatrix(a, 0, r, 0, c),
        tr: sliceMatrix(a, 0, r, c, cols),
        bl: sliceMatrix(a, r, rows, 0, c),
        br: sliceMatrix(a, r, rows, c, cols),
        error: null as string | null,
      };
    } catch (e) {
      return {
        top: null,
        bottom: null,
        left: null,
        right: null,
        tl: null,
        tr: null,
        bl: null,
        br: null,
        error: e instanceof Error ? e.message : "Error",
      };
    }
  }, [a, rowCut, colCut]);

  return (
    <PageLayout
      title="Split / Partition"
      tagline="Cut one matrix into row, column, and block partitions used in block elimination and matrix identities."
      showHowItWorks={false}
    >
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card/40 p-6 space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Row cut index (1-based)
          </Label>
          <Input value={rowCut} onChange={(e) => setRowCut(e.target.value)} className="font-mono" />
        </div>
        <div className="rounded-lg border border-border bg-card/40 p-6 space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Column cut index (1-based)
          </Label>
          <Input value={colCut} onChange={(e) => setColCut(e.target.value)} className="font-mono" />
        </div>
      </div>

      <MatrixInput title="Matrix A" value={a} onChange={setA} />

      {result.error ? (
        <section className="rounded-lg border border-border bg-card/40 p-6">
          <p className="text-sm font-mono text-destructive">{result.error}</p>
        </section>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          <section className="rounded-lg border border-border bg-card/40 p-6 space-y-4">
            <h2 className="text-xl font-semibold">Row / column splits</h2>
            {result.top && (
              <div className="overflow-x-auto">
                <MatrixDisplay m={result.top} label="Top block" />
              </div>
            )}
            {result.bottom && (
              <div className="overflow-x-auto">
                <MatrixDisplay m={result.bottom} label="Bottom block" />
              </div>
            )}
            {result.left && (
              <div className="overflow-x-auto">
                <MatrixDisplay m={result.left} label="Left block" />
              </div>
            )}
            {result.right && (
              <div className="overflow-x-auto">
                <MatrixDisplay m={result.right} label="Right block" />
              </div>
            )}
          </section>
          <section className="rounded-lg border border-border bg-card/40 p-6 space-y-4">
            <h2 className="text-xl font-semibold">2x2 partition</h2>
            {result.tl && (
              <div className="overflow-x-auto">
                <MatrixDisplay m={result.tl} label="A11 (top-left)" />
              </div>
            )}
            {result.tr && (
              <div className="overflow-x-auto">
                <MatrixDisplay m={result.tr} label="A12 (top-right)" />
              </div>
            )}
            {result.bl && (
              <div className="overflow-x-auto">
                <MatrixDisplay m={result.bl} label="A21 (bottom-left)" />
              </div>
            )}
            {result.br && (
              <div className="overflow-x-auto">
                <MatrixDisplay m={result.br} label="A22 (bottom-right)" />
              </div>
            )}
          </section>
        </div>
      )}

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold">How split and partition works</h2>
        <p className="text-sm text-muted-foreground">
          A partition chooses cut indices and rewrites <span className="font-mono">A</span> as a
          block matrix
          <span className="font-mono"> [[A11, A12], [A21, A22]]</span>. This is the setup for Schur
          complements and block Gaussian elimination.
        </p>
        <p className="text-sm text-muted-foreground">
          The row cut divides top vs bottom rows, and the column cut divides left vs right columns.
          Cuts must stay inside the matrix so each block has at least one row and one column.
        </p>
        <p className="text-sm text-muted-foreground">
          With row cut r and column cut c on A (m x n), block sizes are:
          <span className="font-mono"> A11: r x c</span>,{" "}
          <span className="font-mono">A12: r x (n-c)</span>,
          <span className="font-mono"> A21: (m-r) x c</span>,{" "}
          <span className="font-mono">A22: (m-r) x (n-c)</span>. These dimensions drive block
          products and Schur complement formulas.
        </p>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
          <li>For an m x n matrix, valid row cuts are 1 through m-1.</li>
          <li>Valid column cuts are 1 through n-1.</li>
          <li>The four block shapes are determined directly by the two cut indices.</li>
        </ul>
      </section>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}
