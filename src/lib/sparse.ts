export type SparseEntry = {
  row: number;
  col: number;
  value: number;
};

export type SparseMatrix = {
  rows: number;
  cols: number;
  entries: SparseEntry[];
};

export function parseNumericMatrixText(text: string): number[][] {
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) throw new Error("Matrix input is empty");
  const matrix = lines.map((line, idx) => {
    const cells = line
      .split(/[\s,;]+/)
      .map((cell) => cell.trim())
      .filter(Boolean);
    if (!cells.length) throw new Error(`Row ${idx + 1} is empty`);
    return cells.map((cell) => {
      const value = Number.parseFloat(cell);
      if (!Number.isFinite(value)) {
        throw new Error(`Row ${idx + 1} contains a non-numeric value: "${cell}"`);
      }
      return value;
    });
  });
  const cols = matrix[0].length;
  if (!matrix.every((row) => row.length === cols)) {
    throw new Error("All rows must have the same number of columns");
  }
  return matrix;
}

export function parseNumericVectorText(text: string): number[] {
  const cells = text
    .split(/[\s,;]+/)
    .map((cell) => cell.trim())
    .filter(Boolean);
  if (!cells.length) throw new Error("Vector input is empty");
  return cells.map((cell, idx) => {
    const value = Number.parseFloat(cell);
    if (!Number.isFinite(value))
      throw new Error(`Vector contains a non-numeric value at index ${idx + 1}: "${cell}"`);
    return value;
  });
}

export function denseToSparse(matrix: number[][], tolerance = 1e-12): SparseMatrix {
  const rows = matrix.length;
  const cols = matrix[0]?.length ?? 0;
  const entries: SparseEntry[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const value = matrix[r][c];
      if (Math.abs(value) > tolerance) entries.push({ row: r, col: c, value });
    }
  }
  return { rows, cols, entries };
}

export function sparseToDense(sparse: SparseMatrix): number[][] {
  const out = Array.from({ length: sparse.rows }, () =>
    Array.from({ length: sparse.cols }, () => 0),
  );
  for (const entry of sparse.entries) out[entry.row][entry.col] = entry.value;
  return out;
}

export function toCSR(sparse: SparseMatrix): {
  values: number[];
  colIndices: number[];
  rowPtr: number[];
} {
  const sorted = [...sparse.entries].sort((a, b) => a.row - b.row || a.col - b.col);
  const values: number[] = [];
  const colIndices: number[] = [];
  const rowPtr = Array.from({ length: sparse.rows + 1 }, () => 0);
  let cursor = 0;
  for (let row = 0; row < sparse.rows; row++) {
    rowPtr[row] = cursor;
    while (cursor < sorted.length && sorted[cursor].row === row) {
      values.push(sorted[cursor].value);
      colIndices.push(sorted[cursor].col);
      cursor++;
    }
  }
  rowPtr[sparse.rows] = sorted.length;
  return { values, colIndices, rowPtr };
}

export function toCSC(sparse: SparseMatrix): {
  values: number[];
  rowIndices: number[];
  colPtr: number[];
} {
  const sorted = [...sparse.entries].sort((a, b) => a.col - b.col || a.row - b.row);
  const values: number[] = [];
  const rowIndices: number[] = [];
  const colPtr = Array.from({ length: sparse.cols + 1 }, () => 0);
  let cursor = 0;
  for (let col = 0; col < sparse.cols; col++) {
    colPtr[col] = cursor;
    while (cursor < sorted.length && sorted[cursor].col === col) {
      values.push(sorted[cursor].value);
      rowIndices.push(sorted[cursor].row);
      cursor++;
    }
  }
  colPtr[sparse.cols] = sorted.length;
  return { values, rowIndices, colPtr };
}

export function addSparse(a: SparseMatrix, b: SparseMatrix, tolerance = 1e-12): SparseMatrix {
  if (a.rows !== b.rows || a.cols !== b.cols) {
    throw new Error("Sparse addition requires matching dimensions");
  }
  const accumulator = new Map<string, number>();
  const keyFor = (row: number, col: number) => `${row}:${col}`;
  for (const entry of a.entries) accumulator.set(keyFor(entry.row, entry.col), entry.value);
  for (const entry of b.entries) {
    const key = keyFor(entry.row, entry.col);
    accumulator.set(key, (accumulator.get(key) ?? 0) + entry.value);
  }
  const entries: SparseEntry[] = [];
  for (const [key, value] of accumulator.entries()) {
    if (Math.abs(value) <= tolerance) continue;
    const [rowText, colText] = key.split(":");
    entries.push({ row: Number.parseInt(rowText, 10), col: Number.parseInt(colText, 10), value });
  }
  entries.sort((x, y) => x.row - y.row || x.col - y.col);
  return { rows: a.rows, cols: a.cols, entries };
}

