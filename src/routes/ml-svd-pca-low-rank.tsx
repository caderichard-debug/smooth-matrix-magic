import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { MatrixInput } from "@/components/MatrixInput";
import { AdSlot } from "@/components/AdSlot";
import { fromNumbers, formatNumber, type Matrix } from "@/lib/matrix";
import {
  gridToMatrix,
  lowRankApproximation,
  matrixToGrid,
  pcaFromSvd,
  truncatedSvd,
} from "@/lib/mlOps";

export const Route = createFileRoute("/ml-svd-pca-low-rank")({
  head: () => ({
    meta: [
      { title: "SVD, PCA, and Low-Rank Approximation Calculator" },
      {
        name: "description",
        content:
          "Learn truncated SVD, rank-k matrix reconstruction, and PCA from SVD with numeric in-browser matrix examples.",
      },
      { property: "og:title", content: "SVD/PCA/Low-Rank Matrix Calculator" },
      {
        property: "og:description",
        content: "Compute U, S, V^T plus rank-k approximation and PCA outputs from SVD.",
      },
    ],
  }),
  component: MlSvdPcaLowRankPage,
});

function MlSvdPcaLowRankPage() {
  const [matrixA, setMatrixA] = useState<Matrix>(() =>
    fromNumbers([
      [5, 4, 0],
      [4, 5, 0],
      [1, 0, 3],
      [0, 1, 2],
    ]),
  );
  const [dataX, setDataX] = useState<Matrix>(() =>
    fromNumbers([
      [2.5, 2.4, 1.2],
      [0.5, 0.7, -0.2],
      [2.2, 2.9, 1.4],
      [1.9, 2.2, 0.8],
      [3.1, 3.0, 1.9],
      [2.3, 2.7, 1.1],
    ]),
  );
  const [rankK, setRankK] = useState(2);
  const [pcaK, setPcaK] = useState(2);

  const svdResult = useMemo(() => {
    try {
      const a = matrixToGrid(matrixA, "Matrix A");
      const svd = truncatedSvd(a, rankK);
      const approx = lowRankApproximation(a, rankK);
      const reconstructionError = Math.sqrt(
        a.reduce(
          (sum, row, i) =>
            sum +
            row.reduce((inner, v, j) => {
              const d = v - approx[i][j];
              return inner + d * d;
            }, 0),
          0,
        ),
      );
      return {
        U: gridToMatrix(svd.U),
        S: gridToMatrix([svd.S]),
        Vt: gridToMatrix(svd.Vt),
        approximation: gridToMatrix(approx),
        singularValues: svd.singularValues,
        reconstructionError,
        error: null as string | null,
      };
    } catch (e) {
      return {
        U: null as Matrix | null,
        S: null as Matrix | null,
        Vt: null as Matrix | null,
        approximation: null as Matrix | null,
        singularValues: [] as number[],
        reconstructionError: null as number | null,
        error: e instanceof Error ? e.message : "Error",
      };
    }
  }, [matrixA, rankK]);

  const pcaResult = useMemo(() => {
    try {
      const x = matrixToGrid(dataX, "Data matrix X");
      const out = pcaFromSvd(x, pcaK);
      return {
        means: gridToMatrix([out.means]),
        components: gridToMatrix(out.components),
        scores: gridToMatrix(out.scores),
        explainedVariance: out.explainedVariance,
        explainedVarianceRatio: out.explainedVarianceRatio,
        error: null as string | null,
      };
    } catch (e) {
      return {
        means: null as Matrix | null,
        components: null as Matrix | null,
        scores: null as Matrix | null,
        explainedVariance: [] as number[],
        explainedVarianceRatio: [] as number[],
        error: e instanceof Error ? e.message : "Error",
      };
    }
  }, [dataX, pcaK]);

  return (
    <PageLayout
      title="SVD, PCA, and Low-Rank Approximation"
      tagline="Use truncated SVD for rank-k compression and PCA projection from centered data."
      showHowItWorks={false}
    >
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <section className="space-y-4 rounded-lg border border-border bg-card/40 p-6">
          <h2 className="text-xl font-semibold">SVD and rank-k reconstruction</h2>
          <MatrixInput title="Matrix A (numeric)" value={matrixA} onChange={setMatrixA} />
          <label className="block space-y-1">
            <span className="text-sm text-muted-foreground">Truncated rank k</span>
            <input
              type="number"
              min={1}
              value={rankK}
              onChange={(e) => setRankK(Number(e.target.value))}
              className="w-28 rounded-md border border-border bg-background px-2 py-1 text-sm"
            />
          </label>
          {svdResult.error ? (
            <p className="text-sm font-mono text-destructive">{svdResult.error}</p>
          ) : (
            <div className="space-y-4">
              {svdResult.U && (
                <MatrixDisplay m={svdResult.U} label="U (left singular vectors, truncated)" />
              )}
              {svdResult.S && <MatrixDisplay m={svdResult.S} label="S (kept singular values)" />}
              <p className="text-sm text-muted-foreground">
                Full singular spectrum:{" "}
                <span className="font-mono text-primary">
                  {svdResult.singularValues.map((v) => formatNumber(v)).join(", ")}
                </span>
              </p>
              {svdResult.Vt && (
                <MatrixDisplay m={svdResult.Vt} label="V^T (right singular vectors, truncated)" />
              )}
              {svdResult.approximation && (
                <MatrixDisplay
                  m={svdResult.approximation}
                  label="Rank-k approximation A_k = U_k diag(S_k) V_k^T"
                />
              )}
              {typeof svdResult.reconstructionError === "number" ? (
                <p className="text-sm text-muted-foreground">
                  Reconstruction error (Frobenius norm):{" "}
                  <span className="font-mono text-primary">
                    {formatNumber(svdResult.reconstructionError)}
                  </span>
                </p>
              ) : null}
            </div>
          )}
        </section>

        <section className="space-y-4 rounded-lg border border-border bg-card/40 p-6">
          <h2 className="text-xl font-semibold">PCA from SVD</h2>
          <MatrixInput
            title="Data X (rows = samples, cols = features)"
            value={dataX}
            onChange={setDataX}
          />
          <label className="block space-y-1">
            <span className="text-sm text-muted-foreground">
              Number of principal components (k)
            </span>
            <input
              type="number"
              min={1}
              value={pcaK}
              onChange={(e) => setPcaK(Number(e.target.value))}
              className="w-28 rounded-md border border-border bg-background px-2 py-1 text-sm"
            />
          </label>
          {pcaResult.error ? (
            <p className="text-sm font-mono text-destructive">{pcaResult.error}</p>
          ) : (
            <div className="space-y-4">
              {pcaResult.means && (
                <MatrixDisplay m={pcaResult.means} label="Feature means (for centering)" />
              )}
              {pcaResult.components && (
                <MatrixDisplay
                  m={pcaResult.components}
                  label="Principal axes V_k^T (rows are components)"
                />
              )}
              {pcaResult.scores && (
                <MatrixDisplay
                  m={pcaResult.scores}
                  label="Projected data scores Z = X_centered V_k"
                />
              )}
              <div className="rounded-md border border-border bg-background/50 p-3 text-sm text-muted-foreground">
                {pcaResult.explainedVarianceRatio.map((ratio, i) => (
                  <div key={i}>
                    PC{i + 1}: variance {formatNumber(pcaResult.explainedVariance[i])}, explained{" "}
                    <span className="font-mono text-primary">{(ratio * 100).toFixed(2)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3 text-sm text-muted-foreground">
        <h2 className="text-xl font-semibold text-foreground">How it works</h2>
        <p>
          Truncated SVD factors a matrix as{" "}
          <span className="font-mono">A ≈ U_k diag(S_k) V_k^T</span> where only the top k singular
          values are kept. This gives the best rank-k approximation in Frobenius norm.
        </p>
        <p>
          PCA via SVD centers data matrix X, then decomposes it as{" "}
          <span className="font-mono">X_centered = U S V^T</span>. The rows of{" "}
          <span className="font-mono">V_k^T</span> are principal axes and projected coordinates are{" "}
          <span className="font-mono">Z = X_centered V_k</span>.
        </p>
      </section>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}
