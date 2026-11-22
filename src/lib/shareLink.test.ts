import { describe, expect, it } from "vitest";
import { decodeMatrix, encodeMatrix, inputKey } from "@/lib/shareLink";
import { matrixToText, parseMatrixText } from "@/lib/matrix";

describe("inputKey", () => {
  it("derives short, stable keys from input titles", () => {
    expect(inputKey("Matrix A")).toBe("a");
    expect(inputKey("Matrix B (numeric)")).toBe("b");
    expect(inputKey("Feature map (numeric)")).toBe("feature-map");
    expect(inputKey("Kernel (numeric)")).toBe("kernel");
    expect(inputKey("(numeric)")).toBe("m");
  });
});

describe("encodeMatrix / decodeMatrix", () => {
  it("round-trips integers, fractions, decimals and expressions exactly", () => {
    const m = parseMatrixText("1\t-2\t3/4\n0.5\t2x + 1\ta^2");
    const encoded = encodeMatrix(m);
    expect(encoded).not.toMatch(/[\t\n]/);
    expect(matrixToText(decodeMatrix(encoded))).toBe(matrixToText(m));
  });

  it("encodes rows with ';' and cells with ','", () => {
    expect(encodeMatrix(parseMatrixText("1\t2\n3\t4"))).toBe("1,2;3,4");
  });

  it("rejects oversized or malformed shared matrices", () => {
    const big = Array.from({ length: 11 }, () => "1").join(";");
    expect(() => decodeMatrix(big)).toThrow(/limited/);
    expect(() => decodeMatrix("1,2;3")).toThrow();
    expect(() => decodeMatrix("1,(")).toThrow();
  });
});
