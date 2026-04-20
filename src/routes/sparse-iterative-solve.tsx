import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { AdSlot } from "@/components/AdSlot";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  denseToSparse,
  parseNumericMatrixText,
  parseNumericVectorText,
  solveJacobiSparse,
} from "@/lib/sparse";

export const Route = createFileRoute("/sparse-iterative-solve")({
  head: () => ({
    meta: [
      { title: "Sparse Iterative Solve (Jacobi) — Convergence Diagnostics" },
      {
        name: "description",
        content:
          "Solve sparse linear systems approximately with Jacobi iteration and review convergence history and residual norms.",
      },
      { property: "og:title", content: "Sparse Iterative Solve" },
      {
        property: "og:description",
        content: "Jacobi sparse solver with iteration and residual diagnostics.",
      },
    ],
  }),
  component: SparseIterativeSolvePage,
});

function SparseIterativeSolvePage() {
  const [matrixText, setMatrixText] = useState("4 -1 0\n-1 4 -1\n0 -1 3");
  const [rhsText, setRhsText] = useState("15 10 10");
  const [toleranceText, setToleranceText] = useState("1e-6");
  const [maxIterationsText, setMaxIterationsText] = useState("50");

  const result = useMemo(() => {
    try {
      const dense = parseNumericMatrixText(matrixText);
      const rhs = parseNumericVectorText(rhsText);
      const sparse = denseToSparse(dense);
      const tolerance = Number.parseFloat(toleranceText);
      const maxIterations = Number.parseInt(maxIterationsText, 10);
      const solve = solveJacobiSparse(sparse, rhs, maxIterations, tolerance);
      return { solve, sparse, error: null as string | null };
    } catch (error) {
      return { solve: null, sparse: null, error: error instanceof Error ? error.message : "Error" };
    }
  }, [matrixText, rhsText, toleranceText, maxIterationsText]);

  return (
    <PageLayout
      title="Sparse Iterative Solve"
      tagline="Estimate Ax=b solutions using Jacobi updates and inspect convergence in a compact report."
      showHowItWorks={false}
    >
      <div className="grid lg:grid-cols-2 gap-6">
        <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Matrix A assumptions: numeric dense rows; parser accepts spaces, commas, semicolons
          </Label>
          <Textarea
            value={matrixText}
            onChange={(e) => setMatrixText(e.target.value)}
            className="font-mono min-h-[140px]"
            spellCheck={false}
          />
        </section>
        <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Vector b (single row of values)
          </Label>
          <Input
            value={rhsText}
            onChange={(e) => setRhsText(e.target.value)}
            className="font-mono"
          />
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Tolerance
          </Label>
          <Input
            value={toleranceText}
            onChange={(e) => setToleranceText(e.target.value)}
            className="font-mono"
          />
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Max iterations
          </Label>
          <Input
            value={maxIterationsText}
            onChange={(e) => setMaxIterationsText(e.target.value)}
            className="font-mono"
          />
        </section>
      </div>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-4">
        <h2 className="text-xl font-semibold">Iterative convergence report</h2>
        {result.error ? (
          <p className="text-destructive font-mono text-sm">{result.error}</p>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              <Metric label="NNZ(A)" value={`${result.sparse!.entries.length}`} />
              <Metric label="Converged" value={result.solve!.converged ? "yes" : "no"} />
              <Metric label="Iterations used" value={`${result.solve!.iterations}`} />
              <Metric
                label="Final residual norm"
                value={result.solve!.residualNorm.toExponential(4)}
              />
              <Metric
                label="Solution estimate x"
                value={result.solve!.solution.map((x) => x.toFixed(6)).join(", ")}
              />
              <Metric label="Convergence note" value={result.solve!.note} />
            </div>
            <div className="rounded-md border border-border bg-background/50 p-3">
              <div className="text-xs text-muted-foreground mb-2">
                Residual history (iteration: norm)
              </div>
              <pre className="font-mono text-xs whitespace-pre-wrap">
                {result
                  .solve!.history.map(
                    (item) => `${item.iteration}: ${item.residualNorm.toExponential(4)}`,
                  )
                  .join("\n")}
              </pre>
            </div>
          </>
        )}
      </section>

      <section className="prose-invert max-w-none space-y-3 text-muted-foreground">
        <h2 className="text-foreground text-xl font-semibold">How sparse iterative solve works</h2>
        <p>
          Jacobi iteration updates each variable using the previous iterate: x^(k+1) = D^-1 (b -
          (L+U)x^k). For stable convergence, diagonally dominant or well-conditioned sparse systems
          are preferred.
        </p>
        <p>
          This page reports residual norm ||b-Ax||_2 at each iteration. If convergence stalls, try
          scaling, row/column reordering, or switching to stronger methods such as Gauss-Seidel/CG
          in production solvers.
        </p>
      </section>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background/50 p-3">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="font-mono text-primary break-words">{value}</div>
    </div>
  );
}
