import { useState } from "react";
import { Copy, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { formatExpr, type Matrix } from "@/lib/matrix";

type Props = {
  m: Matrix;
  label?: string;
  showCopy?: boolean;
};

type Format = "tsv" | "csv" | "latex" | "numpy" | "matlab";

function serialize(m: Matrix, fmt: Format): string {
  const cells = m.map((r) => r.map(formatExpr));
  switch (fmt) {
    case "tsv":
      return cells.map((r) => r.join("\t")).join("\n");
    case "csv":
      // Quote any cell containing comma, quote, or newline.
      return cells
        .map((r) =>
          r
            .map((c) => (/[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c))
            .join(","),
        )
        .join("\n");
    case "latex":
      return `\\begin{bmatrix}\n${cells.map((r) => "  " + r.join(" & ")).join(" \\\\\n")}\n\\end{bmatrix}`;
    case "numpy":
      return `np.array([\n${cells.map((r) => "  [" + r.map((c) => `"${c}"`).join(", ") + "]").join(",\n")}\n])`;
    case "matlab":
      return `[${cells.map((r) => r.join(" ")).join("; ")}]`;
  }
}

const formats: { value: Format; label: string; hint: string }[] = [
  { value: "tsv", label: "Plain text", hint: "Tab-separated · Excel / Sheets" },
  { value: "csv", label: "CSV", hint: "Comma-separated values" },
  { value: "latex", label: "LaTeX", hint: "\\begin{bmatrix} … \\end{bmatrix}" },
  { value: "numpy", label: "Python (NumPy)", hint: "np.array([[…]])" },
  { value: "matlab", label: "MATLAB", hint: "[a b; c d]" },
];

export function MatrixDisplay({ m, label, showCopy = true }: Props) {
  const rows = m.length;
  const cols = m[0]?.length ?? 0;
  const [copied, setCopied] = useState<Format | null>(null);

  const copy = async (fmt: Format) => {
    try {
      await navigator.clipboard.writeText(serialize(m, fmt));
      setCopied(fmt);
      setTimeout(() => setCopied(null), 1500);
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
          style={{ gridTemplateColumns: `repeat(${cols}, 4rem)` }}
        >
          {m.flatMap((row, i) =>
            row.map((v, j) => (
              <div
                key={`${i}-${j}`}
                className="text-right tabular-nums truncate"
                title={formatExpr(v)}
              >
                {formatExpr(v)}
              </div>
            )),
          )}
        </div>
        <div className="flex items-center justify-between mt-2 gap-3">
          <div className="text-[10px] text-muted-foreground">{rows} × {cols}</div>
          {showCopy && (
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => copy("tsv")}
                className="h-7 px-2 text-xs"
              >
                {copied === "tsv" ? <Check className="size-3" /> : <Copy className="size-3" />}
                {copied === "tsv" ? "Copied" : "Copy"}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-1.5 text-xs"
                    aria-label="Copy as…"
                  >
                    <ChevronDown className="size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover w-56">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Copy as…
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {formats.map((f) => (
                    <DropdownMenuItem
                      key={f.value}
                      onClick={() => copy(f.value)}
                      className="cursor-pointer flex items-start gap-2"
                    >
                      <div className="flex-1">
                        <div className="text-sm flex items-center gap-2">
                          {f.label}
                          {copied === f.value && <Check className="size-3 text-primary" />}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">{f.hint}</div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
