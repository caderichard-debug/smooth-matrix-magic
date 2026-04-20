import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { StepsPanel } from "@/components/StepsPanel";
import { AdSlot } from "@/components/AdSlot";
import { transpose, fromNumbers, type Matrix } from "@/lib/matrix";
import { transposeSteps } from "@/lib/steps";

export const Route = createFileRoute("/transpose")({
  head: () => ({
    meta: [
      { title: "Matrix Transpose Calculator — Free Online" },
      {
        name: "description",
        content:
          "Transpose any matrix online instantly. Swap rows and columns. Supports fractions and variables.",
      },
      { property: "og:title", content: "Matrix Transpose Calculator" },
      { property: "og:description", content: "Transpose a matrix online — symbolic and instant." },
    ],
  }),
  component: TransposePage,
});

function TransposePage() {
  const [a, setA] = useState<Matrix>(() =>
    fromNumbers([
      [1.1, -2.4, 3.6],
      [0.5, 4.2, -1.3],
    ]),
  );

  const result = useMemo(() => transpose(a), [a]);
  const steps = useMemo(() => transposeSteps(a), [a]);

  return (
    <PageLayout
      title="Matrix Transpose Calculator"
      tagline="The transpose flips a matrix over its diagonal — rows become columns and columns become rows."
      showHowItWorks={false}
    >
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <MatrixInput title="Matrix A" value={a} onChange={setA} />
        <section className="rounded-lg border border-border bg-card/40 p-6">
          <h2 className="text-xl font-semibold mb-4">
            Result: A<sup>T</sup>
          </h2>
          <div className="overflow-x-auto">
            <MatrixDisplay m={result} />
          </div>
        </section>
      </div>

      <StepsPanel steps={steps} />

      <AdSlot label="Ad space — below result" height="h-28" />

      <section className="prose-invert max-w-none space-y-3 text-muted-foreground">
        <h2 className="text-foreground text-xl font-semibold">How matrix transpose works</h2>
        <p>
          The transpose swaps row and column indices. If{" "}
          <span className="font-mono text-primary">B = Aᵀ</span>, then{" "}
          <span className="font-mono text-primary">Bᵢⱼ = Aⱼᵢ</span>.
        </p>
        <p>
          A matrix of size <span className="font-mono text-primary">m×n</span> becomes{" "}
          <span className="font-mono text-primary">n×m</span> after transposing. This operation is
          always valid for any matrix, including non-square ones.
        </p>
        <p>
          Useful identities: <span className="font-mono text-primary">(Aᵀ)ᵀ = A</span> and{" "}
          <span className="font-mono text-primary">(AB)ᵀ = BᵀAᵀ</span>. The second one explains why
          transpose is common when rewriting dot products and normal equations.
        </p>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>Linearity: (A + B)ᵀ = Aᵀ + Bᵀ and (kA)ᵀ = kAᵀ.</li>
          <li>Trace is unchanged: tr(Aᵀ) = tr(A).</li>
          <li>Determinant is unchanged for square A: det(Aᵀ) = det(A).</li>
          <li>Symmetry checks: A is symmetric if Aᵀ = A, skew-symmetric if Aᵀ = -A.</li>
        </ul>
      </section>
    </PageLayout>
  );
}
