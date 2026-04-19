import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { makeMatrix, matrixToText, parseMatrixText, type Matrix } from "@/lib/matrix";
import { Shuffle, Eraser } from "lucide-react";

type Props = {
  title: string;
  value: Matrix;
  onChange: (m: Matrix) => void;
};

export function MatrixInput({ title, value, onChange }: Props) {
  const rows = value.length;
  const cols = value[0]?.length ?? 0;
  const [text, setText] = useState(() => matrixToText(value));
  const [textError, setTextError] = useState<string | null>(null);

  // Keep textarea in sync when grid changes externally
  useEffect(() => {
    setText(matrixToText(value));
  }, [value]);

  const setDims = (r: number, c: number) => {
    r = Math.max(1, Math.min(10, r || 1));
    c = Math.max(1, Math.min(10, c || 1));
    const next = makeMatrix(r, c);
    for (let i = 0; i < r; i++)
      for (let j = 0; j < c; j++) next[i][j] = value[i]?.[j] ?? 0;
    onChange(next);
  };

  const setCell = (i: number, j: number, raw: string) => {
    const n = raw === "" || raw === "-" ? 0 : Number(raw);
    if (raw !== "" && raw !== "-" && !Number.isFinite(n)) return;
    const next = value.map((row) => row.slice());
    next[i][j] = n;
    onChange(next);
  };

  const randomize = () => {
    const next = value.map((row) => row.map(() => Math.floor(Math.random() * 19) - 9));
    onChange(next);
  };

  const clear = () => {
    onChange(makeMatrix(rows, cols));
  };

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
            {value.map((row, i) =>
              row.map((cell, j) => (
                <input
                  key={`${i}-${j}`}
                  className="cell w-full rounded-md bg-input/60 border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 px-2 py-1.5 text-center text-sm font-mono text-foreground"
                  value={cell}
                  onChange={(e) => setCell(i, j, e.target.value)}
                  inputMode="decimal"
                />
              )),
            )}
          </div>
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
              Separate values with spaces, commas or tabs. New line = new row.
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
