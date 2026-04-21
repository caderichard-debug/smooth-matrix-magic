import type { Matrix } from "./matrix";
import { asNumber, formatNumber, isFullyNumeric, parseExpr } from "./matrix";

/** Max height/width for feature maps in ML demo routes (browser-friendly). */
export const ML_MAX_INPUT_DIM = 16;
/** Max kernel height/width. */
export const ML_MAX_KERNEL_DIM = 7;

export function matrixToGrid(m: Matrix, context: string): number[][] {
  if (m.length === 0 || (m[0] && m[0].length === 0)) {
    throw new Error(`${context}: matrix is empty.`);
  }
  if (!isFullyNumeric(m)) {
    throw new Error(`${context}: all entries must be numeric constants.`);
  }
  const w = m[0].length;
  for (const row of m) {
    if (row.length !== w) {
      throw new Error(`${context}: rows must have equal length.`);
    }
  }
  return m.map((row) => row.map((cell) => asNumber(cell) as number));
}

export function gridToMatrix(grid: number[][]): Matrix {
  return grid.map((row) => row.map((v) => parseExpr(formatNumber(v))));
}

function flip2d(a: number[][]): number[][] {
  return a
    .slice()
    .reverse()
    .map((r) => [...r].reverse());
}

function pad2d(grid: number[][], p: number): number[][] {
  if (p === 0) {
    return grid.map((r) => r.slice());
  }
  const H = grid.length;
  const W = grid[0].length;
  const Hp = H + 2 * p;
  const Wp = W + 2 * p;
  const out = Array.from({ length: Hp }, () => Array<number>(Wp).fill(0));
  for (let i = 0; i < H; i++) {
    for (let j = 0; j < W; j++) {
      out[i + p][j + p] = grid[i][j];
    }
  }
  return out;
}

function assertRectangular(grid: number[][], name: string): { h: number; w: number } {
  const h = grid.length;
  const w = grid[0]?.length ?? 0;
  if (h === 0 || w === 0) {
    throw new Error(`${name} is empty.`);
  }
  for (const row of grid) {
    if (row.length !== w) {
      throw new Error(`${name} rows must have equal length.`);
    }
  }
  return { h, w };
}

function assertFiniteNumericGrid(grid: number[][], name: string): { h: number; w: number } {
  const { h, w } = assertRectangular(grid, name);
  for (let i = 0; i < h; i++) {
    for (let j = 0; j < w; j++) {
      if (!Number.isFinite(grid[i][j])) {
        throw new Error(`${name} must contain only finite numbers.`);
      }
    }
  }
  return { h, w };
}

function matMul(a: number[][], b: number[][]): number[][] {
  const { h: aRows, w: aCols } = assertFiniteNumericGrid(a, "Left matrix");
  const { h: bRows, w: bCols } = assertFiniteNumericGrid(b, "Right matrix");
  if (aCols !== bRows) {
    throw new Error(
      `Matrix multiply shape mismatch: left is ${aRows}x${aCols} but right is ${bRows}x${bCols}.`,
    );
  }
  const out = Array.from({ length: aRows }, () => Array<number>(bCols).fill(0));
  for (let i = 0; i < aRows; i++) {
    for (let k = 0; k < aCols; k++) {
      const aik = a[i][k];
      for (let j = 0; j < bCols; j++) {
        out[i][j] += aik * b[k][j];
      }
    }
  }
  return out;
}

function transpose(a: number[][]): number[][] {
  const { h, w } = assertFiniteNumericGrid(a, "Matrix");
  return Array.from({ length: w }, (_, j) => Array.from({ length: h }, (_, i) => a[i][j]));
}

export function linearForward(x: number[][], w: number[][], b?: number[]): number[][] {
  const { h: batch, w: inFeatures } = assertFiniteNumericGrid(x, "X");
  const { h: weightRows, w: outFeatures } = assertFiniteNumericGrid(w, "W");
  if (inFeatures !== weightRows) {
    throw new Error(
      `Shape mismatch: X is ${batch}x${inFeatures} but W is ${weightRows}x${outFeatures}.`,
    );
  }

  const y = matMul(x, w);
  if (b === undefined) {
    return y;
  }
  if (b.length !== outFeatures) {
    throw new Error(
      `Bias shape mismatch: expected b to have length ${outFeatures}, got ${b.length}.`,
    );
  }
  for (let i = 0; i < b.length; i++) {
    if (!Number.isFinite(b[i])) {
      throw new Error("b must contain only finite numbers.");
    }
  }
  return y.map((row) => row.map((v, j) => v + b[j]));
}

export function linearBackward(
  x: number[][],
  w: number[][],
  dY: number[][],
): { dW: number[][]; dX: number[][]; db: number[] } {
  const { h: batch, w: inFeatures } = assertFiniteNumericGrid(x, "X");
  const { h: weightRows, w: outFeatures } = assertFiniteNumericGrid(w, "W");
  const { h: dyRows, w: dyCols } = assertFiniteNumericGrid(dY, "dY");

  if (inFeatures !== weightRows) {
    throw new Error(
      `Shape mismatch: X is ${batch}x${inFeatures} but W is ${weightRows}x${outFeatures}.`,
    );
  }
  if (dyRows !== batch || dyCols !== outFeatures) {
    throw new Error(
      `Shape mismatch: dY is ${dyRows}x${dyCols} but expected ${batch}x${outFeatures} to match XW output.`,
    );
  }

  const dW = matMul(transpose(x), dY);
  const dX = matMul(dY, transpose(w));
  const db = Array<number>(outFeatures).fill(0);
  for (let i = 0; i < dyRows; i++) {
    for (let j = 0; j < outFeatures; j++) {
      db[j] += dY[i][j];
    }
  }
  return { dW, dX, db };
}

function assertFiniteRectangular(grid: number[][], name: string): { h: number; w: number } {
  const dims = assertRectangular(grid, name);
  for (const row of grid) {
    for (const v of row) {
      if (!Number.isFinite(v)) {
        throw new Error(`${name} must contain only finite numbers.`);
      }
    }
  }
  return dims;
}

function assertPositiveEps(eps: number): void {
  if (!Number.isFinite(eps) || eps <= 0) {
    throw new Error("eps must be a positive finite number.");
  }
}

/**
 * 2D cross-correlation (sliding dot product): output[y,x] = sum_ij I'[y*s+i,x*s+j] * K[i,j]
 * where I' is zero-padded input.
 */
