import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sigma, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const nav = [
  { to: "/" as const, label: "Multiply" },
  { to: "/add" as const, label: "Add / Subtract" },
  { to: "/scalar" as const, label: "Scalar ×" },
  { to: "/power" as const, label: "Power" },
  { to: "/transpose" as const, label: "Transpose" },
  { to: "/determinant" as const, label: "Determinant" },
  { to: "/inverse" as const, label: "Inverse" },
  { to: "/trace-rank" as const, label: "Trace / Rank" },
];

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function SiteHeader() {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const moreRef = useRef<HTMLButtonElement>(null);
  const [visibleCount, setVisibleCount] = useState(nav.length);

  // Measure once with everything visible, then collapse trailing items into "More"
  // when they would otherwise overflow the available width.
  useIsoLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const available = el.clientWidth;
      // Reserve room for the "More" button (≈ 64px) in case we need it.
      const moreWidth = moreRef.current?.offsetWidth ?? 56;
      const widths = itemRefs.current.map((n) => n?.offsetWidth ?? 0);
      const gap = 4; // matches gap-1

      // Try fitting all items without "More" first.
      let total = widths.reduce((s, w) => s + w + gap, -gap);
      if (total <= available) {
        setVisibleCount(nav.length);
        return;
      }

      // Otherwise fit as many as possible plus the "More" button.
      let used = moreWidth + gap;
      let count = 0;
      for (let i = 0; i < widths.length; i++) {
        if (used + widths[i] + gap <= available) {
          used += widths[i] + gap;
          count++;
        } else break;
      }
      setVisibleCount(Math.max(1, count));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const overflow = nav.slice(visibleCount);

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-background/80 border-b border-border">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2 font-semibold text-foreground shrink-0">
          <span className="grid place-items-center size-7 rounded-md bg-primary text-primary-foreground">
            <Sigma className="size-4" />
          </span>
          <span className="tracking-tight">
            matrix<span className="text-primary">.calc</span>
          </span>
        </Link>

        <div ref={containerRef} className="flex-1 min-w-0 flex items-center gap-1 text-sm">
          {/* Hidden full list used purely for measurement on first paint. */}
          <div className="flex items-center gap-1 absolute opacity-0 pointer-events-none -z-10" aria-hidden>
            {nav.map((item, i) => (
              <span
                key={item.to}
                ref={(el) => { itemRefs.current[i] = el as unknown as HTMLAnchorElement; }}
                className="px-3 py-1.5 rounded-md whitespace-nowrap"
              >
                {item.label}
              </span>
            ))}
          </div>

          {nav.slice(0, visibleCount).map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: true }}
              activeProps={{ className: "bg-secondary text-foreground" }}
              inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}
              className="px-3 py-1.5 rounded-md whitespace-nowrap transition-colors"
            >
              {item.label}
            </Link>
          ))}

          {overflow.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger
                ref={moreRef}
                className="px-2 py-1.5 rounded-md text-muted-foreground hover:text-foreground inline-flex items-center gap-1 whitespace-nowrap"
                aria-label="More navigation"
              >
                <MoreHorizontal className="size-4" />
                More
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover">
                {overflow.map((item) => (
                  <DropdownMenuItem key={item.to} asChild>
                    <Link to={item.to} className="cursor-pointer">{item.label}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
