import {
  Expr, ZERO, ONE, add as eAdd, sub as eSub, mul as eMul, div as eDiv,
  neg as eNeg, isZero, isConstant, asNumber, asRational, fromInt, parse,
  stringifyShort,
} from "./expr";

export type Matrix = Expr[][];

export function makeMatrix(rows: number, cols: number, fill: Expr = ZERO): Matrix {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => fill));
}

export function dims(m: Matrix): { rows: number; cols: number } {
  return { rows: m.length, cols: m[0]?.length ?? 0 };
}

export function isRectangular(m: Matrix): boolean {
  if (m.length === 0) return false;
  const c = m[0].length;
  return m.every((r) => r.length === c);
}

export function fromNumbers(rows: number[][]): Matrix {
  return rows.map((r) => r.map((v) => fromInt(v)));
}

// ---------- Text I/O ----------

export function parseMatrixText(text: string): Matrix {
  const rows = text
    .split(/\n+/)
    .map((r) => r.trim())
    .filter(Boolean);
  if (rows.length === 0) throw new Error("Empty matrix");
  const parsed = rows.map((r, i) => {
    // Cells are separated by tabs, commas, semicolons, or runs of 2+ spaces.
    // Single spaces inside a cell (e.g. "2 x" or "1 + a") are preserved.
    const cells = r.split(/\t+|,|;| {2,}/).map((c) => c.trim()).filter(Boolean);
    return cells.map((c) => {
      try { return parse(c); }
      catch (e) {
        throw new Error(`Row ${i + 1}: ${e instanceof Error ? e.message : "bad cell"} in "${c}"`);
      }
    });
  });
  if (!isRectangular(parsed)) throw new Error("All rows must have the same number of columns");
  return parsed;
}

export function matrixToText(m: Matrix): string {
  return m.map((r) => r.map((c) => stringifyShort(c)).join("\t")).join("\n");
}

// ---------- Operations ----------

export function multiply(a: Matrix, b: Matrix): Matrix {
  const ad = dims(a), bd = dims(b);
  if (ad.cols !== bd.rows) {
    throw new Error(
      `Cannot multiply: A is ${ad.rows}×${ad.cols}, B is ${bd.rows}×${bd.cols}. Columns of A must equal rows of B.`,
    );
  }
  const out = makeMatrix(ad.rows, bd.cols);
  for (let i = 0; i < ad.rows; i++) {
    for (let j = 0; j < bd.cols; j++) {
      let s: Expr = ZERO;
      for (let k = 0; k < ad.cols; k++) s = eAdd(s, eMul(a[i][k], b[k][j]));
      out[i][j] = s;
    }
  }
  return out;
}

export function add(a: Matrix, b: Matrix): Matrix {
  const ad = dims(a), bd = dims(b);
  if (ad.rows !== bd.rows || ad.cols !== bd.cols) throw new Error("Matrices must have the same dimensions");
  return a.map((row, i) => row.map((v, j) => eAdd(v, b[i][j])));
}

export function subtract(a: Matrix, b: Matrix): Matrix {
  const ad = dims(a), bd = dims(b);
  if (ad.rows !== bd.rows || ad.cols !== bd.cols) throw new Error("Matrices must have the same dimensions");
  return a.map((row, i) => row.map((v, j) => eSub(v, b[i][j])));
}

export function scalarMultiply(a: Matrix, s: Expr): Matrix {
  return a.map((row) => row.map((v) => eMul(v, s)));
}

export function transpose(a: Matrix): Matrix {
  const { rows, cols } = dims(a);
  const out = makeMatrix(cols, rows);
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) out[j][i] = a[i][j];
  return out;
}

// Determinant via Laplace cofactor expansion — works symbolically.
export function determinant(a: Matrix): Expr {
  const { rows, cols } = dims(a);
  if (rows !== cols) throw new Error("Determinant requires a square matrix");
  return detExpr(a);
}

function detExpr(m: Matrix): Expr {
  const n = m.length;
  if (n === 1) return m[0][0];
  if (n === 2) return eSub(eMul(m[0][0], m[1][1]), eMul(m[0][1], m[1][0]));
  // Cofactor expansion along the first row.
  let total: Expr = ZERO;
  for (let j = 0; j < n; j++) {
    if (isZero(m[0][j])) continue;
    const minor = m.slice(1).map((row) => row.filter((_, k) => k !== j));
    const cof = detExpr(minor);
    const term = eMul(m[0][j], cof);
    total = (j % 2 === 0) ? eAdd(total, term) : eSub(total, term);
  }
  return total;
}