export function correlate2d(
  input: number[][],
  kernel: number[][],
  stride: number,
  pad: number,
): number[][] {
  if (!Number.isInteger(stride) || stride < 1) {
    throw new Error("Stride must be a positive integer.");
  }
  if (!Number.isInteger(pad) || pad < 0) {
    throw new Error("Padding must be a non-negative integer.");
  }
  const { h: H, w: W } = assertRectangular(input, "Feature map");
  const { h: kh, w: kw } = assertRectangular(kernel, "Kernel");
  if (H > ML_MAX_INPUT_DIM || W > ML_MAX_INPUT_DIM) {
    throw new Error(`Feature map exceeds ${ML_MAX_INPUT_DIM}×${ML_MAX_INPUT_DIM} cap.`);
  }
  if (kh > ML_MAX_KERNEL_DIM || kw > ML_MAX_KERNEL_DIM) {
    throw new Error(`Kernel exceeds ${ML_MAX_KERNEL_DIM}×${ML_MAX_KERNEL_DIM} cap.`);
  }
  const padded = pad2d(input, pad);
  const Hp = padded.length;
  const Wp = padded[0].length;
  if (Hp < kh || Wp < kw) {
    throw new Error(
      "After padding, the map is still smaller than the kernel. Increase padding or shrink the kernel.",
    );
  }
  const outH = Math.floor((Hp - kh) / stride) + 1;
  const outW = Math.floor((Wp - kw) / stride) + 1;
  const out: number[][] = [];
  for (let y = 0; y < outH; y++) {
    const row: number[] = [];
    for (let x = 0; x < outW; x++) {
      const sy = y * stride;
      const sx = x * stride;
      let acc = 0;
      for (let i = 0; i < kh; i++) {
        for (let j = 0; j < kw; j++) {
          acc += padded[sy + i][sx + j] * kernel[i][j];
        }
      }
      row.push(acc);
    }
    out.push(row);
  }
  return out;
}

/** True 2D convolution: correlate with spatially flipped kernel. */
export function convolve2d(
  input: number[][],
  kernel: number[][],
  stride: number,
  pad: number,
): number[][] {
  return correlate2d(input, flip2d(kernel), stride, pad);
}

function dilateKernel2d(kernel: number[][], dilation: number): number[][] {
  const { h: kh, w: kw } = assertRectangular(kernel, "Kernel");
  if (!Number.isInteger(dilation) || dilation < 1) {
    throw new Error("Dilation must be a positive integer.");
  }
  if (dilation === 1) {
    return kernel.map((row) => row.slice());
  }
  const outH = (kh - 1) * dilation + 1;
  const outW = (kw - 1) * dilation + 1;
  const out = Array.from({ length: outH }, () => Array<number>(outW).fill(0));
  for (let i = 0; i < kh; i++) {
    for (let j = 0; j < kw; j++) {
      out[i * dilation][j * dilation] = kernel[i][j];
    }
  }
  return out;
}

/** True 2D convolution with dilation (atrous convolution). */
export function dilatedConvolve2d(
  input: number[][],
  kernel: number[][],
  stride: number,
  pad: number,
  dilation: number,
): number[][] {
  const dilatedKernel = dilateKernel2d(kernel, dilation);
  return convolve2d(input, dilatedKernel, stride, pad);
}

export type SeparableConvResult = {
  depthwise: number[][];
  output: number[][];
};

/**
 * Educational single-channel depthwise + pointwise separable convolution.
 * depthwise = dilated convolve over spatial grid, output = pointwiseWeight * depthwise + pointwiseBias.
 */
export function separableConvolve2d(
  input: number[][],
  depthwiseKernel: number[][],
  pointwiseWeight: number,
  pointwiseBias = 0,
  stride = 1,
  pad = 0,
  dilation = 1,
): SeparableConvResult {
  if (!Number.isFinite(pointwiseWeight)) {
    throw new Error("Pointwise weight must be a finite number.");
  }
  if (!Number.isFinite(pointwiseBias)) {
    throw new Error("Pointwise bias must be a finite number.");
  }
  const depthwise = dilatedConvolve2d(input, depthwiseKernel, stride, pad, dilation);
  const output = depthwise.map((row) => row.map((v) => pointwiseWeight * v + pointwiseBias));
  return { depthwise, output };
}

export type TransposedConvSizeResult = {
  input: number;
  kernel: number;
  stride: number;
  pad: number;
  dilation: number;
  outputPadding: number;
  effectiveKernel: number;
  output: number;
};

export function transposedConv1dOutputSize(
  input: number,
  kernel: number,
  stride: number,
  pad: number,
  dilation = 1,
  outputPadding = 0,
): TransposedConvSizeResult {
  for (const [value, label] of [
    [input, "Input size"],
    [kernel, "Kernel size"],
    [stride, "Stride"],
    [dilation, "Dilation"],
  ] as const) {
    if (!Number.isInteger(value) || value < 1) {
      throw new Error(`${label} must be a positive integer.`);
    }
  }
  if (!Number.isInteger(pad) || pad < 0) {
    throw new Error("Padding must be a non-negative integer.");
  }
  if (!Number.isInteger(outputPadding) || outputPadding < 0) {
    throw new Error("Output padding must be a non-negative integer.");
  }
  if (outputPadding >= stride || outputPadding >= dilation) {
    throw new Error("Output padding must be smaller than both stride and dilation.");
  }
  const effectiveKernel = dilation * (kernel - 1) + 1;
  const output = (input - 1) * stride - 2 * pad + effectiveKernel + outputPadding;
  if (output < 1) {
    throw new Error("Transposed convolution output size is non-positive; adjust parameters.");
  }
  return {
    input,
    kernel,
    stride,
    pad,
    dilation,
    outputPadding,
    effectiveKernel,
    output,
  };
}

export type TransposedConv2dSizeResult = {
  height: TransposedConvSizeResult;
  width: TransposedConvSizeResult;
  outputHeight: number;
  outputWidth: number;
};

