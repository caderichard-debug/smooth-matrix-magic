import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixInput } from "@/components/MatrixInput";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { AdSlot } from "@/components/AdSlot";
import { nullSpaceBasis, columnSpaceBasis, fromNumbers, type Matrix } from "@/lib/matrix";

export const Route = createFileRoute("/spaces")({
  head: () => ({
    meta: [
      { title: "Null Space & Column Space Basis Calculator — Free Online" },
      {
        name: "description",
        content:
          "Compute basis vectors for the null space and column space of a numeric matrix online.",
      },
      { property: "og:title", content: "Null Space & Column Space Basis Calculator" },
      {
        property: "og:description",
        content: "Find null space and column space basis vectors online — free.",
      },
    ],
  }),
  component: SpacesPage,
});

function SpacesPage() {
  const [a, setA] = useState<Matrix>(() =>
    fromNumbers([
      [1, 2.5, 3, 4.5],
      [2, 5, 6, 9],
      [0, 1, 1.5, 2],
    ]),
  );

  const nullBasis = useMemo(() => {
    try {
      return { data: nullSpaceBasis(a), error: null as string | null };
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : "Error" };
    }
  }, [a]);

  const colBasis = useMemo(() => {
    try {
      return { data: columnSpaceBasis(a), error: null as string | null };
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : "Error" };
    }
  }, [a]);

  return (
    <PageLayout
      title="Null Space & Column Space Basis"
      tagline="Find basis vectors of kernel(A) and Col(A) from one numeric matrix input."
      showHowItWorks={false}
    >
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <MatrixInput title="Matrix A (numeric)" value={a} onChange={setA} />

        <div className="space-y-4">
          <section className="rounded-lg border border-border bg-card/40 p-6">
            <h2 className="text-xl font-semibold mb-3">Null Space Basis</h2>
            {nullBasis.error ? (
              <p className="text-destructive font-mono text-sm">{nullBasis.error}</p>
            ) : nullBasis.data && nullBasis.data.length > 0 ? (
              <div className="space-y-3 overflow-x-auto">
                {nullBasis.data.map((basisVec, idx) => (
                  <MatrixDisplay key={`null-${idx}`} m={basisVec} label={`v${idx + 1}`} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Only the zero vector is in the null space (trivial null space).
              </p>
            )}
          </section>

          <section className="rounded-lg border border-border bg-card/40 p-6">
            <h2 className="text-xl font-semibold mb-3">Column Space Basis</h2>
            {colBasis.error ? (
              <p className="text-destructive font-mono text-sm">{colBasis.error}</p>
            ) : colBasis.data && colBasis.data.length > 0 ? (
              <div className="space-y-3 overflow-x-auto">
                {colBasis.data.map((basisVec, idx) => (
                  <MatrixDisplay key={`col-${idx}`} m={basisVec} label={`c${idx + 1}`} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No pivot columns were found.</p>
            )}
          </section>
        </div>
      </div>

      <section className="prose-invert max-w-none space-y-3 text-muted-foreground">
        <h2 className="text-foreground text-xl font-semibold">
          How null space and column space basis works
        </h2>
        <p>
          The null space is N(A) = {"{"}x : Ax = 0{"}"}. A basis is built by row-reducing A to
          identify pivot and free variables, then writing one basis vector for each free-variable
          direction.
        </p>
        <p>
          The column space Col(A) is the span of A&apos;s columns. Pivot columns found from row
          reduction mark which original columns form a basis for Col(A).
        </p>
        <p>
          Dimensions summarize the result: <span className="font-mono">dim Col(A)=rank(A)</span> and{" "}
          <span className="font-mono">dim N(A)=nullity(A)</span>.
        </p>
        <p>
          Rank-nullity links both outputs: rank(A) + nullity(A) = number of columns of A. If no free
          variables appear, null space is trivial (only the zero vector).
        </p>
        <p>
          Interpretation note: basis vectors are not unique. Different elimination paths can return
          different bases that span the same space.
        </p>
      </section>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}
