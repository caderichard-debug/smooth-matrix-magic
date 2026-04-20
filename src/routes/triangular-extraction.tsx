import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { AdSlot } from "@/components/AdSlot";
import { ONE, ZERO, bandExtract, fromNumbers, type Matrix } from "@/lib/matrix";

export const Route = createFileRoute("/triangular-extraction")({
  head: () => ({
    meta: [
      { title: "Triangular Matrix Extraction Calculator" },
      {
        name: "description",
        content:
          "Extract upper, lower, strict-upper, strict-lower, and unit-triangular forms from a matrix for elimination workflows.",
      },
      { property: "og:title", content: "Triangular Matrix Extraction Calculator" },
      { property: "og:description", content: "Inspect triangular parts used in LU-style algorithms and matrix splitting." },
    ],
  }),
  component: TriangularExtractionPage,
});

function TriangularExtractionPage() {
  const [a, setA] = useState<Matrix>(() => fromNumbers([[2, -1, 3], [4, 5, 6], [7, 8, 9]]));

  const tri = useMemo(() => {
    const lower = bandExtract(a, Number.MAX_SAFE_INTEGER, 0);
    const upper = bandExtract(a, 0, Number.MAX_SAFE_INTEGER);
    const strictLower = lower.map((row, i) => row.map((v, j) => (i === j ? ZERO : v)));
    const strictUpper = upper.map((row, i) => row.map((v, j) => (i === j ? ZERO : v)));
    const unitLower = lower.map((row, i) => row.map((v, j) => (i === j ? ONE : v)));
    const unitUpper = upper.map((row, i) => row.map((v, j) => (i === j ? ONE : v)));
    return { lower, upper, strictLower, strictUpper, unitLower, unitUpper };
  }, [a]);

  return (
    <PageLayout
      title="Triangular Extraction"
      tagline="Isolate upper/lower triangular structure and strict or unit variants from a matrix."
      showHowItWorks={false}
    >
      <MatrixInput title="Matrix A" value={a} onChange={setA} />

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="rounded-lg border border-border bg-card/40 p-6 space-y-4">
          <h2 className="text-xl font-semibold">Triangular parts</h2>
          <div className="overflow-x-auto"><MatrixDisplay m={tri.lower} label="Lower triangular part L(A)" /></div>
          <div className="overflow-x-auto"><MatrixDisplay m={tri.upper} label="Upper triangular part U(A)" /></div>
          <div className="overflow-x-auto"><MatrixDisplay m={tri.strictLower} label="Strict lower part (diag removed)" /></div>
          <div className="overflow-x-auto"><MatrixDisplay m={tri.strictUpper} label="Strict upper part (diag removed)" /></div>
        </section>
        <section className="rounded-lg border border-border bg-card/40 p-6 space-y-4">
          <h2 className="text-xl font-semibold">Unit triangular variants</h2>
          <div className="overflow-x-auto"><MatrixDisplay m={tri.unitLower} label="Unit-lower (diag set to 1)" /></div>
          <div className="overflow-x-auto"><MatrixDisplay m={tri.unitUpper} label="Unit-upper (diag set to 1)" /></div>
        </section>
      </div>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold">How triangular extraction works</h2>
        <p className="text-sm text-muted-foreground">
          Lower extraction keeps entries with <span className="font-mono">i &ge; j</span>, while upper extraction keeps
          entries with <span className="font-mono">i &le; j</span>. Strict forms drop the diagonal.
        </p>
        <p className="text-sm text-muted-foreground">
          Unit triangular matrices force diagonal entries to 1, which is common in LU factorizations where L is unit-lower
          and U is upper triangular.
        </p>
      </section>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}
