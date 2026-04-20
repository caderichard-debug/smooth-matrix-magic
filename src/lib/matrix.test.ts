import { describe, expect, it } from "vitest";
import {
  add,
  anticommutator,
  asNumber,
  bandExtract,
  characteristicPolynomial,
  columnSpaceBasis,
  commutator,
  conditionNumber1,
  conjugateTranspose,
  concatHorizontal,
  concatVertical,
  circulantMatrix,
  determinant,
  diagonalExtract,
  diagonalMatrix,
  distanceFrobenius,
  directSum,
  eigenvaluesNumeric,
  elementWisePower,
  flattenMatrix,
  frobeniusNorm,
  hadamardProduct,
  hadamardDivide,
  identity,
  infinityNorm,
  inverse,
  kroneckerProduct,
  l1Norm,
  luDecomposition,
  matrixExponential,
  matrixPower,
  matrixToText,
  multiply,
  nullity,
  nullSpaceBasis,
  parseExpr,
  parseMatrixText,
  permuteCols,
  permuteRows,
  qrDecomposition,
  rank,
  relativeError,
  resizeMatrix,
  reshapeMatrix,
  sliceMatrix,
  reverseCols,
  reverseRows,
  rref,
  scalarDivide,
  scalarMultiply,
  solveLinearSystem,
  subtract,
  toeplitzMatrix,
  trace,
  transpose,
  type Matrix,
  fromNumbers,
  gramSchmidtOrthogonalization,
  onesMatrix,
  randomMatrix,
  zeroMatrix,
} from "@/lib/matrix";

function toNum(m: Matrix): number[][] {
  return m.map((row) =>
    row.map((value) => {
      const n = asNumber(value);
      if (n === null || !Number.isFinite(n)) throw new Error("Expected numeric matrix");
      return n;
    }),
  );
}

function expectMatrixClose(actual: Matrix, expected: number[][], tol = 1e-6) {
  const n = toNum(actual);
  expect(n.length).toBe(expected.length);
  for (let i = 0; i < expected.length; i++) {
    expect(n[i].length).toBe(expected[i].length);
    for (let j = 0; j < expected[i].length; j++) {
      expect(n[i][j]).toBeCloseTo(expected[i][j], Math.abs(Math.log10(tol)));
    }
  }
}

