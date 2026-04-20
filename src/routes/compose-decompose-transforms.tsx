import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { AdSlot } from "@/components/AdSlot";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatNumber, parseExpr, type Matrix } from "@/lib/matrix";

export const Route = createFileRoute("/compose-decompose-transforms")({
  head: () => ({
    meta: [
      { title: "Compose & Decompose 2D Affine Transforms — Matrix Calculator" },
      {
        name: "description",
        content:
          "Compose two 2D affine transforms as homogeneous matrices and decompose the result into translation, rotation, scale, and shear.",
      },
      { property: "og:title", content: "Compose Decompose Transform Matrices" },
      {
        property: "og:description",
        content: "Interactive affine transform composition and parameter extraction.",
      },
    ],
  }),
  component: ComposeDecomposeTransformsPage,
});

function ComposeDecomposeTransformsPage() {
  const [rotA, setRotA] = useState(20);
  const [sxA, setSxA] = useState(1.2);
  const [syA, setSyA] = useState(1);
  const [shA, setShA] = useState(0.4);
  const [txA, setTxA] = useState(1);
  const [tyA, setTyA] = useState(0);

  const [rotB, setRotB] = useState(-15);
  const [sxB, setSxB] = useState(1);
  const [syB, setSyB] = useState(1.1);
  const [shB, setShB] = useState(0);
  const [txB, setTxB] = useState(0);
  const [tyB, setTyB] = useState(2);

  const computed = useMemo(() => {
    const a = makeAffine(rotA, sxA, syA, shA, txA, tyA);
    const b = makeAffine(rotB, sxB, syB, shB, txB, tyB);
    const c = mul3(b, a);
    const l11 = c[0][0];
    const l21 = c[1][0];
    const l12 = c[0][1];
    const l22 = c[1][1];
    const sx = Math.hypot(l11, l21);
    const eps = 1e-12;
    const rot = sx < eps ? 0 : Math.atan2(l21, l11);
    const ux1 = sx < eps ? 1 : l11 / sx;
    const ux2 = sx < eps ? 0 : l21 / sx;
    const shearRaw = ux1 * l12 + ux2 * l22;
    const v2x = l12 - shearRaw * ux1;
    const v2y = l22 - shearRaw * ux2;
    const sy = Math.hypot(v2x, v2y);
    const shear = sy < eps ? 0 : shearRaw / sy;

    return {
      a: toExprMatrix(a),
      b: toExprMatrix(b),
      c: toExprMatrix(c),
      tx: c[0][2],
      ty: c[1][2],
      rotationDeg: (rot * 180) / Math.PI,
      scaleX: sx,
      scaleY: sy,
      shear,
      degenerate: sx < eps || sy < eps,
    };
  }, [rotA, rotB, shA, shB, sxA, sxB, syA, syB, txA, txB, tyA, tyB]);

  return (
    <PageLayout
      title="Compose & Decompose Transforms"
      tagline="Compose two affine transforms and recover approximate translation, rotation, scale, and shear parameters."
      showHowItWorks={false}
    >
      <div className="grid lg:grid-cols-2 gap-6">
        <TransformControls
          title="Transform A"
          rot={rotA}
          setRot={setRotA}
          sx={sxA}
          setSx={setSxA}
          sy={syA}
          setSy={setSyA}
          sh={shA}
          setSh={setShA}
          tx={txA}
          setTx={setTxA}
          ty={tyA}
          setTy={setTyA}
        />
        <TransformControls
          title="Transform B"
          rot={rotB}
          setRot={setRotB}
          sx={sxB}
          setSx={setSxB}
          sy={syB}
          setSy={setSyB}
          sh={shB}
          setSh={setShB}
          tx={txB}
          setTx={setTxB}
          ty={tyB}
          setTy={setTyB}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Panel title="A (3x3 affine)">
          <MatrixDisplay m={computed.a} />
        </Panel>
        <Panel title="B (3x3 affine)">
          <MatrixDisplay m={computed.b} />
        </Panel>
        <Panel title="Composed C = B·A">
          <MatrixDisplay m={computed.c} />
        </Panel>
      </div>

      <section className="rounded-lg border border-border bg-card/40 p-6">
        <h2 className="text-xl font-semibold mb-4">Decomposition of C (approximate)</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
          <Metric label="Translation tx" value={formatNumber(computed.tx)} />
          <Metric label="Translation ty" value={formatNumber(computed.ty)} />
          <Metric label="Rotation (deg)" value={formatNumber(computed.rotationDeg)} />
          <Metric label="Scale sx" value={formatNumber(computed.scaleX)} />
          <Metric label="Scale sy" value={formatNumber(computed.scaleY)} />
          <Metric label="Shear k" value={formatNumber(computed.shear)} />
        </div>
        {computed.degenerate && (
          <p className="text-xs text-amber-400 mt-3">
            The linear block is near-degenerate; decomposition parameters may be unstable or
            non-unique.
          </p>
        )}
      </section>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold">How composition and decomposition work</h2>
        <p className="text-sm text-muted-foreground">
          Affine transforms compose by matrix multiplication in homogeneous coordinates. If you
          apply A first and then B, the net transform is <span className="font-mono">C = B·A</span>.
        </p>
        <p className="text-sm text-muted-foreground">
          Decomposition separates the linear 2x2 block into rotation-scale-shear terms using a
          Gram-Schmidt style factorization. Translation is read directly from the third column.
        </p>
      </section>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}

function TransformControls(props: {
  title: string;
  rot: number;
  setRot: (value: number) => void;
  sx: number;
  setSx: (value: number) => void;
  sy: number;
  setSy: (value: number) => void;
  sh: number;
  setSh: (value: number) => void;
  tx: number;
  setTx: (value: number) => void;
  ty: number;
  setTy: (value: number) => void;
}) {
  return (
    <section className="rounded-lg border border-border bg-card/40 p-6 space-y-4">
      <h2 className="text-xl font-semibold">{props.title}</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Rotation (deg)" value={props.rot} setValue={props.setRot} />
        <Field label="Scale sx" value={props.sx} setValue={props.setSx} />
        <Field label="Scale sy" value={props.sy} setValue={props.setSy} />
        <Field label="Shear k" value={props.sh} setValue={props.setSh} />
        <Field label="Translate tx" value={props.tx} setValue={props.setTx} />
        <Field label="Translate ty" value={props.ty} setValue={props.setTy} />
      </div>
    </section>
  );
}

function Field({
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

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card/40 p-6">
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      <div className="overflow-x-auto">{children}</div>
    </section>
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

function makeAffine(
  rotDeg: number,
  sx: number,
  sy: number,
  shear: number,
  tx: number,
  ty: number,
): number[][] {
  const t = (rotDeg * Math.PI) / 180;
  const c = Math.cos(t);
  const s = Math.sin(t);
  const sMat = [
    [sx, 0, 0],
    [0, sy, 0],
    [0, 0, 1],
  ];
  const hMat = [
    [1, shear, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];
  const rMat = [
    [c, -s, 0],
    [s, c, 0],
    [0, 0, 1],
  ];
  const tr = [
    [1, 0, tx],
    [0, 1, ty],
    [0, 0, 1],
  ];
  return mul3(tr, mul3(rMat, mul3(hMat, sMat)));
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

function toExprMatrix(values: number[][]): Matrix {
  return values.map((row) => row.map((value) => parseExpr(formatNumber(value))));
}
