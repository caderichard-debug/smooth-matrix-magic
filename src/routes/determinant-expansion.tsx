import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { AdSlot } from "@/components/AdSlot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  determinant,
  dims,
  eAdd,
  eMul,
  formatExpr,
  fromNumbers,
  parseExpr,
  type Matrix,
} from "@/lib/matrix";

export const Route = createFileRoute("/determinant-expansion")({
  head: () => ({
    meta: [
      { title: "Determinant Expansion (Laplace) Calculator" },
      {
        name: "description",
        content:
          "Expand determinants by a chosen row or column, inspect each cofactor term, and verify the final symbolic value.",
      },
      { property: "og:title", content: "Determinant Expansion (Laplace) Calculator" },
      {
        property: "og:description",
        content: "See every cofactor term in a row/column determinant expansion.",
      },
    ],
  }),
  component: DeterminantExpansionPage,
});

function DeterminantExpansionPage() {
  const [a, setA] = useState<Matrix>(() =>
    fromNumbers([
      [2, 1, 3],
      [0, -1, 4],
      [5, 2, 0],
    ]),
  );
  const [mode, setMode] = useState<"row" | "col">("row");
  const [indexText, setIndexText] = useState("1");

  const out = useMemo(() => {
    try {
      const { rows, cols } = dims(a);
      if (rows !== cols) throw new Error("Determinant expansion requires a square matrix");
      if (rows > 5) throw new Error("Please use up to 5x5 for readable expansion output");
      const index = Number.parseInt(indexText, 10);
      if (!Number.isInteger(index) || index < 1 || index > rows) {
        throw new Error(`Expansion index must be an integer between 1 and ${rows}`);
      }
      const iOrJ = index - 1;
      const terms: string[] = [];
      let accum = parseExpr("0");
      for (let k = 0; k < rows; k++) {
        const i = mode === "row" ? iOrJ : k;
        const j = mode === "row" ? k : iOrJ;
        const minor = a.filter((_, rr) => rr !== i).map((row) => row.filter((_, cc) => cc !== j));
        const minorDet = determinant(minor);
        const signPositive = (i + j) % 2 === 0;
        const cofactor = signPositive ? minorDet : eMul(parseExpr("-1"), minorDet);
        const term = eMul(a[i][j], cofactor);
        accum = eAdd(accum, term);
        terms.push(
          `${mode === "row" ? "a_" + (i + 1) + "," + (j + 1) : "a_" + (i + 1) + "," + (j + 1)} * C_${i + 1},${j + 1} = ${formatExpr(a[i][j])} * ${formatExpr(cofactor)} = ${formatExpr(term)}`,
        );
      }
      return { terms, expandedDet: accum, directDet: determinant(a), error: null as string | null };
    } catch (e) {
      return {
        terms: [],
        expandedDet: null,
        directDet: null,
        error: e instanceof Error ? e.message : "Error",
      };
    }
  }, [a, mode, indexText]);

  return (
    <PageLayout
      title="Determinant by Expansion"
      tagline="Expand determinants along a selected row or column and inspect each cofactor contribution."
      showHowItWorks={false}
    >
      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-card/40 p-6 space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Expansion mode
          </Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === "row" ? "default" : "secondary"}
              onClick={() => setMode("row")}
            >
              Row
            </Button>
            <Button
              type="button"
              variant={mode === "col" ? "default" : "secondary"}
              onClick={() => setMode("col")}
            >
              Column
            </Button>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card/40 p-6 space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            {mode === "row" ? "Row index (1-based)" : "Column index (1-based)"}
          </Label>
          <Input
            value={indexText}
            onChange={(e) => setIndexText(e.target.value)}
            className="font-mono"
          />
        </div>
      </div>

      <MatrixInput title="Matrix A" value={a} onChange={setA} />

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-4">
        <h2 className="text-xl font-semibold">Expansion terms</h2>
        {out.error ? (
          <p className="text-sm font-mono text-destructive">{out.error}</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground font-mono">
              Expanded determinant = {out.expandedDet ? formatExpr(out.expandedDet) : ""}
            </p>
            <p className="text-sm text-muted-foreground font-mono">
              Direct determinant = {out.directDet ? formatExpr(out.directDet) : ""}
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              {out.terms.map((term) => (
                <li key={term} className="font-mono">
                  {term}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold">How determinant expansion works</h2>
        <p className="text-sm text-muted-foreground">
          Laplace expansion writes <span className="font-mono">det(A)</span> as a sum of entries
          times cofactors along any chosen row or column. Cofactors include the alternating sign
          pattern <span className="font-mono">(-1)^(i+j)</span>.
        </p>
        <p className="text-sm text-muted-foreground">
          Picking a row or column with many zeros reduces work because zero entries contribute zero
          terms. This identity is exact and works symbolically, not only numerically.
        </p>
        <p className="text-sm text-muted-foreground">
          Formally, row i expansion is
          <span className="font-mono"> det(A) = sum_j a_ij C_ij</span> and column j expansion is
          <span className="font-mono"> det(A) = sum_i a_ij C_ij</span>, with
          <span className="font-mono"> C_ij = (-1)^(i+j) det(M_ij)</span>. Determinant
          multilinearity explains why each term is linear in the chosen row or column entries.
        </p>
      </section>

      <section className="rounded-lg border border-border bg-card/40 p-6">
        <div className="overflow-x-auto">
          <MatrixDisplay m={a} label="Matrix used for expansion" />
        </div>
      </section>

      <p className="text-sm text-muted-foreground">
        Comparing expanded and direct determinant values on the same input is a practical way to
        validate sign handling and minor construction logic.
      </p>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}
