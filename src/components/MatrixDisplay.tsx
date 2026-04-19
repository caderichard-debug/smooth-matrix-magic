import { formatNumber, type Matrix } from "@/lib/matrix";

export function MatrixDisplay({ m, label }: { m: Matrix; label?: string }) {
  const rows = m.length;
  const cols = m[0]?.length ?? 0;
  return (
    <div className="inline-flex flex-col gap-2">
      {label && (
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      )}
      <div className="relative px-4 py-3 rounded-md bg-card/60">
        {/* brackets */}
        <span className="absolute left-0 top-0 bottom-0 w-2 border-l-2 border-t-2 border-b-2 border-primary rounded-l-sm" />
        <span className="absolute right-0 top-0 bottom-0 w-2 border-r-2 border-t-2 border-b-2 border-primary rounded-r-sm" />
        <div
          className="grid gap-x-4 gap-y-1 font-mono text-foreground"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(2rem, max-content))` }}
        >
          {m.flatMap((row, i) =>
            row.map((v, j) => (
              <div key={`${i}-${j}`} className="text-right tabular-nums">
                {formatNumber(v)}
              </div>
            )),
          )}
        </div>
        <div className="text-[10px] text-muted-foreground mt-2 text-right">
          {rows} × {cols}
        </div>
      </div>
    </div>
  );
}
