import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { AdSlot } from "@/components/AdSlot";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  elementWisePower,
  hadamardDivide,
  matrixPower,
  scalarDivide,
  fromNumbers,
  parseExpr,
  type Matrix,
} from "@/lib/matrix";

export const Route = createFileRoute("/elementwise")({
  head: () => ({
    meta: [
      { title: "Element-wise vs Matrix Power & Division Calculator" },
      {
        name: "description",
        content:
          "Compare element-wise power with algebraic matrix power, and compute scalar and Hadamard division online.",
      },
      { property: "og:title", content: "Element-wise vs Matrix Algebra Calculator" },
      { property: "og:description", content: "Element-wise operations and matrix power side-by-side." },
    ],
  }),
  component: ElementwisePage,
});

function ElementwisePage() {
  const [a, setA] = useState<Matrix>(() => fromNumbers([[2, 1], [1, 2]]));
  const [b, setB] = useState<Matrix>(() => fromNumbers([[2, 1], [1, 2]]));
  const [scalarText, setScalarText] = useState("2");
  const [powText, setPowText] = useState("2");

  const scalarDiv = useMemo(() => {
    try {
      return { data: scalarDivide(a, parseExpr(scalarText || "1")), error: null as string | null };
    } catch (e) {
      return { data: null as Matrix | null, error: e instanceof Error ? e.message : "Error" };
    }
  }, [a, scalarText]);

  const hadDiv = useMemo(() => {
    try {
      return { data: hadamardDivide(a, b), error: null as string | null };
    } catch (e) {
      return { data: null as Matrix | null, error: e instanceof Error ? e.message : "Error" };
    }
  }, [a, b]);

  const powers = useMemo(() => {
    const p = Number.parseInt(powText, 10);
    if (!Number.isInteger(p)) return { element: null, matrix: null, error: "Exponent must be an integer" };
    try {
      return {
        element: elementWisePower(a, p),
        matrix: matrixPower(a, p),
        error: null as string | null,
      };
    } catch (e) {
      return { element: null, matrix: null, error: e instanceof Error ? e.message : "Error" };
    }
  }, [a, powText]);

  return (
    <PageLayout
      title="Element-wise vs Matrix Algebra Operations"
      tagline="Avoid common confusion: element-wise operations act entry-by-entry, matrix algebra operations follow linear algebra rules."
    >
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card/40 p-4 space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Scalar for A / k</Label>
          <Input value={scalarText} onChange={(e) => setScalarText(e.target.value)} className="font-mono" />
        </div>
        <div className="rounded-lg border border-border bg-card/40 p-4 space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Exponent p</Label>
          <Input value={powText} onChange={(e) => setPowText(e.target.value)} className="font-mono" />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <MatrixInput title="Matrix A" value={a} onChange={setA} />
        <MatrixInput title="Matrix B (for A ./ B)" value={b} onChange={setB} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <section className="rounded-lg border border-border bg-card/40 p-6 space-y-4">
          <h2 className="text-xl font-semibold">Division</h2>
          <div>
            <h3 className="text-sm text-muted-foreground mb-2">Scalar division: A / k</h3>
            {scalarDiv.error ? <p className="text-destructive font-mono text-sm">{scalarDiv.error}</p> : scalarDiv.data && <MatrixDisplay m={scalarDiv.data} />}
          </div>
          <div>
            <h3 className="text-sm text-muted-foreground mb-2">Hadamard division: A ./ B</h3>
            {hadDiv.error ? <p className="text-destructive font-mono text-sm">{hadDiv.error}</p> : hadDiv.data && <MatrixDisplay m={hadDiv.data} />}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card/40 p-6 space-y-4">
          <h2 className="text-xl font-semibold">Power (explicitly distinguished)</h2>
          {powers.error ? (
            <p className="text-destructive font-mono text-sm">{powers.error}</p>
          ) : (
            <>
              {powers.element && (
                <div>
                  <h3 className="text-sm text-muted-foreground mb-2">Element-wise power: A.^p</h3>
                  <MatrixDisplay m={powers.element} />
                </div>
              )}
              {powers.matrix && (
                <div>
                  <h3 className="text-sm text-muted-foreground mb-2">Matrix power: A^p</h3>
                  <MatrixDisplay m={powers.matrix} />
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}
