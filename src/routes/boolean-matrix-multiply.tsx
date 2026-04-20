import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { AdSlot } from "@/components/AdSlot";
import { asNumber, fromNumbers, isConstant, type Matrix } from "@/lib/matrix";

export const Route = createFileRoute("/boolean-matrix-multiply")({
  head: () => ({
    meta: [
      { title: "Boolean Matrix Multiplication Calculator" },
      {
        name: "description",
        content:
          "Compute boolean matrix product using AND for multiplication and OR for addition. Great for relation and graph logic.",
      },
      { property: "og:title", content: "Boolean Matrix Multiplication Calculator" },
      {
        property: "og:description",
        content: "Multiply 0/1 matrices with logical AND-OR rules directly in browser.",
      },
    ],
  }),
  component: BooleanMatrixMultiplyPage,
});

function BooleanMatrixMultiplyPage() {
  const [a, setA] = useState<Matrix>(() =>
    fromNumbers([
      [1, 0, 1],
      [0, 1, 1],
    ]),
  );
  const [b, setB] = useState<Matrix>(() =>
    fromNumbers([
      [0, 1],
      [1, 1],
      [1, 0],
    ]),
  );

  const product = useMemo(() => {
    try {
      const an = toBinaryMatrix(a, "Matrix A");
      const bn = toBinaryMatrix(b, "Matrix B");
      const aCols = an[0]?.length ?? 0;
      const bRows = bn.length;
      if (aCols !== bRows) {
        throw new Error(
          `Boolean multiplication requires compatible sizes: A columns (${aCols}) must equal B rows (${bRows})`,
        );
      }
      const rows = an.length;
      const cols = bn[0]?.length ?? 0;
      const out = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          let v = 0;
          for (let k = 0; k < aCols; k++) {
            v = v || (an[i][k] && bn[k][j]) ? 1 : 0;
            if (v === 1) break;
          }
          out[i][j] = v;
        }
      }
      return { data: fromNumbers(out), error: null as string | null };
    } catch (e) {
      return { data: null as Matrix | null, error: e instanceof Error ? e.message : "Error" };
    }
  }, [a, b]);

  return (
    <PageLayout
      title="Boolean Matrix Multiply"
      tagline="Multiply 0/1 matrices with logical AND and OR to model composition of binary relations."
      showHowItWorks={false}
    >
      <div className="grid lg:grid-cols-2 gap-6">
        <MatrixInput title="Matrix A (0/1)" value={a} onChange={setA} />
        <MatrixInput title="Matrix B (0/1)" value={b} onChange={setB} />
      </div>

      <section className="rounded-lg border border-border bg-card/40 p-6">
        <h2 className="text-xl font-semibold mb-4">Result: A boxtimes B</h2>
        {product.error ? (
          <p className="text-sm font-mono text-destructive">{product.error}</p>
        ) : (
          product.data && (
            <div className="overflow-x-auto">
              <MatrixDisplay m={product.data} />
            </div>
          )
        )}
      </section>

      <section className="prose-invert max-w-none space-y-3 text-muted-foreground">
        <h2 className="text-foreground text-xl font-semibold">
          How boolean matrix multiplication works
        </h2>
        <p>
          Boolean product replaces +/* with OR/AND:
          <span className="font-mono"> c_ij = OR_k (a_ik AND b_kj)</span>. So c_ij=1 iff at least
          one intermediate index k links i to j.
        </p>
        <p>
          This is common in graph reachability and relation composition. If A and B are
          adjacency-like matrices, the product tells you whether two-step connections exist.
        </p>
        <p>
          Inputs must be 0/1 and dimensions still follow A.cols=B.rows. The operation is
          associative, so repeated products model longer path composition.
        </p>
        <p>
          Read each output 1 as "at least one valid intermediate link exists"; this interpretation
          is often clearer than treating boolean products as numeric arithmetic.
        </p>
      </section>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}

function toBinaryMatrix(m: Matrix, label: string): number[][] {
  if (!m.length || !m[0]?.length) throw new Error(`${label} must not be empty`);
  if (!m.every((row) => row.length === m[0].length))
    throw new Error(`${label} must be rectangular`);
  if (!m.every((row) => row.every((entry) => isConstant(entry)))) {
    throw new Error(`${label} must contain only numeric entries`);
  }
  const out = m.map((row) => row.map((entry) => asNumber(entry) as number));
  for (const row of out) {
    for (const value of row) {
      if (!(Math.abs(value) < 1e-10 || Math.abs(value - 1) < 1e-10)) {
        throw new Error(`${label} must contain only 0 or 1 for boolean multiplication`);
      }
    }
  }
  return out.map((row) => row.map((value) => (Math.abs(value) < 1e-10 ? 0 : 1)));
}
