import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { AdSlot } from "@/components/AdSlot";
import {
  luDecomposition,
  qrDecomposition,
  gramSchmidtOrthogonalization,
  fromNumbers,
  type Matrix,
} from "@/lib/matrix";

export const Route = createFileRoute("/decompositions")({
  head: () => ({
    meta: [
      { title: "LU, QR, Gram-Schmidt Matrix Calculator — Free Online" },
      {
        name: "description",
        content:
          "Compute LU decomposition, QR decomposition, and Gram-Schmidt orthogonalization for numeric matrices.",
      },
      { property: "og:title", content: "LU, QR, Gram-Schmidt Matrix Calculator" },
      { property: "og:description", content: "Find LU/QR factors and orthonormalized vectors online — free." },
    ],
  }),
  component: DecompositionsPage,
});

function DecompositionsPage() {
  const [a, setA] = useState<Matrix>(() => fromNumbers([
    [1, 2, 1],
    [2, 1, 0],
    [0, 1, 1],
  ]));

  const lu = useMemo(() => {
    try {
      return { data: luDecomposition(a), error: null as string | null };
    } catch (e) {
      return { data: null as { l: Matrix; u: Matrix } | null, error: e instanceof Error ? e.message : "Error" };
    }
  }, [a]);

  const qr = useMemo(() => {
    try {
      return { data: qrDecomposition(a), error: null as string | null };
    } catch (e) {
      return { data: null as { q: Matrix; r: Matrix } | null, error: e instanceof Error ? e.message : "Error" };
    }
  }, [a]);

  const gs = useMemo(() => {
    try {
      return { data: gramSchmidtOrthogonalization(a), error: null as string | null };
    } catch (e) {
      return { data: null as Matrix | null, error: e instanceof Error ? e.message : "Error" };
    }
  }, [a]);

  return (
    <PageLayout
      title="LU, QR & Gram-Schmidt Calculator"
      tagline="Use one numeric matrix input to compute triangular and orthogonal factorizations side by side."
      showHowItWorks={false}
    >
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <MatrixInput title="Matrix A (numeric)" value={a} onChange={setA} />
        <div className="space-y-4">
          <section className="rounded-lg border border-border bg-card/40 p-6">
            <h2 className="text-xl font-semibold mb-3">LU Decomposition (A = LU)</h2>
            {lu.error ? (
              <p className="text-destructive font-mono text-sm">{lu.error}</p>
            ) : lu.data && (
              <div className="space-y-4 overflow-x-auto">
                <MatrixDisplay m={lu.data.l} label="L" />
                <MatrixDisplay m={lu.data.u} label="U" />
              </div>
            )}
          </section>

          <section className="rounded-lg border border-border bg-card/40 p-6">
            <h2 className="text-xl font-semibold mb-3">QR Decomposition (A = QR)</h2>
            {qr.error ? (
              <p className="text-destructive font-mono text-sm">{qr.error}</p>
            ) : qr.data && (
              <div className="space-y-4 overflow-x-auto">
                <MatrixDisplay m={qr.data.q} label="Q" />
                <MatrixDisplay m={qr.data.r} label="R" />
              </div>
            )}
          </section>

          <section className="rounded-lg border border-border bg-card/40 p-6">
            <h2 className="text-xl font-semibold mb-3">Gram-Schmidt Orthonormal Columns</h2>
            {gs.error ? (
              <p className="text-destructive font-mono text-sm">{gs.error}</p>
            ) : gs.data && (
              <div className="overflow-x-auto">
                <MatrixDisplay m={gs.data} />
              </div>
            )}
          </section>
        </div>
      </div>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold">How these decompositions work</h2>
        <p className="text-sm text-muted-foreground">
          LU decomposition factors a square matrix as <span className="font-mono">A = LU</span>, where L is lower
          triangular and U is upper triangular. This implementation is numeric and expects square input.
        </p>
        <p className="text-sm text-muted-foreground">
          QR decomposition writes <span className="font-mono">A = QR</span>, with Q having orthonormal columns and
          R upper triangular. For A in R^(m x n), Q is m x n and R is n x n in reduced form.
        </p>
        <p className="text-sm text-muted-foreground">
          Gram-Schmidt orthonormalization transforms independent input columns into orthonormal columns spanning the
          same subspace. The returned matrix contains those orthonormalized column vectors.
        </p>
      </section>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}
