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
  parseExpr,
  type Matrix,
} from "@/lib/matrix";

export const Route = createFileRoute("/householder-givens")({
  head: () => ({
    meta: [
      { title: "Householder & Givens Transform Calculator — Numeric Orthogonal Tools" },
      {
        name: "description",
        content:
          "Compute a Householder reflection and a Givens rotation from a numeric vector, with orthogonal matrix outputs and transformed vectors.",
      },
      { property: "og:title", content: "Householder and Givens Calculator" },
      {
        property: "og:description",
        content: "Orthogonal transformations for vector elimination steps in QR-style workflows.",
      },
    ],
  }),
  component: HouseholderGivensPage,
});

function HouseholderGivensPage() {
  const [x, setX] = useState<Matrix>(() => fromNumbers([[4], [3], [1]]));
  const [p, setP] = useState(0);
  const [q, setQ] = useState(1);

  const computed = useMemo(() => {
    try {
      const xd = dims(x);
      if (xd.cols !== 1) throw new Error("Input x must be a column vector (n x 1)");
      if (!isFullyNumeric(x))
        throw new Error("Householder/Givens tools require fully numeric entries");
      const n = xd.rows;
      const vec = x.map((row) => asNumber(row[0]) as number);
      const norm = Math.hypot(...vec);
      if (norm < 1e-12) throw new Error("Input vector must be non-zero");

      const alpha = vec[0] >= 0 ? -norm : norm;
      const u = vec.slice();
      u[0] -= alpha;
      const uNorm = Math.hypot(...u);
      const w = uNorm < 1e-12 ? u.map(() => 0) : u.map((value) => value / uNorm);
      const h = Array.from({ length: n }, (_, i) =>
        Array.from({ length: n }, (_, j) => (i === j ? 1 : 0) - 2 * w[i] * w[j]),
      );
      const hx = mulMatVec(h, vec);

      const pp = Math.max(0, Math.min(n - 1, Math.trunc(p)));
      const qq = Math.max(0, Math.min(n - 1, Math.trunc(q)));
      if (pp === qq) throw new Error("Givens indices p and q must be different");
      const a = vec[pp];
      const b = vec[qq];
      const r = Math.hypot(a, b);
      if (r < 1e-12) throw new Error("Selected Givens entries are both near zero");
      const c = a / r;
      const s = -b / r;
      const g = Array.from({ length: n }, (_, i) =>
        Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
      );
      g[pp][pp] = c;
      g[qq][qq] = c;
      g[pp][qq] = -s;
      g[qq][pp] = s;
      const gx = mulMatVec(g, vec);

      return {
        n,
        h: toExprMatrix(h),
        hx: toExprVector(hx),
        g: toExprMatrix(g),
        gx: toExprVector(gx),
        c,
        s,
        p: pp,
        q: qq,
        error: null as string | null,
      };
    } catch (e) {
      return {
        n: 0,
        h: null as Matrix | null,
        hx: null as Matrix | null,
        g: null as Matrix | null,
        gx: null as Matrix | null,
        c: 0,
        s: 0,
        p: 0,
        q: 1,
        error: e instanceof Error ? e.message : "Error",
      };
    }
  }, [p, q, x]);

  return (
    <PageLayout
      title="Householder & Givens Tools"
      tagline="Construct orthogonal reflection/rotation matrices used in stable elimination algorithms."
      showHowItWorks={false}
    >
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <MatrixInput title="Input vector x (n x 1, numeric)" value={x} onChange={setX} />
        <section className="rounded-lg border border-border bg-card/40 p-6 space-y-4">
          <h2 className="text-xl font-semibold">Givens settings</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Index p (0-based)</Label>
              <Input type="number" value={p} onChange={(e) => setP(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Index q (0-based)</Label>
              <Input type="number" value={q} onChange={(e) => setQ(Number(e.target.value))} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Givens rotation acts on rows/coordinates p and q to zero out coordinate q in the rotated
            vector.
          </p>
        </section>
      </div>

      <section className="rounded-lg border border-border bg-card/40 p-6">
        <h2 className="text-xl font-semibold mb-4">Results</h2>
        {computed.error ? (
          <p className="text-destructive font-mono text-sm">{computed.error}</p>
        ) : (
          <div className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold">Householder matrix H</h3>
                <div className="overflow-x-auto">
                  <MatrixDisplay m={computed.h!} />
                </div>
                <div className="overflow-x-auto">
                  <MatrixDisplay m={computed.hx!} label="H·x" />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold">
                  Givens matrix G (indices {computed.p}, {computed.q})
                </h3>
                <div className="overflow-x-auto">
                  <MatrixDisplay m={computed.g!} />
                </div>
                <div className="overflow-x-auto">
                  <MatrixDisplay m={computed.gx!} label="G·x" />
                </div>
                <p className="text-xs font-mono text-muted-foreground">
                  c = {formatNumber(computed.c)}, s = {formatNumber(computed.s)}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold">How Householder and Givens work</h2>
        <p className="text-sm text-muted-foreground">
          Householder uses <span className="font-mono">H = I - 2ww^T</span> with unit vector w. It
          reflects x across a hyperplane and can zero all but one subvector entry in one step.
        </p>
        <p className="text-sm text-muted-foreground">
          Givens uses a 2x2 rotation block in coordinates p and q:
          <span className="font-mono"> [[c,-s],[s,c]] </span>
          with <span className="font-mono">c^2+s^2=1</span>. It zeros one chosen entry while
          changing only two coordinates.
        </p>
      </section>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}

function mulMatVec(a: number[][], x: number[]): number[] {
  return a.map((row) => row.reduce((sum, value, i) => sum + value * x[i], 0));
}

function toExprMatrix(values: number[][]): Matrix {
  return values.map((row) => row.map((value) => parseExpr(formatNumber(value))));
}

function toExprVector(values: number[]): Matrix {
  return values.map((value) => [parseExpr(formatNumber(value))]);
}
