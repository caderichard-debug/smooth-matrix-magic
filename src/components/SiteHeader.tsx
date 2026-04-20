import { Link } from "@tanstack/react-router";
import { Sigma } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

type NavEntry = { label: string; to?: string; comingSoon?: boolean };
type NavSection = { id: string; label: string; items: NavEntry[] };

const sections: NavSection[] = [
  {
    id: "core-arithmetic",
    label: "1) Core Arithmetic",
    items: [
      { label: "Add / Subtract", to: "/add" },
      { label: "Scalar Multiply", to: "/scalar" },
      { label: "Matrix Multiply", to: "/" },
      { label: "Element-wise / Matrix Power + Division", to: "/elementwise" },
    ],
  },
  {
    id: "shape-structure",
    label: "2) Shape & Structural Ops",
    items: [
      { label: "Transpose", to: "/transpose" },
      { label: "Structure Toolkit", to: "/structure-tools" },
      { label: "Split / Partition", comingSoon: true },
    ],
  },
  {
    id: "creation",
    label: "3) Matrix Creation Utilities",
    items: [
      { label: "Generators (Zero/Ones/Random/Toeplitz)", to: "/generators" },
      { label: "Sparse Constructors", comingSoon: true },
    ],
  },
  {
    id: "linear-algebra-core",
    label: "4) Linear Algebra Core",
    items: [
      { label: "Determinant", to: "/determinant" },
      { label: "Trace / Rank", to: "/trace-rank" },
      { label: "Inverse", to: "/inverse" },
      { label: "Solve Ax=b", to: "/linear-system" },
      { label: "Norms / Nullity / Condition #", to: "/norms-metrics" },
      { label: "Pseudoinverse", comingSoon: true },
    ],
  },
  {
    id: "decompositions",
    label: "5) Decompositions",
    items: [
      { label: "LU / QR / Gram-Schmidt", to: "/decompositions" },
      { label: "Cholesky / SVD / Schur", comingSoon: true },
    ],
  },
  {
    id: "eigen-spectral",
    label: "6) Eigen & Spectral",
    items: [
      { label: "Eigen / Characteristic Poly", to: "/eigen-characteristic" },
      { label: "Diagonalization", comingSoon: true },
    ],
  },
  {
    id: "norms-metrics",
    label: "7) Norms & Metrics",
    items: [
      { label: "Norms & Distances", to: "/norms-metrics" },
    ],
  },
  {
    id: "advanced-algebra",
    label: "8) Advanced Algebra",
    items: [
      { label: "Hadamard / Kronecker", to: "/matrix-products" },
      { label: "Commutator / Direct Sum", to: "/advanced-products" },
      { label: "Matrix Exponential", to: "/matrix-exponential" },
      { label: "Matrix Logarithm / Sqrt", comingSoon: true },
    ],
  },
  {
    id: "echelon-rows",
    label: "9) Row Ops / Echelon",
    items: [
      { label: "RREF", to: "/rref" },
      { label: "Row/Column Space Basis", to: "/spaces" },
      { label: "Gaussian Elimination Steps", comingSoon: true },
    ],
  },
  {
    id: "sparse",
    label: "10) Sparse Matrix Ops",
    items: [{ label: "Sparse Suite", comingSoon: true }],
  },
  {
    id: "boolean",
    label: "11) Boolean / Logical",
    items: [{ label: "Comparisons / Masking", comingSoon: true }],
  },
  {
    id: "statistics",
    label: "12) Statistics",
    items: [{ label: "Mean / Var / Cov / Corr", comingSoon: true }],
  },
  {
    id: "transformations",
    label: "13) Transformations",
    items: [{ label: "2D/3D Transform Matrices", comingSoon: true }],
  },
  {
    id: "specialized",
    label: "14) Specialized / Niche",
    items: [{ label: "Householder / Givens / PCA", comingSoon: true }],
  },
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

        <nav className="sidebar-scroll text-sm md:overflow-y-auto md:[direction:rtl] rounded-lg border border-border bg-card/40 px-2 py-1">
          <Accordion type="multiple" className="w-full md:[direction:ltr]">
            {sections.map((section) => (
              <AccordionItem value={section.id} key={section.id} className="border-border/70">
                <AccordionTrigger className="py-2 text-xs uppercase tracking-[0.12em] text-muted-foreground hover:no-underline">
                  {section.label}
                </AccordionTrigger>
                <AccordionContent className="space-y-1">
                  {section.items.map((item) => (
                    item.to ? (
                      <Link
                        key={`${section.id}-${item.label}`}
                        to={item.to}
                        activeOptions={{ exact: true }}
                        activeProps={{ className: "bg-secondary text-foreground" }}
                        inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}
                        className="block px-3 py-1.5 rounded-md whitespace-nowrap transition-colors"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <div
                        key={`${section.id}-${item.label}`}
                        className="px-3 py-1.5 rounded-md text-muted-foreground/70"
                      >
                        {item.label} {item.comingSoon ? "(soon)" : ""}
                      </div>
                    )
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </nav>
      </div>
    </aside>
  );
}
