import { useEffect, useRef, useState, KeyboardEvent, ClipboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  makeMatrix, matrixToText, parseMatrixText, formatExpr, type Matrix,
} from "@/lib/matrix";
import { ZERO, parse as parseExprStr } from "@/lib/expr";
import { Shuffle, Eraser } from "lucide-react";

type Props = {
  title: string;
  value: Matrix;
  onChange: (m: Matrix) => void;
};

export function MatrixInput({ title, value, onChange }: Props) {
  const rows = value.length;
  const cols = value[0]?.length ?? 0;

  // Cell text is local — we only commit to the parent matrix when it parses cleanly.
  // This lets users type partial expressions like "3/" or "2x+" without errors flashing.
  const [cellText, setCellText] = useState<string[][]>(() =>
    value.map((row) => row.map((c) => formatExpr(c))),
  );
  const [cellError, setCellError] = useState<Record<string, boolean>>({});

  const [text, setText] = useState(() => matrixToText(value));
  const [textError, setTextError] = useState<string | null>(null);

  // Sync local text when parent value changes (e.g. random / clear / use-as-A).
  // Compare to current rendered cells to avoid clobbering an in-progress edit.
  const lastSync = useRef("");
  useEffect(() => {
    const sig = matrixToText(value);
    if (sig === lastSync.current) return;
    lastSync.current = sig;
    setCellText(value.map((row) => row.map((c) => formatExpr(c))));
    setText(sig);
    setCellError({});
  }, [value]);

  const cellRefs = useRef<(HTMLInputElement | null)[][]>([]);
  const setRef = (i: number, j: number) => (el: HTMLInputElement | null) => {
    if (!cellRefs.current[i]) cellRefs.current[i] = [];
    cellRefs.current[i][j] = el;
  };
  const focusCell = (i: number, j: number) => {
    const r = Math.max(0, Math.min(rows - 1, i));
    const c = Math.max(0, Math.min(cols - 1, j));
    const el = cellRefs.current[r]?.[c];
    if (el) { el.focus(); el.select(); }
  };

  const setDims = (r: number, c: number) => {
    r = Math.max(1, Math.min(10, r || 1));
    c = Math.max(1, Math.min(10, c || 1));
    const next = makeMatrix(r, c);
    for (let i = 0; i < r; i++)
      for (let j = 0; j < c; j++) next[i][j] = value[i]?.[j] ?? ZERO;
    onChange(next);
  };

  const commitCell = (i: number, j: number, raw: string) => {
    const trimmed = raw.trim();
    const next = cellText.map((row) => row.slice());
    next[i][j] = raw;
    setCellText(next);

    if (trimmed === "" || trimmed === "-") {
      // Treat empty as zero, but don't error.
      const m = value.map((row) => row.slice());
      m[i][j] = ZERO;
      setCellError((e) => ({ ...e, [`${i}-${j}`]: false }));
      onChange(m);
      return;
    }
    try {
      const e = parseExprStr(trimmed);
      const m = value.map((row) => row.slice());
      m[i][j] = e;
      setCellError((er) => ({ ...er, [`${i}-${j}`]: false }));
      onChange(m);
    } catch {
      setCellError((er) => ({ ...er, [`${i}-${j}`]: true }));
    }
  };

  const onCellKeyDown = (i: number, j: number, e: KeyboardEvent<HTMLInputElement>) => {
    const ctrl = e.ctrlKey || e.metaKey;
    if (ctrl && e.key === "ArrowRight") { e.preventDefault(); focusCell(i, cols - 1); return; }
    if (ctrl && e.key === "ArrowLeft")  { e.preventDefault(); focusCell(i, 0); return; }
    if (ctrl && e.key === "ArrowDown")  { e.preventDefault(); focusCell(rows - 1, j); return; }
    if (ctrl && e.key === "ArrowUp")    { e.preventDefault(); focusCell(0, j); return; }
    if (e.key === "ArrowRight" && (e.currentTarget.selectionStart ?? 0) === e.currentTarget.value.length) {
      e.preventDefault(); focusCell(i, j + 1); return;
    }
    if (e.key === "ArrowLeft" && (e.currentTarget.selectionEnd ?? 0) === 0) {
      e.preventDefault(); focusCell(i, j - 1); return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); focusCell(i + 1, j); return; }
    if (e.key === "ArrowUp")   { e.preventDefault(); focusCell(i - 1, j); return; }
    if (e.key === "Enter")     { e.preventDefault(); focusCell(i + 1, j); return; }
    if (e.key === "Tab" && !e.shiftKey && j === cols - 1 && i === rows - 1) {
      // let default Tab behavior leave the grid
    }
  };

  // Paste detection — if user pastes multi-row/col text into a cell, replace whole matrix.
  const onCellPaste = (i: number, j: number, e: ClipboardEvent<HTMLInputElement>) => {
    const data = e.clipboardData.getData("text");
    if (!data || (!data.includes("\n") && !data.includes("\t") && !/ {2,}/.test(data) && !/[,;]/.test(data))) {
      return; // let normal single-cell paste happen
    }
    e.preventDefault();
    try {
      const m = parseMatrixText(data);
      onChange(m);
    } catch (err) {
      // fall back: insert raw text into cell
      commitCell(i, j, data);
    }
  };

  const randomize = () => {
    const next: Matrix = value.map((row) =>
      row.map(() => parseExprStr(String(Math.floor(Math.random() * 19) - 9))),
    );
    onChange(next);
  };

  const clear = () => onChange(makeMatrix(rows, cols));

  const applyText = () => {
    try {
      const m = parseMatrixText(text);
      setTextError(null);
      onChange(m);
    } catch (e) {
      setTextError(e instanceof Error ? e.message : "Invalid matrix");
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card/40 p-5 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-lg font-semibold text-primary glow-text">{title}</h3>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={randomize}>
            <Shuffle className="size-4" /> Random
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={clear}>
            <Eraser className="size-4" /> Clear
          </Button>
        </div>
      </div>

      <div className="flex items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Rows</Label>
          <Input
            type="number"
            min={1}
            max={10}
            value={rows}
            onChange={(e) => setDims(parseInt(e.target.value, 10), cols)}
            className="w-20 font-mono"
          />
        </div>
        <div className="text-muted-foreground pb-2">×</div>
        <div className="space-y-1">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Cols</Label>
          <Input
            type="number"
            min={1}
            max={10}
            value={cols}
            onChange={(e) => setDims(rows, parseInt(e.target.value, 10))}
            className="w-20 font-mono"
          />
        </div>
      </div>

      <Tabs defaultValue="grid" className="w-full">
        <TabsList className="bg-muted">
          <TabsTrigger value="grid">Grid</TabsTrigger>
          <TabsTrigger value="paste">Paste</TabsTrigger>
        </TabsList>
        <TabsContent value="grid" className="mt-3">
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {cellText.map((row, i) =>
              row.map((cell, j) => {
                const err = cellError[`${i}-${j}`];
                return (
                  <input
                    key={`${i}-${j}`}
                    ref={setRef(i, j)}
                    className={`cell w-full rounded-md bg-input/60 border px-2 py-1.5 text-center text-sm font-mono text-foreground transition-colors focus:outline-none focus:ring-2 focus:bg-card focus:border-primary focus:ring-primary/40 hover:border-primary/60 ${
                      err ? "border-destructive ring-1 ring-destructive/40" : "border-border"
                    }`}
                    value={cell}
                    onChange={(e) => commitCell(i, j, e.target.value)}
                    onFocus={(e) => e.currentTarget.select()}
                    onKeyDown={(e) => onCellKeyDown(i, j, e)}
                    onPaste={(e) => onCellPaste(i, j, e)}
                    inputMode="text"
                    autoComplete="off"
                    spellCheck={false}
                  />
                );
              }),
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Supports fractions (<span className="font-mono text-primary">3/4</span>),
            variables (<span className="font-mono text-primary">x</span>,{" "}
            <span className="font-mono text-primary">alpha</span>), and expressions
            (<span className="font-mono text-primary">2x + 1</span>). Use Ctrl+Arrow to jump to row/column edges.
          </p>
        </TabsContent>
        <TabsContent value="paste" className="mt-3 space-y-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={applyText}
            rows={Math.min(8, rows + 1)}
            placeholder={"1 2 3\n4 5 6"}
            className="font-mono"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Separate cells with tabs, commas, semicolons, or 2+ spaces. New line = new row.
            </p>
            <Button type="button" size="sm" variant="secondary" onClick={applyText}>
              Apply
            </Button>
          </div>
          {textError && <p className="text-xs text-destructive">{textError}</p>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
