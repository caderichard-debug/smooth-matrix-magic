import { describe, expect, it } from "vitest";
import {
  addSparse,
  denseToSparse,
  multiplySparse,
  parseNumericMatrixText,
  parseNumericVectorText,
  solveJacobiSparse,
  sparseBandwidthProfile,
  sparseToDense,
  toCSC,
  toCSR,
  type SparseMatrix,
} from "@/lib/sparse";

function expectDenseClose(actual: number[][], expected: number[][], tol = 1e-9) {
  expect(actual.length).toBe(expected.length);
  for (let i = 0; i < expected.length; i++) {
    expect(actual[i].length).toBe(expected[i].length);
    for (let j = 0; j < expected[i].length; j++) {
      expect(actual[i][j]).toBeCloseTo(expected[i][j], Math.abs(Math.log10(tol)));
    }
  }
}

describe("sparse utilities", () => {
  it("parses numeric matrix text with spaces, commas, and semicolons", () => {
    const m = parseNumericMatrixText("1, 2; 3\n4 5 6");
    expect(m).toEqual([
      [1, 2, 3],
      [4, 5, 6],
    ]);
  });

  it("rejects malformed matrix input", () => {
    expect(() => parseNumericMatrixText("")).toThrow("Matrix input is empty");
    expect(() => parseNumericMatrixText("1 2\n3")).toThrow("All rows must have the same number of columns");
    expect(() => parseNumericMatrixText("1 2\n3 x")).toThrow("non-numeric value");
  });

  it("parses numeric vector text", () => {
    expect(parseNumericVectorText("1, 2; 3 4")).toEqual([1, 2, 3, 4]);
    expect(() => parseNumericVectorText("")).toThrow("Vector input is empty");
    expect(() => parseNumericVectorText("1 a")).toThrow("non-numeric value");
  });

  it("converts between dense and sparse forms", () => {
    const dense = [
      [1, 0, 0],
      [0, -2, 3],
      [0, 0, 0],
    ];
    const sparse = denseToSparse(dense);
    expect(sparse.rows).toBe(3);
    expect(sparse.cols).toBe(3);
    expect(sparse.entries).toEqual([
      { row: 0, col: 0, value: 1 },
      { row: 1, col: 1, value: -2 },
      { row: 1, col: 2, value: 3 },
    ]);
    expect(sparseToDense(sparse)).toEqual(dense);
  });

  it("builds CSR and CSC arrays correctly", () => {
    const sparse: SparseMatrix = {
      rows: 3,
      cols: 3,
      entries: [
        { row: 0, col: 1, value: 4 },
        { row: 2, col: 2, value: 9 },
        { row: 1, col: 0, value: 5 },
      ],
    };

    const csr = toCSR(sparse);
    expect(csr.values).toEqual([4, 5, 9]);
    expect(csr.colIndices).toEqual([1, 0, 2]);
    expect(csr.rowPtr).toEqual([0, 1, 2, 3]);

    const csc = toCSC(sparse);
    expect(csc.values).toEqual([5, 4, 9]);
    expect(csc.rowIndices).toEqual([1, 0, 2]);
    expect(csc.colPtr).toEqual([0, 1, 2, 3]);
  });

  it("adds sparse matrices", () => {
    const a = denseToSparse([
      [1, 0, 2],
      [0, 3, 0],
    ]);
    const b = denseToSparse([
      [0, 4, -2],
      [5, 0, 0],
    ]);
    const sum = addSparse(a, b);
    expectDenseClose(sparseToDense(sum), [
      [1, 4, 0],
      [5, 3, 0],
    ]);
  });

  it("rejects sparse addition with mismatched dimensions", () => {
    const a = denseToSparse([[1, 2]]);
    const b = denseToSparse([[1], [2]]);
    expect(() => addSparse(a, b)).toThrow("Sparse addition requires matching dimensions");
  });

  it("multiplies sparse matrices", () => {
    const a = denseToSparse([
      [1, 0, 2],
      [0, 3, 0],
    ]);
    const b = denseToSparse([
      [0, 4],
      [5, 0],
      [6, 7],
    ]);
    const product = multiplySparse(a, b);
    expectDenseClose(sparseToDense(product), [
      [12, 18],
      [15, 0],
    ]);
  });

  it("rejects sparse multiplication with incompatible shapes", () => {
    const a = denseToSparse([[1, 2]]);
    const b = denseToSparse([[1, 2]]);
    expect(() => multiplySparse(a, b)).toThrow("Sparse multiplication requires A.cols = B.rows");
  });

  it("computes bandwidth and profile metrics", () => {
    const sparse = denseToSparse([
      [10, 2, 0],
      [3, 11, 4],
      [0, 5, 12],
    ]);
    const metrics = sparseBandwidthProfile(sparse);
    expect(metrics.lowerBandwidth).toBe(1);
    expect(metrics.upperBandwidth).toBe(1);
    expect(metrics.bandwidth).toBe(3);
    expect(metrics.rowProfile).toEqual([0, 1, 1]);
    expect(metrics.profile).toBe(2);
  });

  it("solves sparse systems with Jacobi iteration", () => {
    const a = denseToSparse([
      [4, 1],
      [2, 3],
    ]);
    const b = [1, 2];
    const result = solveJacobiSparse(a, b, 100, 1e-10);

    expect(result.converged).toBe(true);
    expect(result.iterations).toBeGreaterThan(0);
    expect(result.residualNorm).toBeLessThan(1e-10);
    expect(result.solution[0]).toBeCloseTo(0.1, 6);
    expect(result.solution[1]).toBeCloseTo(0.6, 6);
    expect(result.note).toContain("Converged");
  });

  it("reports non-convergence with tight iteration budget", () => {
    const a = denseToSparse([
      [4, 1],
      [2, 3],
    ]);
    const b = [1, 2];
    const result = solveJacobiSparse(a, b, 1, 1e-20);

    expect(result.converged).toBe(false);
    expect(result.iterations).toBe(1);
    expect(result.residualNorm).toBeGreaterThan(1e-20);
    expect(result.note).toContain("Did not converge");
  });

  it("validates Jacobi inputs", () => {
    const square = denseToSparse([
      [2, 1],
      [1, 2],
    ]);
    const nonSquare = denseToSparse([[1, 2, 3]]);

    expect(() => solveJacobiSparse(nonSquare, [1], 10, 1e-6)).toThrow(
      "Iterative solve requires a square matrix",
    );
    expect(() => solveJacobiSparse(square, [1], 10, 1e-6)).toThrow(
      "Right-hand side vector length must match matrix rows",
    );
    expect(() => solveJacobiSparse(square, [1, 2], 0, 1e-6)).toThrow(
      "Max iterations must be a positive integer",
    );
    expect(() => solveJacobiSparse(square, [1, 2], 10, 0)).toThrow("Tolerance must be positive");

    const zeroDiagonal = denseToSparse([
      [0, 1],
      [1, 2],
    ]);
    expect(() => solveJacobiSparse(zeroDiagonal, [1, 2], 10, 1e-6)).toThrow(
      "Jacobi iteration requires non-zero diagonal entries",
    );
  });
});