export function transposedConv2dOutputShape(
  inputH: number,
  inputW: number,
  kernelH: number,
  kernelW: number,
  strideH: number,
  strideW: number,
  padH: number,
  padW: number,
  dilationH = 1,
  dilationW = 1,
  outputPadH = 0,
  outputPadW = 0,
): TransposedConv2dSizeResult {
  const height = transposedConv1dOutputSize(inputH, kernelH, strideH, padH, dilationH, outputPadH);
  const width = transposedConv1dOutputSize(inputW, kernelW, strideW, padW, dilationW, outputPadW);
  return {
    height,
    width,
    outputHeight: height.output,
    outputWidth: width.output,
  };
}

export function maxPool2d(
  input: number[][],
  poolH: number,
  poolW: number,
  strideH: number,
  strideW: number,
): number[][] {
  if (!Number.isInteger(poolH) || !Number.isInteger(poolW) || poolH < 1 || poolW < 1) {
    throw new Error("Pool height and width must be positive integers.");
  }
  if (!Number.isInteger(strideH) || !Number.isInteger(strideW) || strideH < 1 || strideW < 1) {
    throw new Error("Strides must be positive integers.");
  }
  const { h: H, w: W } = assertRectangular(input, "Feature map");
  if (H > ML_MAX_INPUT_DIM || W > ML_MAX_INPUT_DIM) {
    throw new Error(`Feature map exceeds ${ML_MAX_INPUT_DIM}×${ML_MAX_INPUT_DIM} cap.`);
  }
  if (H < poolH || W < poolW) {
    throw new Error("Pool window is larger than the feature map.");
  }
  const outH = Math.floor((H - poolH) / strideH) + 1;
  const outW = Math.floor((W - poolW) / strideW) + 1;
  const out: number[][] = [];
  for (let y = 0; y < outH; y++) {
    const row: number[] = [];
    for (let x = 0; x < outW; x++) {
      const sy = y * strideH;
      const sx = x * strideW;
      let mx = -Infinity;
      for (let i = 0; i < poolH; i++) {
        for (let j = 0; j < poolW; j++) {
          const v = input[sy + i][sx + j];
          if (v > mx) mx = v;
        }
      }
      row.push(mx);
    }
    out.push(row);
  }
  return out;
}

export function avgPool2d(
  input: number[][],
  poolH: number,
  poolW: number,
  strideH: number,
  strideW: number,
): number[][] {
  if (!Number.isInteger(poolH) || !Number.isInteger(poolW) || poolH < 1 || poolW < 1) {
    throw new Error("Pool height and width must be positive integers.");
  }
  if (!Number.isInteger(strideH) || !Number.isInteger(strideW) || strideH < 1 || strideW < 1) {
    throw new Error("Strides must be positive integers.");
  }
  const { h: H, w: W } = assertRectangular(input, "Feature map");
  if (H > ML_MAX_INPUT_DIM || W > ML_MAX_INPUT_DIM) {
    throw new Error(`Feature map exceeds ${ML_MAX_INPUT_DIM}×${ML_MAX_INPUT_DIM} cap.`);
  }
  if (H < poolH || W < poolW) {
    throw new Error("Pool window is larger than the feature map.");
  }
  const area = poolH * poolW;
  const outH = Math.floor((H - poolH) / strideH) + 1;
  const outW = Math.floor((W - poolW) / strideW) + 1;
  const out: number[][] = [];
  for (let y = 0; y < outH; y++) {
    const row: number[] = [];
    for (let x = 0; x < outW; x++) {
      const sy = y * strideH;
      const sx = x * strideW;
      let sum = 0;
      for (let i = 0; i < poolH; i++) {
        for (let j = 0; j < poolW; j++) {
          sum += input[sy + i][sx + j];
        }
      }
      row.push(sum / area);
    }
    out.push(row);
  }
  return out;
}

/** Row-wise softmax (common for attention-style logits). */
export function softmaxRows(logits: number[][]): number[][] {
  assertRectangular(logits, "Logits matrix");
  const { h, w } = { h: logits.length, w: logits[0].length };
  if (h > ML_MAX_INPUT_DIM || w > ML_MAX_INPUT_DIM) {
    throw new Error(`Matrix exceeds ${ML_MAX_INPUT_DIM}×${ML_MAX_INPUT_DIM} cap.`);
  }
  for (const row of logits) {
    for (const value of row) {
      if (!Number.isFinite(value)) {
        throw new Error("Logits matrix must contain only finite numbers.");
      }
    }
  }
  return logits.map((row) => {
    const mx = Math.max(...row);
    const ex = row.map((v) => Math.exp(v - mx));
    const s = ex.reduce((a, b) => a + b, 0);
    if (s === 0) {
      throw new Error("Softmax sum underflowed; check for extreme input values.");
    }
    return ex.map((e) => e / s);
  });
}

export function mseLoss(pred: number[][], target: number[][]): number {
  assertSameShape(pred, target, "Prediction", "Target");
  const { h, w } = assertFiniteRectangular(pred, "Prediction");
  const count = h * w;
  let sumSq = 0;
  for (let i = 0; i < h; i++) {
    for (let j = 0; j < w; j++) {
      const d = pred[i][j] - target[i][j];
      sumSq += d * d;
    }
  }
  return sumSq / count;
}

export function mseGrad(pred: number[][], target: number[][]): number[][] {
  assertSameShape(pred, target, "Prediction", "Target");
  const { h, w } = assertFiniteRectangular(pred, "Prediction");
  const scale = 2 / (h * w);
  return pred.map((row, i) => row.map((v, j) => (v - target[i][j]) * scale));
}

export function crossEntropyFromLogits(logits: number[][], targetsOneHot: number[][]): number {
  assertSameShape(logits, targetsOneHot, "Logits", "Targets");
  const { h: rows, w: cols } = assertFiniteRectangular(logits, "Logits");
  if (rows > ML_MAX_INPUT_DIM || cols > ML_MAX_INPUT_DIM) {
    throw new Error(`Matrix exceeds ${ML_MAX_INPUT_DIM}×${ML_MAX_INPUT_DIM} cap.`);
  }
  const targetsDims = assertFiniteRectangular(targetsOneHot, "Targets");
  if (targetsDims.h > ML_MAX_INPUT_DIM || targetsDims.w > ML_MAX_INPUT_DIM) {
    throw new Error(`Matrix exceeds ${ML_MAX_INPUT_DIM}×${ML_MAX_INPUT_DIM} cap.`);
  }

  let total = 0;
  for (let i = 0; i < rows; i++) {
    const row = logits[i];
    const maxLogit = Math.max(...row);
    let sumExp = 0;
    for (let j = 0; j < cols; j++) {
      sumExp += Math.exp(row[j] - maxLogit);
    }
    const logSumExp = maxLogit + Math.log(sumExp);
    let rowLoss = 0;
    let targetMass = 0;
    for (let j = 0; j < cols; j++) {
      const t = targetsOneHot[i][j];
      if (t < 0 || t > 1) {
        throw new Error("Targets must contain probabilities in [0, 1].");
      }
      targetMass += t;
      rowLoss += -t * (row[j] - logSumExp);
    }
    if (Math.abs(targetMass - 1) > 1e-8) {
      throw new Error("Each target row must sum to 1.");
    }
    total += rowLoss;
  }
  return total / rows;
}

