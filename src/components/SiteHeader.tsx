import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
      { label: "Split / Partition", to: "/split-partition" },
      { label: "Stack / Unstack Blocks", to: "/stack-unstack-blocks" },
      { label: "Triangular Extraction", to: "/triangular-extraction" },
      { label: "Symmetrize / Skew-Symmetrize", to: "/symmetrize-skew" },
    ],
  },
  {
    id: "creation",
    label: "3) Matrix Creation Utilities",
    items: [
      { label: "Generators (Zero/Ones/Random/Toeplitz)", to: "/generators" },
      { label: "Sparse Constructors", to: "/sparse-constructors" },
      { label: "Vandermonde / Pascal / Hilbert", to: "/vandermonde-pascal-hilbert" },
      { label: "Block Matrix Builder", to: "/block-matrix-builder" },
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
      { label: "Pseudoinverse", to: "/pseudoinverse" },
      { label: "Adjugate / Cofactor Matrix", to: "/adjugate-cofactor" },
      { label: "Determinant by Expansion", to: "/determinant-expansion" },
    ],
  },
  {
    id: "decompositions",
    label: "5) Decompositions",
    items: [
      { label: "LU / QR / Gram-Schmidt", to: "/decompositions" },
      { label: "Cholesky / SVD / Schur", to: "/cholesky-svd-schur" },
      { label: "Polar Decomposition", to: "/polar-decomposition" },
      { label: "Jordan Form", to: "/jordan-form" },
    ],
  },
  {
    id: "eigen-spectral",
    label: "6) Eigen & Spectral",
    items: [
      { label: "Eigen / Characteristic Poly", to: "/eigen-characteristic" },
      { label: "Diagonalization", to: "/diagonalization" },
      { label: "Spectral Radius", to: "/spectral-radius" },
      { label: "Matrix Functions via Spectrum", to: "/matrix-functions-spectrum" },
    ],
  },
  {
    id: "norms-metrics",
    label: "7) Norms & Metrics",
    items: [{ label: "Norms & Distances", to: "/norms-metrics" }],
  },
  {
    id: "advanced-algebra",
    label: "8) Advanced Algebra",
    items: [
      { label: "Hadamard / Kronecker", to: "/matrix-products" },
      { label: "Commutator / Direct Sum", to: "/advanced-products" },
      { label: "Matrix Exponential", to: "/matrix-exponential" },
      { label: "Matrix Logarithm / Sqrt", to: "/matrix-log-sqrt" },
      { label: "Sylvester / Lyapunov Equations", to: "/sylvester-lyapunov" },
    ],
  },
  {
    id: "echelon-rows",
    label: "9) Row Ops / Echelon",
    items: [
      { label: "RREF", to: "/rref" },
      { label: "Row/Column Space Basis", to: "/spaces" },
      { label: "Gaussian Elimination Steps", to: "/gaussian-elimination-steps" },
      { label: "Pivot / Free Variable Analyzer", to: "/pivot-free-analyzer" },
      { label: "REF with Partial Pivoting", to: "/ref-partial-pivoting" },
    ],
  },
  {
    id: "sparse",
    label: "10) Sparse Matrix Ops",
    items: [
      { label: "CSR / CSC Conversions", to: "/csr-csc-conversions" },
      { label: "Sparse Add / Multiply", to: "/sparse-add-multiply" },
      { label: "Bandwidth / Profile Metrics", to: "/sparse-bandwidth-profile" },
      { label: "Sparse Solve (Iterative)", to: "/sparse-iterative-solve" },
    ],
  },
  {
    id: "boolean",
    label: "11) Boolean / Logical",
    items: [
      { label: "Comparisons / Masking", to: "/boolean-comparisons-masking" },
      { label: "Boolean Matrix Multiply", to: "/boolean-matrix-multiply" },
      { label: "Reachability / Transitive Closure", to: "/reachability-transitive-closure" },
      { label: "Logical Reductions (Any/All)", to: "/logical-reductions" },
    ],
  },
  {
    id: "statistics",
    label: "12) Statistics",
    items: [
      { label: "Mean / Var / Cov / Corr", to: "/mean-var-cov-corr" },
      { label: "Standardize / Normalize Columns", to: "/standardize-normalize" },
      { label: "PCA (from covariance)", to: "/pca-covariance" },
      { label: "Mahalanobis Distance", to: "/mahalanobis-distance" },
    ],
  },
  {
    id: "transformations",
    label: "13) Transformations",
    items: [
      { label: "2D/3D Transform Matrices", to: "/transform-matrices-2d-3d" },
      { label: "Rotation / Reflection / Shear", to: "/rotation-reflection-shear" },
      { label: "Homogeneous Coordinates", to: "/homogeneous-coordinates" },
      { label: "Compose / Decompose Transforms", to: "/compose-decompose-transforms" },
    ],
  },
  {
    id: "specialized",
    label: "14) Specialized / Niche",
    items: [
      { label: "Householder / Givens", to: "/householder-givens" },
      { label: "Companion / Fiedler Matrices", to: "/companion-fiedler" },
      { label: "Markov Chain Transition Tools", to: "/markov-chain-tools" },
      { label: "Graph Laplacian Utilities", to: "/graph-laplacian" },
    ],
  },
  {
    id: "ml-operations",
    label: "15) ML / Neural Ops",
    items: [
      { label: "2D Convolution", to: "/ml-convolution" },
      { label: "Convolution Extras", to: "/ml-convolution-extras" },
      { label: "2D Cross-Correlation", to: "/ml-cross-correlation" },
      { label: "Max / Avg Pooling", to: "/ml-pooling" },
      { label: "Softmax (rows)", to: "/ml-softmax" },
      { label: "Scaled Dot-Product Attention", to: "/ml-attention" },
      { label: "Multi-Head Attention Walkthrough", to: "/ml-multihead-attention" },
      { label: "Sequence Ops (Positional + Causal Mask)", to: "/ml-sequence-ops" },
      { label: "Optimizer Steps (SGD / Momentum / Adam)", to: "/ml-optimizer-steps" },
      { label: "Adam Optimizer Step", to: "/ml-adam-step" },
      { label: "Linear Layer (Forward & Backward)", to: "/ml-linear-layer" },
      { label: "Loss + Gradient Basics", to: "/ml-loss-gradients" },
      { label: "Similarity / Distances", to: "/ml-similarity-distance" },
      { label: "BatchNorm / LayerNorm / RMSNorm", to: "/ml-normalization" },
      { label: "Regularization (L2 + Dropout)", to: "/ml-regularization" },
      { label: "SVD PCA / Low-Rank Approximation", to: "/ml-svd-pca-low-rank" },
    ],
  },
];

