import { Link } from "@tanstack/react-router";
import { Sigma } from "lucide-react";

const nav = [
  { to: "/" as const, label: "Multiply" },
  { to: "/add" as const, label: "Add / Subtract" },
  { to: "/scalar" as const, label: "Scalar ×" },
  { to: "/matrix-products" as const, label: "Hadamard / Kronecker" },
  { to: "/advanced-products" as const, label: "Commutator / Direct Sum" },
  { to: "/power" as const, label: "Power" },
  { to: "/matrix-exponential" as const, label: "Matrix Exponential" },
  { to: "/transpose" as const, label: "Transpose" },
  { to: "/determinant" as const, label: "Determinant" },
  { to: "/inverse" as const, label: "Inverse" },
  { to: "/decompositions" as const, label: "LU / QR / Gram-Schmidt" },
  { to: "/linear-system" as const, label: "Solve Ax=b" },
  { to: "/eigen-characteristic" as const, label: "Eigen / Char Poly" },
  { to: "/spaces" as const, label: "Null / Column Space" },
  { to: "/rref" as const, label: "RREF" },
  { to: "/trace-rank" as const, label: "Trace / Rank" },
];

export function SiteHeader() {
  return (
    <aside className="w-full md:w-72 md:sticky md:top-0 md:h-screen border-b md:border-b-0 md:border-r border-border bg-background/90 backdrop-blur-md">
      <div className="px-4 py-4 md:py-6 md:px-5 h-full flex flex-col gap-4">
        <Link to="/" className="flex items-center gap-2 font-semibold text-foreground shrink-0">
          <span className="grid place-items-center size-7 rounded-md bg-primary text-primary-foreground">
            <Sigma className="size-4" />
          </span>
          <span className="tracking-tight">
            matrix<span className="text-primary">.calc</span>
          </span>
        </Link>

        <nav className="grid grid-cols-2 md:grid-cols-1 gap-1 text-sm md:overflow-y-auto md:pr-1">
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
    </aside>
  );
}
