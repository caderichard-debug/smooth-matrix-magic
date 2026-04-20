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

// RREF via Gauss-Jordan elimination — only when matrix is fully numeric.
export function rref(a: Matrix): Matrix {
  const { rows, cols } = dims(a);
  if (!isFullyNumeric(a)) throw new Error("RREF requires a fully numeric matrix");
  const m = a.map((r) => r.map((c) => asNumber(c) as number));
  const tol = 1e-10;
  let pivotRow = 0;

  for (let col = 0; col < cols && pivotRow < rows; col++) {
    let pivot = -1;
    let max = tol;
    for (let r = pivotRow; r < rows; r++) {
      const abs = Math.abs(m[r][col]);
      if (abs > max) {
        max = abs;
        pivot = r;
      }
    }
    if (pivot === -1) continue;

    if (pivot !== pivotRow) [m[pivotRow], m[pivot]] = [m[pivot], m[pivotRow]];

    const pv = m[pivotRow][col];
    for (let j = col; j < cols; j++) m[pivotRow][j] /= pv;
    m[pivotRow][col] = 1;

    for (let r = 0; r < rows; r++) {
      if (r === pivotRow) continue;
      const f = m[r][col];
      if (Math.abs(f) <= tol) {
        m[r][col] = 0;
        continue;
      }
      for (let j = col; j < cols; j++) m[r][j] -= f * m[pivotRow][j];
      m[r][col] = 0;
    }

    pivotRow++;
  }

  return m.map((row) => row.map((value) => {
    const n = Math.abs(value) < tol ? 0 : value;
    const nearestInt = Math.round(n);
    if (Math.abs(n - nearestInt) < tol) return fromInt(nearestInt);
    return parse(formatNumber(n));
  }));
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

export type LinearSystemClassification = "unique" | "infinite" | "none";

export type LinearSystemSolution = {
  classification: LinearSystemClassification;
  particularSolution: Matrix | null;
  rrefAugmented: Matrix;
};

export type CharPolyResult = {
  expression: string;
  coefficients: number[];
};

function requireSquare(a: Matrix, label: string): number {
  const { rows, cols } = dims(a);
  if (rows !== cols) throw new Error(`${label} requires a square matrix`);
  return rows;
}

function toNumericMatrix(a: Matrix, context: string): number[][] {
  if (!isFullyNumeric(a)) throw new Error(`${context} requires a fully numeric matrix`);
  return a.map((row) => row.map((value) => asNumber(value) as number));
}

function toExprMatrix(a: number[][], tol = 1e-10): Matrix {
  return a.map((row) => row.map((value) => {
    const n = Math.abs(value) < tol ? 0 : value;
    const nearestInt = Math.round(n);
    if (Math.abs(n - nearestInt) < tol) return fromInt(nearestInt);
    return parse(formatNumber(n));
  }));
}

export function hadamardProduct(a: Matrix, b: Matrix): Matrix {
  const ad = dims(a);
  const bd = dims(b);
  if (ad.rows !== bd.rows || ad.cols !== bd.cols) {
    throw new Error("Hadamard product requires matrices with the same dimensions");
  }
  return a.map((row, i) => row.map((value, j) => eMul(value, b[i][j])));
}

export function kroneckerProduct(a: Matrix, b: Matrix): Matrix {
  const ad = dims(a);
  const bd = dims(b);
  const out = makeMatrix(ad.rows * bd.rows, ad.cols * bd.cols);
  for (let i = 0; i < ad.rows; i++) {
    for (let j = 0; j < ad.cols; j++) {
      for (let bi = 0; bi < bd.rows; bi++) {
        for (let bj = 0; bj < bd.cols; bj++) {
          out[i * bd.rows + bi][j * bd.cols + bj] = eMul(a[i][j], b[bi][bj]);
        }
      }
    }
  }
  return out;
}

export function directSum(a: Matrix, b: Matrix): Matrix {
  const ad = dims(a);
  const bd = dims(b);
  const out = makeMatrix(ad.rows + bd.rows, ad.cols + bd.cols);
  for (let i = 0; i < ad.rows; i++) {
    for (let j = 0; j < ad.cols; j++) out[i][j] = a[i][j];
  }
  for (let i = 0; i < bd.rows; i++) {
    for (let j = 0; j < bd.cols; j++) out[ad.rows + i][ad.cols + j] = b[i][j];
  }
  return out;
}

export function commutator(a: Matrix, b: Matrix): Matrix {
  const ad = dims(a);
  const bd = dims(b);
  if (ad.rows !== ad.cols || bd.rows !== bd.cols) {
    throw new Error("Commutator requires square matrices");
  }
  if (ad.rows !== bd.rows) {
    throw new Error("Commutator requires matrices of the same dimensions");
  }
  return subtract(multiply(a, b), multiply(b, a));
}

export function anticommutator(a: Matrix, b: Matrix): Matrix {
  const ad = dims(a);
  const bd = dims(b);
  if (ad.rows !== ad.cols || bd.rows !== bd.cols) {
    throw new Error("Anticommutator requires square matrices");
  }
  if (ad.rows !== bd.rows) {
    throw new Error("Anticommutator requires matrices of the same dimensions");
  }
  return add(multiply(a, b), multiply(b, a));
}

export function luDecomposition(a: Matrix): { l: Matrix; u: Matrix } {
  const n = requireSquare(a, "LU decomposition");
  const m = toNumericMatrix(a, "LU decomposition");
  const l = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  );
  const u = Array.from({ length: n }, () => Array.from({ length: n }, () => 0));
  const tol = 1e-10;

  for (let i = 0; i < n; i++) {
    for (let k = i; k < n; k++) {
      let sum = 0;
      for (let j = 0; j < i; j++) sum += l[i][j] * u[j][k];
      u[i][k] = m[i][k] - sum;
    }
    if (Math.abs(u[i][i]) < tol) {
      throw new Error("LU decomposition failed: zero pivot encountered (pivoting not implemented)");
    }
    for (let k = i + 1; k < n; k++) {
      let sum = 0;
      for (let j = 0; j < i; j++) sum += l[k][j] * u[j][i];
      l[k][i] = (m[k][i] - sum) / u[i][i];
    }
  }

  return { l: toExprMatrix(l), u: toExprMatrix(u) };
}