export function multiplySparse(a: SparseMatrix, b: SparseMatrix, tolerance = 1e-12): SparseMatrix {
  if (a.cols !== b.rows) {
    throw new Error("Sparse multiplication requires A.cols = B.rows");
  }
  const bByRow = new Map<number, SparseEntry[]>();
  for (const entry of b.entries) {
    const list = bByRow.get(entry.row) ?? [];
    list.push(entry);
    bByRow.set(entry.row, list);
  }
  const accumulator = new Map<string, number>();
  for (const entryA of a.entries) {
    const rowMatches = bByRow.get(entryA.col);
    if (!rowMatches) continue;
    for (const entryB of rowMatches) {
      const key = `${entryA.row}:${entryB.col}`;
      accumulator.set(key, (accumulator.get(key) ?? 0) + entryA.value * entryB.value);
    }
  }
  const entries: SparseEntry[] = [];
  for (const [key, value] of accumulator.entries()) {
    if (Math.abs(value) <= tolerance) continue;
    const [rowText, colText] = key.split(":");
    entries.push({ row: Number.parseInt(rowText, 10), col: Number.parseInt(colText, 10), value });
  }
  entries.sort((x, y) => x.row - y.row || x.col - y.col);
  return { rows: a.rows, cols: b.cols, entries };
}

export function sparseBandwidthProfile(sparse: SparseMatrix): {
  lowerBandwidth: number;
  upperBandwidth: number;
  bandwidth: number;
  profile: number;
  rowProfile: number[];
} {
  const firstNonZeroByRow = Array.from({ length: sparse.rows }, () => Number.POSITIVE_INFINITY);
  let lowerBandwidth = 0;
  let upperBandwidth = 0;
  for (const entry of sparse.entries) {
    const rowDistance = entry.row - entry.col;
    const colDistance = entry.col - entry.row;
    lowerBandwidth = Math.max(lowerBandwidth, rowDistance);
    upperBandwidth = Math.max(upperBandwidth, colDistance);
    firstNonZeroByRow[entry.row] = Math.min(firstNonZeroByRow[entry.row], entry.col);
  }

  const rowProfile = firstNonZeroByRow.map((first, row) => {
    if (!Number.isFinite(first)) return 0;
    return Math.max(0, row - first);
  });
  const profile = rowProfile.reduce((sum, value) => sum + value, 0);

  return {
    lowerBandwidth,
    upperBandwidth,
    bandwidth: lowerBandwidth + upperBandwidth + 1,
    profile,
    rowProfile,
  };
}

export function solveJacobiSparse(
  a: SparseMatrix,
  b: number[],
  maxIterations: number,
  tolerance: number,
): {
  converged: boolean;
  iterations: number;
  residualNorm: number;
  solution: number[];
  history: Array<{ iteration: number; residualNorm: number }>;
  note: string;
} {
  if (a.rows !== a.cols) throw new Error("Iterative solve requires a square matrix");
  if (b.length !== a.rows) throw new Error("Right-hand side vector length must match matrix rows");
  if (maxIterations < 1 || !Number.isInteger(maxIterations))
    throw new Error("Max iterations must be a positive integer");
  if (!(tolerance > 0)) throw new Error("Tolerance must be positive");

  const n = a.rows;
  const rows = Array.from({ length: n }, () => [] as SparseEntry[]);
  const diagonal = Array.from({ length: n }, () => 0);
  for (const entry of a.entries) {
    rows[entry.row].push(entry);
    if (entry.row === entry.col) diagonal[entry.row] = entry.value;
  }

  for (let i = 0; i < n; i++) {
    if (Math.abs(diagonal[i]) <= 1e-12) {
      throw new Error(`Jacobi iteration requires non-zero diagonal entries (row ${i + 1})`);
    }
  }

  const x = Array.from({ length: n }, () => 0);
  const next = Array.from({ length: n }, () => 0);
  const history: Array<{ iteration: number; residualNorm: number }> = [];
  let converged = false;

  for (let iter = 1; iter <= maxIterations; iter++) {
    for (let row = 0; row < n; row++) {
      let sigma = 0;
      for (const entry of rows[row]) {
        if (entry.col === row) continue;
        sigma += entry.value * x[entry.col];
      }
      next[row] = (b[row] - sigma) / diagonal[row];
    }

    const residual = computeResidualNorm(rows, next, b);
    history.push({ iteration: iter, residualNorm: residual });
    for (let i = 0; i < n; i++) x[i] = next[i];

    if (residual <= tolerance) {
      converged = true;
      break;
    }
  }

  const residualNorm = history.at(-1)?.residualNorm ?? Number.POSITIVE_INFINITY;
  const note = converged
    ? "Converged under the requested tolerance."
    : "Did not converge within the iteration budget. Consider scaling or reordering.";
  return { converged, iterations: history.length, residualNorm, solution: x, history, note };
}

function computeResidualNorm(rows: SparseEntry[][], x: number[], b: number[]): number {
  let sumSquares = 0;
  for (let row = 0; row < rows.length; row++) {
    let ax = 0;
    for (const entry of rows[row]) ax += entry.value * x[entry.col];
    const residual = b[row] - ax;
    sumSquares += residual * residual;
  }
  return Math.sqrt(sumSquares);
}