export function crossEntropyGradFromLogits(
  logits: number[][],
  targetsOneHot: number[][],
): number[][] {
  assertSameShape(logits, targetsOneHot, "Logits", "Targets");
  const { h: rows, w: cols } = assertFiniteRectangular(logits, "Logits");
  if (rows > ML_MAX_INPUT_DIM || cols > ML_MAX_INPUT_DIM) {
    throw new Error(`Matrix exceeds ${ML_MAX_INPUT_DIM}×${ML_MAX_INPUT_DIM} cap.`);
  }
  const targetsDims = assertFiniteRectangular(targetsOneHot, "Targets");
  if (targetsDims.h > ML_MAX_INPUT_DIM || targetsDims.w > ML_MAX_INPUT_DIM) {
    throw new Error(`Matrix exceeds ${ML_MAX_INPUT_DIM}×${ML_MAX_INPUT_DIM} cap.`);
  }
  const probs = softmaxRows(logits);
  return probs.map((row, i) => {
    let targetMass = 0;
    const outRow = row.map((p, j) => {
      const t = targetsOneHot[i][j];
      if (t < 0 || t > 1) {
        throw new Error("Targets must contain probabilities in [0, 1].");
      }
      targetMass += t;
      return (p - t) / rows;
    });
    if (Math.abs(targetMass - 1) > 1e-8) {
      throw new Error("Each target row must sum to 1.");
    }
    return outRow;
  });
}

export function softmaxJacobianRow(row: number[]): number[][] {
  if (row.length < 1) {
    throw new Error("Row must be non-empty.");
  }
  if (row.length > ML_MAX_INPUT_DIM) {
    throw new Error(`Row length exceeds ${ML_MAX_INPUT_DIM} cap.`);
  }
  for (const value of row) {
    if (!Number.isFinite(value)) {
      throw new Error("Row must contain only finite numbers.");
    }
  }
  const probs = softmaxRows([row])[0];
  const n = probs.length;
  const jac = Array.from({ length: n }, () => Array<number>(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      jac[i][j] = i === j ? probs[i] * (1 - probs[i]) : -probs[i] * probs[j];
    }
  }
  return jac;
}

export type DistanceMetric = "euclidean" | "manhattan";

function validateVectorMatrix(rows: number[][], name: string): { count: number; dim: number } {
  const { h: count, w: dim } = assertRectangular(rows, name);
  if (count > ML_MAX_INPUT_DIM || dim > ML_MAX_INPUT_DIM) {
    throw new Error(`${name} exceeds ${ML_MAX_INPUT_DIM}×${ML_MAX_INPUT_DIM} cap.`);
  }
  for (const row of rows) {
    for (const value of row) {
      if (!Number.isFinite(value)) {
        throw new Error(`${name} must contain only finite numeric values.`);
      }
    }
  }
  return { count, dim };
}

export function cosineSimilarityMatrix(A: number[][], B?: number[][]): number[][] {
  const { count: aRows, dim: aDim } = validateVectorMatrix(A, "Matrix A");
  const useSelf = typeof B === "undefined";
  const right = useSelf ? A : B;
  const { count: bRows, dim: bDim } = validateVectorMatrix(
    right,
    useSelf ? "Matrix A" : "Matrix B",
  );
  if (aDim !== bDim) {
    throw new Error("Matrix A and Matrix B vectors must have the same dimension.");
  }

  const aNorms = A.map((row, i) => {
    const norm = Math.hypot(...row);
    if (norm === 0) {
      throw new Error(`Matrix A row ${i + 1} has zero norm; cosine similarity is undefined.`);
    }
    return norm;
  });
  const bNorms = useSelf
    ? aNorms
    : right.map((row, i) => {
        const norm = Math.hypot(...row);
        if (norm === 0) {
          throw new Error(`Matrix B row ${i + 1} has zero norm; cosine similarity is undefined.`);
        }
        return norm;
      });

  const out = Array.from({ length: aRows }, () => Array<number>(bRows).fill(0));
  for (let i = 0; i < aRows; i++) {
    for (let j = 0; j < bRows; j++) {
      let dot = 0;
      for (let k = 0; k < aDim; k++) dot += A[i][k] * right[j][k];
      out[i][j] = dot / (aNorms[i] * bNorms[j]);
    }
  }
  return out;
}

export function pairwiseDistanceMatrix(
  A: number[][],
  B?: number[][],
  metric: DistanceMetric = "euclidean",
): number[][] {
  if (metric !== "euclidean" && metric !== "manhattan") {
    throw new Error("Metric must be either 'euclidean' or 'manhattan'.");
  }
  const { count: aRows, dim: aDim } = validateVectorMatrix(A, "Matrix A");
  const useSelf = typeof B === "undefined";
  const right = useSelf ? A : B;
  const { count: bRows, dim: bDim } = validateVectorMatrix(
    right,
    useSelf ? "Matrix A" : "Matrix B",
  );
  if (aDim !== bDim) {
    throw new Error("Matrix A and Matrix B vectors must have the same dimension.");
  }

  const out = Array.from({ length: aRows }, () => Array<number>(bRows).fill(0));
  for (let i = 0; i < aRows; i++) {
    for (let j = 0; j < bRows; j++) {
      let acc = 0;
      if (metric === "euclidean") {
        for (let k = 0; k < aDim; k++) {
          const d = A[i][k] - right[j][k];
          acc += d * d;
        }
        out[i][j] = Math.sqrt(acc);
      } else {
        for (let k = 0; k < aDim; k++) {
          acc += Math.abs(A[i][k] - right[j][k]);
        }
        out[i][j] = acc;
      }
    }
  }
  return out;
}

