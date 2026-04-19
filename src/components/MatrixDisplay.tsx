import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatExpr, type Matrix } from "@/lib/matrix";

type Props = {
  m: Matrix;
  label?: string;
  showCopy?: boolean;
};

export function MatrixDisplay({ m, label, showCopy = true }: Props) {
  const rows = m.length;
  const cols = m[0]?.length ?? 0;
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const text = m.map((r) => r.map(formatExpr).join("\t")).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="inline-flex flex-col gap-2">
      {label && (
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      )}
      <div className="relative px-4 py-3 rounded-md bg-card/60">
        <span className="absolute left-0 top-0 bottom-0 w-2 border-l-2 border-t-2 border-b-2 border-primary rounded-l-sm" />
        <span className="absolute right-0 top-0 bottom-0 w-2 border-r-2 border-t-2 border-b-2 border-primary rounded-r-sm" />
        <div
          className="grid gap-x-4 gap-y-1 font-mono text-foreground"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(2rem, max-content))` }}
        >
          {m.flatMap((row, i) =>
            row.map((v, j) => (
              <div key={`${i}-${j}`} className="text-right tabular-nums">
                {formatExpr(v)}
              </div>
            )),
          )}
        </div>
        <div className="flex items-center justify-between mt-2 gap-3">
          <div className="text-[10px] text-muted-foreground">{rows} × {cols}</div>
          {showCopy && (
            <Button type="button" variant="ghost" size="sm" onClick={copy} className="h-7 px-2 text-xs">
              {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
