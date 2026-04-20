import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { AdSlot } from "@/components/AdSlot";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatNumber, parseExpr, type Matrix } from "@/lib/matrix";

export const Route = createFileRoute("/homogeneous-coordinates")({
  head: () => ({
    meta: [
      { title: "Homogeneous Coordinates Calculator — 2D Affine Transforms" },
      {
        name: "description",
        content:
          "Compose translation, rotation, and scaling with 3x3 homogeneous matrices and map points between Cartesian and homogeneous form.",
      },
      { property: "og:title", content: "Homogeneous Coordinates Transform Calculator" },
      {
        property: "og:description",
        content: "3x3 affine transform matrix builder for 2D points with homogeneous output.",
      },
    ],
  }),
  component: HomogeneousCoordinatesPage,
});

function HomogeneousCoordinatesPage() {
  const [x, setX] = useState(2);
  const [y, setY] = useState(1);
  const [tx, setTx] = useState(1);
  const [ty, setTy] = useState(-1);
  const [angleDeg, setAngleDeg] = useState(30);
  const [sx, setSx] = useState(1.2);
  const [sy, setSy] = useState(0.8);

  const computed = useMemo(() => {
    const theta = (angleDeg * Math.PI) / 180;
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    const sMat = [
      [sx, 0, 0],
      [0, sy, 0],
      [0, 0, 1],
    ];
    const rMat = [
      [c, -s, 0],
      [s, c, 0],
      [0, 0, 1],
    ];
    const tMat = [
      [1, 0, tx],
      [0, 1, ty],
      [0, 0, 1],
    ];
    const h = mul3(tMat, mul3(rMat, sMat));
    const p = [[x], [y], [1]];
    const hp = mul3x1(h, p);
    const w = hp[2][0];
    const cartX = Math.abs(w) < 1e-12 ? Number.NaN : hp[0][0] / w;
    const cartY = Math.abs(w) < 1e-12 ? Number.NaN : hp[1][0] / w;

    return {
      h: toExprMatrix(h),
      p: toExprMatrix(p),
      hp: toExprMatrix(hp),
      w,
      cartX,
      cartY,
    };
  }, [angleDeg, sx, sy, tx, ty, x, y]);

  return (
    <PageLayout
      title="Homogeneous Coordinates (2D Affine)"
      tagline="Use one 3x3 matrix to combine scaling, rotation, and translation on 2D points."
      showHowItWorks={false}
    >
      <section className="rounded-lg border border-border bg-card/40 p-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <NumberField label="Point x" value={x} setValue={setX} />
        <NumberField label="Point y" value={y} setValue={setY} />
        <NumberField label="Translate tx" value={tx} setValue={setTx} />
        <NumberField label="Translate ty" value={ty} setValue={setTy} />
        <NumberField label="Rotation (deg)" value={angleDeg} setValue={setAngleDeg} />
        <NumberField label="Scale sx" value={sx} setValue={setSx} />
        <NumberField label="Scale sy" value={sy} setValue={setSy} />
      </section>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="rounded-lg border border-border bg-card/40 p-6">
          <h2 className="text-xl font-semibold mb-3">Combined homogeneous matrix H</h2>
          <div className="overflow-x-auto">
            <MatrixDisplay m={computed.h} label="H = T·R·S" />
          </div>
        </section>
        <section className="rounded-lg border border-border bg-card/40 p-6 space-y-4">
          <h2 className="text-xl font-semibold">Point mapping</h2>
          <div className="overflow-x-auto">
            <MatrixDisplay m={computed.p} label="p = [x, y, 1]^T" />
          </div>
          <div className="overflow-x-auto">
            <MatrixDisplay m={computed.hp} label="p' = H·p" />
          </div>
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <Metric label="w coordinate" value={formatNumber(computed.w)} />
            <Metric
              label="Cartesian x'"
              value={
                Number.isFinite(computed.cartX) ? formatNumber(computed.cartX) : "undefined (w = 0)"
              }
            />
            <Metric
              label="Cartesian y'"
              value={
                Number.isFinite(computed.cartY) ? formatNumber(computed.cartY) : "undefined (w = 0)"
              }
            />
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold">How homogeneous coordinates work</h2>
        <p className="text-sm text-muted-foreground">
          A 2D point <span className="font-mono">(x,y)</span> is embedded as{" "}
          <span className="font-mono">(x,y,1)</span>. Affine transforms become matrix multiplication
          with a single 3x3 matrix.
        </p>
        <p className="text-sm text-muted-foreground">
          In block form, <span className="font-mono">H = [[A,t],[0,1]]</span> where{" "}
          <span className="font-mono">A</span> is the 2x2 linear part and{" "}
          <span className="font-mono">t</span> is translation.
        </p>
        <p className="text-sm text-muted-foreground">
          Translation is linear in homogeneous form, so composition order is explicit: this page
          uses <span className="font-mono">H = T·R·S</span>, meaning scale first, then rotate, then
          translate.
        </p>
        <p className="text-sm text-muted-foreground">
          Cartesian output recovers by dividing by <span className="font-mono">w</span>. For affine
          maps, ideal arithmetic gives <span className="font-mono">w=1</span>.
        </p>
        <p className="text-sm text-muted-foreground">
          If <span className="font-mono">w=0</span>, the mapped point is at infinity in projective
          geometry; this is why normalization by <span className="font-mono">w</span> is the key
          final interpretation step.
        </p>
      </section>

      <p className="text-sm text-muted-foreground">
        Homogeneous form also generalizes cleanly to perspective/projective mappings, where w varies
        and normalization becomes the key final step.
      </p>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}

function NumberField({
  label,
  value,
  setValue,
}: {
  label: string;
  value: number;
  setValue: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background/50 p-3">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="font-mono text-primary">{value}</div>
    </div>
  );
}

function mul3(a: number[][], b: number[][]): number[][] {
  const out = Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => 0));
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      let sum = 0;
      for (let k = 0; k < 3; k++) sum += a[i][k] * b[k][j];
      out[i][j] = sum;
    }
  }
  return out;
}

function mul3x1(a: number[][], v: number[][]): number[][] {
  return a.map((row) => [row[0] * v[0][0] + row[1] * v[1][0] + row[2] * v[2][0]]);
}

function toExprMatrix(values: number[][]): Matrix {
  return values.map((row) => row.map((value) => parseExpr(formatNumber(value))));
}