export type TruncatedSvdResult = {
  U: number[][];
  S: number[];
  Vt: number[][];
  singularValues: number[];
};

export type SvdPcaResult = {
  centered: number[][];
  means: number[];
  components: number[][];
  scores: number[][];
  singularValues: number[];
  explainedVariance: number[];
  explainedVarianceRatio: number[];
};

function identity(n: number): number[][] {
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  );
}

function normalizeVector(v: number[], eps = 1e-12): number[] {
  const norm = Math.hypot(...v);
  if (norm <= eps) return v.map(() => 0);
  return v.map((x) => x / norm);
}

function symmetricEigenJacobi(
  input: number[][],
  maxIters = 128,
  eps = 1e-10,
): { values: number[]; vectors: number[][] } {
  const { h, w } = assertFiniteRectangular(input, "Symmetric matrix");
  if (h !== w) {
    throw new Error("Symmetric eigendecomposition requires a square matrix.");
  }
  const n = h;
  const a = input.map((row) => row.slice());
  const v = identity(n);
  if (n === 1) {
    return { values: [a[0][0]], vectors: [[1]] };
  }

  for (let iter = 0; iter < maxIters; iter++) {
    let p = 0;
    let q = 1;
    let maxAbs = Math.abs(a[p][q]);
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const absVal = Math.abs(a[i][j]);
        if (absVal > maxAbs) {
          maxAbs = absVal;
          p = i;
          q = j;
        }
      }
    }
    if (maxAbs < eps) break;

    const app = a[p][p];
    const aqq = a[q][q];
    const apq = a[p][q];
    const tau = (aqq - app) / (2 * apq);
    const t = Math.sign(tau) / (Math.abs(tau) + Math.sqrt(1 + tau * tau));
    const c = 1 / Math.sqrt(1 + t * t);
    const s = t * c;

    for (let k = 0; k < n; k++) {
      if (k === p || k === q) continue;
      const akp = a[k][p];
      const akq = a[k][q];
      a[k][p] = c * akp - s * akq;
      a[p][k] = a[k][p];
      a[k][q] = s * akp + c * akq;
      a[q][k] = a[k][q];
    }
    a[p][p] = c * c * app - 2 * s * c * apq + s * s * aqq;
    a[q][q] = s * s * app + 2 * s * c * apq + c * c * aqq;
    a[p][q] = 0;
    a[q][p] = 0;

    for (let k = 0; k < n; k++) {
      const vkp = v[k][p];
      const vkq = v[k][q];
      v[k][p] = c * vkp - s * vkq;
      v[k][q] = s * vkp + c * vkq;
    }
  }

  const values = Array.from({ length: n }, (_, i) => a[i][i]);
  return { values, vectors: v };
}

export function truncatedSvd(a: number[][], k?: number): TruncatedSvdResult {
  const { h: m, w: n } = assertFiniteRectangular(a, "Input matrix");
  if (m > ML_MAX_INPUT_DIM || n > ML_MAX_INPUT_DIM) {
    throw new Error(`Input matrix exceeds ${ML_MAX_INPUT_DIM}×${ML_MAX_INPUT_DIM} cap.`);
  }
  const maxRank = Math.min(m, n);
  const at = transpose(a);
  const ata = matMul(at, a);
  const { values, vectors } = symmetricEigenJacobi(ata);
  const order = values
    .map((value, idx) => ({ value, idx }))
    .sort((x, y) => y.value - x.value)
    .map((x) => x.idx);
  const singularValuesAll = order.map((idx) => Math.sqrt(Math.max(0, values[idx])));

  const eps = 1e-10;
  const effectiveRank = singularValuesAll.filter((s) => s > eps).length;
  const rank = typeof k === "undefined" ? effectiveRank : k;
  if (!Number.isInteger(rank) || rank < 1 || rank > maxRank) {
    throw new Error(`k must be an integer in [1, ${maxRank}].`);
  }

  const U = Array.from({ length: m }, () => Array<number>(rank).fill(0));
  const S: number[] = [];
  const Vt = Array.from({ length: rank }, () => Array<number>(n).fill(0));

  for (let r = 0; r < rank; r++) {
    const idx = order[r];
    const sigma = singularValuesAll[r];
    const vCol = normalizeVector(
      vectors.map((row) => row[idx]),
      eps,
    );
    for (let j = 0; j < n; j++) Vt[r][j] = vCol[j];
    S.push(sigma);

    if (sigma <= eps) continue;
    const av = a.map((row) => row.reduce((acc, value, j) => acc + value * vCol[j], 0));
    const uCol = normalizeVector(
      av.map((x) => x / sigma),
      eps,
    );
    for (let i = 0; i < m; i++) U[i][r] = uCol[i];
  }

  return { U, S, Vt, singularValues: singularValuesAll };
}

export function reconstructFromTruncatedSvd(
  U: number[][],
  S: number[],
  Vt: number[][],
): number[][] {
  const { h: m, w: kU } = assertFiniteRectangular(U, "U");
  const { h: kV, w: n } = assertFiniteRectangular(Vt, "Vt");
  if (S.length !== kU || S.length !== kV) {
    throw new Error("S length must match U/Vt truncated rank.");
  }
  for (const s of S) {
    if (!Number.isFinite(s) || s < 0) {
      throw new Error("S must contain finite non-negative singular values.");
    }
  }
  const us = Array.from({ length: m }, () => Array<number>(S.length).fill(0));
  for (let i = 0; i < m; i++) {
    for (let r = 0; r < S.length; r++) {
      us[i][r] = U[i][r] * S[r];
    }
  }
  return matMul(us, Vt).map((row) => row.slice(0, n));
}

export function lowRankApproximation(a: number[][], k: number): number[][] {
  const svd = truncatedSvd(a, k);
  return reconstructFromTruncatedSvd(svd.U, svd.S, svd.Vt);
}

