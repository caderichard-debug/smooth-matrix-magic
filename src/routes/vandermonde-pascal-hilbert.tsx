import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { AdSlot } from "@/components/AdSlot";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatNumber, parseExpr, type Matrix } from "@/lib/matrix";

export const Route = createFileRoute("/vandermonde-pascal-hilbert")({
  head: () => ({
    meta: [
      { title: "Vandermonde, Pascal & Hilbert Matrix Generator" },
      {
        name: "description",
        content:
          "Generate Vandermonde, Pascal, and Hilbert matrices with size controls and custom Vandermonde nodes.",
      },
      { property: "og:title", content: "Vandermonde, Pascal & Hilbert Generator" },
      { property: "og:description", content: "Create classic structured matrices for interpolation, combinatorics, and conditioning studies." },
    ],
  }),
  component: VandermondePascalHilbertPage,
});

function VandermondePascalHilbertPage() {
  const [nText, setNText] = useState("4");
  const [xText, setXText] = useState("1,2,3,4");

  const randomNodes = () => {
    const n = Number.parseInt(nText, 10);
    if (!Number.isInteger(n) || n < 1) return;
    const values = Array.from({ length: n }, () => formatNumber(-3 + Math.random() * 6));
    setXText(values.join(","));
  };

  const out = useMemo(() => {
    try {
      const n = Number.parseInt(nText, 10);
      if (!Number.isInteger(n) || n < 1 || n > 10) throw new Error("n must be an integer between 1 and 10");
      const xs = xText.split(",").map((v) => Number.parseFloat(v.trim())).filter((v) => Number.isFinite(v));
      if (xs.length !== n) throw new Error(`Provide exactly ${n} numeric node values for Vandermonde`);

      const vandermonde: Matrix = xs.map((x) =>
        Array.from({ length: n }, (_, j) => parseExpr(formatNumber(x ** j))),
      );
      const pascal: Matrix = Array.from({ length: n }, (_, i) =>
        Array.from({ length: n }, (_, j) => parseExpr(String(binomial(i + j, i)))),
      );
      const hilbert: Matrix = Array.from({ length: n }, (_, i) =>
        Array.from({ length: n }, (_, j) => parseExpr(`1/${i + j + 1}`)),
      );

      return { vandermonde, pascal, hilbert, error: null as string | null };
    } catch (e) {
      return { vandermonde: null, pascal: null, hilbert: null, error: e instanceof Error ? e.message : "Error" };
    }
  }, [nText, xText]);

  return (
    <PageLayout
      title="Vandermonde / Pascal / Hilbert"
      tagline="Generate structured matrices that appear in interpolation, combinatorics, and numerical stability analysis."
      showHowItWorks={false}
    >
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card/40 p-6 space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Matrix size n</Label>
          <Input value={nText} onChange={(e) => setNText(e.target.value)} className="font-mono" />
        </div>
        <div className="rounded-lg border border-border bg-card/40 p-6 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Vandermonde nodes x1,...,xn</Label>
            <Button type="button" variant="secondary" onClick={randomNodes}>Randomize</Button>
          </div>
          <Input value={xText} onChange={(e) => setXText(e.target.value)} className="font-mono" />
        </div>
      </div>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-4">
        <h2 className="text-xl font-semibold">Generated matrices</h2>
        {out.error ? (
          <p className="text-sm font-mono text-destructive">{out.error}</p>
        ) : (
          <div className="grid lg:grid-cols-2 gap-4">
            {out.vandermonde && <div className="overflow-x-auto"><MatrixDisplay m={out.vandermonde} label="Vandermonde V(i,j)=x_i^(j-1)" /></div>}
            {out.pascal && <div className="overflow-x-auto"><MatrixDisplay m={out.pascal} label="Pascal P(i,j)=C(i+j-2,i-1)" /></div>}
            {out.hilbert && <div className="overflow-x-auto"><MatrixDisplay m={out.hilbert} label="Hilbert H(i,j)=1/(i+j-1)" /></div>}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold">How Vandermonde, Pascal, and Hilbert works</h2>
        <p className="text-sm text-muted-foreground">
          Vandermonde matrices encode polynomial interpolation constraints: each row is powers of one node
          <span className="font-mono"> x_i</span>. Distinct nodes give a nonzero determinant.
        </p>
        <p className="text-sm text-muted-foreground">
          Pascal matrices carry binomial coefficients and arise in combinatorial transforms. Hilbert matrices are classic
          examples of ill-conditioned systems, so they are useful for testing numerical sensitivity.
        </p>
      </section>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}

function binomial(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let kk = Math.min(k, n - k);
  let out = 1;
  for (let i = 1; i <= kk; i++) out = (out * (n - kk + i)) / i;
  return Math.round(out);
}
