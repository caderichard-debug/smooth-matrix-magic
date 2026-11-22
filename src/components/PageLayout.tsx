import { ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AdSlot } from "@/components/AdSlot";
import { ShareButton } from "@/components/ShareButton";
import { PageGuide } from "@/components/PageGuide";
import { getPageGuide } from "@/content/pageGuides";
import { useRouterState } from "@tanstack/react-router";

type Props = {
  title: string;
  tagline: string;
  children: ReactNode;
  showHowItWorks?: boolean;
};

function getHowHeading(title: string) {
  const normalized = title.replace(/\s+calculator$/i, "").trim();
  return `How ${normalized} works`;
}

export function PageLayout({ title, tagline, children, showHowItWorks = true }: Props) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const guide = getPageGuide(pathname);
  return (
    <div className="min-h-screen bg-background bg-grid md:flex">
      <SiteHeader />
      <div className="flex-1 min-w-0 flex flex-col">
        <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8 space-y-8">
          <AdSlot placement="header" />
          <header className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight glow-text">{title}</h1>
            <p className="text-muted-foreground max-w-2xl">{tagline}</p>
            <div className="pt-2">
              <ShareButton />
            </div>
          </header>
          {children}
          {guide && <PageGuide guide={guide} />}
          {showHowItWorks && (
            <section className="prose-invert max-w-none space-y-3 text-muted-foreground">
              <h2 className="text-foreground text-xl font-semibold">{getHowHeading(title)}</h2>
              <p>
                This page lets you enter your matrix values, run the selected operation instantly,
                and review the result in a clear format.
              </p>
              <p>
                {tagline} All calculations run in your browser, so input updates are immediate and
                nothing is uploaded.
              </p>
            </section>
          )}
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