export function pcaFromSvd(data: number[][], k: number): SvdPcaResult {
  const { h: rows, w: cols } = assertFiniteRectangular(data, "Data matrix");
  if (rows > ML_MAX_INPUT_DIM || cols > ML_MAX_INPUT_DIM) {
    throw new Error(`Data matrix exceeds ${ML_MAX_INPUT_DIM}×${ML_MAX_INPUT_DIM} cap.`);
  }
  if (rows < 2) {
    throw new Error("PCA requires at least 2 observations (rows).");
  }
  if (!Number.isInteger(k) || k < 1 || k > Math.min(rows, cols)) {
    throw new Error(`k must be an integer in [1, ${Math.min(rows, cols)}].`);
  }
  const means = Array.from(
    { length: cols },
    (_, j) => data.reduce((sum, row) => sum + row[j], 0) / rows,
  );
  const centered = data.map((row) => row.map((v, j) => v - means[j]));
  const full = truncatedSvd(centered);
  const components = full.Vt.slice(0, k).map((row) => row.slice());
  const singularValues = full.S.slice(0, k);
  const scores = matMul(centered, transpose(components));
  const allVariance = full.singularValues.map((s) => (s * s) / (rows - 1));
  const totalVariance = allVariance.reduce((sum, v) => sum + v, 0);
  if (totalVariance <= 1e-14) {
    throw new Error("PCA failed: centered data has near-zero variance (no principal directions).");
  }
  const explainedVariance = singularValues.map((s) => (s * s) / (rows - 1));
  const explainedVarianceRatio = explainedVariance.map((v) => v / totalVariance);
  return {
    centered,
    means,
    components,
    scores,
    singularValues,
    explainedVariance,
    explainedVarianceRatio,
  };
}

/**
 * Single SGD-style parameter update with L2 regularization.
 * Equivalent to p <- p - lr * (grad + weightDecay * p).
 */
export function l2WeightDecayStep(
  params: number[][],
  grads: number[][],
  lr: number,
  weightDecay: number,
): number[][] {
  assertSameShape(params, grads, "Parameters", "Gradients");
  assertFinitePositive("Learning rate", lr);
  if (!Number.isFinite(weightDecay) || weightDecay < 0) {
    throw new Error("Weight decay must be a non-negative finite number.");
  }
  return params.map((row, i) =>
    row.map((p, j) => {
      const g = grads[i][j];
      return p - lr * (g + weightDecay * p);
    }),
  );
}

export type DropoutResult = {
  output: number[][];
  mask: number[][];
};

/**
 * Applies inverted-dropout scaling: output = input * mask / keepProb.
 * mask entries must be 0 or 1. If mask is omitted, Bernoulli samples are generated.
 */
export function applyDropout(
  input: number[][],
  keepProb: number,
  mask?: number[][],
): DropoutResult {
  const { h, w } = assertFiniteRectangular(input, "Input matrix");
  if (h > ML_MAX_INPUT_DIM || w > ML_MAX_INPUT_DIM) {
    throw new Error(`Matrix exceeds ${ML_MAX_INPUT_DIM}×${ML_MAX_INPUT_DIM} cap.`);
  }
  if (!Number.isFinite(keepProb) || keepProb <= 0 || keepProb > 1) {
    throw new Error("keepProb must satisfy 0 < keepProb <= 1.");
  }

  const sampledMask =
    typeof mask === "undefined"
      ? Array.from({ length: h }, () =>
          Array.from({ length: w }, () => (Math.random() < keepProb ? 1 : 0)),
        )
      : mask;
  assertSameShape(input, sampledMask, "Input matrix", "Dropout mask");
  for (let i = 0; i < h; i++) {
    for (let j = 0; j < w; j++) {
      const m = sampledMask[i][j];
      if (m !== 0 && m !== 1) {
        throw new Error("Dropout mask entries must be 0 or 1.");
      }
    }
  }

  const invKeep = 1 / keepProb;
  const output = input.map((row, i) => row.map((x, j) => x * sampledMask[i][j] * invKeep));
  return { output, mask: sampledMask.map((row) => row.slice()) };
}

export type AdamStepResult = {
  params: number[][];
  m: number[][];
  v: number[][];
  mHat: number[][];
  vHat: number[][];
  t: number;
};

export type MomentumStepResult = {
  params: number[][];
  velocity: number[][];
};

function assertSameShape(a: number[][], b: number[][], aName: string, bName: string) {
  const ar = assertFiniteRectangular(a, aName);
  const br = assertFiniteRectangular(b, bName);
  if (ar.h !== br.h || ar.w !== br.w) {
    throw new Error(`${aName} and ${bName} must have the same shape.`);
  }
}

