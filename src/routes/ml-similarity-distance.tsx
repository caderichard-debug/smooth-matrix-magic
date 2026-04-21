import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { MatrixInput } from "@/components/MatrixInput";
import { AdSlot } from "@/components/AdSlot";
import { Button } from "@/components/ui/button";
import { fromNumbers, type Matrix } from "@/lib/matrix";
import {
  cosineSimilarityMatrix,
  gridToMatrix,
  matrixToGrid,
  pairwiseDistanceMatrix,
  type DistanceMetric,
} from "@/lib/mlOps";

export const Route = createFileRoute("/ml-similarity-distance")({
  head: () => ({
    meta: [
      { title: "Cosine Similarity & Pairwise Distance Matrix Calculator" },
      {
        name: "description",
        content:
          "Compute row-vector cosine similarities and pairwise Euclidean or Manhattan distances for one or two numeric matrices.",
      },
      { property: "og:title", content: "Cosine Similarity & Pairwise Distance Calculator" },
      {
        property: "og:description",
        content:
          "Numeric row-vector similarity and distance matrices with optional cross-matrix mode.",
      },
    ],
  }),
  component: MlSimilarityDistancePage,
});

function MlSimilarityDistancePage() {
  const [A, setA] = useState<Matrix>(() =>
    fromNumbers([
      [1, 0, 1],
      [1, 1, 0],
      [0, 1, 1],
    ]),
  );
  const [useB, setUseB] = useState(false);
  const [B, setB] = useState<Matrix>(() =>
    fromNumbers([
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ]),
  );
  const [metric, setMetric] = useState<DistanceMetric>("euclidean");

  const result = useMemo(() => {
    try {
      const left = matrixToGrid(A, "Matrix A");
      const right = useB ? matrixToGrid(B, "Matrix B") : undefined;
      const cosine = cosineSimilarityMatrix(left, right);
      const distance = pairwiseDistanceMatrix(left, right, metric);
      return {
        cosine: gridToMatrix(cosine),
        distance: gridToMatrix(distance),
        error: null as string | null,
      };
    } catch (e) {
      return {
        cosine: null as Matrix | null,
        distance: null as Matrix | null,
        error: e instanceof Error ? e.message : "Error",
      };
    }
  }, [A, B, useB, metric]);

  return (
    <PageLayout
      title="Cosine Similarity + Pairwise Distances"
      tagline="Rows are treated as vectors; compute cosine similarity and Euclidean/Manhattan distance matrices."
      showHowItWorks={false}
    >
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-4">
          <MatrixInput title="Matrix A (rows are vectors, numeric)" value={A} onChange={setA} />
          <div className="flex flex-wrap gap-2">
            <Button variant={useB ? "secondary" : "default"} onClick={() => setUseB(false)}>
              Self mode (A vs A)
            </Button>
            <Button variant={useB ? "default" : "secondary"} onClick={() => setUseB(true)}>
              Cross mode (A vs B)
            </Button>
          </div>
          {useB && (
            <MatrixInput
              title="Matrix B (optional, same row dimension)"
              value={B}
              onChange={setB}
            />
          )}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Distance metric:</span>
            <Button
              variant={metric === "euclidean" ? "default" : "secondary"}
              onClick={() => setMetric("euclidean")}
            >
              Euclidean (L2)
            </Button>
            <Button
              variant={metric === "manhattan" ? "default" : "secondary"}
              onClick={() => setMetric("manhattan")}
            >
              Manhattan (L1)
            </Button>
          </div>
        </div>

        <section className="rounded-lg border border-border bg-card/40 p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-3">Cosine similarity matrix</h2>
            {result.error ? (
              <p className="text-destructive font-mono text-sm">{result.error}</p>
            ) : (
              result.cosine && (
                <div className="overflow-x-auto">
                  <MatrixDisplay m={result.cosine} />
                </div>
              )
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-3">Pairwise distance matrix ({metric})</h2>
            {!result.error && result.distance && (
              <div className="overflow-x-auto">
                <MatrixDisplay m={result.distance} />
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold">How the math works</h2>
        <p className="text-sm text-muted-foreground">
          Treat each row as a vector. If A has n rows and B has m rows, both with d columns, then
          output matrices are n-by-m. In self mode, B = A and outputs are square.
        </p>
        <p className="text-sm text-muted-foreground">
          Cosine similarity for vectors x and y is{" "}
          <span className="font-mono">cos(x,y) = (x·y) / (||x||_2 ||y||_2)</span>. It measures
          directional alignment (1 same direction, 0 orthogonal, -1 opposite direction) and is
          undefined for zero vectors.
        </p>
        <p className="text-sm text-muted-foreground">
          Pairwise distances use either{" "}
          <span className="font-mono">||x - y||_2 = sqrt(sum_k (x_k - y_k)^2)</span> (Euclidean) or{" "}
          <span className="font-mono">||x - y||_1 = sum_k |x_k - y_k|</span> (Manhattan). In self
          mode, distance matrices are symmetric with zeros on the diagonal.
        </p>
      </section>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}