export function qrDecomposition(a: Matrix): { q: Matrix; r: Matrix } {
  const numeric = toNumericMatrix(a, "QR decomposition");
  const { rows, cols } = dims(a);
  const tol = 1e-10;
  const qCols: number[][] = [];
  const r = Array.from({ length: cols }, () => Array.from({ length: cols }, () => 0));

  const getColumn = (j: number) => numeric.map((row) => row[j]);
  const dot = (u: number[], v: number[]) => u.reduce((s, x, i) => s + x * v[i], 0);
  const norm = (v: number[]) => Math.sqrt(dot(v, v));

  for (let j = 0; j < cols; j++) {
    const v = getColumn(j).slice();
    for (let i = 0; i < qCols.length; i++) {
      const proj = dot(qCols[i], getColumn(j));
      r[i][j] = proj;
      for (let k = 0; k < rows; k++) v[k] -= proj * qCols[i][k];
    }
    const vNorm = norm(v);
    if (vNorm < tol) throw new Error("QR decomposition failed: columns are linearly dependent");
    r[j][j] = vNorm;
    const qCol = v.map((x) => x / vNorm);
    qCols.push(qCol);
  }

  const q = Array.from({ length: rows }, (_, i) =>
    Array.from({ length: cols }, (_, j) => qCols[j][i]),
  );
  return { q: toExprMatrix(q), r: toExprMatrix(r) };
}

