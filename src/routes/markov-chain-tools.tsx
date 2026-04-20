import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { AdSlot } from "@/components/AdSlot";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  asNumber,
  dims,
  formatNumber,
  fromNumbers,
  isFullyNumeric,
  multiply,
  parseExpr,
  type Matrix,
} from "@/lib/matrix";

export const Route = createFileRoute("/markov-chain-tools")({
  head: () => ({
    meta: [
      { title: "Markov Chain Matrix Tools — n-Step and Stationary Distribution" },
      {
        name: "description",
        content:
          "Analyze finite-state Markov chains from a transition matrix: validate stochastic constraints, compute n-step distributions, and estimate stationary distribution.",
      },
      { property: "og:title", content: "Markov Chain Matrix Tools" },
      {
        property: "og:description",
        content:
          "Transition matrix validation, n-step evolution, and stationary distribution estimation.",
      },
    ],
  }),
  component: MarkovChainToolsPage,
});

function MarkovChainToolsPage() {
  const [p, setP] = useState<Matrix>(() =>
    fromNumbers([
      [0.8, 0.2, 0],
      [0.1, 0.7, 0.2],
      [0.2, 0.2, 0.6],
    ]),
  );
  const [pi0, setPi0] = useState<Matrix>(() => fromNumbers([[1, 0, 0]]));
  const [steps, setSteps] = useState(10);

  const computed = useMemo(() => {
    try {
      if (!isFullyNumeric(p) || !isFullyNumeric(pi0))
        throw new Error("Markov tools require numeric entries");
      const pd = dims(p);
      const pid = dims(pi0);
      if (pd.rows !== pd.cols) throw new Error("Transition matrix P must be square");
      if (pid.rows !== 1 || pid.cols !== pd.rows)
        throw new Error(`Initial distribution pi0 must be a 1x${pd.rows} row vector`);

      const pNum = toNumeric(p);
      const piNum = toNumeric(pi0);
      const tol = 1e-10;
      for (let i = 0; i < pd.rows; i++) {
        let rowSum = 0;
        for (let j = 0; j < pd.cols; j++) {
          const value = pNum[i][j];
          if (value < -tol) throw new Error("Transition probabilities must be non-negative");
          rowSum += value;
        }
        if (Math.abs(rowSum - 1) > 1e-8)
          throw new Error(`Row ${i + 1} of P must sum to 1 (got ${formatNumber(rowSum)})`);
      }
      let piSum = 0;
      for (let j = 0; j < pid.cols; j++) {
        if (piNum[0][j] < -tol) throw new Error("Initial probabilities must be non-negative");
        piSum += piNum[0][j];
      }
      if (Math.abs(piSum - 1) > 1e-8)
        throw new Error(`Initial distribution must sum to 1 (got ${formatNumber(piSum)})`);

      const n = Math.max(0, Math.trunc(steps));
      let pn = identityNum(pd.rows);
      for (let i = 0; i < n; i++) pn = mulNum(pn, pNum);
      let piN = piNum;
      for (let i = 0; i < n; i++) piN = mulNum(piN, pNum);

      let stationary = Array.from({ length: pd.rows }, () => 1 / pd.rows);
      for (let iter = 0; iter < 400; iter++) {
        const next = multiplyRowVector(stationary, pNum);
        const diff = next.reduce((sum, value, idx) => sum + Math.abs(value - stationary[idx]), 0);
        stationary = next;
        if (diff < 1e-12) break;
      }

      return {
        n,
        pn: toExprMatrix(pn),
        piN: toExprMatrix(piN),
        stationary: toExprMatrix([stationary]),
        error: null as string | null,
      };
    } catch (e) {
      return {
        n: 0,
        pn: null as Matrix | null,
        piN: null as Matrix | null,
        stationary: null as Matrix | null,
        error: e instanceof Error ? e.message : "Error",
      };
    }
  }, [p, pi0, steps]);

  return (
    <PageLayout
      title="Markov Chain Matrix Tools"
      tagline="Validate stochastic matrices and compute n-step behavior with matrix powers."
      showHowItWorks={false}
    >
      <div className="rounded-lg border border-border bg-card/40 p-5 max-w-xs space-y-2">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Steps n</Label>
        <Input
          type="number"
          min={0}
          value={steps}
          onChange={(e) => setSteps(Math.max(0, Number(e.target.value)))}
          className="font-mono w-24"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <MatrixInput title="Transition matrix P (row-stochastic)" value={p} onChange={setP} />
        <MatrixInput
          title="Initial distribution pi0 (1xn row vector)"
          value={pi0}
          onChange={setPi0}
        />
      </div>

      <section className="rounded-lg border border-border bg-card/40 p-6">
        <h2 className="text-xl font-semibold mb-4">Results</h2>
        {computed.error ? (
          <p className="text-destructive font-mono text-sm">{computed.error}</p>
        ) : (
          <div className="space-y-5">
            <div className="overflow-x-auto">
              <MatrixDisplay m={computed.pn!} label={`P^${computed.n}`} />
            </div>
            <div className="overflow-x-auto">
              <MatrixDisplay m={computed.piN!} label={`pi_${computed.n} = pi0·P^${computed.n}`} />
            </div>
            <div className="overflow-x-auto">
              <MatrixDisplay
                m={computed.stationary!}
                label="Estimated stationary distribution pi*"
              />
            </div>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold">How Markov chain matrix calculations work</h2>
        <p className="text-sm text-muted-foreground">
          A row-stochastic matrix has non-negative entries and each row sums to 1. State
          distributions evolve by <span className="font-mono">pi_(k+1) = pi_k P</span>, so{" "}
          <span className="font-mono">pi_n = pi_0 P^n</span>.
        </p>
        <p className="text-sm text-muted-foreground">
          A stationary distribution <span className="font-mono">pi*</span> satisfies{" "}
          <span className="font-mono">pi*P = pi*</span>. This page estimates it by repeated
          multiplication, which converges under common ergodicity assumptions.
        </p>
        <p className="text-sm text-muted-foreground">
          Equivalent characterization: <span className="font-mono">P^T pi*^T = pi*^T</span> with{" "}
          <span className="font-mono">sum_i pi*_i = 1</span> and{" "}
          <span className="font-mono">pi*_i &gt;= 0</span>; for irreducible, aperiodic chains this
          fixed point is unique and attracts all initial distributions.
        </p>
      </section>

      <p className="text-sm text-muted-foreground">
        Comparing pi_n against pi* gives a quick empirical sense of mixing speed for your chosen
        starting distribution.
      </p>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}

function toNumeric(m: Matrix): number[][] {
  return m.map((row) => row.map((value) => asNumber(value) as number));
}

function identityNum(n: number): number[][] {
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  );
}

function mulNum(a: number[][], b: number[][]): number[][] {
  const rows = a.length;
  const cols = b[0]?.length ?? 0;
  const inner = b.length;
  const out = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      let sum = 0;
      for (let k = 0; k < inner; k++) sum += a[i][k] * b[k][j];
      out[i][j] = sum;
    }
  }
  return out;
}

function multiplyRowVector(v: number[], p: number[][]): number[] {
  return p[0].map((_, j) => v.reduce((sum, value, i) => sum + value * p[i][j], 0));
}

function toExprMatrix(values: number[][]): Matrix {
  return values.map((row) => row.map((value) => parseExpr(formatNumber(value))));
}