export function SiteHeader() {
  const allSectionIds = useMemo(() => sections.map((section) => section.id), []);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const allExpanded = expandedSections.length === allSectionIds.length;

  return (
    <aside className="w-full md:w-72 md:sticky md:top-0 md:h-screen border-b md:border-b-0 md:border-r border-border bg-background/90 backdrop-blur-md">
      <div className="px-4 py-4 md:py-6 md:px-5 h-full flex flex-col gap-4">
        <Link to="/" className="flex items-center gap-2 font-semibold text-foreground shrink-0">
          <img src="/favicon.svg" alt="MatrixDojo logo" className="size-7 rounded-md" />
          <span className="tracking-tight">MatrixDojo</span>
        </Link>

        <nav className="sidebar-scroll text-sm md:overflow-y-auto rounded-lg border border-border bg-card/40 px-2 py-1">
          <div className="flex items-center justify-end border-b border-border/70 pb-2 mb-1">
            <button
              type="button"
              onClick={() => setExpandedSections(allExpanded ? [] : allSectionIds)}
              className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground transition-colors"
            >
              {allExpanded ? "Collapse all" : "Expand all"}
            </button>
          </div>
          <Accordion
            type="multiple"
            className="w-full"
            value={expandedSections}
            onValueChange={setExpandedSections}
          >
            {sections.map((section) => (
              <AccordionItem value={section.id} key={section.id} className="border-border/70">
                <AccordionTrigger className="py-2 text-xs uppercase tracking-[0.12em] text-muted-foreground hover:no-underline">
                  {section.label}
                </AccordionTrigger>
                <AccordionContent className="space-y-1">
                  {section.items.map((item) =>
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
                    ),
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </nav>
      </div>
    </aside>
  );
}
