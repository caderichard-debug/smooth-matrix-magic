import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { AdSlot } from "@/components/AdSlot";
import {
  asNumber,
  dims,
  formatNumber,
  fromNumbers,
  isFullyNumeric,
  parseExpr,
  transpose,
  type Matrix,
} from "@/lib/matrix";

export const Route = createFileRoute("/sylvester-lyapunov")({
  head: () => ({
    meta: [
      { title: "Sylvester and Lyapunov Equation Solver — MatrixDojo" },
      {
        name: "description",
        content:
          "Solve AX + XB = C and continuous-time Lyapunov A^T X + X A = -Q for small numeric matrices in-browser.",
      },
      { property: "og:title", content: "Sylvester and Lyapunov Equation Solver" },
      {
        property: "og:description",
        content: "Numeric solver for matrix equations used in control and systems theory.",
      },
    ],
  }),
  component: SylvesterLyapunovPage,
});

type Mode = "sylvester" | "lyapunov";

function SylvesterLyapunovPage() {
  const [mode, setMode] = useState<Mode>("sylvester");
  const [a, setA] = useState<Matrix>(() =>
    fromNumbers([
      [2, 0],
      [0, 3],
    ]),
  );
  const [b, setB] = useState<Matrix>(() =>
    fromNumbers([
      [1, 0],
      [0, 4],
    ]),
  );
  const [c, setC] = useState<Matrix>(() =>
    fromNumbers([
      [1, 2],
      [3, 4],
    ]),
  );

  const result = useMemo(() => {
    try {
      return { data: solveSelectedEquation(a, b, c, mode), error: null as string | null };
    } catch (e) {
      return {
        data: null as { x: Matrix; residual: number } | null,
        error: e instanceof Error ? e.message : "Error",
      };
    }
  }, [a, b, c, mode]);

  return (
    <PageLayout
      title="Sylvester & Lyapunov Solver"
      tagline="Solve AX + XB = C or A^T X + X A = -Q with a direct Kronecker linear-system approach."
      showHowItWorks={false}
    >
      <div className="rounded-lg border border-border bg-card/40 p-5 flex flex-wrap gap-3 items-center">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          Equation type
        </span>
        <select
          className="h-10 rounded-md border border-border bg-background px-3 text-sm"
          value={mode}
          onChange={(e) => setMode(e.target.value as Mode)}
        >
          <option value="sylvester">AX + XB = C</option>
          <option value="lyapunov">A^T X + X A = -Q</option>
        </select>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <MatrixInput title="Matrix A (numeric)" value={a} onChange={setA} />
        <MatrixInput
          title={mode === "sylvester" ? "Matrix B (numeric)" : "Matrix Q (numeric)"}
          value={mode === "sylvester" ? b : c}
          onChange={mode === "sylvester" ? setB : setC}
        />
        <MatrixInput
          title={
            mode === "sylvester" ? "Matrix C (numeric)" : "Aux matrix B (unused in Lyapunov mode)"
          }
          value={mode === "sylvester" ? c : b}
          onChange={mode === "sylvester" ? setC : setB}
        />
      </div>

      <section className="rounded-lg border border-border bg-card/40 p-6">
        <h2 className="text-xl font-semibold mb-3">Solution matrix X</h2>
        {result.error ? (
          <p className="text-destructive font-mono text-sm">{result.error}</p>
        ) : (
          result.data && (
            <div className="space-y-3 overflow-x-auto">
              <p className="text-sm text-muted-foreground">
                Residual Frobenius norm: {formatNumber(result.data.residual)}
              </p>
              <MatrixDisplay m={result.data.x} label="X" />
            </div>
          )
        )}
      </section>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold">How these equations are solved</h2>
        <p className="text-sm text-muted-foreground">
          Sylvester equation AX + XB = C is vectorized as
          <span className="font-mono"> (I ⊗ A + B^T ⊗ I) vec(X) = vec(C)</span>. Solving this linear
          system gives X directly.
        </p>
        <p className="text-sm text-muted-foreground">
          Lyapunov equation A^T X + X A = -Q is a Sylvester special case with left matrix A^T, right
          matrix A, and right-hand side -Q. This page uses the same Kronecker-based direct solve.
        </p>
      </section>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}

function solveSelectedEquation(
  a: Matrix,
  b: Matrix,
  c: Matrix,
  mode: Mode,
): { x: Matrix; residual: number } {
  if (!isFullyNumeric(a) || !isFullyNumeric(b) || !isFullyNumeric(c)) {
    throw new Error("Sylvester/Lyapunov solver requires fully numeric matrices");
  }
  const an = toNumeric(a);
  const bn = toNumeric(b);
  const cn = toNumeric(c);
  if (mode === "sylvester") return solveSylvester(an, bn, cn);
  return solveLyapunov(an, cn);
}

function solveSylvester(
  a: number[][],
  b: number[][],
  c: number[][],
): { x: Matrix; residual: number } {
  const ar = a.length;
  const ac = a[0]?.length ?? 0;
  const br = b.length;
  const bc = b[0]?.length ?? 0;
  const cr = c.length;
  const cc = c[0]?.length ?? 0;
  if (ar !== ac || br !== bc) throw new Error("A and B must be square in AX + XB = C");
  if (cr !== ar || cc !== bc) throw new Error("C must have dimensions rows(A) x cols(B)");
  const n = ar;
  const m = bc;
  if (n * m > 9)
    throw new Error("Current solver is scoped to small systems up to 3x3 unknown blocks");

  const k = buildKroneckerSystem(a, b, n, m);
  const rhs = flattenColumnMajor(c);
  const xVec = gaussianSolve(k, rhs);
  const xNum = unflattenColumnMajor(xVec, n, m);
  const residual = frobeniusNorm(subNum(addNum(multiplyNum(a, xNum), multiplyNum(xNum, b)), c));
  return { x: toExpr(xNum), residual };
}

function solveLyapunov(a: number[][], q: number[][]): { x: Matrix; residual: number } {
  const n = a.length;
  if (a[0]?.length !== n || q.length !== n || q[0]?.length !== n) {
    throw new Error("Lyapunov mode requires square A and Q with matching dimensions");
  }
  const at = transposeNum(a);
  const negQ = q.map((row) => row.map((value) => -value));
  const solved = solveSylvester(at, a, negQ);
  const xNum = toNumeric(solved.x);
  const lhs = addNum(multiplyNum(at, xNum), multiplyNum(xNum, a));
  const residual = frobeniusNorm(addNum(lhs, q));
  return { x: solved.x, residual };
}

function buildKroneckerSystem(a: number[][], b: number[][], n: number, m: number): number[][] {
  const size = n * m;
  const out = Array.from({ length: size }, () => Array.from({ length: size }, () => 0));
  const index = (row: number, col: number) => row + col * n;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      const eq = index(i, j);
      for (let p = 0; p < n; p++) out[eq][index(p, j)] += a[i][p];
      for (let q = 0; q < m; q++) out[eq][index(i, q)] += b[q][j];
    }
  }
  return out;
}

