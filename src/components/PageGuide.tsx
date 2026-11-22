import type { PageGuideContent } from "@/content/pageGuides";

export function PageGuide({ guide }: { guide: PageGuideContent }) {
  const { example, mistakes, faqs } = guide;
  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold">Worked example: {example.title}</h2>
        <p className="text-sm text-muted-foreground">{example.intro}</p>
        <div className="rounded-md bg-background/60 p-4">
          <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-primary">
            {example.lines.join("\n")}
          </pre>
        </div>
        {example.takeaway && <p className="text-sm text-muted-foreground">{example.takeaway}</p>}
      </section>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold">Common mistakes</h2>
        <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
          {mistakes.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-border bg-card/40 p-6 space-y-4">
        <h2 className="text-xl font-semibold">Frequently asked questions</h2>
        <dl className="space-y-4">
          {faqs.map((f) => (
            <div key={f.q} className="space-y-1">
              <dt className="font-medium text-foreground">{f.q}</dt>
              <dd className="text-sm text-muted-foreground">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