export function gramSchmidtOrthogonalization(a: Matrix): Matrix {
  const numeric = toNumericMatrix(a, "Gram-Schmidt orthogonalization");
  const { rows, cols } = dims(a);
  const tol = 1e-10;
  const orthonormalCols: number[][] = [];

  const getColumn = (j: number) => numeric.map((row) => row[j]);
  const dot = (u: number[], v: number[]) => u.reduce((s, x, i) => s + x * v[i], 0);
  const norm = (v: number[]) => Math.sqrt(dot(v, v));

  for (let j = 0; j < cols; j++) {
    const v = getColumn(j).slice();
    for (const basis of orthonormalCols) {
      const proj = dot(v, basis);
      for (let i = 0; i < rows; i++) v[i] -= proj * basis[i];
    }
    const vNorm = norm(v);
    if (vNorm < tol) throw new Error("Gram-Schmidt failed: vectors are linearly dependent");
    orthonormalCols.push(v.map((x) => x / vNorm));
  }

  const out = Array.from({ length: rows }, (_, i) =>
    Array.from({ length: cols }, (_, j) => orthonormalCols[j][i]),
  );
  return toExprMatrix(out);
}

export function solveLinearSystem(a: Matrix, b: Matrix): LinearSystemSolution {
  const ad = dims(a);
  const bd = dims(b);
  if (bd.cols !== 1 || bd.rows !== ad.rows) {
    throw new Error("For Ax=b, b must be a single-column matrix with the same number of rows as A");
  }
  const aNum = toNumericMatrix(a, "Linear system solver");
  const bNum = toNumericMatrix(b, "Linear system solver");
  const rows = ad.rows;
  const cols = ad.cols;
  const tol = 1e-10;
  const aug = aNum.map((row, i) => [...row, bNum[i][0]]);
  let pivotRow = 0;
  const pivotCols: number[] = [];

  for (let col = 0; col < cols && pivotRow < rows; col++) {
    let pivot = -1;
    let maxAbs = tol;
    for (let r = pivotRow; r < rows; r++) {
      const abs = Math.abs(aug[r][col]);
      if (abs > maxAbs) {
        maxAbs = abs;
        pivot = r;
      }
    }
    if (pivot === -1) continue;
    if (pivot !== pivotRow) [aug[pivotRow], aug[pivot]] = [aug[pivot], aug[pivotRow]];

    const pv = aug[pivotRow][col];
    for (let j = col; j <= cols; j++) aug[pivotRow][j] /= pv;
    for (let r = 0; r < rows; r++) {
      if (r === pivotRow) continue;
      const f = aug[r][col];
      if (Math.abs(f) < tol) continue;
      for (let j = col; j <= cols; j++) aug[r][j] -= f * aug[pivotRow][j];
    }
    pivotCols.push(col);
    pivotRow++;
  }

  for (let r = 0; r < rows; r++) {
    let coeffZero = true;
    for (let c = 0; c < cols; c++) {
      if (Math.abs(aug[r][c]) > tol) {
        coeffZero = false;
        break;
      }
    }
    if (coeffZero && Math.abs(aug[r][cols]) > tol) {
      return { classification: "none", particularSolution: null, rrefAugmented: toExprMatrix(aug) };
    }
  }

  if (pivotCols.length < cols) {
    return { classification: "infinite", particularSolution: null, rrefAugmented: toExprMatrix(aug) };
  }

  const solution = Array.from({ length: cols }, (_, i) => [aug[i][cols]]);
  return {
    classification: "unique",
    particularSolution: toExprMatrix(solution),
    rrefAugmented: toExprMatrix(aug),
  };
}

export function characteristicPolynomial(a: Matrix): CharPolyResult {
  const n = requireSquare(a, "Characteristic polynomial");
  const m = toNumericMatrix(a, "Characteristic polynomial");
  const tol = 1e-10;
  if (n < 1 || n > 3) throw new Error("Characteristic polynomial currently supports only 1x1 to 3x3 matrices");

  if (n === 1) {
    const a11 = m[0][0];
    return { expression: `lambda - (${formatNumber(a11)})`, coefficients: [1, -a11] };
  }
  if (n === 2) {
    const tr = m[0][0] + m[1][1];
    const det = m[0][0] * m[1][1] - m[0][1] * m[1][0];
    return {
      expression: `lambda^2 - (${formatNumber(tr)})lambda + (${formatNumber(det)})`,
      coefficients: [1, -tr, det],
    };
  }

  const tr = m[0][0] + m[1][1] + m[2][2];
  const a2 = multiplyNumberMatrices(m, m);
  const trA2 = a2[0][0] + a2[1][1] + a2[2][2];
  const c2 = 0.5 * (tr * tr - trA2);
  const det = det3(m);
  return {
    expression: `lambda^3 - (${formatNumber(tr)})lambda^2 + (${formatNumber(c2)})lambda - (${formatNumber(det)})`,
    coefficients: [1, -tr, c2, -det],
  };

  function det3(x: number[][]): number {
    return (
      x[0][0] * (x[1][1] * x[2][2] - x[1][2] * x[2][1]) -
      x[0][1] * (x[1][0] * x[2][2] - x[1][2] * x[2][0]) +
      x[0][2] * (x[1][0] * x[2][1] - x[1][1] * x[2][0])
    );
  }
  function multiplyNumberMatrices(x: number[][], y: number[][]): number[][] {
    return x.map((row, i) =>
      y[0].map((_, j) =>
        row.reduce((sum, v, k) => sum + v * y[k][j], 0),
      ),
    );
  }
}