function assertFinitePositive(name: string, value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive finite number.`);
  }
}

/**
 * One SGD update on matrix-shaped parameters: params <- params - lr * grads.
 */
export function sgdStep(params: number[][], grads: number[][], lr: number): number[][] {
  assertSameShape(params, grads, "Parameters", "Gradients");
  assertFinitePositive("Learning rate", lr);
  return params.map((row, i) => row.map((p, j) => p - lr * grads[i][j]));
}

/**
 * One momentum update step:
 * velocity' = momentum * velocity + grads
 * params' = params - lr * velocity'
 */
export function momentumStep(
  params: number[][],
  grads: number[][],
  velocity: number[][],
  lr: number,
  momentum: number,
): MomentumStepResult {
  assertSameShape(params, grads, "Parameters", "Gradients");
  assertSameShape(params, velocity, "Parameters", "Velocity matrix");
  assertFinitePositive("Learning rate", lr);
  if (!Number.isFinite(momentum) || momentum < 0 || momentum >= 1) {
    throw new Error("momentum must satisfy 0 <= momentum < 1.");
  }

  const outVelocity: number[][] = [];
  const outParams: number[][] = [];
  for (let i = 0; i < params.length; i++) {
    const rowV: number[] = [];
    const rowP: number[] = [];
    for (let j = 0; j < params[i].length; j++) {
      const nextV = momentum * velocity[i][j] + grads[i][j];
      rowV.push(nextV);
      rowP.push(params[i][j] - lr * nextV);
    }
    outVelocity.push(rowV);
    outParams.push(rowP);
  }

  return { params: outParams, velocity: outVelocity };
}

/**
 * One Adam optimizer update step with optional decoupled weight decay.
 * t is the current step index before this update, and the returned t is t + 1.
 */
export function adamStep(
  params: number[][],
  grads: number[][],
  m: number[][],
  v: number[][],
  t: number,
  lr: number,
  beta1: number,
  beta2: number,
  eps: number,
  weightDecay = 0,
): AdamStepResult {
  assertSameShape(params, grads, "Parameters", "Gradients");
  assertSameShape(params, m, "Parameters", "First-moment matrix");
  assertSameShape(params, v, "Parameters", "Second-moment matrix");
  assertFinitePositive("Learning rate", lr);
  assertFinitePositive("Epsilon", eps);
  if (!Number.isFinite(weightDecay) || weightDecay < 0) {
    throw new Error("Weight decay must be a non-negative finite number.");
  }
  if (!Number.isInteger(t) || t < 0) {
    throw new Error("Step index t must be a non-negative integer.");
  }
  if (!Number.isFinite(beta1) || beta1 < 0 || beta1 >= 1) {
    throw new Error("beta1 must satisfy 0 <= beta1 < 1.");
  }
  if (!Number.isFinite(beta2) || beta2 < 0 || beta2 >= 1) {
    throw new Error("beta2 must satisfy 0 <= beta2 < 1.");
  }

  const nextT = t + 1;
  const b1Corr = 1 - beta1 ** nextT;
  const b2Corr = 1 - beta2 ** nextT;
  const outP: number[][] = [];
  const outM: number[][] = [];
  const outV: number[][] = [];
  const outMHat: number[][] = [];
  const outVHat: number[][] = [];

  for (let i = 0; i < params.length; i++) {
    const rowP: number[] = [];
    const rowM: number[] = [];
    const rowV: number[] = [];
    const rowMHat: number[] = [];
    const rowVHat: number[] = [];
    for (let j = 0; j < params[i].length; j++) {
      const g = grads[i][j];
      const mi = beta1 * m[i][j] + (1 - beta1) * g;
      const vi = beta2 * v[i][j] + (1 - beta2) * g * g;
      const mHat = mi / b1Corr;
      const vHat = vi / b2Corr;
      const adaptive = mHat / (Math.sqrt(vHat) + eps);
      const p = params[i][j] - lr * adaptive - lr * weightDecay * params[i][j];
      rowP.push(p);
      rowM.push(mi);
      rowV.push(vi);
      rowMHat.push(mHat);
      rowVHat.push(vHat);
    }
    outP.push(rowP);
    outM.push(rowM);
    outV.push(rowV);
    outMHat.push(rowMHat);
    outVHat.push(rowVHat);
  }

  return { params: outP, m: outM, v: outV, mHat: outMHat, vHat: outVHat, t: nextT };
}

/**
 * BatchNorm inference over a mini-batch matrix X with shape [N, D].
 * runningMean/runningVar/gamma/beta are per-feature vectors of length D.
 */
export function batchNormInference(
  X: number[][],
  gamma: number[],
  beta: number[],
  runningMean: number[],
  runningVar: number[],
  eps: number,
): number[][] {
  const { h: rows, w: features } = assertFiniteRectangular(X, "Input matrix");
  if (rows > ML_MAX_INPUT_DIM || features > ML_MAX_INPUT_DIM) {
    throw new Error(`Matrix exceeds ${ML_MAX_INPUT_DIM}×${ML_MAX_INPUT_DIM} cap.`);
  }
  assertPositiveEps(eps);
  for (const [vec, name] of [
    [gamma, "gamma"],
    [beta, "beta"],
    [runningMean, "runningMean"],
    [runningVar, "runningVar"],
  ] as const) {
    if (vec.length !== features) {
      throw new Error(`${name} length must match input feature count (${features}).`);
    }
    for (const v of vec) {
      if (!Number.isFinite(v)) {
        throw new Error(`${name} must contain only finite numbers.`);
      }
    }
  }
  for (const v of runningVar) {
    if (v < 0) {
      throw new Error("runningVar entries must be non-negative.");
    }
  }
  return X.map((row) =>
    row.map((x, j) => {
      const normalized = (x - runningMean[j]) / Math.sqrt(runningVar[j] + eps);
      return gamma[j] * normalized + beta[j];
    }),
  );
}

/**
 * LayerNorm over each row independently on an [N, D] matrix.
 * gamma/beta are per-feature vectors of length D.
 */
export function layerNorm(X: number[][], gamma: number[], beta: number[], eps: number): number[][] {
  const { h: rows, w: features } = assertFiniteRectangular(X, "Input matrix");
  if (rows > ML_MAX_INPUT_DIM || features > ML_MAX_INPUT_DIM) {
    throw new Error(`Matrix exceeds ${ML_MAX_INPUT_DIM}×${ML_MAX_INPUT_DIM} cap.`);
  }
  assertPositiveEps(eps);
  for (const [vec, name] of [
    [gamma, "gamma"],
    [beta, "beta"],
  ] as const) {
    if (vec.length !== features) {
      throw new Error(`${name} length must match input feature count (${features}).`);
    }
    for (const v of vec) {
      if (!Number.isFinite(v)) {
        throw new Error(`${name} must contain only finite numbers.`);
      }
    }
  }
  return X.map((row) => {
    const mean = row.reduce((a, b) => a + b, 0) / features;
    const variance = row.reduce((acc, v) => acc + (v - mean) ** 2, 0) / features;
    const denom = Math.sqrt(variance + eps);
    return row.map((x, j) => gamma[j] * ((x - mean) / denom) + beta[j]);
  });
}

/**
 * RMSNorm over each row independently on an [N, D] matrix.
 * gamma is a per-feature vector of length D (no beta shift term).
 */
export function rmsNorm(X: number[][], gamma: number[], eps: number): number[][] {
  const { h: rows, w: features } = assertFiniteRectangular(X, "Input matrix");
  if (rows > ML_MAX_INPUT_DIM || features > ML_MAX_INPUT_DIM) {
    throw new Error(`Matrix exceeds ${ML_MAX_INPUT_DIM}×${ML_MAX_INPUT_DIM} cap.`);
  }
  assertPositiveEps(eps);
  if (gamma.length !== features) {
    throw new Error(`gamma length must match input feature count (${features}).`);
  }
  for (const v of gamma) {
    if (!Number.isFinite(v)) {
      throw new Error("gamma must contain only finite numbers.");
    }
  }
  return X.map((row) => {
    const meanSquare = row.reduce((acc, v) => acc + v * v, 0) / features;
    const denom = Math.sqrt(meanSquare + eps);
    return row.map((x, j) => gamma[j] * (x / denom));
  });
}

export type ScaledDotProductAttentionOptions = {
  additiveMask?: number[][];
};

export type ScaledDotProductAttentionResult = {
  scores: number[][];
  weights: number[][];
  output: number[][];
};

export function splitHeads(x: number[][], numHeads: number): number[][][] {
  const { h: rows, w: cols } = assertFiniteRectangular(x, "Input matrix");
  if (!Number.isInteger(numHeads) || numHeads < 1) {
    throw new Error("numHeads must be a positive integer.");
  }
  if (cols % numHeads !== 0) {
    throw new Error(
      `Input width (${cols}) must be divisible by numHeads (${numHeads}) for head splitting.`,
    );
  }
  const headWidth = cols / numHeads;
  const out: number[][][] = [];
  for (let h = 0; h < numHeads; h++) {
    const start = h * headWidth;
    const head = Array.from({ length: rows }, (_, i) => x[i].slice(start, start + headWidth));
    out.push(head);
  }
  return out;
}

export function concatHeads(heads: number[][][]): number[][] {
  if (heads.length === 0) {
    throw new Error("Heads list cannot be empty.");
  }
  const firstDims = assertFiniteRectangular(heads[0], "Head 1 matrix");
  const rows = firstDims.h;
  const out = Array.from({ length: rows }, () => [] as number[]);
  for (let h = 0; h < heads.length; h++) {
    const dims = assertFiniteRectangular(heads[h], `Head ${h + 1} matrix`);
    if (dims.h !== rows) {
      throw new Error("All heads must have the same row count.");
    }
    for (let i = 0; i < rows; i++) {
      out[i].push(...heads[h][i]);
    }
  }
  return out;
}

export function sinusoidalPositionalEncoding(
  seqLen: number,
  dModel: number,
  base = 10_000,
): number[][] {
  if (!Number.isInteger(seqLen) || seqLen < 1) {
    throw new Error("seqLen must be a positive integer.");
  }
  if (!Number.isInteger(dModel) || dModel < 1) {
    throw new Error("dModel must be a positive integer.");
  }
  if (!Number.isFinite(base) || base <= 1) {
    throw new Error("base must be a finite number greater than 1.");
  }
  if (seqLen > ML_MAX_INPUT_DIM || dModel > ML_MAX_INPUT_DIM) {
    throw new Error(`Matrix exceeds ${ML_MAX_INPUT_DIM}×${ML_MAX_INPUT_DIM} cap.`);
  }

  const out = Array.from({ length: seqLen }, () => Array<number>(dModel).fill(0));
  for (let pos = 0; pos < seqLen; pos++) {
    for (let i = 0; i < dModel; i++) {
      const exponent = (2 * Math.floor(i / 2)) / dModel;
      const angle = pos / base ** exponent;
      out[pos][i] = i % 2 === 0 ? Math.sin(angle) : Math.cos(angle);
    }
  }
  return out;
}

export function causalMask(qRows: number, kRows: number, blockedValue = -1e9): number[][] {
  if (!Number.isInteger(qRows) || qRows < 1 || !Number.isInteger(kRows) || kRows < 1) {
    throw new Error("qRows and kRows must be positive integers.");
  }
  if (!Number.isFinite(blockedValue) || blockedValue >= 0) {
    throw new Error("blockedValue must be a finite negative number.");
  }
  const out = Array.from({ length: qRows }, () => Array<number>(kRows).fill(0));
  for (let i = 0; i < qRows; i++) {
    for (let j = i + 1; j < kRows; j++) {
      out[i][j] = blockedValue;
    }
  }
  return out;
}

function transpose2d(m: number[][]): number[][] {
  const rows = m.length;
  const cols = m[0].length;
  const out = Array.from({ length: cols }, () => Array<number>(rows).fill(0));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      out[j][i] = m[i][j];
    }
  }
  return out;
}

function matMul2d(a: number[][], b: number[][]): number[][] {
  const aRows = a.length;
  const aCols = a[0].length;
  const bRows = b.length;
  const bCols = b[0].length;
  if (aCols !== bRows) {
    throw new Error("Matrix multiply dimension mismatch.");
  }
  const out = Array.from({ length: aRows }, () => Array<number>(bCols).fill(0));
  for (let i = 0; i < aRows; i++) {
    for (let k = 0; k < aCols; k++) {
      const aik = a[i][k];
      for (let j = 0; j < bCols; j++) {
        out[i][j] += aik * b[k][j];
      }
    }
  }
  return out;
}

export function scaledDotProductAttention(
  Q: number[][],
  K: number[][],
  V: number[][],
  options?: ScaledDotProductAttentionOptions,
): ScaledDotProductAttentionResult {
  const { h: qRows, w: qCols } = assertFiniteRectangular(Q, "Q matrix");
  const { h: kRows, w: kCols } = assertFiniteRectangular(K, "K matrix");
  const { h: vRows, w: vCols } = assertFiniteRectangular(V, "V matrix");
  if (qRows > ML_MAX_INPUT_DIM || kRows > ML_MAX_INPUT_DIM || vRows > ML_MAX_INPUT_DIM) {
    throw new Error(`Attention matrices exceed ${ML_MAX_INPUT_DIM} rows cap.`);
  }
  if (qCols > ML_MAX_INPUT_DIM || kCols > ML_MAX_INPUT_DIM || vCols > ML_MAX_INPUT_DIM) {
    throw new Error(`Attention matrices exceed ${ML_MAX_INPUT_DIM} columns cap.`);
  }
  if (qCols !== kCols) {
    throw new Error("Q and K must have the same feature width (d_k).");
  }
  if (kRows !== vRows) {
    throw new Error("K and V must have the same number of rows (sequence length).");
  }
  const dk = qCols;
  if (dk < 1) {
    throw new Error("Q and K feature width (d_k) must be at least 1.");
  }

  const scale = Math.sqrt(dk);
  const rawScores = matMul2d(Q, transpose2d(K));
  const scores = rawScores.map((row) => row.map((x) => x / scale));
  const mask = options?.additiveMask;
  if (mask) {
    const { h: maskRows, w: maskCols } = assertFiniteRectangular(mask, "Attention mask");
    if (maskRows !== qRows || maskCols !== kRows) {
      throw new Error("Attention mask must have shape [Q rows × K rows].");
    }
    for (let i = 0; i < scores.length; i++) {
      for (let j = 0; j < scores[i].length; j++) {
        scores[i][j] += mask[i][j];
      }
    }
  }
  const weights = softmaxRows(scores);
  const output = matMul2d(weights, V);
  if (output.length !== qRows || output[0].length !== vCols) {
    throw new Error("Attention output shape validation failed.");
  }
  return { scores, weights, output };
}
