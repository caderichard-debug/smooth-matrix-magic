import { ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AdSlot } from "@/components/AdSlot";

type Props = {
  title: string;
  tagline: string;
  children: ReactNode;
};

export function PageLayout({ title, tagline, children }: Props) {
  return (
    <div className="min-h-screen flex flex-col bg-background bg-grid">
      <SiteHeader />
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8 space-y-8">
        <AdSlot label="Ad space — header (728×90)" height="h-20" />
        <header className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight glow-text">{title}</h1>
          <p className="text-muted-foreground max-w-2xl">{tagline}</p>
        </header>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