export function eigenvaluesNumeric(a: Matrix): number[] {
  const n = requireSquare(a, "Eigenvalues");
  const m = toNumericMatrix(a, "Eigenvalues");
  const tol = 1e-10;
  if (n === 1) return [m[0][0]];
  if (n === 2) {
    const tr = m[0][0] + m[1][1];
    const det = m[0][0] * m[1][1] - m[0][1] * m[1][0];
    const disc = tr * tr - 4 * det;
    if (disc < -tol) throw new Error("Eigenvalues are complex for this matrix; only real numeric eigenvalues are supported");
    const root = Math.sqrt(Math.max(0, disc));
    return [(tr + root) / 2, (tr - root) / 2];
  }
  if (n === 3) {
    const maxIters = 150;
    const t = m.map((row) => row.slice());
    for (let iter = 0; iter < maxIters; iter++) {
      const { q, r } = qrNumeric(t);
      const next = multiplyNumeric(r, q);
      let offDiag = 0;
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          if (i !== j) offDiag += Math.abs(next[i][j]);
        }
      }
      for (let i = 0; i < n; i++) t[i] = next[i];
      if (offDiag < 1e-8) break;
    }
    return [t[0][0], t[1][1], t[2][2]];
  }
  throw new Error("Eigenvalues currently support only 1x1, 2x2, and 3x3 matrices");

  function qrNumeric(x: number[][]): { q: number[][]; r: number[][] } {
    const rows = x.length;
    const cols = x[0].length;
    const qCols: number[][] = [];
    const r = Array.from({ length: cols }, () => Array.from({ length: cols }, () => 0));
    const getCol = (j: number) => x.map((row) => row[j]);
    const dot = (u: number[], v: number[]) => u.reduce((s, val, i) => s + val * v[i], 0);
    const norm = (v: number[]) => Math.sqrt(dot(v, v));

    for (let j = 0; j < cols; j++) {
      const col = getCol(j);
      const v = col.slice();
      for (let i = 0; i < qCols.length; i++) {
        const proj = dot(qCols[i], col);
        r[i][j] = proj;
        for (let k = 0; k < rows; k++) v[k] -= proj * qCols[i][k];
      }
      const vNorm = norm(v);
      if (vNorm < 1e-12) throw new Error("Eigenvalue iteration failed: matrix appears defective for this numeric method");
      r[j][j] = vNorm;
      qCols.push(v.map((val) => val / vNorm));
    }

    const q = Array.from({ length: rows }, (_, i) =>
      Array.from({ length: cols }, (_, j) => qCols[j][i]),
    );
    return { q, r };
  }

  function multiplyNumeric(x: number[][], y: number[][]): number[][] {
    return x.map((row, i) =>
      y[0].map((_, j) =>
        row.reduce((sum, value, k) => sum + value * y[k][j], 0),
      ),
    );
  }
}

