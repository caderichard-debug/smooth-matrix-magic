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
  inverse,
  isFullyNumeric,
  multiply,
  parseExpr,
  type Matrix,
} from "@/lib/matrix";

export const Route = createFileRoute("/matrix-functions-spectrum")({
  head: () => ({
    meta: [
      { title: "Matrix Functions via Spectrum Calculator (2x2)" },
      {
        name: "description",
        content:
          "Compute f(A) from eigen-decomposition for diagonalizable real 2x2 matrices with functions exp, power, and resolvent-type map.",
      },
      { property: "og:title", content: "Matrix Functions via Spectrum Calculator" },
      {
        property: "og:description",
        content: "Apply scalar functions to eigenvalues and reconstruct f(A).",
      },
    ],
  }),
  component: MatrixFunctionsSpectrumPage,
});

type FunctionMode = "exp" | "power" | "resolvent";

function MatrixFunctionsSpectrumPage() {
  const [a, setA] = useState<Matrix>(() =>
    fromNumbers([
      [2, 1],
      [0, 3],
    ]),
  );
  const [mode, setMode] = useState<FunctionMode>("exp");
  const [power, setPower] = useState(2);

  const result = useMemo(() => {
    try {
      return { data: spectralFunction2x2(a, mode, power), error: null as string | null };
    } catch (e) {
      return {
        data: null as {
          fA: Matrix;
          p: Matrix;
          d: Matrix;
          transformedDiag: [number, number];
        } | null,
        error: e instanceof Error ? e.message : "Error",
      };
    }
  }, [a, mode, power]);

  return (
    <PageLayout
      title="Matrix Functions via Spectrum (2x2)"
      tagline="For diagonalizable real 2x2 matrices, compute f(A) = P f(D) P^-1 by applying scalar functions to eigenvalues."
      showHowItWorks={false}
    >
      <div className="rounded-lg border border-border bg-card/40 p-5 flex flex-wrap gap-5 items-end">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Function f
          </Label>
          <select
            className="h-10 rounded-md border border-border bg-background px-3 text-sm"
            value={mode}
            onChange={(e) => setMode(e.target.value as FunctionMode)}
          >
            <option value="exp">exp(lambda)</option>
            <option value="power">lambda^k</option>
            <option value="resolvent">1 / (1 - lambda)</option>
          </select>
        </div>
        {mode === "power" && (
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              k (integer)
            </Label>
            <Input
              type="number"
              value={power}
              onChange={(e) => setPower(parseInt(e.target.value, 10) || 0)}
              className="font-mono w-24"
            />
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <MatrixInput
          title="Matrix A (2x2 numeric, diagonalizable over reals)"
          value={a}
          onChange={setA}
        />
        <section className="rounded-lg border border-border bg-card/40 p-6">
          <h2 className="text-xl font-semibold mb-3">Result: f(A)</h2>
          {result.error ? (
            <p className="text-destructive font-mono text-sm">{result.error}</p>
          ) : (
            result.data && (
              <div className="space-y-4 overflow-x-auto">
                <p className="text-sm text-muted-foreground font-mono">
                  f(lambda1), f(lambda2) = {formatNumber(result.data.transformedDiag[0])},{" "}
                  {formatNumber(result.data.transformedDiag[1])}
                </p>
                <MatrixDisplay m={result.data.fA} label="f(A)" />
                <MatrixDisplay m={result.data.p} label="P" />
                <MatrixDisplay m={result.data.d} label="D" />
              </div>
            )
          )}
        </section>
      </div>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold">How spectral matrix functions work</h2>
        <p className="text-sm text-muted-foreground">
          If A is diagonalizable, A = P D P^-1 with D = diag(lambda1, lambda2). For a scalar
          function f defined on the eigenvalues, f(A) is computed as P diag(f(lambda1), f(lambda2))
          P^-1.
        </p>
        <p className="text-sm text-muted-foreground">
          This route provides three valid examples: exponential, integer power, and the
          resolvent-like map 1/(1-lambda) (which requires lambda != 1). The implementation is
          intentionally scoped to real diagonalizable 2x2 input.
        </p>
      </section>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}

function spectralFunction2x2(a: Matrix, mode: FunctionMode, power: number) {
  const { rows, cols } = dims(a);
  if (rows !== 2 || cols !== 2)
    throw new Error("This matrix-function panel currently supports only 2x2 matrices");
  if (!isFullyNumeric(a))
    throw new Error("Matrix functions via spectrum require a fully numeric matrix");
  const m = a.map((row) => row.map((value) => asNumber(value) as number));
  const tr = m[0][0] + m[1][1];
  const det = m[0][0] * m[1][1] - m[0][1] * m[1][0];
  const disc = tr * tr - 4 * det;
  if (disc < 0) throw new Error("This panel currently supports only real eigenvalues");
  const root = Math.sqrt(disc);
  const l1 = (tr + root) / 2;
  const l2 = (tr - root) / 2;
  if (Math.abs(l1 - l2) < 1e-10)
    throw new Error("Distinct eigenvalues are required for this scoped implementation");

  const v1 = eigenvector2x2(m, l1);
  const v2 = eigenvector2x2(m, l2);
  const p = toExpr([
    [v1[0], v2[0]],
    [v1[1], v2[1]],
  ]);
  const pInv = inverse(p);
  const f1 = applyScalarFunction(l1, mode, power);
  const f2 = applyScalarFunction(l2, mode, power);
  const transformed = toExpr([
    [f1, 0],
    [0, f2],
  ]);
  const fA = multiply(multiply(p, transformed), pInv);
  const d = toExpr([
    [l1, 0],
    [0, l2],
  ]);
  return { fA, p, d, transformedDiag: [f1, f2] as [number, number] };
}

function applyScalarFunction(lambda: number, mode: FunctionMode, power: number): number {
  if (mode === "exp") return Math.exp(lambda);
  if (mode === "power") {
    if (!Number.isInteger(power)) throw new Error("Power mode requires an integer exponent");
    return lambda ** power;
  }
  if (Math.abs(lambda - 1) < 1e-10)
    throw new Error("Resolvent mode requires eigenvalues different from 1");
  return 1 / (1 - lambda);
}

function eigenvector2x2(m: number[][], lambda: number): [number, number] {
  const a = m[0][0] - lambda;
  const b = m[0][1];
  const c = m[1][0];
  const d = m[1][1] - lambda;
  const vec: [number, number] =
    Math.abs(a) + Math.abs(b) > Math.abs(c) + Math.abs(d) ? [-b, a] : [-d, c];
  const norm = Math.hypot(vec[0], vec[1]);
  if (norm < 1e-10) throw new Error("Failed to construct eigenvectors for this matrix");
  return [vec[0] / norm, vec[1] / norm];
}

function toExpr(values: number[][]): Matrix {
  return values.map((row) =>
    row.map((value) => parseExpr(formatNumber(Math.abs(value) < 1e-10 ? 0 : value))),
  );
}
