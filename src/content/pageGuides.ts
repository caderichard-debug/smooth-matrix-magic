/**
 * Page-specific guide content: a worked example, common mistakes, and FAQs.
 *
 * Rendered visibly by `PageGuide` (via `PageLayout`) and reused for FAQPage JSON-LD in
 * `__root.tsx`, so structured data always matches what visitors can read on the page.
 * Keyed by route pathname. Pages without an entry render no guide and emit no FAQ schema.
 */
export type PageGuideContent = {
  example: {
    title: string;
    intro: string;
    /** Monospace working lines, shown in order. */
    lines: string[];
    takeaway?: string;
  };
  mistakes: string[];
  faqs: { q: string; a: string }[];
};

export const PAGE_GUIDES: Record<string, PageGuideContent> = {
  "/": {
    example: {
      title: "Multiplying two 2×2 matrices",
      intro:
        "Each entry of AB is the dot product of a row of A with a column of B. Take A = [[1, 2], [3, 4]] and B = [[5, 6], [7, 8]]:",
      lines: [
        "(AB)₁₁ = 1·5 + 2·7 = 19",
        "(AB)₁₂ = 1·6 + 2·8 = 22",
        "(AB)₂₁ = 3·5 + 4·7 = 43",
        "(AB)₂₂ = 3·6 + 4·8 = 50",
        "AB = [[19, 22], [43, 50]]",
      ],
      takeaway:
        "Try computing BA with the same matrices: you get [[23, 34], [31, 46]], a different answer.",
    },
    mistakes: [
      "Multiplying entry by entry. That is the Hadamard product, a different operation.",
      "Assuming AB = BA. Matrix multiplication is generally not commutative.",
      "Ignoring shapes: an m×n matrix times an n×p matrix gives m×p, and the inner sizes (n) must match.",
    ],
    faqs: [
      {
        q: "When can two matrices be multiplied?",
        a: "AB is defined when the number of columns of A equals the number of rows of B. A 2×3 matrix can multiply a 3×4 matrix (giving 2×4), but not a 2×4 matrix.",
      },
      {
        q: "Why is matrix multiplication not commutative?",
        a: "AB combines rows of A with columns of B, while BA combines rows of B with columns of A. These are different calculations, so the results usually differ, and one of the products may not even be defined.",
      },
      {
        q: "Can I multiply matrices with fractions or variables?",
        a: "Yes. Enter fractions like 3/4 or expressions like 2x + 1 in any cell and the calculator keeps the result exact.",
      },
    ],
  },

  "/add": {
    example: {
      title: "Adding two 2×2 matrices",
      intro: "Add matching entries. With A = [[1, 2], [3, 4]] and B = [[5, 6], [7, 8]]:",
      lines: ["A + B = [[1+5, 2+6], [3+7, 4+8]]", "A + B = [[6, 8], [10, 12]]"],
      takeaway: "Subtraction works the same way: A − B = [[−4, −4], [−4, −4]].",
    },
    mistakes: [
      "Adding matrices of different sizes. Both must have exactly the same number of rows and columns.",
      "Sign errors in subtraction: A − B subtracts every entry of B, including negative ones (3 − (−2) = 5).",
    ],
    faqs: [
      {
        q: "Can you add matrices of different sizes?",
        a: "No. Matrix addition and subtraction are only defined for matrices with identical dimensions.",
      },
      {
        q: "Is matrix addition commutative?",
        a: "Yes. A + B = B + A, and addition is also associative: (A + B) + C = A + (B + C).",
      },
    ],
  },

  "/transpose": {
    example: {
      title: "Transposing a 2×3 matrix",
      intro: "Row i of A becomes column i of Aᵀ. For A = [[1, 2, 3], [4, 5, 6]]:",
      lines: [
        "Row 1 (1, 2, 3) → column 1",
        "Row 2 (4, 5, 6) → column 2",
        "Aᵀ = [[1, 4], [2, 5], [3, 6]]",
      ],
      takeaway: "A 2×3 matrix becomes 3×2. In general, (Aᵀ)ᵢⱼ = Aⱼᵢ.",
    },
    mistakes: [
      "Reversing the order of rows instead of turning rows into columns.",
      "Forgetting that (AB)ᵀ = BᵀAᵀ. The order of the factors flips.",
    ],
    faqs: [
      {
        q: "What is a symmetric matrix?",
        a: "A square matrix that equals its own transpose (A = Aᵀ), meaning it is mirrored across the main diagonal.",
      },
      {
        q: "What is the difference between transpose and conjugate transpose?",
        a: "For real matrices they are the same. For complex matrices, the conjugate (Hermitian) transpose also negates the imaginary part of every entry.",
      },
    ],
  },

  "/determinant": {
    example: {
      title: "Determinant of a 3×3 matrix by cofactor expansion",
      intro: "Expand along the first row of A = [[2, 0, 1], [1, 3, 2], [1, 1, 2]]:",
      lines: [
        "det(A) = 2·det[[3, 2], [1, 2]] − 0·det[[1, 2], [1, 2]] + 1·det[[1, 3], [1, 1]]",
        "       = 2·(3·2 − 2·1) − 0 + 1·(1·1 − 3·1)",
        "       = 2·4 + (−2)",
        "       = 6",
      ],
      takeaway:
        "A row with zeros saves work: the middle term vanished. Since det(A) ≠ 0, A is invertible.",
    },
    mistakes: [
      "Dropping the alternating signs (+ − +) in cofactor expansion.",
      "Using the 3×3 diagonal shortcut (rule of Sarrus) on a 4×4 or larger matrix. It only works for 3×3.",
      "Forgetting that swapping two rows flips the sign of the determinant during row reduction.",
    ],
    faqs: [
      {
        q: "What does a determinant of zero mean?",
        a: "The matrix is singular: it has no inverse, its columns are linearly dependent, and Ax = b has either no solution or infinitely many.",
      },
      {
        q: "Can non-square matrices have a determinant?",
        a: "No. The determinant is only defined for square matrices.",
      },
      {
        q: "How do row operations change the determinant?",
        a: "Swapping two rows multiplies it by −1, scaling a row by k multiplies it by k, and adding a multiple of one row to another leaves it unchanged.",
      },
    ],
  },

  "/inverse": {
    example: {
      title: "Inverting a 2×2 matrix",
      intro:
        "For A = [[a, b], [c, d]], A⁻¹ = (1/det A)·[[d, −b], [−c, a]]. With A = [[4, 7], [2, 6]]:",
      lines: [
        "det(A) = 4·6 − 7·2 = 10",
        "A⁻¹ = (1/10)·[[6, −7], [−2, 4]]",
        "A⁻¹ = [[3/5, −7/10], [−1/5, 2/5]]",
      ],
      takeaway: "Check it: A·A⁻¹ = [[1, 0], [0, 1]].",
    },
    mistakes: [
      "Swapping b and c instead of negating them in the 2×2 formula. Swap a and d, negate b and c.",
      "Trying to invert a matrix whose determinant is zero.",
      "Writing (AB)⁻¹ = A⁻¹B⁻¹. The correct rule is (AB)⁻¹ = B⁻¹A⁻¹.",
    ],
    faqs: [
      {
        q: "How do I know if a matrix is invertible?",
        a: "A square matrix is invertible exactly when its determinant is non-zero, which is the same as having full rank.",
      },
      {
        q: "How do you find the inverse of a 3×3 matrix?",
        a: "Row-reduce the augmented matrix [A | I]. When the left side becomes I, the right side is A⁻¹. Alternatively, A⁻¹ = adj(A) / det(A).",
      },
      {
        q: "What if my matrix is not square?",
        a: "It has no ordinary inverse, but it may have a Moore–Penrose pseudoinverse, which gives least-squares solutions.",
      },
    ],
  },

  "/rref": {
    example: {
      title: "Reducing a 2×3 matrix to RREF",
      intro: "Start with A = [[1, 2, 3], [2, 4, 7]]:",
      lines: [
        "R₂ ← R₂ − 2R₁   →  [[1, 2, 3], [0, 0, 1]]",
        "R₁ ← R₁ − 3R₂   →  [[1, 2, 0], [0, 0, 1]]",
        "RREF(A) = [[1, 2, 0], [0, 0, 1]]",
      ],
      takeaway:
        "Pivots are in columns 1 and 3, so the rank is 2 and column 2 corresponds to a free variable.",
    },
    mistakes: [
      "Stopping at row echelon form. RREF also needs every pivot to be 1 with zeros above it.",
      "Expecting a pivot in every column. Columns without pivots correspond to free variables.",
      "Applying a row operation to only part of a row (including only part of an augmented column).",
    ],
    faqs: [
      {
        q: "What is the difference between REF and RREF?",
        a: "Row echelon form only needs zeros below each pivot. Reduced row echelon form also requires each pivot to equal 1 and to be the only non-zero entry in its column. RREF is unique; REF is not.",
      },
      {
        q: "How do I read the solution of a linear system from RREF?",
        a: "Row-reduce the augmented matrix [A | b]. Each pivot variable equals its row's right-hand side minus the free-variable terms. A row like [0 0 … 0 | 1] means the system has no solution.",
      },
    ],
  },

  "/trace-rank": {
    example: {
      title: "Trace and rank of a 2×2 matrix",
      intro: "Take A = [[1, 2], [2, 4]]:",
      lines: [
        "trace(A) = 1 + 4 = 5",
        "Row 2 = 2 · Row 1, so the rows are dependent",
        "rank(A) = 1",
      ],
      takeaway: "The trace also equals the sum of the eigenvalues (here 0 and 5).",
    },
    mistakes: [
      "Adding all entries for the trace. Only the main diagonal counts.",
      "Counting non-zero rows before row-reducing. Rank is the number of pivots after reduction.",
    ],
    faqs: [
      {
        q: "What does the rank of a matrix tell you?",
        a: "The number of linearly independent rows (equivalently, columns). It is the dimension of the column space, and an n×n matrix is invertible only if its rank is n.",
      },
      {
        q: "Is trace defined for non-square matrices?",
        a: "No. The trace is the sum of the main-diagonal entries of a square matrix.",
      },
    ],
  },

  "/power": {
    example: {
      title: "Raising a shear matrix to a power",
      intro: "Let A = [[1, 1], [0, 1]]. Multiply A by itself repeatedly:",
      lines: [
        "A² = [[1, 2], [0, 1]]",
        "A³ = A²·A = [[1, 3], [0, 1]]",
        "Pattern: Aⁿ = [[1, n], [0, 1]]",
      ],
      takeaway: "Powers are only defined for square matrices, and A⁰ = I.",
    },
    mistakes: [
      "Raising each entry to the power. That is the element-wise power, not Aⁿ.",
      "Trying to square a non-square matrix: A·A requires columns of A to equal rows of A.",
    ],
    faqs: [
      {
        q: "How are large matrix powers computed efficiently?",
        a: "By repeated squaring (A⁸ = ((A²)²)²), or by diagonalizing: if A = PDP⁻¹ then Aⁿ = PDⁿP⁻¹, and Dⁿ just raises each diagonal entry.",
      },
      {
        q: "What does a negative power mean?",
        a: "A⁻ⁿ = (A⁻¹)ⁿ, which exists only when A is invertible.",
      },
    ],
  },

  "/eigen-characteristic": {
    example: {
      title: "Eigenvalues of a symmetric 2×2 matrix",
      intro: "For A = [[2, 1], [1, 2]], solve det(A − λI) = 0:",
      lines: [
        "det[[2−λ, 1], [1, 2−λ]] = (2−λ)² − 1",
        "p(λ) = λ² − 4λ + 3 = (λ − 1)(λ − 3)",
        "λ₁ = 1 with eigenvector (1, −1)",
        "λ₂ = 3 with eigenvector (1, 1)",
      ],
      takeaway: "Quick checks: the eigenvalues sum to trace(A) = 4 and multiply to det(A) = 3.",
    },
    mistakes: [
      "Computing det(A) − λ instead of det(A − λI). Subtract λ from each diagonal entry first.",
      "Treating the zero vector as an eigenvector. Eigenvectors must be non-zero.",
      "Expecting real eigenvalues for every real matrix. Rotations, for example, have complex eigenvalues.",
    ],
    faqs: [
      {
        q: "What is the characteristic polynomial?",
        a: "p(λ) = det(A − λI). Its roots are exactly the eigenvalues of A, and for an n×n matrix it has degree n.",
      },
      {
        q: "What do eigenvalues mean geometrically?",
        a: "An eigenvector keeps its direction when multiplied by A; it is only stretched or flipped by the factor λ.",
      },
    ],
  },

  "/linear-system": {
    example: {
      title: "Solving a 2×2 system",
      intro:
        "Solve x + y = 3 and 2x − y = 0, written as Ax = b with A = [[1, 1], [2, −1]] and b = [3, 0]:",
      lines: [
        "[A | b] = [[1, 1 | 3], [2, −1 | 0]]",
        "R₂ ← R₂ − 2R₁  →  [[1, 1 | 3], [0, −3 | −6]]",
        "y = 2, then x = 3 − y = 1",
      ],
      takeaway: "Check: 1 + 2 = 3 and 2·1 − 2 = 0. Since det(A) = −3 ≠ 0, the solution is unique.",
    },
    mistakes: [
      "Forgetting to apply row operations to the right-hand side b as well.",
      "Assuming every system has exactly one solution. Singular systems have none or infinitely many.",
    ],
    faqs: [
      {
        q: "How can I tell if a system has no solution?",
        a: "Row-reduce [A | b]. A row of the form [0 0 … 0 | c] with c ≠ 0 means the system is inconsistent.",
      },
      {
        q: "When does a system have infinitely many solutions?",
        a: "When it is consistent but has fewer pivots than unknowns. Each column without a pivot is a free variable.",
      },
    ],
  },

  "/decompositions": {
    example: {
      title: "LU decomposition of a 2×2 matrix",
      intro: "Factor A = [[4, 3], [6, 3]] into a lower-triangular L and upper-triangular U:",
      lines: [
        "Multiplier: ℓ₂₁ = 6 / 4 = 1.5",
        "R₂ ← R₂ − 1.5·R₁  →  U = [[4, 3], [0, −1.5]]",
        "L = [[1, 0], [1.5, 1]]",
        "Check: L·U = [[4, 3], [6, 3]] = A",
      ],
      takeaway:
        "Once A = LU, solving Ax = b becomes two quick triangular solves: Ly = b, then Ux = y.",
    },
    mistakes: [
      "Storing the negative of the elimination multiplier in L. L holds the multipliers themselves.",
      "Expecting LU without pivoting to always work. A zero pivot requires row swaps (PA = LU).",
    ],
    faqs: [
      {
        q: "When should I use LU vs QR decomposition?",
        a: "LU is the fast choice for solving square systems repeatedly. QR is more numerically stable and is the standard tool for least-squares problems with rectangular matrices.",
      },
      {
        q: "What does Gram–Schmidt produce?",
        a: "An orthonormal basis for the column space of A. Collecting those vectors gives Q in A = QR.",
      },
    ],
  },

  "/pseudoinverse": {
    example: {
      title: "Pseudoinverse of a column vector",
      intro: "A = [[1], [2]] is 2×1, so it has no inverse. With full column rank, A⁺ = (AᵀA)⁻¹Aᵀ:",
      lines: ["AᵀA = 1² + 2² = 5", "A⁺ = (1/5)·[[1, 2]] = [[1/5, 2/5]]", "A⁺A = [[1]]"],
      takeaway:
        "x = A⁺b is the least-squares solution of Ax = b: the best fit when no exact solution exists.",
    },
    mistakes: [
      "Using (AᵀA)⁻¹Aᵀ when A does not have full column rank. Then AᵀA is singular; use the SVD instead.",
      "Expecting AA⁺ = I. That holds only when A has full row rank.",
    ],
    faqs: [
      {
        q: "What is the Moore–Penrose pseudoinverse used for?",
        a: "Least-squares fitting, solving over- or under-determined systems, and finding minimum-norm solutions. It exists for every matrix, square or not.",
      },
      {
        q: "How is the pseudoinverse computed in general?",
        a: "From the SVD A = UΣVᵀ: A⁺ = VΣ⁺Uᵀ, where Σ⁺ inverts the non-zero singular values and transposes the shape.",
      },
    ],
  },

  "/ml-softmax": {
    example: {
      title: "Softmax of one row of logits",
      intro: "For logits z = [1, 2, 3], softmax(z)ᵢ = e^zᵢ / Σⱼ e^zⱼ:",
      lines: [
        "e¹ ≈ 2.718,  e² ≈ 7.389,  e³ ≈ 20.086",
        "sum ≈ 30.193",
        "softmax(z) ≈ [0.090, 0.245, 0.665]",
      ],
      takeaway:
        "Adding the same constant to every logit leaves the output unchanged, which is why implementations subtract the row max for numerical stability.",
    },
    mistakes: [
      "Normalizing over the wrong axis. In a batch, each row (example) is normalized separately.",
      "Exponentiating large logits directly and overflowing. Subtract the row max first.",
    ],
    faqs: [
      {
        q: "Why use softmax instead of dividing by the sum?",
        a: "Logits can be negative, and exponentiation makes every value positive while emphasizing the largest scores. The output is a valid probability distribution.",
      },
      {
        q: "How does temperature change softmax?",
        a: "Dividing logits by a temperature T > 1 flattens the distribution; T < 1 sharpens it towards the maximum.",
      },
    ],
  },

  "/ml-attention": {
    example: {
      title: "Attention for a single query",
      intro:
        "Attention(Q, K, V) = softmax(QKᵀ / √dₖ)·V. Take Q = [[1, 0]], K = [[1, 0], [0, 1]], V = [[1, 2], [3, 4]], so dₖ = 2:",
      lines: [
        "QKᵀ = [[1, 0]]",
        "scaled scores = [1, 0] / √2 ≈ [0.707, 0]",
        "weights = softmax ≈ [0.670, 0.330]",
        "output = 0.670·[1, 2] + 0.330·[3, 4] ≈ [1.660, 2.660]",
      ],
      takeaway:
        "The query matches key 1 best, so the output leans towards value row 1, but still blends in value row 2.",
    },
    mistakes: [
      "Forgetting the 1/√dₖ scaling, which makes softmax saturate as dimensions grow.",
      "Applying softmax over the query axis instead of the key axis. Each query's weights should sum to 1.",
      "Using a 0/1 mask additively. Masked positions need −∞ (or a large negative number) before softmax.",
    ],
    faqs: [
      {
        q: "Why divide by √dₖ in attention?",
        a: "Dot products of random dₖ-dimensional vectors have variance proportional to dₖ. Scaling by √dₖ keeps scores in a range where softmax still has useful gradients.",
      },
      {
        q: "What shapes do Q, K and V need?",
        a: "Q is n×dₖ and K is m×dₖ (same feature size), V is m×dᵥ. The weights are n×m and the output is n×dᵥ.",
      },
      {
        q: "How does a causal mask work?",
        a: "It adds −∞ to every score where a query would attend to a later position, so after softmax those weights are exactly zero.",
      },
    ],
  },

  "/ml-multihead-attention": {
    example: {
      title: "Tracking shapes through multi-head attention",
      intro:
        "Take 4 tokens with model width d = 8 and h = 2 heads, so each head has width 8 / 2 = 4:",
      lines: [
        "X: 4×8  →  Q, K, V = X·W_Q, X·W_K, X·W_V: each 4×8",
        "split heads: Q₁, Q₂ (and K, V likewise): each 4×4",
        "per head: softmax(QᵢKᵢᵀ / √4)·Vᵢ  →  4×4",
        "concat heads: 4×8  →  output = concat · W_O: 4×8",
      ],
      takeaway:
        "Total compute is similar to one wide head, but each head can learn a different attention pattern.",
    },
    mistakes: [
      "Choosing a model width that is not divisible by the number of heads.",
      "Scaling by √d instead of the per-head width √(d/h).",
    ],
    faqs: [
      {
        q: "Why use multiple attention heads?",
        a: "Each head attends in its own learned subspace, so different heads can track different relationships (for example position versus meaning) at the same time.",
      },
      {
        q: "What does the output projection W_O do?",
        a: "It mixes the concatenated head outputs back into a single d-dimensional representation per token.",
      },
    ],
  },

  "/ml-convolution": {
    example: {
      title: "Convolution vs cross-correlation on the same input",
      intro:
        "Input X = [[1, 2, 3], [4, 5, 6], [7, 8, 9]], kernel K = [[1, 0], [0, −1]], stride 1, no padding (output 2×2):",
      lines: [
        "Cross-correlation (no flip), top-left: 1·1 + 5·(−1) = −4  →  [[−4, −4], [−4, −4]]",
        "Convolution flips K to [[−1, 0], [0, 1]], top-left: −1 + 5 = 4  →  [[4, 4], [4, 4]]",
      ],
      takeaway:
        "Most deep-learning libraries (including PyTorch's Conv2d) actually compute cross-correlation. With learned kernels the flip doesn't matter, but with fixed kernels it does.",
    },
    mistakes: [
      "Forgetting to flip the kernel for true convolution.",
      "Getting the output size wrong. Use ⌊(n + 2p − k) / s⌋ + 1 per dimension.",
    ],
    faqs: [
      {
        q: "How do I compute the output size of a convolution?",
        a: "For input size n, kernel size k, padding p and stride s, the output size is ⌊(n + 2p − k) / s⌋ + 1 along each dimension.",
      },
      {
        q: "Is CNN convolution really convolution?",
        a: "Usually not: CNN layers compute cross-correlation (no kernel flip). Since kernels are learned, the network simply learns the flipped version.",
      },
    ],
  },

  "/ml-adam-step": {
    example: {
      title: "The first Adam step",
      intro:
        "Parameter θ = 1, gradient g = 0.5, learning rate 0.001, β₁ = 0.9, β₂ = 0.999, step t = 1:",
      lines: [
        "m = 0.9·0 + 0.1·0.5 = 0.05",
        "v = 0.999·0 + 0.001·0.5² = 0.00025",
        "m̂ = m / (1 − 0.9¹) = 0.5,   v̂ = v / (1 − 0.999¹) = 0.25",
        "θ ← 1 − 0.001 · 0.5 / (√0.25 + 1e−8) ≈ 0.999",
      ],
      takeaway:
        "On the first step the update size is about the learning rate regardless of gradient scale, because m̂ / √v̂ ≈ ±1.",
    },
    mistakes: [
      "Skipping bias correction, which makes early steps far too small since m and v start at zero.",
      "Treating weight decay inside Adam as equivalent to L2 loss. AdamW applies decay separately for this reason.",
    ],
    faqs: [
      {
        q: "What do β₁ and β₂ control in Adam?",
        a: "β₁ sets how much past gradients are averaged (momentum); β₂ sets how much past squared gradients are averaged (per-parameter scaling). Typical values are 0.9 and 0.999.",
      },
      {
        q: "Why does Adam need bias correction?",
        a: "The moment estimates start at zero, so early on they are biased towards zero. Dividing by (1 − βᵗ) removes that bias.",
      },
    ],
  },
};

export function getPageGuide(pathname: string): PageGuideContent | undefined {
  return PAGE_GUIDES[pathname];
}
