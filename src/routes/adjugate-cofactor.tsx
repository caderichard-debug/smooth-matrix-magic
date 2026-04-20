import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { AdSlot } from "@/components/AdSlot";
import {
  ONE,
  determinant,
  dims,
  eMul,
  fromNumbers,
  formatExpr,
  identity,
  multiply,
  parseExpr,
  scalarMultiply,
  transpose,
  type Matrix,
} from "@/lib/matrix";

export const Route = createFileRoute("/adjugate-cofactor")({
  head: () => ({
    meta: [
      { title: "Adjugate & Cofactor Matrix Calculator" },
      {
        name: "description",
        content:
          "Compute cofactor matrix and adjugate (classical adjoint), then verify A·adj(A) = det(A)·I for square matrices.",
      },
      { property: "og:title", content: "Adjugate & Cofactor Matrix Calculator" },
      {
        property: "og:description",
        content: "Build cofactors, transpose to adjugate, and verify determinant identity.",
      },
    ],
  }),
  component: AdjugateCofactorPage,
});

function AdjugateCofactorPage() {
  const [a, setA] = useState<Matrix>(() =>
    fromNumbers([
      [2, 1, 3],
      [0, -1, 4],
      [5, 2, 0],
    ]),
  );

  const out = useMemo(() => {
    try {
      const { rows, cols } = dims(a);
      if (rows !== cols) throw new Error("Adjugate and cofactor matrix require a square matrix");
      if (rows > 5) throw new Error("Please use up to 5x5 for responsive symbolic performance");
      const cofactor = buildCofactorMatrix(a);
      const adjugate = transpose(cofactor);
      const detA = determinant(a);
      const identityScaled = scalarMultiply(identity(rows), detA);
      const left = multiply(a, adjugate);
      return {
        cofactor,
        adjugate,
        identityScaled,
        left,
        detText: formatExpr(detA),
        error: null as string | null,
      };
    } catch (e) {
      return {
        cofactor: null,
        adjugate: null,
        identityScaled: null,
        left: null,
        detText: "",
        error: e instanceof Error ? e.message : "Error",
      };
    }
  }, [a]);

  return (
    <PageLayout
      title="Adjugate / Cofactor Matrix"
      tagline="Compute cofactors and the adjugate, then verify the classical identity linking them to determinants."
      showHowItWorks={false}
    >
      <MatrixInput title="Matrix A" value={a} onChange={setA} />

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-4">
        <h2 className="text-xl font-semibold">Cofactor and adjugate results</h2>
        {out.error ? (
          <p className="text-sm font-mono text-destructive">{out.error}</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground font-mono">det(A) = {out.detText}</p>
            <div className="grid lg:grid-cols-2 gap-4">
              {out.cofactor && (
                <div className="overflow-x-auto">
                  <MatrixDisplay m={out.cofactor} label="Cofactor matrix C" />
                </div>
              )}
              {out.adjugate && (
                <div className="overflow-x-auto">
                  <MatrixDisplay m={out.adjugate} label="adj(A) = C^T" />
                </div>
              )}
              {out.left && (
                <div className="overflow-x-auto">
                  <MatrixDisplay m={out.left} label="A · adj(A)" />
                </div>
              )}
              {out.identityScaled && (
                <div className="overflow-x-auto">
                  <MatrixDisplay m={out.identityScaled} label="det(A) · I" />
                </div>
              )}
            </div>
          </>
        )}
      </section>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold">How adjugate and cofactor works</h2>
        <p className="text-sm text-muted-foreground">
          The cofactor entry is <span className="font-mono">C_ij = (-1)^(i+j) det(M_ij)</span>,
          where
          <span className="font-mono"> M_ij</span> removes row i and column j.
        </p>
        <p className="text-sm text-muted-foreground">
          The adjugate is the transpose of the cofactor matrix. A key identity is
          <span className="font-mono"> A·adj(A) = det(A)·I</span>, which also yields
          <span className="font-mono"> A^(-1) = adj(A)/det(A)</span> when{" "}
          <span className="font-mono">det(A) != 0</span>.
        </p>
        <p className="text-sm text-muted-foreground">
          Equivalent right-multiplication also holds:
          <span className="font-mono"> adj(A)·A = det(A)·I</span>. The map is multilinear in
          rows/columns through minors, and signs follow the checkerboard pattern
          <span className="font-mono"> (+,-,+;-,+,-;...)</span>.
        </p>
      </section>

      <p className="text-sm text-muted-foreground">
        While direct adjugate formulas are expensive for large n, they remain a valuable symbolic
        tool and a compact proof technique in linear algebra.
      </p>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}

function buildCofactorMatrix(a: Matrix): Matrix {
  const { rows } = dims(a);
  if (rows === 1) return [[ONE]];
  return Array.from({ length: rows }, (_, i) =>
    Array.from({ length: rows }, (_, j) => {
      const minor = a.filter((_, rr) => rr !== i).map((row) => row.filter((_, cc) => cc !== j));
      const sign = (i + j) % 2 === 0 ? parseExpr("1") : parseExpr("-1");
      return eMul(sign, determinant(minor));
    }),
  );
}
