import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { AdSlot } from "@/components/AdSlot";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  bandExtract,
  concatHorizontal,
  concatVertical,
  conjugateTranspose,
  diagonalExtract,
  diagonalMatrix,
  flattenMatrix,
  fromNumbers,
  parseExpr,
  reshapeMatrix,
  reverseCols,
  reverseRows,
  type Matrix,
} from "@/lib/matrix";

export const Route = createFileRoute("/structure-tools")({
  head: () => ({
    meta: [
      { title: "Matrix Shape & Structural Tools — Reshape, Slice, Diagonal, Bands" },
      {
        name: "description",
        content:
          "Use practical matrix structure operations: conjugate transpose, reshape, flatten, concatenation, reverse, diagonal, and band extraction.",
      },
      { property: "og:title", content: "Matrix Shape & Structural Tools" },
      {
        property: "og:description",
        content: "Reshape, flatten, concatenate, diagonal extraction and more.",
      },
    ],
  }),
  component: StructureToolsPage,
});

function StructureToolsPage() {
  const [a, setA] = useState<Matrix>(() =>
    fromNumbers([
      [1.5, 2.5, 3.5],
      [4.5, 5.5, 6.5],
    ]),
  );
  const [b, setB] = useState<Matrix>(() =>
    fromNumbers([
      [0.5, 1.0, 1.5],
      [2.0, 2.5, 3.0],
    ]),
  );
  const [shapeText, setShapeText] = useState("3x2");
  const [diagText, setDiagText] = useState("1.5,2.5,3.5");

  const tools = useMemo(() => {
    try {
      const [rText, cText] = shapeText.toLowerCase().split("x");
      const rows = Number.parseInt(rText ?? "", 10);
      const cols = Number.parseInt(cText ?? "", 10);
      const diag = diagText
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
        .map((x) => parseExpr(x));
      return {
        ctranspose: conjugateTranspose(a),
        flat: flattenMatrix(a),
        reshaped: reshapeMatrix(a, rows, cols),
        hcat: concatHorizontal(a, b),
        vcat: concatVertical(a, b),
        revRows: reverseRows(a),
        revCols: reverseCols(a),
        diagExtracted: [diagonalExtract(a)],
        band: bandExtract(a, 1, 0),
        diagCreated: diag.length ? diagonalMatrix(diag) : null,
        error: null as string | null,
      };
    } catch (e) {
      return {
        ctranspose: null,
        flat: null,
        reshaped: null,
        hcat: null,
        vcat: null,
        revRows: null,
        revCols: null,
        diagExtracted: null,
        band: null,
        diagCreated: null,
        error: e instanceof Error ? e.message : "Error",
      };
    }
  }, [a, b, shapeText, diagText]);

  return (
    <PageLayout
      title="Shape & Structural Matrix Tools"
      tagline="Compose and transform matrices with practical structural operations used in pipelines and data workflows."
      showHowItWorks={false}
    >
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card/40 p-4 space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Reshape target (rows x cols)
          </Label>
          <Input
            value={shapeText}
            onChange={(e) => setShapeText(e.target.value)}
            className="font-mono"
          />
        </div>
        <div className="rounded-lg border border-border bg-card/40 p-4 space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Diagonal values (comma separated)
          </Label>
          <Input
            value={diagText}
            onChange={(e) => setDiagText(e.target.value)}
            className="font-mono"
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <MatrixInput title="Matrix A" value={a} onChange={setA} />
        <MatrixInput title="Matrix B (for concatenation)" value={b} onChange={setB} />
      </div>

      {tools.error ? (
        <section className="rounded-lg border border-border bg-card/40 p-6">
          <p className="text-destructive font-mono text-sm">{tools.error}</p>
        </section>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          <section className="rounded-lg border border-border bg-card/40 p-6 space-y-4">
            <h2 className="text-xl font-semibold">Transforms</h2>
            {tools.ctranspose && (
              <MatrixDisplay m={tools.ctranspose} label="Conjugate transpose A^H" />
            )}
            {tools.flat && <MatrixDisplay m={tools.flat} label="Flatten(A)" />}
            {tools.reshaped && <MatrixDisplay m={tools.reshaped} label="Reshape(A)" />}
            {tools.revRows && <MatrixDisplay m={tools.revRows} label="Reverse rows" />}
            {tools.revCols && <MatrixDisplay m={tools.revCols} label="Reverse cols" />}
          </section>
          <section className="rounded-lg border border-border bg-card/40 p-6 space-y-4">
            <h2 className="text-xl font-semibold">Composition & extraction</h2>
            {tools.hcat && <MatrixDisplay m={tools.hcat} label="Concat horizontal [A|B]" />}
            {tools.vcat && <MatrixDisplay m={tools.vcat} label="Concat vertical [A;B]" />}
            {tools.diagExtracted && (
              <MatrixDisplay m={tools.diagExtracted} label="Diagonal extraction diag(A)" />
            )}
            {tools.band && (
              <MatrixDisplay m={tools.band} label="Band extraction (lower=1, upper=0)" />
            )}
            {tools.diagCreated && (
              <MatrixDisplay m={tools.diagCreated} label="Diagonal entries (input preview)" />
            )}
          </section>
        </div>
      )}

      <section className="prose-invert max-w-none space-y-3 text-muted-foreground">
        <h2 className="text-foreground text-xl font-semibold">
          How shape and structural matrix tools work
        </h2>
        <p>
          Conjugate transpose forms A^H by transposing and conjugating entries; for real matrices
          this is just A^T. Flatten and reshape preserve entry order while changing dimensions, so
          total element count must stay constant.
        </p>
        <p>
          Horizontal concatenation [A|B] requires matching row counts, while vertical concatenation
          [A;B] requires matching column counts. Reversing rows or columns applies permutation
          matrices to reorder indices.
        </p>
        <p>
          Diagonal extraction returns diag(A) = [a_11, a_22, ...], and diagonal creation places
          chosen values on the main diagonal. Band extraction with lower and upper widths keeps
          entries near the diagonal and zeros others.
        </p>
        <p>
          Dimension rules: reshape from m x n to r x c requires mn = rc; [A|B] needs rows(A) =
          rows(B); [A;B] needs cols(A) = cols(B). Index-wise, row reversal maps i to m-1-i and
          column reversal maps j to n-1-j.
        </p>
        <ul className="list-disc pl-5 text-sm">
          <li>Flatten(A) here is row-major, so reshape follows the same row-by-row order.</li>
          <li>
            Band limits are relative to the main diagonal: lower keeps below, upper keeps above.
          </li>
          <li>For real-valued inputs, conjugate transpose and transpose are identical.</li>
        </ul>
      </section>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}
