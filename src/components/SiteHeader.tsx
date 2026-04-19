import { Link } from "@tanstack/react-router";
import { Sigma } from "lucide-react";

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

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-background/80 border-b border-border">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2 font-semibold text-foreground">
          <span className="grid place-items-center size-7 rounded-md bg-primary text-primary-foreground">
            <Sigma className="size-4" />
          </span>
          <span className="tracking-tight">
            matrix<span className="text-primary">.calc</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto text-sm">
          {nav.map((item) => (
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
        </nav>
      </div>
    </header>
  );
}
