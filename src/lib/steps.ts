// Generates human-readable step-by-step working for matrix operations.
// Each step is a heading + a string body (so callers can render with simple JSX).

import {
  Expr, add as eAdd, sub as eSub, mul as eMul, ZERO, isZero,
} from "./expr";
import { Matrix, dims, formatExpr } from "./matrix";

export type Step = { title: string; body: string };

function fmt(e: Expr) { return formatExpr(e); }

export function multiplySteps(a: Matrix, b: Matrix): Step[] {
  const ad = dims(a), bd = dims(b);
  if (ad.cols !== bd.rows) return [];
  const steps: Step[] = [];
  steps.push({
    title: "Setup",
    body: `A is ${ad.rows}×${ad.cols}, B is ${bd.rows}×${bd.cols}. Result C = A·B is ${ad.rows}×${bd.cols}.\nEach entry C[i][j] = sum over k of A[i][k] · B[k][j].`,
  });
  for (let i = 0; i < ad.rows; i++) {
    for (let j = 0; j < bd.cols; j++) {
      const parts: string[] = [];
      let total: Expr = ZERO;
      for (let k = 0; k < ad.cols; k++) {
        parts.push(`(${fmt(a[i][k])})·(${fmt(b[k][j])})`);
        total = eAdd(total, eMul(a[i][k], b[k][j]));
      }
      steps.push({
        title: `C[${i + 1}][${j + 1}]`,
        body: `${parts.join(" + ")} = ${fmt(total)}`,
      });
    }
  }
  return steps;
}

export function addSteps(a: Matrix, b: Matrix, op: "+" | "-"): Step[] {
  const ad = dims(a), bd = dims(b);
  if (ad.rows !== bd.rows || ad.cols !== bd.cols) return [];
  const steps: Step[] = [{
    title: "Setup",
    body: `Both matrices are ${ad.rows}×${ad.cols}. Add (or subtract) entry by entry.`,
  }];
  for (let i = 0; i < ad.rows; i++) {
    for (let j = 0; j < ad.cols; j++) {
      const v = op === "+" ? eAdd(a[i][j], b[i][j]) : eSub(a[i][j], b[i][j]);
      steps.push({
        title: `C[${i + 1}][${j + 1}]`,
        body: `(${fmt(a[i][j])}) ${op} (${fmt(b[i][j])}) = ${fmt(v)}`,
      });
    }
  }
  return steps;
}

export function transposeSteps(a: Matrix): Step[] {
  const ad = dims(a);
  return [{
    title: "Method",
    body: `Aᵀ swaps rows and columns. Aᵀ[i][j] = A[j][i]. Result is ${ad.cols}×${ad.rows}.`,
  }];
}

export function determinantSteps(a: Matrix): Step[] {
  const { rows, cols } = dims(a);
  if (rows !== cols) return [];
  const n = rows;
  if (n === 1) return [{ title: "1×1 determinant", body: `det = ${fmt(a[0][0])}` }];
  if (n === 2) {
    const ad = eMul(a[0][0], a[1][1]);
    const bc = eMul(a[0][1], a[1][0]);
    return [
      { title: "2×2 formula", body: `det = a·d − b·c` },
      {
        title: "Substitute",
        body: `= (${fmt(a[0][0])})·(${fmt(a[1][1])}) − (${fmt(a[0][1])})·(${fmt(a[1][0])})\n= ${fmt(ad)} − ${fmt(bc)}\n= ${fmt(eSub(ad, bc))}`,
      },
    ];
  }
  // Laplace along row 1
  const steps: Step[] = [{
    title: "Cofactor expansion (row 1)",
    body: `det(A) = Σ (−1)^(1+j) · A[1][j] · M[1][j], where M[1][j] is the (n−1)×(n−1) minor.`,
  }];
  for (let j = 0; j < n; j++) {
    if (isZero(a[0][j])) {
      steps.push({ title: `j = ${j + 1}`, body: `A[1][${j + 1}] = 0, term contributes 0.` });
      continue;
    }
    const minor = a.slice(1).map((row) => row.filter((_, k) => k !== j));
    const sign = j % 2 === 0 ? "+" : "−";
    steps.push({
      title: `j = ${j + 1}`,
      body: `${sign} (${fmt(a[0][j])}) · det(minor)\nMinor:\n${minor.map((r) => r.map(fmt).join("\t")).join("\n")}`,
    });
  }
  return steps;
}

export function inverseSteps(a: Matrix): Step[] {
  const { rows, cols } = dims(a);
  if (rows !== cols) return [];
  const n = rows;
  if (n === 2) {
    return [
      { title: "2×2 formula", body: `A⁻¹ = (1/det) · [[d, −b], [−c, a]]` },
      { title: "Substitute", body: `a=${fmt(a[0][0])}, b=${fmt(a[0][1])}, c=${fmt(a[1][0])}, d=${fmt(a[1][1])}` },
    ];
  }
  return [{
    title: "Method",
    body: `Augment [A | I] and apply row operations until the left becomes I. The right side is then A⁻¹.`,
  }];
}

export function scalarSteps(a: Matrix, s: Expr): Step[] {
  return [{
    title: "Method",
    body: `Multiply each entry of A by ${fmt(s)}.`,
  }];
}

export function powerSteps(p: number): Step[] {
  if (p === 0) return [{ title: "A⁰", body: "Any square matrix to the power 0 is the identity matrix I." }];
  return [{ title: `A^${p}`, body: `Multiply A by itself ${p} time(s): A · A · … · A.` }];
}
