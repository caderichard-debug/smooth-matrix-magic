import { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import type { Step } from "@/lib/steps";

type Props = {
  steps: Step[];
  intro?: ReactNode;
};

export function StepsPanel({ steps, intro }: Props) {
  if (!steps.length) return null;
  return (
    <details className="rounded-lg border border-border bg-card/40 p-5 group">
      <summary className="cursor-pointer list-none flex items-center justify-between">
        <span className="text-lg font-semibold">Step-by-step solution</span>
        <ChevronRight className="size-4 text-muted-foreground transition-transform group-open:rotate-90" />
      </summary>
      <div className="mt-4 space-y-3">
        {intro && <div className="text-sm text-muted-foreground">{intro}</div>}
        <ol className="space-y-3">
          {steps.map((s, i) => (
            <li key={i} className="rounded-md border border-border bg-background/40 p-3">
              <div className="text-xs uppercase tracking-wider text-primary mb-1">
                Step {i + 1} — {s.title}
              </div>
              <pre className="text-sm font-mono whitespace-pre-wrap break-words text-foreground">
                {s.body}
              </pre>
            </li>
          ))}
        </ol>
      </div>
    </details>
  );
}
