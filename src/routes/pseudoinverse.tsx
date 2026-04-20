import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { AdSlot } from "@/components/AdSlot";
import {
  dims,
  fromNumbers,
  inverse,
  isFullyNumeric,
  multiply,
  rank,
  transpose,
  type Matrix,
} from "@/lib/matrix";

export const Route = createFileRoute("/pseudoinverse")({
  head: () => ({
    meta: [
      { title: "Moore-Penrose Pseudoinverse Calculator" },
      {
        name: "description",
        content:
          "Compute matrix pseudoinverse using full-rank formulas for tall or wide numeric matrices and inspect projection checks.",
      },
      { property: "og:title", content: "Moore-Penrose Pseudoinverse Calculator" },
      { property: "og:description", content: "Find A+ for rectangular systems and least-squares workflows." },
    ],
  }),
  component: PseudoinversePage,
});

function PseudoinversePage() {
  const [a, setA] = useState<Matrix>(() => fromNumbers([[1, 2], [2, 1], [0, 1]]));

  const out = useMemo(() => {
    try {
      if (!isFullyNumeric(a)) throw new Error("Pseudoinverse currently requires a fully numeric matrix");
      const { rows, cols } = dims(a);
      const r = rank(a);
      const at = transpose(a);

      let pinv: Matrix;
      let method: string;
      if (rows >= cols && r === cols) {
        pinv = multiply(inverse(multiply(at, a)), at);
        method = "Full column-rank formula: A+ = (A^T A)^(-1) A^T";
      } else if (cols > rows && r === rows) {
        pinv = multiply(at, inverse(multiply(a, at)));
        method = "Full row-rank formula: A+ = A^T (A A^T)^(-1)";
      } else {
        throw new Error(
          "This implementation supports full row-rank or full column-rank numeric matrices. Rank-deficient SVD-based pseudoinverse is not yet included.",
        );
      }

      return {
        pinv,
        leftProjection: multiply(a, multiply(pinv, a)),
        rightProjection: multiply(pinv, multiply(a, pinv)),
        rankText: `rank(A) = ${r}`,
        method,
        error: null as string | null,
      };
    } catch (e) {
      return { pinv: null, leftProjection: null, rightProjection: null, rankText: "", method: "", error: e instanceof Error ? e.message : "Error" };
    }
  }, [a]);

  return (
    <PageLayout
      title="Pseudoinverse"
      tagline="Compute the Moore-Penrose pseudoinverse for full-rank rectangular matrices and verify core identities."
      showHowItWorks={false}
    >
      <MatrixInput title="Matrix A" value={a} onChange={setA} />

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-4">
        <h2 className="text-xl font-semibold">Pseudoinverse result</h2>
        {out.error ? (
          <p className="text-sm font-mono text-destructive">{out.error}</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{out.method}</p>
            <p className="text-sm text-muted-foreground font-mono">{out.rankText}</p>
            <div className="grid lg:grid-cols-2 gap-4">
              {out.pinv && <div className="overflow-x-auto"><MatrixDisplay m={out.pinv} label="A+" /></div>}
              {out.leftProjection && <div className="overflow-x-auto"><MatrixDisplay m={out.leftProjection} label="A A+ A (should equal A)" /></div>}
              {out.rightProjection && <div className="overflow-x-auto"><MatrixDisplay m={out.rightProjection} label="A+ A A+ (should equal A+)" /></div>}
            </div>
          </>
        )}
      </section>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold">How pseudoinverse works</h2>
        <p className="text-sm text-muted-foreground">
          The Moore-Penrose pseudoinverse extends inversion to rectangular matrices and gives least-squares solutions
          <span className="font-mono"> x* = A+ b</span> when exact solves do not exist.
        </p>
        <p className="text-sm text-muted-foreground">
          For full column rank, <span className="font-mono">A+ = (A^T A)^(-1)A^T</span>; for full row rank,
          <span className="font-mono"> A+ = A^T(AA^T)^(-1)</span>. Rank-deficient cases generally require SVD.
        </p>
      </section>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}
