import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { AdSlot } from "@/components/AdSlot";
import {
  asNumber,
  determinant,
  dims,
  formatNumber,
  fromNumbers,
  isFullyNumeric,
  multiply,
  parseExpr,
  type Matrix,
} from "@/lib/matrix";

export const Route = createFileRoute("/transform-matrices-2d-3d")({
  head: () => ({
    meta: [
      { title: "2D/3D Matrix Transform Calculator — Apply T·x Online" },
      {
        name: "description",
        content:
          "Apply 2x2 or 3x3 numeric transformation matrices to vectors, with determinant-based area/volume scaling and invertibility checks.",
      },
      { property: "og:title", content: "2D/3D Matrix Transform Calculator" },
      {
        property: "og:description",
        content: "Compute T·x with geometric scale factor and singular/non-singular diagnostics.",
      },
    ],
  }),
  component: TransformMatricesPage,
});

function TransformMatricesPage() {
  const [t, setT] = useState<Matrix>(() =>
    fromNumbers([
      [1, 0],
      [0, 1],
    ]),
  );
  const [x, setX] = useState<Matrix>(() => fromNumbers([[2], [1]]));

  const computed = useMemo(() => {
    try {
      const td = dims(t);
      const xd = dims(x);
      if (!isFullyNumeric(t) || !isFullyNumeric(x)) {
        throw new Error("This tool currently requires fully numeric matrix and vector entries");
      }
      if (td.rows !== td.cols) {
        throw new Error("Transformation matrix T must be square");
      }
      if (td.rows !== 2 && td.rows !== 3) {
        throw new Error("This page supports only 2D (2x2) and 3D (3x3) transformations");
      }
      if (xd.cols !== 1 || xd.rows !== td.cols) {
        throw new Error(`Vector x must be ${td.cols}x1 to match T (${td.rows}x${td.cols})`);
      }

      const tx = multiply(t, x);
      const detExpr = determinant(t);
      const detValue = asNumber(detExpr);
      if (detValue === null) throw new Error("Determinant could not be interpreted as a number");

      return {
        tx,
        det: detValue,
        singular: Math.abs(detValue) < 1e-10,
        scaleMeaning: td.rows === 2 ? "signed area scale factor" : "signed volume scale factor",
        error: null as string | null,
      };
    } catch (e) {
      return {
        tx: null as Matrix | null,
        det: null as number | null,
        singular: false,
        scaleMeaning: "",
        error: e instanceof Error ? e.message : "Error",
      };
    }
  }, [t, x]);

  return (
    <PageLayout
      title="2D/3D Transform Matrices"
      tagline="Apply a numeric transformation matrix T to a vector x and inspect scaling and invertibility."
      showHowItWorks={false}
    >
      <div className="grid lg:grid-cols-2 gap-6">
        <MatrixInput title="Transformation matrix T (2x2 or 3x3)" value={t} onChange={setT} />
        <MatrixInput title="Input vector x (column vector)" value={x} onChange={setX} />
      </div>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-4">
        <h2 className="text-xl font-semibold">Result: T·x</h2>
        {computed.error ? (
          <p className="text-destructive font-mono text-sm">{computed.error}</p>
        ) : (
          computed.tx && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <MatrixDisplay m={computed.tx} />
              </div>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <Metric label="det(T)" value={formatNumber(computed.det!)} />
                <Metric
                  label={computed.scaleMeaning}
                  value={
                    Math.abs(computed.det!) < 1e-10
                      ? "0 (dimension collapse)"
                      : formatNumber(computed.det!)
                  }
                />
                <Metric
                  label="Invertibility"
                  value={
                    computed.singular ? "Singular (not invertible)" : "Non-singular (invertible)"
                  }
                />
                <Metric
                  label="Orientation"
                  value={
                    computed.det! > 0
                      ? "Preserved (det > 0)"
                      : computed.det! < 0
                        ? "Reversed (det < 0)"
                        : "Collapsed (det = 0)"
                  }
                />
              </div>
            </div>
          )
        )}
      </section>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold">How this transform works</h2>
        <p className="text-sm text-muted-foreground">
          A linear transform sends each vector <span className="font-mono">x</span> to{" "}
          <span className="font-mono">Tx</span>. In 2D,{" "}
          <span className="font-mono">T in R^(2x2)</span>; in 3D,{" "}
          <span className="font-mono">T in R^(3x3)</span>.
        </p>
        <p className="text-sm text-muted-foreground">
          The determinant controls geometric scaling: <span className="font-mono">|det(T)|</span> is
          the area scale in 2D and volume scale in 3D. If{" "}
          <span className="font-mono">det(T)=0</span>, dimensions collapse and no inverse exists.
        </p>
        <p className="text-sm text-muted-foreground">
          The sign of <span className="font-mono">det(T)</span> tracks orientation: positive
          preserves orientation, negative reverses it.
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
      <div className="font-mono text-primary">{value}</div>
    </div>
  );
}

function toExprMatrix(values: number[][]): Matrix {
  return values.map((row) => row.map((value) => parseExpr(formatNumber(value))));
}
