import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { AdSlot } from "@/components/AdSlot";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  circulantMatrix,
  diagonalMatrix,
  identity,
  onesMatrix,
  parseExpr,
  randomMatrix,
  toeplitzMatrix,
  zeroMatrix,
} from "@/lib/matrix";

export const Route = createFileRoute("/generators")({
  head: () => ({
    meta: [
      { title: "Matrix Generator Utilities — Zero, Ones, Identity, Random, Toeplitz" },
      {
        name: "description",
        content:
          "Generate common matrices instantly: zeros, ones, identity, random, diagonal, Toeplitz, and circulant forms.",
      },
      { property: "og:title", content: "Matrix Generator Utilities" },
      {
        property: "og:description",
        content: "Create useful matrices quickly for downstream operations.",
      },
    ],
  }),
  component: GeneratorsPage,
});

function GeneratorsPage() {
  const [rows, setRows] = useState("3");
  const [cols, setCols] = useState("3");
  const [diagText, setDiagText] = useState("1,2,3");
  const [toeplitzCol, setToeplitzCol] = useState("1,2,3");
  const [toeplitzRow, setToeplitzRow] = useState("1,4,5");
  const [circulantRow, setCirculantRow] = useState("1,2,3");
  const [seed, setSeed] = useState(0);

  const generated = useMemo(() => {
    try {
      void seed;
      const r = Number.parseInt(rows, 10);
      const c = Number.parseInt(cols, 10);
      const diag = diagText
        .split(",")
        .map((x) => parseExpr(x.trim()))
        .filter(Boolean);
      const toNums = (src: string) => src.split(",").map((x) => Number.parseFloat(x.trim()));
      return {
        zero: zeroMatrix(r, c),
        ones: onesMatrix(r, c),
        identity: identity(Math.min(r, c)),
        randomInt: randomMatrix(r, c, -9, 10, true),
        diagonal: diagonalMatrix(diag),
        toeplitz: toeplitzMatrix(toNums(toeplitzCol), toNums(toeplitzRow)),
        circulant: circulantMatrix(toNums(circulantRow)),
        error: null as string | null,
      };
    } catch (e) {
      return {
        zero: null,
        ones: null,
        identity: null,
        randomInt: null,
        diagonal: null,
        toeplitz: null,
        circulant: null,
        error: e instanceof Error ? e.message : "Error",
      };
    }
  }, [rows, cols, diagText, toeplitzCol, toeplitzRow, circulantRow, seed]);

  return (
    <PageLayout
      title="Matrix Creation Utilities"
      tagline="Generate baseline matrices quickly so users can move straight into computation."
      showHowItWorks={false}
    >
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-card/40 p-4 space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Rows</Label>
          <Input value={rows} onChange={(e) => setRows(e.target.value)} className="font-mono" />
        </div>
        <div className="rounded-lg border border-border bg-card/40 p-4 space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Cols</Label>
          <Input value={cols} onChange={(e) => setCols(e.target.value)} className="font-mono" />
        </div>
        <div className="rounded-lg border border-border bg-card/40 p-4 space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Diagonal values
          </Label>
          <Input
            value={diagText}
            onChange={(e) => setDiagText(e.target.value)}
            className="font-mono"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-card/40 p-4 space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Toeplitz first column
          </Label>
          <Input
            value={toeplitzCol}
            onChange={(e) => setToeplitzCol(e.target.value)}
            className="font-mono"
          />
        </div>
        <div className="rounded-lg border border-border bg-card/40 p-4 space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Toeplitz first row
          </Label>
          <Input
            value={toeplitzRow}
            onChange={(e) => setToeplitzRow(e.target.value)}
            className="font-mono"
          />
        </div>
        <div className="rounded-lg border border-border bg-card/40 p-4 space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Circulant first row
          </Label>
          <Input
            value={circulantRow}
            onChange={(e) => setCirculantRow(e.target.value)}
            className="font-mono"
          />
        </div>
      </div>

      <div>
        <Button type="button" variant="secondary" onClick={() => setSeed((s) => s + 1)}>
          Regenerate random matrix
        </Button>
      </div>

      {generated.error ? (
        <section className="rounded-lg border border-border bg-card/40 p-6">
          <p className="text-destructive font-mono text-sm">{generated.error}</p>
        </section>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {generated.zero && <MatrixDisplay m={generated.zero} label="Zero matrix" />}
          {generated.ones && <MatrixDisplay m={generated.ones} label="Ones matrix" />}
          {generated.identity && <MatrixDisplay m={generated.identity} label="Identity matrix" />}
          {generated.randomInt && (
            <MatrixDisplay m={generated.randomInt} label="Random integer matrix" />
          )}
          {generated.diagonal && <MatrixDisplay m={generated.diagonal} label="Diagonal matrix" />}
          {generated.toeplitz && <MatrixDisplay m={generated.toeplitz} label="Toeplitz matrix" />}
          {generated.circulant && (
            <MatrixDisplay m={generated.circulant} label="Circulant matrix" />
          )}
        </div>
      )}

      <section className="prose-invert max-w-none space-y-3 text-muted-foreground">
        <h2 className="text-foreground text-xl font-semibold">
          How matrix creation utilities works
        </h2>
        <p>
          Zero and ones matrices set every entry to 0 or 1. Identity I_n has ones on the main
          diagonal and zeros elsewhere, so I_n x = x for any compatible vector x.
        </p>
        <p>
          A diagonal matrix is diag(d_1, ..., d_n), where only a_ii = d_i may be nonzero. Toeplitz
          matrices satisfy a_i,j = c_(i-j), so each descending diagonal is constant.
        </p>
        <p>
          A circulant matrix is determined by its first row and each next row is a cyclic right
          shift. Random integer matrices are sampled entrywise and are useful for quick tests, but
          results change on regeneration.
        </p>
        <p>
          Structural notes: identity is the multiplicative neutral element, diagonal matrices scale
          coordinates independently, Toeplitz matrices encode shift-invariant kernels, and circulant
          matrices are diagonalized by the discrete Fourier basis.
        </p>
      </section>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}