export function nullSpaceBasis(a: Matrix): Matrix[] {
  const numeric = toNumericMatrix(a, "Null space basis");
  const rows = numeric.length;
  const cols = numeric[0]?.length ?? 0;
  const tol = 1e-10;
  const m = numeric.map((row) => row.slice());
  const pivotCols: number[] = [];
  let pivotRow = 0;

  for (let col = 0; col < cols && pivotRow < rows; col++) {
    let pivot = -1;
    let maxAbs = tol;
    for (let r = pivotRow; r < rows; r++) {
      const abs = Math.abs(m[r][col]);
      if (abs > maxAbs) {
        maxAbs = abs;
        pivot = r;
      }
    }
    if (pivot === -1) continue;
    if (pivot !== pivotRow) [m[pivotRow], m[pivot]] = [m[pivot], m[pivotRow]];
    const pv = m[pivotRow][col];
    for (let j = col; j < cols; j++) m[pivotRow][j] /= pv;
    for (let r = 0; r < rows; r++) {
      if (r === pivotRow) continue;
      const f = m[r][col];
      if (Math.abs(f) < tol) continue;
      for (let j = col; j < cols; j++) m[r][j] -= f * m[pivotRow][j];
    }
    pivotCols.push(col);
    pivotRow++;
  }

  const freeCols = Array.from({ length: cols }, (_, c) => c).filter((c) => !pivotCols.includes(c));
  if (freeCols.length === 0) return [];

  return freeCols.map((freeCol) => {
    const vec = Array.from({ length: cols }, () => [0]);
    vec[freeCol][0] = 1;
    for (let r = 0; r < pivotCols.length; r++) {
      const pCol = pivotCols[r];
      vec[pCol][0] = -m[r][freeCol];
    }
    return toExprMatrix(vec);
  });
}

export function columnSpaceBasis(a: Matrix): Matrix[] {
  const numeric = toNumericMatrix(a, "Column space basis");
  const rows = numeric.length;
  const cols = numeric[0]?.length ?? 0;
  const tol = 1e-10;
  const m = numeric.map((row) => row.slice());
  const pivotCols: number[] = [];
  let pivotRow = 0;

  for (let col = 0; col < cols && pivotRow < rows; col++) {
    let pivot = -1;
    let maxAbs = tol;
    for (let r = pivotRow; r < rows; r++) {
      const abs = Math.abs(m[r][col]);
      if (abs > maxAbs) {
        maxAbs = abs;
        pivot = r;
      }
    }
    if (pivot === -1) continue;
    if (pivot !== pivotRow) [m[pivotRow], m[pivot]] = [m[pivot], m[pivotRow]];
    const pv = m[pivotRow][col];
    for (let j = col; j < cols; j++) m[pivotRow][j] /= pv;
    for (let r = pivotRow + 1; r < rows; r++) {
      const f = m[r][col];
      if (Math.abs(f) < tol) continue;
      for (let j = col; j < cols; j++) m[r][j] -= f * m[pivotRow][j];
    }
    pivotCols.push(col);
    pivotRow++;
  }

  return pivotCols.map((col) => toExprMatrix(numeric.map((row) => [row[col]])));
}

export function matrixExponential(a: Matrix, terms = 20): Matrix {
  const n = requireSquare(a, "Matrix exponential");
  if (!Number.isInteger(terms) || terms < 1) throw new Error("Matrix exponential requires a positive integer number of terms");
  const numeric = toNumericMatrix(a, "Matrix exponential");

  const identityNum = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  );
  const zeroNum = Array.from({ length: n }, () => Array.from({ length: n }, () => 0));

  let result = identityNum.map((row) => row.slice());
  let currentPower = identityNum.map((row) => row.slice());
  let factorial = 1;

  for (let k = 1; k <= terms; k++) {
    currentPower = multiplyNum(currentPower, numeric);
    factorial *= k;
    result = addNum(result, scaleNum(currentPower, 1 / factorial));
  }
  return toExprMatrix(result);

  function multiplyNum(x: number[][], y: number[][]): number[][] {
    const out = zeroNum.map((row) => row.slice());
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        let sum = 0;
        for (let k = 0; k < n; k++) sum += x[i][k] * y[k][j];
        out[i][j] = sum;
      }
    }
    return out;
  }
  function scaleNum(x: number[][], s: number): number[][] {
    return x.map((row) => row.map((v) => v * s));
  }
  function addNum(x: number[][], y: number[][]): number[][] {
    return x.map((row, i) => row.map((v, j) => v + y[i][j]));
  }
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