// Matrix power (square, non-negative integer exponent).
export function matrixPower(a: Matrix, p: number): Matrix {
  const { rows, cols } = dims(a);
  if (rows !== cols) throw new Error("Power requires a square matrix");
  if (!Number.isInteger(p) || p < 0) throw new Error("Exponent must be a non-negative integer");
  if (p === 0) return identity(rows);
  let result = a;
  for (let i = 1; i < p; i++) result = multiply(result, a);
  return result;
}

export function identity(n: number): Matrix {
  const out = makeMatrix(n, n);
  for (let i = 0; i < n; i++) out[i][i] = ONE;
  return out;
}

export function trace(a: Matrix): Expr {
  const { rows, cols } = dims(a);
  if (rows !== cols) throw new Error("Trace requires a square matrix");
  let s: Expr = ZERO;
  for (let i = 0; i < rows; i++) s = eAdd(s, a[i][i]);
  return s;
}

// Rank via Gaussian elimination over Expr — only when matrix is fully numeric.
export function rank(a: Matrix): number {
  const { rows, cols } = dims(a);
  if (!isFullyNumeric(a)) throw new Error("Rank requires a fully numeric matrix");
  const m = a.map((r) => r.map((c) => asNumber(c) as number));
  const tol = 1e-10;
  let r = 0;
  for (let col = 0; col < cols && r < rows; col++) {
    let pivot = -1;
    let max = tol;
    for (let i = r; i < rows; i++) {
      if (Math.abs(m[i][col]) > max) { max = Math.abs(m[i][col]); pivot = i; }
    }
    if (pivot === -1) continue;
    [m[r], m[pivot]] = [m[pivot], m[r]];
    for (let i = r + 1; i < rows; i++) {
      const f = m[i][col] / m[r][col];
      for (let j = col; j < cols; j++) m[i][j] -= f * m[r][j];
    }
    r++;
  }
  return r;
}

// Inverse via Gauss-Jordan over Expr. Works symbolically for many cases.
export function inverse(a: Matrix): Matrix {
  const { rows, cols } = dims(a);
  if (rows !== cols) throw new Error("Inverse requires a square matrix");
  const n = rows;
  const m: Expr[][] = a.map((r, i) => [
    ...r,
    ...Array.from({ length: n }, (_, j) => (i === j ? ONE : ZERO)),
  ]);
  for (let i = 0; i < n; i++) {
    // pick pivot: prefer constant non-zero, then any non-zero
    let pivot = -1;
    let bestAbs = -1;
    for (let r = i; r < n; r++) {
      if (isZero(m[r][i])) continue;
      const num = asNumber(m[r][i]);
      const abs = num !== null ? Math.abs(num) : 0.5; // symbolic counts as nonzero
      if (abs > bestAbs) { bestAbs = abs; pivot = r; }
    }
    if (pivot === -1) throw new Error("Matrix is singular (no inverse)");
    if (pivot !== i) [m[i], m[pivot]] = [m[pivot], m[i]];
    const div = m[i][i];
    for (let c = 0; c < 2 * n; c++) m[i][c] = eDiv(m[i][c], div);
    for (let r = 0; r < n; r++) {
      if (r === i) continue;
      if (isZero(m[r][i])) continue;
      const f = m[r][i];
      for (let c = 0; c < 2 * n; c++) m[r][c] = eSub(m[r][c], eMul(f, m[i][c]));
    }
  }
  return m.map((r) => r.slice(n));
}

// ---------- Helpers ----------

export function isFullyNumeric(m: Matrix): boolean {
  return m.every((r) => r.every((c) => isConstant(c)));
}

export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  if (Math.abs(n) < 1e-10) return "0";
  const rounded = Math.round(n * 1e10) / 1e10;
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toString();
}

export function formatExpr(e: Expr): string {
  return stringifyShort(e);
}

// Re-export common Expr helpers so consumers don't need two imports.
export { ZERO, ONE, eAdd, eSub, eMul, eDiv, eNeg, asRational, asNumber, isConstant, isZero, parse as parseExpr };
