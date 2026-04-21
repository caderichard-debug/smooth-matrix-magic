import { describe, expect, it, vi } from "vitest";
import {
  adamStep,
  applyDropout,
  avgPool2d,
  batchNormInference,
  l2WeightDecayStep,
  cosineSimilarityMatrix,
  convolve2d,
  correlate2d,
  dilatedConvolve2d,
  gridToMatrix,
  layerNorm,
  linearBackward,
  linearForward,
  matrixToGrid,
  maxPool2d,
  pairwiseDistanceMatrix,
  pcaFromSvd,
  lowRankApproximation,
  momentumStep,
  truncatedSvd,
  reconstructFromTruncatedSvd,
  rmsNorm,
  sinusoidalPositionalEncoding,
  scaledDotProductAttention,
  splitHeads,
  concatHeads,
  crossEntropyFromLogits,
  crossEntropyGradFromLogits,
  causalMask,
  mseGrad,
  mseLoss,
  softmaxJacobianRow,
  softmaxRows,
  sgdStep,
  separableConvolve2d,
  transposedConv1dOutputSize,
  transposedConv2dOutputShape,
} from "@/lib/mlOps";
import { fromNumbers } from "@/lib/matrix";

function expectGridClose(actual: number[][], expected: number[][], tol = 1e-9) {
  expect(actual.length).toBe(expected.length);
  for (let i = 0; i < expected.length; i++) {
    expect(actual[i].length).toBe(expected[i].length);
    for (let j = 0; j < expected[i].length; j++) {
      expect(actual[i][j]).toBeCloseTo(expected[i][j], Math.abs(Math.log10(tol)));
    }
  }
}

