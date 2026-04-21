import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdSlot } from "@/components/AdSlot";
import { MatrixDisplay } from "@/components/MatrixDisplay";
import { PageLayout } from "@/components/PageLayout";
import { causalMask, gridToMatrix, sinusoidalPositionalEncoding } from "@/lib/mlOps";

export const Route = createFileRoute("/ml-sequence-ops")({
  head: () => ({
    meta: [
      { title: "Sequence Model Matrix Ops — Positional Encoding + Causal Mask" },
      {
        name: "description",
        content:
          "Generate sinusoidal positional encoding matrices and causal attention masks for sequence models.",
      },
      { property: "og:title", content: "Sequence Model Matrix Ops" },
      {
        property: "og:description",
        content:
          "Interactive walkthrough for positional encodings and causal masks used in transformer attention.",
      },
    ],
  }),
  component: MlSequenceOpsPage,
});

function MlSequenceOpsPage() {
  const [seqLenStr, setSeqLenStr] = useState("6");
  const [qRowsStr, setQRowsStr] = useState("6");
  const [kRowsStr, setKRowsStr] = useState("6");
  const [dModelStr, setDModelStr] = useState("8");
  const [baseStr, setBaseStr] = useState("10000");
  const [blockedValueStr, setBlockedValueStr] = useState("-1e9");

  const result = useMemo(() => {
    try {
      const seqLen = Number(seqLenStr);
      const qRows = Number(qRowsStr);
      const kRows = Number(kRowsStr);
      const dModel = Number(dModelStr);
      const base = Number(baseStr);
      const blockedValue = Number(blockedValueStr);
      const pe = sinusoidalPositionalEncoding(seqLen, dModel, base);
      const mask = causalMask(qRows, kRows, blockedValue);
      return {
        pe: gridToMatrix(pe),
        mask: gridToMatrix(mask),
        error: null as string | null,
      };
    } catch (e) {
      return {
        pe: null,
        mask: null,
        error: e instanceof Error ? e.message : "Error",
      };
    }
  }, [seqLenStr, qRowsStr, kRowsStr, dModelStr, baseStr, blockedValueStr]);

  return (
    <PageLayout
      title="Sequence-Model Matrix Ops"
      tagline="Build positional encoding and causal mask matrices used by transformer attention."
      showHowItWorks={false}
    >
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <section className="rounded-lg border border-border bg-card/40 p-6 space-y-4">
          <h2 className="text-xl font-semibold">Parameters</h2>
          <NumberField
            id="seq-len"
            label="Sequence length (L)"
            value={seqLenStr}
            onChange={setSeqLenStr}
          />
          <NumberField
            id="d-model"
            label="Model width (d_model)"
            value={dModelStr}
            onChange={setDModelStr}
          />
          <NumberField
            id="q-rows"
            label="Causal mask query rows (qRows)"
            value={qRowsStr}
            onChange={setQRowsStr}
          />
          <NumberField
            id="k-rows"
            label="Causal mask key rows (kRows)"
            value={kRowsStr}
            onChange={setKRowsStr}
          />
          <NumberField
            id="base"
            label="Positional base (B)"
            value={baseStr}
            onChange={setBaseStr}
          />
          <NumberField
            id="blocked-value"
            label="Causal blocked value"
            value={blockedValueStr}
            onChange={setBlockedValueStr}
          />
          <p className="text-xs text-muted-foreground">
            Typical values: <span className="font-mono">-1e9</span> or{" "}
            <span className="font-mono">-10000</span>. Current matrix cap is 16x16.
          </p>
        </section>

        <section className="rounded-lg border border-border bg-card/40 p-6 space-y-5">
          <h2 className="text-xl font-semibold">Generated matrices</h2>
          {result.error ? (
            <p className="text-destructive font-mono text-sm">{result.error}</p>
          ) : (
            <>
              {result.pe ? (
                <div>
                  <h3 className="font-medium mb-2">Positional encoding matrix P (L x d_model)</h3>
                  <div className="overflow-x-auto">
                    <MatrixDisplay m={result.pe} />
                  </div>
                </div>
              ) : null}
              {result.mask ? (
                <div>
                  <h3 className="font-medium mb-2">Causal mask M (qRows x kRows)</h3>
                  <div className="overflow-x-auto">
                    <MatrixDisplay m={result.mask} />
                  </div>
                </div>
              ) : null}
            </>
          )}
        </section>
      </div>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold">Equations</h2>
        <p className="text-sm text-muted-foreground">
          Sinusoidal positional encoding uses paired frequencies:
          <span className="font-mono">
            {" "}
            P[pos,2i] = sin(pos / B^(2i/d_model)), P[pos,2i+1] = cos(pos / B^(2i/d_model))
          </span>
          .
        </p>
        <p className="text-sm text-muted-foreground">
          Causal masking blocks future key positions in attention scores:
          <span className="font-mono"> M[i,j] = 0 if j &lt;= i, else blockedValue</span>. Adding M
          before row-wise softmax suppresses attention to future tokens.
        </p>
      </section>

      <AdSlot label="Ad space — below result" height="h-28" />
    </PageLayout>
  );
}

type NumberFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
};

function NumberField({ id, label, value, onChange }: NumberFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type="number"
        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
