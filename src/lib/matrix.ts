export type Matrix = number[][];

export function makeMatrix(rows: number, cols: number, fill = 0): Matrix {
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

export function parseMatrixText(text: string): Matrix {
  const rows = text
    .split(/\n+/)
    .map((r) => r.trim())
    .filter(Boolean);
  if (rows.length === 0) throw new Error("Empty matrix");
  const parsed = rows.map((r, i) => {
    const cells = r.split(/[\s,;\t]+/).filter(Boolean).map((c) => {
      const n = Number(c);
      if (!Number.isFinite(n)) throw new Error(`Row ${i + 1}: "${c}" is not a number`);
      return n;
    });
    return cells;
  });
  if (!isRectangular(parsed)) throw new Error("All rows must have the same number of columns");
  return parsed;
}

export function matrixToText(m: Matrix): string {
  return m.map((r) => r.join("\t")).join("\n");
}

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
      let s = 0;
      for (let k = 0; k < ad.cols; k++) s += a[i][k] * b[k][j];
      out[i][j] = s;
    }
  }
  return out;
}

export function add(a: Matrix, b: Matrix): Matrix {
  const ad = dims(a), bd = dims(b);
  if (ad.rows !== bd.rows || ad.cols !== bd.cols) throw new Error("Matrices must have the same dimensions");
  return a.map((row, i) => row.map((v, j) => v + b[i][j]));
}

export function subtract(a: Matrix, b: Matrix): Matrix {
  const ad = dims(a), bd = dims(b);
  if (ad.rows !== bd.rows || ad.cols !== bd.cols) throw new Error("Matrices must have the same dimensions");
  return a.map((row, i) => row.map((v, j) => v - b[i][j]));
}

export function scalarMultiply(a: Matrix, s: number): Matrix {
  return a.map((row) => row.map((v) => v * s));
}

export function transpose(a: Matrix): Matrix {
  const { rows, cols } = dims(a);
  const out = makeMatrix(cols, rows);
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) out[j][i] = a[i][j];
  return out;
}

export function determinant(a: Matrix): number {
  const { rows, cols } = dims(a);
  if (rows !== cols) throw new Error("Determinant requires a square matrix");
  const n = rows;
  // LU with partial pivoting
  const m = a.map((r) => r.slice());
  let det = 1;
  for (let i = 0; i < n; i++) {
    let pivot = i;
    for (let r = i + 1; r < n; r++) if (Math.abs(m[r][i]) > Math.abs(m[pivot][i])) pivot = r;
    if (Math.abs(m[pivot][i]) < 1e-12) return 0;
    if (pivot !== i) { [m[i], m[pivot]] = [m[pivot], m[i]]; det = -det; }
    det *= m[i][i];
    for (let r = i + 1; r < n; r++) {
      const f = m[r][i] / m[i][i];
      for (let c = i; c < n; c++) m[r][c] -= f * m[i][c];
    }
  }
  return det;
}

export function inverse(a: Matrix): Matrix {
  const { rows, cols } = dims(a);
  if (rows !== cols) throw new Error("Inverse requires a square matrix");
  const n = rows;
  const m = a.map((r, i) => [...r, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  for (let i = 0; i < n; i++) {
    let pivot = i;
    for (let r = i + 1; r < n; r++) if (Math.abs(m[r][i]) > Math.abs(m[pivot][i])) pivot = r;
    if (Math.abs(m[pivot][i]) < 1e-12) throw new Error("Matrix is singular (no inverse)");
    if (pivot !== i) [m[i], m[pivot]] = [m[pivot], m[i]];
    const div = m[i][i];
    for (let c = 0; c < 2 * n; c++) m[i][c] /= div;
    for (let r = 0; r < n; r++) {
      if (r === i) continue;
      const f = m[r][i];
      if (f === 0) continue;
      for (let c = 0; c < 2 * n; c++) m[r][c] -= f * m[i][c];
    }
  }
  return m.map((r) => r.slice(n));
}

export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  if (Math.abs(n) < 1e-10) return "0";
  const rounded = Math.round(n * 1e10) / 1e10;
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toString();
}
