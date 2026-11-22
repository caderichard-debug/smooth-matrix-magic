import { useEffect, useRef, useState } from "react";
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
        .map((r) => r.map((c) => (/[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(","))
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

  // Track whether the matrix is wider than its box (phones) and whether more columns remain
  // to the right, so we can show a fade + swipe hint instead of an unexplained cut-off.
  const scrollRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState<{ any: boolean; more: boolean }>({
    any: false,
    more: false,
  });
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      const any = el.scrollWidth > el.clientWidth + 1;
      const more = any && el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
      setOverflow((prev) => (prev.any === any && prev.more === more ? prev : { any, more }));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    el.addEventListener("scroll", update, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", update);
    };
  }, []);

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
    <div className="inline-flex max-w-full flex-col gap-2">
      {label && (
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      )}
      <div className="relative max-w-full px-4 py-3 rounded-md bg-card/60">
        <span className="absolute left-0 top-0 bottom-0 w-2 border-l-2 border-t-2 border-b-2 border-primary rounded-l-sm" />
        <span className="absolute right-0 top-0 bottom-0 w-2 border-r-2 border-t-2 border-b-2 border-primary rounded-r-sm" />
        {/* Columns never shrink below their content; wide matrices scroll inside the brackets
            instead of squeezing cells into each other on narrow screens. */}
        <div
          ref={scrollRef}
          className={`overflow-x-auto ${overflow.more ? "matrix-scroll-fade" : ""}`}
        >
          <div
            className="grid w-max gap-x-4 gap-y-1 font-mono text-foreground"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(2rem, max-content))` }}
          >
            {m.flatMap((row, i) =>
              row.map((v, j) => (
                <div key={`${i}-${j}`} className="whitespace-nowrap text-right tabular-nums">
                  {formatExpr(v)}
                </div>
              )),
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mt-2 gap-3">
          <div className="text-[10px] text-muted-foreground">
            {rows} × {cols}
            {overflow.any && <span className="ml-1 whitespace-nowrap">· swipe for more →</span>}
          </div>
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