function gaussianSolve(a: number[][], b: number[]): number[] {
  const n = b.length;
  const aug = a.map((row, i) => [...row, b[i]]);
  const tol = 1e-10;
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(aug[r][col]) > Math.abs(aug[pivot][col])) pivot = r;
    }
    if (Math.abs(aug[pivot][col]) < tol)
      throw new Error("System is singular: equation has no unique solution");
    if (pivot !== col) [aug[col], aug[pivot]] = [aug[pivot], aug[col]];
    const pv = aug[col][col];
    for (let j = col; j <= n; j++) aug[col][j] /= pv;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = aug[r][col];
      for (let j = col; j <= n; j++) aug[r][j] -= factor * aug[col][j];
    }
  }
  return aug.map((row) => row[n]);
}

function flattenColumnMajor(a: number[][]): number[] {
  const rows = a.length;
  const cols = a[0]?.length ?? 0;
  const out: number[] = [];
  for (let j = 0; j < cols; j++) for (let i = 0; i < rows; i++) out.push(a[i][j]);
  return out;
}

function unflattenColumnMajor(v: number[], rows: number, cols: number): number[][] {
  const out = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));
  let idx = 0;
  for (let j = 0; j < cols; j++) for (let i = 0; i < rows; i++) out[i][j] = v[idx++];
  return out;
}

function toNumeric(m: Matrix): number[][] {
  return m.map((row) => row.map((value) => asNumber(value) as number));
}

function toExpr(values: number[][]): Matrix {
  return values.map((row) =>
    row.map((value) => parseExpr(formatNumber(Math.abs(value) < 1e-10 ? 0 : value))),
  );
}

function multiplyNum(a: number[][], b: number[][]): number[][] {
  return a.map((row) =>
    b[0].map((_, j) => row.reduce((sum, value, k) => sum + value * b[k][j], 0)),
  );
}

function addNum(a: number[][], b: number[][]): number[][] {
  return a.map((row, i) => row.map((value, j) => value + b[i][j]));
}

function subNum(a: number[][], b: number[][]): number[][] {
  return a.map((row, i) => row.map((value, j) => value - b[i][j]));
}

function transposeNum(a: number[][]): number[][] {
  return transpose(toExpr(a)).map((row) => row.map((value) => asNumber(value) as number));
}

function frobeniusNorm(a: number[][]): number {
  let sum = 0;
  for (const row of a) for (const value of row) sum += value * value;
  return Math.sqrt(sum);
}