describe("mlOps", () => {
  it("converts between matrix and numeric grid", () => {
    const m = fromNumbers([
      [1, -2],
      [3, 4],
    ]);
    const grid = matrixToGrid(m, "test");
    expectGridClose(grid, [
      [1, -2],
      [3, 4],
    ]);
    const back = gridToMatrix(grid);
    expect(matrixToGrid(back, "back")).toEqual(grid);
  });

  it("computes 2D cross-correlation without kernel flip", () => {
    const input = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ];
    const kernel = [
      [1, 0],
      [0, 1],
    ];
    const out = correlate2d(input, kernel, 1, 0);
    expectGridClose(out, [
      [6, 8],
      [12, 14],
    ]);
  });

  it("computes true 2D convolution with flipped kernel", () => {
    const input = [
      [1, 2, 0],
      [0, 1, 3],
      [2, 0, 1],
    ];
    const kernel = [
      [1, 2],
      [3, 4],
    ];
    const conv = convolve2d(input, kernel, 1, 0);
    const corrWithFlipped = correlate2d(
      input,
      [
        [4, 3],
        [2, 1],
      ],
      1,
      0,
    );
    expect(conv).toEqual(corrWithFlipped);
  });

  it("supports padding and stride in correlation", () => {
    const out = correlate2d(
      [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ],
      [
        [1, 1],
        [1, 1],
      ],
      2,
      1,
    );
    expectGridClose(out, [
      [1, 5],
      [11, 28],
    ]);
  });

  it("computes dilated convolution with expanded receptive field", () => {
    const input = [
      [1, 2, 3, 4, 5],
      [6, 7, 8, 9, 10],
      [11, 12, 13, 14, 15],
      [16, 17, 18, 19, 20],
      [21, 22, 23, 24, 25],
    ];
    const kernel = [
      [1, 2],
      [3, 4],
    ];
    const out = dilatedConvolve2d(input, kernel, 1, 0, 2);
    const manualDilatedKernel = [
      [1, 0, 2],
      [0, 0, 0],
      [3, 0, 4],
    ];
    expectGridClose(out, convolve2d(input, manualDilatedKernel, 1, 0));
  });

  it("matches regular convolution when dilation is one", () => {
    const input = [
      [2, 1, 0],
      [1, 3, 2],
      [0, 1, 4],
    ];
    const kernel = [
      [1, -1],
      [2, 0],
    ];
    expectGridClose(dilatedConvolve2d(input, kernel, 1, 0, 1), convolve2d(input, kernel, 1, 0));
  });

  it("computes depthwise+pointwise separable convolution", () => {
    const input = [
      [1, 0, 2],
      [3, 1, 0],
      [1, 2, 1],
    ];
    const depthwiseKernel = [
      [1, -1],
      [0, 2],
    ];
    const result = separableConvolve2d(input, depthwiseKernel, 0.5, 1, 1, 0, 1);
    expectGridClose(result.depthwise, dilatedConvolve2d(input, depthwiseKernel, 1, 0, 1));
    expectGridClose(
      result.output,
      result.depthwise.map((row) => row.map((v) => 0.5 * v + 1)),
    );
  });

  it("supports separable convolution with stride/pad/dilation passthrough", () => {
    const input = [
      [1, 2, 3, 0],
      [0, 1, 2, 1],
      [3, 0, 1, 2],
      [2, 1, 0, 1],
    ];
    const depthwiseKernel = [
      [1, 0],
      [2, -1],
    ];
    const result = separableConvolve2d(input, depthwiseKernel, -2, 0.25, 2, 1, 2);
    const expectedDepthwise = dilatedConvolve2d(input, depthwiseKernel, 2, 1, 2);
    expectGridClose(result.depthwise, expectedDepthwise);
    expectGridClose(
      result.output,
      expectedDepthwise.map((row) => row.map((v) => -2 * v + 0.25)),
    );
  });

  it("computes transposed convolution output-size math", () => {
    const oneDim = transposedConv1dOutputSize(5, 3, 2, 1, 2, 1);
    expect(oneDim.effectiveKernel).toBe(5);
    expect(oneDim.output).toBe(12);

    const twoDim = transposedConv2dOutputShape(4, 5, 3, 3, 2, 2, 1, 1, 1, 1, 0, 0);
    expect(twoDim.outputHeight).toBe(7);
    expect(twoDim.outputWidth).toBe(9);
  });

  it("returns full transposed-conv 1D sizing breakdown fields", () => {
    const out = transposedConv1dOutputSize(3, 4, 3, 1, 2, 1);
    expect(out).toEqual({
      input: 3,
      kernel: 4,
      stride: 3,
      pad: 1,
      dilation: 2,
      outputPadding: 1,
      effectiveKernel: 7,
      output: 12,
    });
  });

  it("uses independent axis parameters for transposed-conv 2D shape", () => {
    const out = transposedConv2dOutputShape(2, 3, 4, 3, 2, 3, 1, 0, 2, 1, 1, 0);
    expect(out.outputHeight).toBe(8);
    expect(out.outputWidth).toBe(9);
    expect(out.height.output).toBe(out.outputHeight);
    expect(out.width.output).toBe(out.outputWidth);
    expect(out.height.effectiveKernel).toBe(7);
    expect(out.width.effectiveKernel).toBe(3);
  });

  it("computes max pooling", () => {
    const out = maxPool2d(
      [
        [1, 3, 2, 0],
        [0, 4, 1, 2],
        [2, 1, 3, 1],
        [0, 0, 2, 4],
      ],
      2,
      2,
      2,
      2,
    );
    expectGridClose(out, [
      [4, 2],
      [2, 4],
    ]);
  });

  it("computes average pooling", () => {
    const out = avgPool2d(
      [
        [1, 3, 2, 0],
        [0, 4, 1, 2],
        [2, 1, 3, 1],
        [0, 0, 2, 4],
      ],
      2,
      2,
      2,
      2,
    );
    expectGridClose(out, [
      [2, 1.25],
      [0.75, 2.5],
    ]);
  });

  it("computes row-wise softmax with row sums of one", () => {
    const probs = softmaxRows([
      [2, 1, 0],
      [1, 1, 1],
    ]);
    expect(probs[0][0]).toBeGreaterThan(probs[0][1]);
    expect(probs[0][1]).toBeGreaterThan(probs[0][2]);
    for (const row of probs) {
      const sum = row.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1, 10);
      for (const v of row) expect(v).toBeGreaterThan(0);
    }
  });

  it("validates softmax non-finite logits", () => {
    expect(() => softmaxRows([[1, Number.NaN]])).toThrow(
      "Logits matrix must contain only finite numbers",
    );
    expect(() => softmaxRows([[Number.POSITIVE_INFINITY, 0]])).toThrow(
      "Logits matrix must contain only finite numbers",
    );
  });

  it("computes MSE loss and gradient", () => {
    const pred = [
      [1, 3],
      [2, 5],
    ];
    const target = [
      [0, 1],
      [2, 1],
    ];
    expect(mseLoss(pred, target)).toBeCloseTo((1 + 4 + 0 + 16) / 4, 12);
    expectGridClose(mseGrad(pred, target), [
      [0.5, 1],
      [0, 2],
    ]);
  });

  it("computes cross-entropy from logits and logits gradient", () => {
    const logits = [
      [2, 1, 0],
      [0, 1, 2],
    ];
    const targets = [
      [1, 0, 0],
      [0, 0, 1],
    ];
    const probs = softmaxRows(logits);
    const expectedLoss = (-Math.log(probs[0][0]) + -Math.log(probs[1][2])) / logits.length;
    expect(crossEntropyFromLogits(logits, targets)).toBeCloseTo(expectedLoss, 12);

    const grad = crossEntropyGradFromLogits(logits, targets);
    expectGridClose(
      grad,
      probs.map((row, i) => row.map((p, j) => (p - targets[i][j]) / logits.length)),
      1e-12,
    );
  });

  it("computes per-row softmax Jacobian", () => {
    const row = [2, 1, 0];
    const p = softmaxRows([row])[0];
    const jac = softmaxJacobianRow(row);
    expect(jac).toHaveLength(3);
    expect(jac[0]).toHaveLength(3);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const expected = i === j ? p[i] * (1 - p[i]) : -p[i] * p[j];
        expect(jac[i][j]).toBeCloseTo(expected, 12);
      }
      const rowSum = jac[i].reduce((a, b) => a + b, 0);
      expect(rowSum).toBeCloseTo(0, 12);
    }
  });

  it("MSE loss/grad are zero when prediction equals target", () => {
    const pred = [
      [1.25, -2.5, 0],
      [3.5, 4.25, -1],
    ];
    const target = [
      [1.25, -2.5, 0],
      [3.5, 4.25, -1],
    ];
    expect(mseLoss(pred, target)).toBe(0);
    expectGridClose(mseGrad(pred, target), [
      [0, 0, 0],
      [0, 0, 0],
    ]);
  });

  it("cross-entropy is invariant to per-row logit shifts", () => {
    const logits = [
      [2, -1, 0.5],
      [0.5, 3, -2],
    ];
    const shifted = logits.map((row) => row.map((v) => v + 10_000));
    const targets = [
      [0, 1, 0],
      [0.2, 0.3, 0.5],
    ];
    expect(crossEntropyFromLogits(logits, targets)).toBeCloseTo(
      crossEntropyFromLogits(shifted, targets),
      12,
    );
    expectGridClose(
      crossEntropyGradFromLogits(logits, targets),
      crossEntropyGradFromLogits(shifted, targets),
    );
  });

  it("cross-entropy gradient rows sum to zero", () => {
    const logits = [
      [1.1, -0.4, 2.3],
      [0.2, 0.2, 0.2],
    ];
    const targets = [
      [0.7, 0.2, 0.1],
      [0, 1, 0],
    ];
    const grad = crossEntropyGradFromLogits(logits, targets);
    for (const row of grad) {
      expect(row.reduce((a, b) => a + b, 0)).toBeCloseTo(0, 12);
    }
  });

  it("softmax Jacobian is symmetric and diagonal entries are positive", () => {
    const jac = softmaxJacobianRow([0.2, -1.3, 4.1, 0.7]);
    for (let i = 0; i < jac.length; i++) {
      expect(jac[i][i]).toBeGreaterThan(0);
      for (let j = 0; j < jac.length; j++) {
        expect(jac[i][j]).toBeCloseTo(jac[j][i], 12);
      }
    }
  });

  it("validates invalid arguments and dimensions", () => {
    expect(() => correlate2d([[1]], [[1]], 0, 0)).toThrow("Stride must be a positive integer.");
    expect(() => correlate2d([[1]], [[1]], 1, -1)).toThrow(
      "Padding must be a non-negative integer.",
    );
    expect(() => maxPool2d([[1]], 2, 2, 1, 1)).toThrow(
      "Pool window is larger than the feature map.",
    );
    expect(() => avgPool2d([[1]], 1, 1, 0, 1)).toThrow("Strides must be positive integers.");
    expect(() => matrixToGrid(fromNumbers([[1], [2, 3]]), "bad")).toThrow(
      "rows must have equal length",
    );
    expect(() => dilatedConvolve2d([[1]], [[1]], 1, 0, 0)).toThrow(
      "Dilation must be a positive integer",
    );
    expect(() => separableConvolve2d([[1]], [[1]], Number.NaN)).toThrow(
      "Pointwise weight must be a finite number",
    );
    expect(() => transposedConv1dOutputSize(2, 3, 2, 0, 1, 2)).toThrow(
      "Output padding must be smaller than both stride and dilation",
    );
    expect(() => transposedConv1dOutputSize(1, 3, 1, 2, 1, 0)).toThrow(
      "Transposed convolution output size is non-positive",
    );
    expect(() => transposedConv1dOutputSize(2, 3, 1.5, 0)).toThrow(
      "Stride must be a positive integer",
    );
    expect(() => mseLoss([[1]], [[1, 2]])).toThrow("must have the same shape");
    expect(() => mseGrad([[1]], [[Number.NaN]])).toThrow("must contain only finite numbers");
    expect(() => crossEntropyFromLogits([[1, 2]], [[1, 1]])).toThrow(
      "Each target row must sum to 1",
    );
    expect(() => crossEntropyGradFromLogits([[1, 2]], [[-1, 2]])).toThrow(
      "probabilities in [0, 1]",
    );
    expect(() =>
      crossEntropyFromLogits(
        Array.from({ length: 17 }, () => [0]),
        Array.from({ length: 17 }, () => [1]),
      ),
    ).toThrow("Matrix exceeds 16×16 cap");
    expect(() => softmaxJacobianRow([])).toThrow("Row must be non-empty");
    expect(() => softmaxJacobianRow([1, Number.POSITIVE_INFINITY])).toThrow(
      "Row must contain only finite numbers",
    );
    expect(() => softmaxJacobianRow(Array.from({ length: 17 }, (_, i) => i))).toThrow(
      "Row length exceeds 16 cap",
    );
  });

  it("batchNormInference returns expected shape and values", () => {
    const X = [
      [2, 4, 6],
      [8, 10, 12],
    ];
    const gamma = [1.5, 0.5, 2];
    const beta = [0, -1, 1];
    const runningMean = [5, 7, 9];
    const runningVar = [9, 4, 1];
    const out = batchNormInference(X, gamma, beta, runningMean, runningVar, 1e-5);
    expect(out.length).toBe(X.length);
    expect(out[0].length).toBe(X[0].length);
    const expected = X.map((row) =>
      row.map(
        (x, j) => gamma[j] * ((x - runningMean[j]) / Math.sqrt(runningVar[j] + 1e-5)) + beta[j],
      ),
    );
    expectGridClose(out, expected, 1e-9);
  });

  it("layerNorm normalizes each row to mean~0 and variance~1", () => {
    const X = [
      [1, 2, 3, 4],
      [2, 4, 6, 8],
    ];
    const out = layerNorm(X, [1, 1, 1, 1], [0, 0, 0, 0], 1e-9);
    expect(out.length).toBe(X.length);
    expect(out[0].length).toBe(X[0].length);
    for (const row of out) {
      const mean = row.reduce((a, b) => a + b, 0) / row.length;
      const variance = row.reduce((acc, v) => acc + (v - mean) ** 2, 0) / row.length;
      expect(mean).toBeCloseTo(0, 8);
      expect(variance).toBeCloseTo(1, 7);
    }
  });

  it("validates normalization shape and numeric constraints", () => {
    expect(() => batchNormInference([[1, 2]], [1], [0, 0], [0, 0], [1, 1], 1e-5)).toThrow(
      "gamma length must match input feature count",
    );
    expect(() => batchNormInference([[1, 2]], [1, 1], [0, 0], [0, 0], [-1, 1], 1e-5)).toThrow(
      "runningVar entries must be non-negative",
    );
    expect(() => layerNorm([[1, 2]], [1], [0, 0], 1e-5)).toThrow(
      "gamma length must match input feature count",
    );
    expect(() => layerNorm([[1, 2]], [1, 1], [0, 0], 0)).toThrow(
      "eps must be a positive finite number",
    );
    expect(() => layerNorm([[1, Number.NaN]], [1, 1], [0, 0], 1e-5)).toThrow(
      "Input matrix must contain only finite numbers",
    );
    expect(() =>
      batchNormInference([[1, 2]], [1, 1], [0, 0], [0, 0], [1, Number.NaN], 1e-5),
    ).toThrow("runningVar must contain only finite numbers");
    expect(() =>
      batchNormInference([[1, 2]], [1, 1], [Number.NaN, 0], [0, 0], [1, 1], 1e-5),
    ).toThrow("beta must contain only finite numbers");
    expect(() => batchNormInference([[1, 2]], [1, 1], [0, 0], [0, 0], [1, 1], Infinity)).toThrow(
      "eps must be a positive finite number",
    );
    expect(() =>
      batchNormInference(
        Array.from({ length: 17 }, () => [1]),
        [1],
        [0],
        [0],
        [1],
        1e-5,
      ),
    ).toThrow("Matrix exceeds 16×16 cap");
    expect(() => layerNorm([[1, 2]], [1, 1], [0, Number.NaN], 1e-5)).toThrow(
      "beta must contain only finite numbers",
    );
    expect(() =>
      layerNorm(
        Array.from({ length: 17 }, () => [1]),
        [1],
        [0],
        1e-5,
      ),
    ).toThrow("Matrix exceeds 16×16 cap");
  });

  it("rmsNorm scales each row by root-mean-square without beta", () => {
    const X = [
      [1, 2, -2],
      [3, 0, 4],
    ];
    const gamma = [1, 0.5, 2];
    const out = rmsNorm(X, gamma, 1e-9);
    const expected = X.map((row) => {
      const rms = Math.sqrt(row.reduce((acc, v) => acc + v * v, 0) / row.length + 1e-9);
      return row.map((x, j) => gamma[j] * (x / rms));
    });
    expectGridClose(out, expected, 1e-9);
  });

  it("handles constant rows for LayerNorm and zero rows for RMSNorm", () => {
    const layerOut = layerNorm(
      [
        [3, 3, 3],
        [10, 10, 10],
      ],
      [2, 0.5, 1],
      [1, -2, 0.25],
      1e-5,
    );
    expectGridClose(layerOut, [
      [1, -2, 0.25],
      [1, -2, 0.25],
    ]);

    const rmsOut = rmsNorm([[0, 0, 0]], [1, 2, 3], 1e-5);
    expectGridClose(rmsOut, [[0, 0, 0]]);
  });

  it("batchNormInference reduces to beta when gamma is zero", () => {
    const out = batchNormInference(
      [
        [100, -50, 3],
        [-7, 8, 9],
      ],
      [0, 0, 0],
      [1, -2, 0.5],
      [0, 0, 0],
      [1, 1, 1],
      1e-5,
    );
    expectGridClose(out, [
      [1, -2, 0.5],
      [1, -2, 0.5],
    ]);
  });

  it("validates rmsNorm shape and finite constraints", () => {
    expect(() => rmsNorm([[1, 2]], [1], 1e-5)).toThrow(
      "gamma length must match input feature count",
    );
    expect(() => rmsNorm([[1, 2]], [1, Number.NaN], 1e-5)).toThrow(
      "gamma must contain only finite numbers",
    );
    expect(() => rmsNorm([[1, Number.POSITIVE_INFINITY]], [1, 1], 1e-5)).toThrow(
      "Input matrix must contain only finite numbers",
    );
    expect(() => rmsNorm([[1, 2]], [1, 1], 0)).toThrow("eps must be a positive finite number");
    expect(() =>
      rmsNorm(
        Array.from({ length: 17 }, () => [1]),
        [1],
        1e-5,
      ),
    ).toThrow("Matrix exceeds 16×16 cap");
  });

  it("computes linear forward with and without bias", () => {
    const X = [
      [1, 2, 3],
      [4, 5, 6],
    ];
    const W = [
      [0.2, 0.5],
      [0.3, -0.1],
      [0.4, 0.7],
    ];
    expectGridClose(linearForward(X, W), [
      [2, 2.4],
      [4.7, 5.7],
    ]);
    expectGridClose(linearForward(X, W, [1, -1]), [
      [3, 1.4],
      [5.7, 4.7],
    ]);
  });

  it("computes linear backward gradients", () => {
    const X = [
      [1, 2],
      [3, 4],
    ];
    const W = [
      [0.5, -0.5, 1],
      [1.5, 0.5, -1],
    ];
    const dY = [
      [1, 0, 2],
      [0, -1, 1],
    ];
    const { dW, dX, db } = linearBackward(X, W, dY);
    expectGridClose(dW, [
      [1, -3, 5],
      [2, -4, 8],
    ]);
    expectGridClose(dX, [
      [2.5, -0.5],
      [1.5, -1.5],
    ]);
    expect(db).toEqual([1, -1, 3]);
  });

  it("validates linear layer shapes and finite values", () => {
    expect(() => linearForward([[1, 2]], [[1], [2], [3]])).toThrow("Shape mismatch");
    expect(() => linearForward([[1, 2]], [[1], [2]], [1, 2])).toThrow("Bias shape mismatch");
    expect(() => linearForward([[1, Number.POSITIVE_INFINITY]], [[1], [2]])).toThrow(
      "X must contain only finite numbers",
    );
    expect(() => linearBackward([[1, 2]], [[1], [2]], [[1, 2]])).toThrow("Shape mismatch");
  });

  it("computes scaled dot-product attention with expected shapes and row-softmax", () => {
    const result = scaledDotProductAttention(
      [
        [1, 0],
        [0, 1],
      ],
      [
        [1, 0],
        [0, 1],
      ],
      [
        [1, 2],
        [3, 4],
      ],
    );
    expect(result.scores).toHaveLength(2);
    expect(result.scores[0]).toHaveLength(2);
    for (const row of result.weights) {
      expect(row.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
    }
    expect(result.output).toHaveLength(2);
    expect(result.output[0]).toHaveLength(2);
    expectGridClose(result.scores, [
      [Math.SQRT1_2, 0],
      [0, Math.SQRT1_2],
    ]);
    const e = Math.exp(Math.SQRT1_2);
    const z = e + 1;
    expectGridClose(result.weights, [
      [e / z, 1 / z],
      [1 / z, e / z],
    ]);
  });

  it("supports additive attention masks", () => {
    const unmasked = scaledDotProductAttention(
      [[1, 0]],
      [
        [1, 0],
        [0, 1],
      ],
      [[5], [10]],
    );
    const masked = scaledDotProductAttention(
      [[1, 0]],
      [
        [1, 0],
        [0, 1],
      ],
      [[5], [10]],
      { additiveMask: [[0, -1e9]] },
    );
    expect(masked.weights[0][0]).toBeGreaterThan(unmasked.weights[0][0]);
    expect(masked.weights[0][1]).toBeLessThan(1e-6);
  });

  it("combines causal masking with attention to suppress future tokens", () => {
    const Q = [
      [1, 0],
      [0, 1],
    ];
    const K = [
      [1, 0],
      [0, 1],
    ];
    const V = [[10], [20]];
    const masked = scaledDotProductAttention(Q, K, V, {
      additiveMask: causalMask(2, 2, -1e9),
    });
    expect(masked.weights[0][1]).toBeLessThan(1e-6);
    expect(masked.output[0][0]).toBeCloseTo(10, 6);
    expect(masked.output[1][0]).toBeGreaterThan(10);
    expect(masked.output[1][0]).toBeLessThan(20);
  });

  it("applies additive and causal masks together", () => {
    const Q = [[1, 0]];
    const K = [
      [1, 0],
      [0, 1],
    ];
    const V = [[1], [5]];
    const combined = scaledDotProductAttention(Q, K, V, {
      additiveMask: [[0, 0]].map((row, i) => row.map((v, j) => v + causalMask(1, 2, -1e9)[i][j])),
    });
    expect(combined.weights[0][1]).toBeLessThan(1e-6);
    expect(combined.output[0][0]).toBeCloseTo(1, 6);
  });

  it("validates attention dimensions and finite values", () => {
    expect(() => scaledDotProductAttention([[1, 2]], [[1]], [[1]])).toThrow(
      "Q and K must have the same feature width",
    );
    expect(() => scaledDotProductAttention([[1]], [[1], [2]], [[1]])).toThrow(
      "K and V must have the same number of rows",
    );
    expect(() =>
      scaledDotProductAttention([[1]], [[1]], [[1]], { additiveMask: [[0, 0]] }),
    ).toThrow("Attention mask must have shape");
    expect(() => scaledDotProductAttention([[Number.NaN]], [[1]], [[1]])).toThrow(
      "Q matrix must contain only finite numbers",
    );
    expect(() => scaledDotProductAttention([[1]], [[Number.NaN]], [[1]])).toThrow(
      "K matrix must contain only finite numbers",
    );
    expect(() => scaledDotProductAttention([[1]], [[1]], [[Number.POSITIVE_INFINITY]])).toThrow(
      "V matrix must contain only finite numbers",
    );
    expect(() =>
      scaledDotProductAttention([[1]], [[1]], [[1]], { additiveMask: [[Number.NaN]] }),
    ).toThrow("Attention mask must contain only finite numbers");
  });

  it("splits and concatenates heads across feature chunks", () => {
    const x = [
      [1, 2, 3, 4],
      [5, 6, 7, 8],
    ];
    const heads = splitHeads(x, 2);
    expect(heads).toEqual([
      [
        [1, 2],
        [5, 6],
      ],
      [
        [3, 4],
        [7, 8],
      ],
    ]);
    expect(concatHeads(heads)).toEqual(x);
    expect(concatHeads(splitHeads(x, 1))).toEqual(x);
    expect(concatHeads(splitHeads(x, 4))).toEqual(x);
  });

  it("creates a causal mask with large negative future entries", () => {
    expect(causalMask(3, 3, -100)).toEqual([
      [0, -100, -100],
      [0, 0, -100],
      [0, 0, 0],
    ]);
  });

  it("supports rectangular causal masks with default blocked value", () => {
    expect(causalMask(2, 4)).toEqual([
      [0, -1e9, -1e9, -1e9],
      [0, 0, -1e9, -1e9],
    ]);
    expect(causalMask(4, 2)).toEqual([
      [0, -1e9],
      [0, 0],
      [0, 0],
      [0, 0],
    ]);
  });

  it("builds sinusoidal positional encoding matrix", () => {
    const pe = sinusoidalPositionalEncoding(3, 4);
    expect(pe).toHaveLength(3);
    expect(pe[0]).toHaveLength(4);
    expect(pe[0][0]).toBeCloseTo(0, 12);
    expect(pe[0][1]).toBeCloseTo(1, 12);
    expect(pe[0][2]).toBeCloseTo(0, 12);
    expect(pe[0][3]).toBeCloseTo(1, 12);
    expect(pe[1][0]).toBeCloseTo(Math.sin(1), 12);
    expect(pe[1][1]).toBeCloseTo(Math.cos(1), 12);
    expect(pe[1][2]).toBeCloseTo(Math.sin(0.01), 12);
    expect(pe[1][3]).toBeCloseTo(Math.cos(0.01), 12);
  });

  it("supports custom positional encoding base", () => {
    const pe = sinusoidalPositionalEncoding(2, 6, 100);
    expect(pe[1][4]).toBeCloseTo(Math.sin(1 / 100 ** (4 / 6)), 12);
    expect(pe[1][5]).toBeCloseTo(Math.cos(1 / 100 ** (4 / 6)), 12);
  });

  it("handles odd dModel positional encoding channel pairing", () => {
    const pe = sinusoidalPositionalEncoding(2, 5, 10_000);
    expect(pe[1][0]).toBeCloseTo(Math.sin(1), 12);
    expect(pe[1][1]).toBeCloseTo(Math.cos(1), 12);
    expect(pe[1][2]).toBeCloseTo(Math.sin(1 / 10_000 ** (2 / 5)), 12);
    expect(pe[1][3]).toBeCloseTo(Math.cos(1 / 10_000 ** (2 / 5)), 12);
    expect(pe[1][4]).toBeCloseTo(Math.sin(1 / 10_000 ** (4 / 5)), 12);
  });

  it("validates head helpers and causal mask inputs", () => {
    expect(() => splitHeads([[1, 2, 3]], 2)).toThrow("must be divisible");
    expect(() => splitHeads([[1, 2]], 0)).toThrow("numHeads must be a positive integer");
    expect(() => splitHeads([[1, Number.NaN]], 1)).toThrow(
      "Input matrix must contain only finite numbers",
    );
    expect(() => concatHeads([])).toThrow("Heads list cannot be empty");
    expect(() => concatHeads([[[1], [2]], [[3]]])).toThrow(
      "All heads must have the same row count",
    );
    expect(() => concatHeads([[[Number.POSITIVE_INFINITY]]])).toThrow(
      "Head 1 matrix must contain only finite numbers",
    );
    expect(() => causalMask(0, 2)).toThrow("qRows and kRows must be positive integers");
    expect(() => causalMask(2, 2, 0)).toThrow("blockedValue must be a finite negative number");
    expect(() => causalMask(2, 2, Number.NaN)).toThrow(
      "blockedValue must be a finite negative number",
    );
    expect(() => sinusoidalPositionalEncoding(0, 4)).toThrow("seqLen must be a positive integer");
    expect(() => sinusoidalPositionalEncoding(4, 0)).toThrow("dModel must be a positive integer");
    expect(() => sinusoidalPositionalEncoding(4, 4, 1)).toThrow(
      "base must be a finite number greater than 1",
    );
    expect(() => sinusoidalPositionalEncoding(17, 4)).toThrow("Matrix exceeds 16×16 cap");
  });

  it("computes cosine similarity and pairwise distances", () => {
    const A = [
      [1, 0],
      [0, 1],
    ];
    expectGridClose(cosineSimilarityMatrix(A), [
      [1, 0],
      [0, 1],
    ]);
    const B = [[1, 1]];
    const cosineAB = cosineSimilarityMatrix(A, B);
    expect(cosineAB[0][0]).toBeCloseTo(Math.SQRT1_2, 10);
    expect(cosineAB[1][0]).toBeCloseTo(Math.SQRT1_2, 10);
    expectGridClose(pairwiseDistanceMatrix(A), [
      [0, Math.sqrt(2)],
      [Math.sqrt(2), 0],
    ]);
    expectGridClose(pairwiseDistanceMatrix(A, B, "manhattan"), [[1], [1]]);
  });

  it("validates similarity and distance inputs", () => {
    expect(() => cosineSimilarityMatrix([[0, 0]])).toThrow("zero norm");
    expect(() => cosineSimilarityMatrix([[1, 2]], [[1]])).toThrow("same dimension");
    expect(() => pairwiseDistanceMatrix([[1, 2]], [[1]], "euclidean")).toThrow("same dimension");
    expect(() => pairwiseDistanceMatrix([[Number.NaN, 1]], undefined, "manhattan")).toThrow(
      "finite numeric values",
    );
  });

  it("computes an Adam step and validates constraints", () => {
    const step = adamStep(
      [[0.4, -0.8]],
      [[0.1, -0.2]],
      [[0, 0]],
      [[0, 0]],
      0,
      0.01,
      0.9,
      0.999,
      1e-8,
      0,
    );
    expect(step.t).toBe(1);
    expectGridClose(step.params, [[0.39, -0.79]], 1e-6);
    expectGridClose(step.m, [[0.01, -0.02]], 1e-12);
    expectGridClose(step.v, [[0.00001, 0.00004]], 1e-12);

    const next = adamStep(
      step.params,
      [[0.1, -0.2]],
      step.m,
      step.v,
      step.t,
      0.01,
      0.9,
      0.999,
      1e-8,
    );
    expect(next.t).toBe(2);
    expect(() => adamStep([[1]], [[1]], [[0]], [[0]], 0, 0, 0.9, 0.999, 1e-8)).toThrow(
      "Learning rate must be a positive finite number",
    );
    expect(() => adamStep([[1]], [[1]], [[0]], [[0]], 0, 0.01, 1, 0.999, 1e-8)).toThrow(
      "beta1 must satisfy",
    );
    expect(() =>
      adamStep([[1]], [[1]], [[0]], [[Number.POSITIVE_INFINITY]], 0, 0.01, 0.9, 0.999, 1e-8),
    ).toThrow("Second-moment matrix must contain only finite numbers");
  });

  it("applies decoupled Adam weight decay", () => {
    const noDecay = adamStep([[1]], [[0]], [[0]], [[0]], 0, 0.1, 0.9, 0.999, 1e-8, 0);
    const withDecay = adamStep([[1]], [[0]], [[0]], [[0]], 0, 0.1, 0.9, 0.999, 1e-8, 0.5);
    expect(noDecay.params[0][0]).toBeCloseTo(1, 10);
    expect(withDecay.params[0][0]).toBeCloseTo(0.95, 10);
  });

  it("computes an SGD update step on parameter matrices", () => {
    const out = sgdStep(
      [
        [1, -2],
        [0.5, 3],
      ],
      [
        [0.1, -0.2],
        [0.4, 0],
      ],
      0.1,
    );
    expectGridClose(out, [
      [0.99, -1.98],
      [0.46, 3],
    ]);
  });

  it("validates SGD inputs", () => {
    expect(() => sgdStep([[1]], [[1, 2]], 0.1)).toThrow("same shape");
    expect(() => sgdStep([[1]], [[1]], 0)).toThrow(
      "Learning rate must be a positive finite number",
    );
  });

  it("SGD follows elementwise update rule and does not mutate inputs", () => {
    const params = [
      [1.5, -2],
      [0, 4.2],
    ];
    const grads = [
      [0.3, -0.5],
      [1.1, 0],
    ];
    const paramsBefore = params.map((row) => row.slice());
    const gradsBefore = grads.map((row) => row.slice());
    const lr = 0.2;

    const out = sgdStep(params, grads, lr);
    const expected = params.map((row, i) => row.map((p, j) => p - lr * grads[i][j]));
    expectGridClose(out, expected, 1e-12);
    expect(params).toEqual(paramsBefore);
    expect(grads).toEqual(gradsBefore);
    expect(out).not.toBe(params);
    expect(out[0]).not.toBe(params[0]);
  });

  it("computes momentum step with updated velocity", () => {
    const out = momentumStep([[1, -2]], [[0.2, -0.4]], [[0.5, 0.1]], 0.1, 0.9);
    expectGridClose(out.velocity, [[0.65, -0.31]]);
    expectGridClose(out.params, [[0.935, -1.969]]);
  });

  it("validates momentum step inputs", () => {
    expect(() => momentumStep([[1]], [[1]], [[1, 2]], 0.1, 0.9)).toThrow("Velocity matrix");
    expect(() => momentumStep([[1]], [[1]], [[0]], 0, 0.9)).toThrow(
      "Learning rate must be a positive finite number",
    );
    expect(() => momentumStep([[1]], [[1]], [[0]], 0.1, 1)).toThrow("momentum must satisfy");
  });

  it("momentum with zero coefficient matches SGD using previous velocity", () => {
    const params = [[2, -1, 0.5]];
    const grads = [[0.4, -0.2, 1.5]];
    const velocity = [[10, -10, 10]];
    const lr = 0.05;
    const out = momentumStep(params, grads, velocity, lr, 0);

    expectGridClose(out.velocity, grads, 1e-12);
    expectGridClose(out.params, sgdStep(params, grads, lr), 1e-12);
  });

  it("momentum with zero gradients only decays velocity and updates params accordingly", () => {
    const params = [[1, -3]];
    const grads = [[0, 0]];
    const velocity = [[0.8, -0.2]];
    const lr = 0.1;
    const momentum = 0.75;
    const out = momentumStep(params, grads, velocity, lr, momentum);

    const expectedVelocity = [[momentum * velocity[0][0], momentum * velocity[0][1]]];
    expectGridClose(out.velocity, expectedVelocity, 1e-12);
    expectGridClose(out.params, [
      [1 - lr * expectedVelocity[0][0], -3 - lr * expectedVelocity[0][1]],
    ]);
  });

  it("computes an SGD-style L2 weight-decay step", () => {
    const out = l2WeightDecayStep(
      [
        [1, -2],
        [0.5, 3],
      ],
      [
        [0.1, -0.2],
        [0.4, 0],
      ],
      0.1,
      0.01,
    );
    expectGridClose(out, [
      [0.989, -1.978],
      [0.4595, 2.997],
    ]);
  });

  it("validates L2 weight-decay step inputs", () => {
    expect(() => l2WeightDecayStep([[1]], [[1, 2]], 0.1, 0.01)).toThrow("same shape");
    expect(() => l2WeightDecayStep([[1]], [[1]], 0, 0.01)).toThrow(
      "Learning rate must be a positive finite number",
    );
    expect(() => l2WeightDecayStep([[1]], [[1]], 0.1, -1)).toThrow(
      "Weight decay must be a non-negative finite number",
    );
  });

  it("matches SGD update when weight decay is zero", () => {
    const params = [
      [1.2, -0.5],
      [0, 3.5],
    ];
    const grads = [
      [0.1, -0.4],
      [0.25, 1.5],
    ];
    const lr = 0.05;
    const out = l2WeightDecayStep(params, grads, lr, 0);
    expectGridClose(
      out,
      params.map((row, i) => row.map((p, j) => p - lr * grads[i][j])),
    );
  });

  it("shrinks parameters toward zero with no gradient", () => {
    const params = [[2, -4, 0.5]];
    const grads = [[0, 0, 0]];
    const lr = 0.1;
    const weightDecay = 0.2;
    const out = l2WeightDecayStep(params, grads, lr, weightDecay);
    const shrink = 1 - lr * weightDecay;
    expectGridClose(out, [params[0].map((p) => p * shrink)]);
  });

  it("satisfies affine-combination identity and does not mutate inputs", () => {
    const params = [
      [1.5, -2.25, 0.75],
      [0, 3.2, -4.8],
    ];
    const grads = [
      [0.3, -0.1, 2],
      [1.25, 0, -0.5],
    ];
    const paramsBefore = params.map((row) => row.slice());
    const gradsBefore = grads.map((row) => row.slice());
    const lr = 0.2;
    const weightDecay = 0.15;

    const out = l2WeightDecayStep(params, grads, lr, weightDecay);
    const expected = params.map((row, i) =>
      row.map((p, j) => (1 - lr * weightDecay) * p - lr * grads[i][j]),
    );
    expectGridClose(out, expected, 1e-12);
    expect(params).toEqual(paramsBefore);
    expect(grads).toEqual(gradsBefore);
    expect(out).not.toBe(params);
    expect(out[0]).not.toBe(params[0]);
  });

  it("Adam with beta1=beta2=0 uses sign-scaled adaptive update", () => {
    const params = [[1.2, -0.7, 0.3]];
    const grads = [[0.4, -0.1, 0.9]];
    const lr = 0.01;
    const eps = 1e-6;
    const out = adamStep(params, grads, [[0, 0, 0]], [[0, 0, 0]], 0, lr, 0, 0, eps, 0);

    expectGridClose(out.m, grads, 1e-12);
    expectGridClose(out.v, [[grads[0][0] ** 2, grads[0][1] ** 2, grads[0][2] ** 2]], 1e-12);
    expectGridClose(out.mHat, grads, 1e-12);
    expectGridClose(out.vHat, [[grads[0][0] ** 2, grads[0][1] ** 2, grads[0][2] ** 2]], 1e-12);
    const expected = params.map((row, i) =>
      row.map((p, j) => p - lr * (grads[i][j] / (Math.abs(grads[i][j]) + eps))),
    );
    expectGridClose(out.params, expected, 1e-12);
  });

  it("Adam keeps params fixed when grads and moments are all zero", () => {
    const params = [[1.5, -2.5]];
    const out = adamStep(params, [[0, 0]], [[0, 0]], [[0, 0]], 4, 0.01, 0.9, 0.999, 1e-8, 0);

    expectGridClose(out.params, params, 1e-12);
    expectGridClose(out.m, [[0, 0]], 1e-12);
    expectGridClose(out.v, [[0, 0]], 1e-12);
    expect(out.t).toBe(5);
  });

  it("applies dropout with deterministic mask and inverted scaling", () => {
    const input = [
      [2, 4],
      [6, 8],
    ];
    const mask = [
      [1, 0],
      [0, 1],
    ];
    const out = applyDropout(input, 0.5, mask);
    expect(out.mask).toEqual(mask);
    expectGridClose(out.output, [
      [4, 0],
      [0, 16],
    ]);
  });

  it("samples dropout mask when omitted and validates constraints", () => {
    const out = applyDropout([[1, 2]], 1);
    expect(out.mask).toEqual([[1, 1]]);
    expectGridClose(out.output, [[1, 2]]);

    expect(() => applyDropout([[1, 2]], 0)).toThrow("keepProb must satisfy 0 < keepProb <= 1");
    expect(() => applyDropout([[1, 2]], 0.5, [[1]])).toThrow("same shape");
    expect(() => applyDropout([[1, 2]], 0.5, [[1, 0.5]])).toThrow(
      "Dropout mask entries must be 0 or 1",
    );
    expect(() => applyDropout([[1, Number.NaN]], 0.5, [[1, 0]])).toThrow(
      "Input matrix must contain only finite numbers",
    );
  });

  it("samples deterministic dropout mask from Math.random and applies inverted scaling", () => {
    const randomSpy = vi.spyOn(Math, "random");
    randomSpy
      .mockReturnValueOnce(0.2)
      .mockReturnValueOnce(0.9)
      .mockReturnValueOnce(0.4)
      .mockReturnValueOnce(0.6);
    const out = applyDropout(
      [
        [10, 20],
        [30, 40],
      ],
      0.5,
    );
    expect(out.mask).toEqual([
      [1, 0],
      [1, 0],
    ]);
    expectGridClose(out.output, [
      [20, 0],
      [60, 0],
    ]);
    randomSpy.mockRestore();
  });

  it("returns a copied mask and preserves identity when keepProb is one", () => {
    const input = [
      [1, 2],
      [3, 4],
    ];
    const mask = [
      [1, 1],
      [1, 1],
    ];
    const out = applyDropout(input, 1, mask);
    expectGridClose(out.output, input);
    expect(out.mask).toEqual(mask);
    expect(out.mask).not.toBe(mask);
    mask[0][0] = 0;
    expect(out.mask[0][0]).toBe(1);
  });

  it("uses provided mask without sampling and supports all-dropped output", () => {
    const randomSpy = vi.spyOn(Math, "random");
    const input = [
      [5, -3],
      [2, 10],
    ];
    const mask = [
      [0, 0],
      [0, 0],
    ];
    const keepProb = 0.25;
    const out = applyDropout(input, keepProb, mask);

    expect(randomSpy).not.toHaveBeenCalled();
    expect(out.mask).toEqual(mask);
    expectGridClose(out.output, [
      [0, 0],
      [0, 0],
    ]);
    randomSpy.mockRestore();
  });

  it("computes truncated SVD and reconstructs original matrix at full rank", () => {
    const A = [
      [3, 1],
      [1, 3],
      [0, 2],
    ];
    const svd = truncatedSvd(A, 2);
    expect(svd.U.length).toBe(3);
    expect(svd.U[0].length).toBe(2);
    expect(svd.S.length).toBe(2);
    expect(svd.Vt.length).toBe(2);
    expect(svd.Vt[0].length).toBe(2);
    expect(svd.S[0]).toBeGreaterThanOrEqual(svd.S[1]);
    const recon = reconstructFromTruncatedSvd(svd.U, svd.S, svd.Vt);
    expectGridClose(recon, A, 1e-6);
  });

  it("uses effective rank by default for rank-deficient matrices", () => {
    const A = [
      [1, 2],
      [2, 4],
      [3, 6],
    ];
    const svd = truncatedSvd(A);
    expect(svd.S.length).toBe(1);
    expect(svd.U[0].length).toBe(1);
    expect(svd.Vt.length).toBe(1);
    const recon = reconstructFromTruncatedSvd(svd.U, svd.S, svd.Vt);
    expectGridClose(recon, A, 1e-6);
    expect(svd.singularValues.length).toBe(2);
    expect(svd.singularValues[1]).toBeLessThan(1e-8);
  });

  it("low-rank approximation reduces reconstruction error with larger k", () => {
    const A = [
      [4, 2, 0],
      [1, 3, 1],
      [0, 1, 2],
    ];
    const rank1 = lowRankApproximation(A, 1);
    const rank2 = lowRankApproximation(A, 2);
    const frobError = (left: number[][], right: number[][]) =>
      Math.sqrt(
        left.reduce(
          (sum, row, i) =>
            sum + row.reduce((inner, v, j) => inner + (v - right[i][j]) * (v - right[i][j]), 0),
          0,
        ),
      );
    const e1 = frobError(rank1, A);
    const e2 = frobError(rank2, A);
    expect(e2).toBeLessThan(e1);
  });

  it("computes PCA from SVD with sane shapes and explained variance ratios", () => {
    const X = [
      [2, 0],
      [0, 2],
      [3, 1],
      [1, 3],
    ];
    const pca = pcaFromSvd(X, 2);
    expect(pca.centered.length).toBe(4);
    expect(pca.centered[0].length).toBe(2);
    expect(pca.means.length).toBe(2);
    expect(pca.components.length).toBe(2);
    expect(pca.components[0].length).toBe(2);
    expect(pca.scores.length).toBe(4);
    expect(pca.scores[0].length).toBe(2);
    expect(pca.explainedVarianceRatio[0]).toBeGreaterThan(0);
    expect(pca.explainedVarianceRatio[1]).toBeGreaterThanOrEqual(0);
    const ratioSum = pca.explainedVarianceRatio[0] + pca.explainedVarianceRatio[1];
    expect(ratioSum).toBeCloseTo(1, 6);
  });

  it("throws for zero-variance PCA inputs due to zero effective rank", () => {
    const X = [
      [5, 5, 5],
      [5, 5, 5],
      [5, 5, 5],
    ];
    expect(() => pcaFromSvd(X, 2)).toThrow("k must be an integer in [1, 3]");
  });

  it("validates SVD/PCA argument shapes and rank parameters", () => {
    expect(() => truncatedSvd([[1, 2]], 0)).toThrow("k must be an integer");
    expect(() => lowRankApproximation([[1, 2]], 3)).toThrow("k must be an integer");
    expect(() => reconstructFromTruncatedSvd([[1]], [1, 2], [[1]])).toThrow(
      "S length must match U/Vt truncated rank",
    );
    expect(() => pcaFromSvd([[1, 2]], 1)).toThrow("at least 2 observations");
    expect(() =>
      pcaFromSvd(
        [
          [1, 2],
          [3, 4],
        ],
        0,
      ),
    ).toThrow("k must be an integer");
    expect(() => reconstructFromTruncatedSvd([[1]], [-1], [[1]])).toThrow(
      "S must contain finite non-negative singular values",
    );
    expect(() => reconstructFromTruncatedSvd([[1]], [Number.NaN], [[1]])).toThrow(
      "S must contain finite non-negative singular values",
    );
  });
});
