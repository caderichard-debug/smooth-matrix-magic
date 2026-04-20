import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { AdSlot } from "@/components/AdSlot";
import { concatHorizontal, concatVertical, fromNumbers, type Matrix } from "@/lib/matrix";

export const Route = createFileRoute("/block-matrix-builder")({
  head: () => ({
    meta: [
      { title: "Block Matrix Builder Calculator" },
      {
        name: "description",
        content:
          "Build a 2x2 block matrix from submatrices A, B, C, D with shape validation for block concatenation.",
      },
      { property: "og:title", content: "Block Matrix Builder Calculator" },
      {
        property: "og:description",
        content: "Assemble [[A,B],[C,D]] with row/column compatibility checks.",
      },
    ],
  }),
  component: BlockMatrixBuilderPage,
});

function BlockMatrixBuilderPage() {
  const [a, setA] = useState<Matrix>(() =>
    fromNumbers([
      [1, 2],
      [3, 4],
    ]),
  );
  const [b, setB] = useState<Matrix>(() => fromNumbers([[5], [6]]));
  const [c, setC] = useState<Matrix>(() => fromNumbers([[7, 8]]));
  const [d, setD] = useState<Matrix>(() => fromNumbers([[9]]));

  const out = useMemo(() => {
    try {
      const top = concatHorizontal(a, b);
      const bottom = concatHorizontal(c, d);
      const block = concatVertical(top, bottom);
      return { block, top, bottom, error: null as string | null };
    } catch (e) {
      return {
        block: null,
        top: null,
        bottom: null,
        error: e instanceof Error ? e.message : "Error",
      };
    }
  }, [a, b, c, d]);

  return (
    <PageLayout
      title="Block Matrix Builder"
      tagline="Assemble a matrix from sub-blocks and validate dimensions before block multiplication or Schur operations."
      showHowItWorks={false}
    >
      <div className="grid lg:grid-cols-2 gap-6">
        <MatrixInput title="Block A (top-left)" value={a} onChange={setA} />
        <MatrixInput title="Block B (top-right)" value={b} onChange={setB} />
        <MatrixInput title="Block C (bottom-left)" value={c} onChange={setC} />
        <MatrixInput title="Block D (bottom-right)" value={d} onChange={setD} />
      </div>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-4">
        <h2 className="text-xl font-semibold">Built block matrix</h2>
        {out.error ? (
          <p className="text-sm font-mono text-destructive">{out.error}</p>
        ) : (
          <div className="grid lg:grid-cols-2 gap-4">
            {out.top && (
              <div className="overflow-x-auto">
                <MatrixDisplay m={out.top} label="[A | B]" />
              </div>
            )}
            {out.bottom && (
              <div className="overflow-x-auto">
                <MatrixDisplay m={out.bottom} label="[C | D]" />
              </div>
            )}
            {out.block && (
              <div className="overflow-x-auto">
                <MatrixDisplay m={out.block} label="[[A, B], [C, D]]" />
              </div>
            )}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold">How block matrix builder works</h2>
        <p className="text-sm text-muted-foreground">
          A 2x2 block matrix is assembled by first building the top row{" "}
          <span className="font-mono">[A|B]</span> and bottom row
          <span className="font-mono"> [C|D]</span>, then stacking them vertically.
        </p>
        <p className="text-sm text-muted-foreground">
          This requires row compatibility within each block row and column compatibility across
          block rows. Block matrices are the natural language of Schur complements and partitioned
          linear solves.
        </p>
        <p className="text-sm text-muted-foreground">
          Shape constraints are: rows(A) = rows(B), rows(C) = rows(D), cols(A) = cols(C), and
          cols(B) = cols(D). Result size is{" "}
          <span className="font-mono">(rows(A)+rows(C)) x (cols(A)+cols(B))</span>. When A is
          invertible, Schur complement relations use{" "}
          <span className="font-mono">S = D - C A^(-1) B</span>.
        </p>
        <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
          <li>Worked shape check: A 2x3, B 2x1, C 1x3, D 1x1 builds a 3x4 block matrix.</li>
          <li>If rows(A) != rows(B), the top block row [A|B] is undefined.</li>
          <li>If cols(A) != cols(C), stacking top and bottom block rows is undefined.</li>
          <li>Schur complement S=D-CA^(-1)B is valid only when A is square and invertible.</li>
        </ul>
      </section>

      <p className="text-sm text-muted-foreground">
        Once assembled, this block form can be reused directly in identities for block inversion,
        Schur complements, and partitioned elimination.
      </p>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}
