import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { AdSlot } from "@/components/AdSlot";
import { hadamardProduct, kroneckerProduct, fromNumbers, type Matrix } from "@/lib/matrix";

export const Route = createFileRoute("/matrix-products")({
  head: () => ({
    meta: [
      { title: "Hadamard & Kronecker Product Calculator — Free Online" },
      {
        name: "description",
        content:
          "Compute Hadamard (element-wise) and Kronecker (tensor) products of two matrices online.",
      },
      { property: "og:title", content: "Hadamard & Kronecker Product Calculator" },
      {
        property: "og:description",
        content: "Find matrix Hadamard and Kronecker products online — free.",
      },
    ],
  }),
  component: MatrixProductsPage,
});

function MatrixProductsPage() {
  const [a, setA] = useState<Matrix>(() =>
    fromNumbers([
      [1.2, 2.4],
      [3.6, 4.8],
    ]),
  );
  const [b, setB] = useState<Matrix>(() =>
    fromNumbers([
      [0.5, 1.5],
      [2.5, 3.5],
    ]),
  );

  const had = useMemo(() => {
    try {
      return { data: hadamardProduct(a, b), error: null as string | null };
    } catch (e) {
      return { data: null as Matrix | null, error: e instanceof Error ? e.message : "Error" };
    }
  }, [a, b]);

  const kron = useMemo(() => {
    try {
      return { data: kroneckerProduct(a, b), error: null as string | null };
    } catch (e) {
      return { data: null as Matrix | null, error: e instanceof Error ? e.message : "Error" };
    }
  }, [a, b]);

  return (
    <PageLayout
      title="Hadamard & Kronecker Product Calculator"
      tagline="Compare element-wise multiplication and tensor-style matrix expansion from the same two inputs."
      showHowItWorks={false}
    >
      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <MatrixInput title="Matrix A" value={a} onChange={setA} />
        <MatrixInput title="Matrix B" value={b} onChange={setB} />
        <div className="space-y-4">
          <section className="rounded-lg border border-border bg-card/40 p-6">
            <h2 className="text-xl font-semibold mb-3">Hadamard Product A .* B</h2>
            {had.error ? (
              <p className="text-destructive font-mono text-sm">{had.error}</p>
            ) : (
              had.data && (
                <div className="overflow-x-auto">
                  <MatrixDisplay m={had.data} />
                </div>
              )
            )}
          </section>

          <section className="rounded-lg border border-border bg-card/40 p-6">
            <h2 className="text-xl font-semibold mb-3">Kronecker Product A (x) B</h2>
            {kron.error ? (
              <p className="text-destructive font-mono text-sm">{kron.error}</p>
            ) : (
              kron.data && (
                <div className="overflow-x-auto">
                  <MatrixDisplay m={kron.data} />
                </div>
              )
            )}
          </section>
        </div>
      </div>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold">How Hadamard and Kronecker products work</h2>
        <p className="text-sm text-muted-foreground">
          The Hadamard product multiplies matching entries:{" "}
          <span className="font-mono">(A .* B)ij = Aij Bij</span>. Dimensions must match exactly, so
          if A is m x n, B must also be m x n.
        </p>
        <p className="text-sm text-muted-foreground">
          The Kronecker product builds a larger block matrix:
          <span className="font-mono"> A (x) B = [aij B]</span>. If A is m x n and B is p x q, the
          result is (m*p) x (n*q), and no equal-size requirement is needed.
        </p>
        <p className="text-sm text-muted-foreground">
          Useful identities: <span className="font-mono">(A (x) B)(C (x) D) = (AC) (x) (BD)</span>{" "}
          when inner dimensions match, and{" "}
          <span className="font-mono">det(A (x) B) = det(A)^p det(B)^m</span> for square A (m x m),
          B (p x p). For same-size inputs, Hadamard obeys
          <span className="font-mono"> sum_ij (A .* B)ij = tr(A^T B)</span>.
        </p>
        <p className="text-sm text-muted-foreground">
          Use Hadamard for entry-by-entry scaling/masking and Kronecker for tensor products, block
          construction, and separable operators.
        </p>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
          <li>Hadamard output always has the same shape as A and B.</li>
          <li>Kronecker output expands to (rows(A)*rows(B)) x (cols(A)*cols(B)).</li>
          <li>If one factor entry is 0 in A, its corresponding Kronecker block is all zeros.</li>
        </ul>
      </section>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}