describe("matrix operations", () => {
  it("parses and serializes matrix text", () => {
    const m = parseMatrixText("1  2\n3  4");
    expect(matrixToText(m)).toBe("1\t2\n3\t4");
  });

  it("multiplies matrices", () => {
    const a = fromNumbers([[1, 2, 3], [4, 5, 6]]);
    const b = fromNumbers([[7, 8], [9, 10], [11, 12]]);
    expectMatrixClose(multiply(a, b), [[58, 64], [139, 154]]);
  });

  it("adds, subtracts, scalar-multiplies, transposes", () => {
    const a = fromNumbers([[1, 2], [3, 4]]);
    const b = fromNumbers([[5, 6], [7, 8]]);
    expectMatrixClose(add(a, b), [[6, 8], [10, 12]]);
    expectMatrixClose(subtract(b, a), [[4, 4], [4, 4]]);
    expectMatrixClose(scalarMultiply(a, parseExpr("2")), [[2, 4], [6, 8]]);
    expectMatrixClose(transpose(a), [[1, 3], [2, 4]]);
    expectMatrixClose(conjugateTranspose(a), [[1, 3], [2, 4]]);
  });

  it("supports element-wise division and power variants", () => {
    const a = fromNumbers([[4, 9], [16, 25]]);
    const b = fromNumbers([[2, 3], [4, 5]]);
    expectMatrixClose(scalarDivide(a, parseExpr("2")), [[2, 4.5], [8, 12.5]]);
    expectMatrixClose(hadamardDivide(a, b), [[2, 3], [4, 5]]);
    expectMatrixClose(elementWisePower(b, 2), [[4, 9], [16, 25]]);
  });

  it("computes determinant, power, identity, trace", () => {
    const a = fromNumbers([[2, 1], [1, 2]]);
    expect(asNumber(determinant(a))).toBe(3);
    expectMatrixClose(matrixPower(a, 2), [[5, 4], [4, 5]]);
    expectMatrixClose(identity(2), [[1, 0], [0, 1]]);
    expect(asNumber(trace(a))).toBe(4);
  });

  it("computes rank and rref", () => {
    const a = fromNumbers([[1, 2, 3], [2, 4, 6], [1, 1, 1]]);
    expect(rank(a)).toBe(2);
    expectMatrixClose(rref(a), [[1, 0, -1], [0, 1, 2], [0, 0, 0]]);
  });

  it("computes inverse", () => {
    const a = fromNumbers([[4, 7], [2, 6]]);
    expectMatrixClose(inverse(a), [[0.6, -0.7], [-0.2, 0.4]]);
  });

  it("computes hadamard and kronecker products", () => {
    const a = fromNumbers([[1, 2], [3, 4]]);
    const b = fromNumbers([[2, 0], [1, 3]]);
    expectMatrixClose(hadamardProduct(a, b), [[2, 0], [3, 12]]);
    expectMatrixClose(kroneckerProduct(a, b), [[2, 0, 4, 0], [1, 3, 2, 6], [6, 0, 8, 0], [3, 9, 4, 12]]);
  });

  it("computes direct sum, commutator, anticommutator", () => {
    const a = fromNumbers([[1, 2], [0, 1]]);
    const b = fromNumbers([[2, 0], [1, 3]]);
    expectMatrixClose(directSum(a, b), [[1, 2, 0, 0], [0, 1, 0, 0], [0, 0, 2, 0], [0, 0, 1, 3]]);
    expectMatrixClose(commutator(a, b), [[2, 2], [0, -2]]);
    expectMatrixClose(anticommutator(a, b), [[6, 10], [2, 8]]);
  });

  it("computes LU decomposition", () => {
    const a = fromNumbers([[4, 3], [6, 3]]);
    const { l, u } = luDecomposition(a);
    expectMatrixClose(multiply(l, u), [[4, 3], [6, 3]]);
  });

  it("computes QR decomposition and Gram-Schmidt", () => {
    const a = fromNumbers([[1, 1], [1, -1]]);
    const { q, r } = qrDecomposition(a);
    expectMatrixClose(multiply(q, r), [[1, 1], [1, -1]], 1e-5);
    const gs = gramSchmidtOrthogonalization(a);
    const gsNum = toNum(gs);
    expect(Math.hypot(gsNum[0][0], gsNum[1][0])).toBeCloseTo(1, 5);
    expect(Math.hypot(gsNum[0][1], gsNum[1][1])).toBeCloseTo(1, 5);
  });

  it("solves linear systems with unique/infinite/no solutions", () => {
    const unique = solveLinearSystem(
      fromNumbers([[2, 1], [1, -1]]),
      fromNumbers([[5], [1]]),
    );
    expect(unique.classification).toBe("unique");
    expectMatrixClose(unique.particularSolution!, [[2], [1]]);

    const infinite = solveLinearSystem(
      fromNumbers([[1, 1], [2, 2]]),
      fromNumbers([[2], [4]]),
    );
    expect(infinite.classification).toBe("infinite");

    const none = solveLinearSystem(
      fromNumbers([[1, 1], [2, 2]]),
      fromNumbers([[2], [5]]),
    );
    expect(none.classification).toBe("none");
  });

  it("computes characteristic polynomial and eigenvalues", () => {
    const a = fromNumbers([[2, 1], [1, 2]]);
    const poly = characteristicPolynomial(a);
    expect(poly.coefficients).toEqual([1, -4, 3]);

    const eig = eigenvaluesNumeric(a).sort((x, y) => x - y);
    expect(eig[0]).toBeCloseTo(1, 6);
    expect(eig[1]).toBeCloseTo(3, 6);
  });

  it("computes null space and column space bases", () => {
    const a = fromNumbers([[1, 2, 3], [2, 4, 6]]);
    const nullBasis = nullSpaceBasis(a);
    const colBasis = columnSpaceBasis(a);
    expect(nullBasis.length).toBe(2);
    expect(colBasis.length).toBe(1);
  });

  it("computes matrix exponential", () => {
    const zero2 = fromNumbers([[0, 0], [0, 0]]);
    expectMatrixClose(matrixExponential(zero2, 10), [[1, 0], [0, 1]], 1e-6);
  });

  it("handles shape and structure operations", () => {
    const a = fromNumbers([[1, 2, 3], [4, 5, 6]]);
    const b = fromNumbers([[7, 8, 9], [10, 11, 12]]);
    expectMatrixClose(flattenMatrix(a), [[1, 2, 3, 4, 5, 6]]);
    expectMatrixClose(reshapeMatrix(a, 3, 2), [[1, 2], [3, 4], [5, 6]]);
    expectMatrixClose(resizeMatrix(a, 3, 4), [[1, 2, 3, 0], [4, 5, 6, 0], [0, 0, 0, 0]]);
    expectMatrixClose(sliceMatrix(a, 0, 2, 1, 3), [[2, 3], [5, 6]]);
    expectMatrixClose(concatHorizontal(a, b), [[1, 2, 3, 7, 8, 9], [4, 5, 6, 10, 11, 12]]);
    expectMatrixClose(concatVertical(a, b), [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10, 11, 12]]);
    expectMatrixClose(reverseRows(a), [[4, 5, 6], [1, 2, 3]]);
    expectMatrixClose(reverseCols(a), [[3, 2, 1], [6, 5, 4]]);
    expectMatrixClose(permuteRows(a, [1, 0]), [[4, 5, 6], [1, 2, 3]]);
    expectMatrixClose(permuteCols(a, [2, 1, 0]), [[3, 2, 1], [6, 5, 4]]);
    expect(diagonalExtract(fromNumbers([[1, 2], [3, 4]])).map((x) => asNumber(x))).toEqual([1, 4]);
    expectMatrixClose(diagonalMatrix([parseExpr("2"), parseExpr("3")]), [[2, 0], [0, 3]]);
    expectMatrixClose(bandExtract(fromNumbers([[1, 2, 3], [4, 5, 6], [7, 8, 9]]), 1, 0), [[1, 0, 0], [4, 5, 0], [0, 8, 9]]);
  });

  it("supports generator utilities", () => {
    expectMatrixClose(zeroMatrix(2, 3), [[0, 0, 0], [0, 0, 0]]);
    expectMatrixClose(onesMatrix(2, 2), [[1, 1], [1, 1]]);
    const rnd = randomMatrix(2, 2, 0, 10, true);
    expect(toNum(rnd).every((row) => row.every((v) => Number.isInteger(v)))).toBe(true);
    expectMatrixClose(toeplitzMatrix([1, 2, 3], [1, 4, 5]), [[1, 4, 5], [2, 1, 4], [3, 2, 1]]);
    expectMatrixClose(circulantMatrix([1, 2, 3]), [[1, 2, 3], [3, 1, 2], [2, 3, 1]]);
  });

  it("computes norms and metrics", () => {
    const a = fromNumbers([[2, 1], [1, 2]]);
    const b = fromNumbers([[2, 1], [1, 3]]);
    expect(frobeniusNorm(a)).toBeCloseTo(Math.sqrt(10), 6);
    expect(l1Norm(a)).toBe(3);
    expect(infinityNorm(a)).toBe(3);
    expect(nullity(fromNumbers([[1, 2, 3], [2, 4, 6]]))).toBe(2);
    expect(distanceFrobenius(a, b)).toBe(1);
    expect(relativeError(a, b)).toBeCloseTo(1 / Math.sqrt(10), 6);
    expect(conditionNumber1(a)).toBeCloseTo(3, 6);
  });
});
