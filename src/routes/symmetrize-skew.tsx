import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { AdSlot } from "@/components/AdSlot";
import {
  add,
  dims,
  fromNumbers,
  parseExpr,
  scalarDivide,
  subtract,
  transpose,
  type Matrix,
} from "@/lib/matrix";

export const Route = createFileRoute("/symmetrize-skew")({
  head: () => ({
    meta: [
      { title: "Symmetrize / Skew-Symmetrize Matrix Calculator" },
      {
        name: "description",
        content:
          "Decompose a square matrix into symmetric and skew-symmetric parts using (A + A^T)/2 and (A - A^T)/2.",
      },
      { property: "og:title", content: "Symmetrize / Skew-Symmetrize Matrix Calculator" },
      {
        property: "og:description",
        content: "Compute A = S + K with S symmetric and K skew-symmetric.",
      },
    ],
  }),
  component: SymmetrizeSkewPage,
});

function SymmetrizeSkewPage() {
  const [a, setA] = useState<Matrix>(() =>
    fromNumbers([
      [2.5, 3.5, 1.5],
      [0.5, -1.0, 4.0],
      [5.5, 2.0, 7.5],
    ]),
  );

  const out = useMemo(() => {
    try {
      const { rows, cols } = dims(a);
      if (rows !== cols) throw new Error("Symmetrization requires a square matrix");
      const at = transpose(a);
      const symmetric = scalarDivide(add(a, at), parseExpr("2"));
      const skew = scalarDivide(subtract(a, at), parseExpr("2"));
      return { symmetric, skew, reconstructed: add(symmetric, skew), error: null as string | null };
    } catch (e) {
      return {
        symmetric: null,
        skew: null,
        reconstructed: null,
        error: e instanceof Error ? e.message : "Error",
      };
    }
  }, [a]);

  return (
    <PageLayout
      title="Symmetrize / Skew-Symmetrize"
      tagline="Split a square matrix into symmetric and skew-symmetric components in one step."
      showHowItWorks={false}
    >
      <MatrixInput title="Matrix A" value={a} onChange={setA} />

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-4">
        <h2 className="text-xl font-semibold">Decomposition results</h2>
        {out.error ? (
          <p className="text-sm font-mono text-destructive">{out.error}</p>
        ) : (
          <div className="grid lg:grid-cols-2 gap-4">
            {out.symmetric && (
              <div className="overflow-x-auto">
                <MatrixDisplay m={out.symmetric} label="S = (A + A^T)/2" />
              </div>
            )}
            {out.skew && (
              <div className="overflow-x-auto">
                <MatrixDisplay m={out.skew} label="K = (A - A^T)/2" />
              </div>
            )}
            {out.reconstructed && (
              <div className="overflow-x-auto">
                <MatrixDisplay m={out.reconstructed} label="S + K (reconstruction)" />
              </div>
            )}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold">How symmetrize and skew-symmetrize works</h2>
        <p className="text-sm text-muted-foreground">
          Every square matrix can be uniquely decomposed as{" "}
          <span className="font-mono">A = S + K</span> where
          <span className="font-mono"> S^T = S</span> and{" "}
          <span className="font-mono">K^T = -K</span>.
        </p>
        <p className="text-sm text-muted-foreground">
          The formulas are <span className="font-mono">S = (A + A^T)/2</span> and{" "}
          <span className="font-mono">K = (A - A^T)/2</span>. This decomposition is central in
          continuum mechanics, quadratic forms, and Lie algebra structure.
        </p>
        <p className="text-sm text-muted-foreground">
          Orthogonality under the Frobenius inner product gives
          <span className="font-mono"> tr(S^T K) = 0</span>, and immediately
          <span className="font-mono"> A^T = S - K</span>. Over characteristic not equal to 2, these
          formulas are valid exactly and guarantee uniqueness.
        </p>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
          <li>S is always symmetric, so S^T = S.</li>
          <li>K is always skew-symmetric, so K^T = -K and its diagonal entries are zero.</li>
          <li>The decomposition is unique for every square matrix A.</li>
        </ul>
      </section>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}
