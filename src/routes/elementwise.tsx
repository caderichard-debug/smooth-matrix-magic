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
  noteFractionInput,
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
      {
        property: "og:description",
        content: "Element-wise operations and matrix power side-by-side.",
      },
    ],
  }),
  component: ElementwisePage,
});

function ElementwisePage() {
  const [a, setA] = useState<Matrix>(() =>
    fromNumbers([
      [2.5, 1.5],
      [1.0, 2.0],
    ]),
  );
  const [b, setB] = useState<Matrix>(() =>
    fromNumbers([
      [1.25, 0.5],
      [2.0, 4.0],
    ]),
  );
  const [scalarText, setScalarText] = useState("2.5");
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
    if (!Number.isInteger(p))
      return { element: null, matrix: null, error: "Exponent must be an integer" };
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
      showHowItWorks={false}
    >
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card/40 p-4 space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Scalar for A / k
          </Label>
          <Input
            value={scalarText}
            onChange={(e) => {
              noteFractionInput(e.target.value);
              setScalarText(e.target.value);
            }}
            className="font-mono"
          />
        </div>
        <div className="rounded-lg border border-border bg-card/40 p-4 space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Exponent p
          </Label>
          <Input
            value={powText}
            onChange={(e) => setPowText(e.target.value)}
            className="font-mono"
          />
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
            {scalarDiv.error ? (
              <p className="text-destructive font-mono text-sm">{scalarDiv.error}</p>
            ) : (
              scalarDiv.data && <MatrixDisplay m={scalarDiv.data} />
            )}
          </div>
          <div>
            <h3 className="text-sm text-muted-foreground mb-2">Hadamard division: A ./ B</h3>
            {hadDiv.error ? (
              <p className="text-destructive font-mono text-sm">{hadDiv.error}</p>
            ) : (
              hadDiv.data && <MatrixDisplay m={hadDiv.data} />
            )}
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

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold">How element-wise and matrix operations differ</h2>
        <p className="text-sm text-muted-foreground">
          Scalar division applies to every entry:{" "}
          <span className="font-mono">(A / k)ij = Aij / k</span>, so k must be nonzero. Hadamard
          division is entry-by-entry:
          <span className="font-mono"> (A ./ B)ij = Aij / Bij</span>, requiring A and B to have
          identical dimensions and every Bij nonzero.
        </p>
        <p className="text-sm text-muted-foreground">
          Element-wise power <span className="font-mono">A.^p</span> means
          <span className="font-mono"> (A.^p)ij = (Aij)^p</span>. Matrix power
          <span className="font-mono"> A^p</span> means repeated matrix multiplication
          <span className="font-mono"> A * A * ... * A</span> (p factors), so A must be square and p
          must be an integer.
        </p>
        <p className="text-sm text-muted-foreground">
          These two powers generally produce different results; they are only the same in special
          cases.
        </p>
        <p className="text-sm text-muted-foreground">
          Core constraints: for <span className="font-mono">p &lt; 0</span>, matrix power
          additionally requires
          <span className="font-mono"> A</span> invertible so{" "}
          <span className="font-mono">A^p = (A^(-1))^(-p)</span>. Matrix powers satisfy{" "}
          <span className="font-mono">A^(p+q) = A^p A^q</span> and
          <span className="font-mono"> A^0 = I</span> (square case), while element-wise powers do
          not follow matrix multiplication identities.
        </p>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
          <li>When A is diagonal, A^p and A.^p agree for integer p.</li>
          <li>
            Matrix power couples rows and columns through matrix multiplication; element-wise power
            does not.
          </li>
          <li>Hadamard division is undefined wherever a corresponding entry of B is zero.</li>
        </ul>
      </section>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}
