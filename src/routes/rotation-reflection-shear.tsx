import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { AdSlot } from "@/components/AdSlot";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatNumber, fromNumbers, multiply, parseExpr, type Matrix } from "@/lib/matrix";

type TransformMode = "rotation" | "reflection" | "shear";
type ReflectionAxis = "x-axis" | "y-axis" | "y-equals-x" | "origin";
type ShearAxis = "x" | "y";

export const Route = createFileRoute("/rotation-reflection-shear")({
  head: () => ({
    meta: [
      { title: "Rotation, Reflection, Shear Matrix Calculator — 2D Geometry" },
      {
        name: "description",
        content:
          "Generate 2D rotation, reflection, and shear matrices and apply them to points with explicit formulas and constraints.",
      },
      { property: "og:title", content: "Rotation Reflection Shear Matrix Calculator" },
      {
        property: "og:description",
        content: "Interactive 2D transform matrices for angle, axis, and shear factor.",
      },
    ],
  }),
  component: RotationReflectionShearPage,
});

function RotationReflectionShearPage() {
  const [mode, setMode] = useState<TransformMode>("rotation");
  const [pointX, setPointX] = useState(2);
  const [pointY, setPointY] = useState(1);
  const [angleDeg, setAngleDeg] = useState(30);
  const [reflectionAxis, setReflectionAxis] = useState<ReflectionAxis>("x-axis");
  const [shearAxis, setShearAxis] = useState<ShearAxis>("x");
  const [shearFactor, setShearFactor] = useState(1);

  const computed = useMemo(() => {
    const theta = (angleDeg * Math.PI) / 180;
    const c = Math.cos(theta);
    const s = Math.sin(theta);

    let matrixNum: number[][];
    let formula = "";

    if (mode === "rotation") {
      matrixNum = [
        [c, -s],
        [s, c],
      ];
      formula = "R(theta) = [[cos(theta), -sin(theta)], [sin(theta), cos(theta)]]";
    } else if (mode === "reflection") {
      if (reflectionAxis === "x-axis") {
        matrixNum = [
          [1, 0],
          [0, -1],
        ];
        formula = "Reflect across x-axis";
      } else if (reflectionAxis === "y-axis") {
        matrixNum = [
          [-1, 0],
          [0, 1],
        ];
        formula = "Reflect across y-axis";
      } else if (reflectionAxis === "y-equals-x") {
        matrixNum = [
          [0, 1],
          [1, 0],
        ];
        formula = "Reflect across line y = x";
      } else {
        matrixNum = [
          [-1, 0],
          [0, -1],
        ];
        formula = "Point reflection through origin";
      }
    } else {
      matrixNum =
        shearAxis === "x"
          ? [
              [1, shearFactor],
              [0, 1],
            ]
          : [
              [1, 0],
              [shearFactor, 1],
            ];
      formula = shearAxis === "x" ? "Shear x': x + k*y, y': y" : "Shear y': y + k*x, x': x";
    }

    const p = fromNumbers([[pointX], [pointY]]);
    const m = toExprMatrix(matrixNum);
    const image = multiply(m, p);

    return { matrix: m, image, formula };
  }, [angleDeg, mode, pointX, pointY, reflectionAxis, shearAxis, shearFactor]);

  return (
    <PageLayout
      title="Rotation, Reflection & Shear"
      tagline="Build a 2D transform matrix from geometric parameters and apply it to a point instantly."
      showHowItWorks={false}
    >
      <section className="rounded-lg border border-border bg-card/40 p-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label>Transform type</Label>
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={mode}
            onChange={(e) => setMode(e.target.value as TransformMode)}
          >
            <option value="rotation">Rotation</option>
            <option value="reflection">Reflection</option>
            <option value="shear">Shear</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>Point x</Label>
          <Input type="number" value={pointX} onChange={(e) => setPointX(Number(e.target.value))} />
        </div>
        <div className="space-y-2">
          <Label>Point y</Label>
          <Input type="number" value={pointY} onChange={(e) => setPointY(Number(e.target.value))} />
        </div>
        {mode === "rotation" && (
          <div className="space-y-2">
            <Label>Angle (degrees)</Label>
            <Input
              type="number"
              value={angleDeg}
              onChange={(e) => setAngleDeg(Number(e.target.value))}
            />
          </div>
        )}
        {mode === "reflection" && (
          <div className="space-y-2">
            <Label>Reflection axis</Label>
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={reflectionAxis}
              onChange={(e) => setReflectionAxis(e.target.value as ReflectionAxis)}
            >
              <option value="x-axis">x-axis</option>
              <option value="y-axis">y-axis</option>
              <option value="y-equals-x">y = x</option>
              <option value="origin">origin</option>
            </select>
          </div>
        )}
        {mode === "shear" && (
          <>
            <div className="space-y-2">
              <Label>Shear axis</Label>
              <select
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={shearAxis}
                onChange={(e) => setShearAxis(e.target.value as ShearAxis)}
              >
                <option value="x">x-shear</option>
                <option value="y">y-shear</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Shear factor k</Label>
              <Input
                type="number"
                value={shearFactor}
                onChange={(e) => setShearFactor(Number(e.target.value))}
              />
            </div>
          </>
        )}
      </section>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="rounded-lg border border-border bg-card/40 p-6">
          <h2 className="text-xl font-semibold mb-3">Transform matrix</h2>
          <div className="overflow-x-auto">
            <MatrixDisplay m={computed.matrix} />
          </div>
          <p className="text-sm text-muted-foreground mt-3 font-mono">{computed.formula}</p>
        </section>
        <section className="rounded-lg border border-border bg-card/40 p-6">
          <h2 className="text-xl font-semibold mb-3">Transformed point</h2>
          <div className="overflow-x-auto">
            <MatrixDisplay m={computed.image} label="T·p" />
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold">How these 2D transforms work</h2>
        <p className="text-sm text-muted-foreground">
          Rotation by angle <span className="font-mono">theta</span> uses an orthogonal matrix,
          preserving distances and angles:
          <span className="font-mono"> R(theta)^T R(theta) = I</span>.
        </p>
        <p className="text-sm text-muted-foreground">
          Reflections also preserve distances but reverse orientation (determinant{" "}
          <span className="font-mono">-1</span>). Shears keep area (
          <span className="font-mono">det = 1</span>) while changing angles.
        </p>
      </section>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}

function toExprMatrix(values: number[][]): Matrix {
  return values.map((row) => row.map((value) => parseExpr(formatNumber(value))));
}
