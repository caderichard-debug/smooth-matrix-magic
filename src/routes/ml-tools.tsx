import { createFileRoute, Link } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { AdSlot } from "@/components/AdSlot";

export const Route = createFileRoute("/ml-tools")({
  head: () => ({
    meta: [
      { title: "Machine Learning Math Calculators — Attention, Adam, Convolution | MatrixDojo" },
      {
        name: "description",
        content:
          "Work through the matrix math behind neural networks by hand: attention, multi-head attention, softmax, convolution, Adam, LayerNorm, and more. Free, in-browser, with every intermediate step.",
      },
      {
        property: "og:title",
        content: "Machine Learning Math Calculators — see every intermediate matrix",
      },
      {
        property: "og:description",
        content:
          "Attention, Adam, convolution, normalization and more, computed step by step in your browser.",
      },
    ],
  }),
  component: MlToolsPage,
});

type Tool = { to: string; name: string; blurb: string };

const groups: { heading: string; intro: string; tools: Tool[] }[] = [
  {
    heading: "Transformers and attention",
    intro: "Follow a sequence model's matrices from raw scores to mixed value vectors.",
    tools: [
      {
        to: "/ml-attention",
        name: "Scaled dot-product attention",
        blurb: "See QKᵀ, the √dₖ scaling, softmax weights and the output, with optional masking.",
      },
      {
        to: "/ml-multihead-attention",
        name: "Multi-head attention walkthrough",
        blurb:
          "Projections, head splitting, per-head attention, concatenation and W_O, shape by shape.",
      },
      {
        to: "/ml-sequence-ops",
        name: "Positional encoding and causal masks",
        blurb:
          "Generate sinusoidal position encodings and the mask that blocks attention to future tokens.",
      },
      {
        to: "/ml-softmax",
        name: "Softmax",
        blurb: "Row-wise probabilities from logits, and why subtracting the max changes nothing.",
      },
    ],
  },
  {
    heading: "Convolutional networks",
    intro: "Slide kernels over feature maps and check output sizes before you write the layer.",
    tools: [
      {
        to: "/ml-convolution",
        name: "2D convolution",
        blurb: "True convolution with kernel flip, padding and stride.",
      },
      {
        to: "/ml-cross-correlation",
        name: "2D cross-correlation",
        blurb: "What CNN layers actually compute: a sliding dot product with no flip.",
      },
      {
        to: "/ml-convolution-extras",
        name: "Dilated, separable and transposed convolution",
        blurb: "Dilation, depthwise + pointwise filters, and transposed-convolution output sizes.",
      },
      {
        to: "/ml-pooling",
        name: "Max and average pooling",
        blurb: "Downsample feature maps by window.",
      },
    ],
  },
  {
    heading: "Training: layers, losses and optimizers",
    intro: "Compute the forward pass, the gradient, and the update a single training step applies.",
    tools: [
      {
        to: "/ml-linear-layer",
        name: "Linear layer forward and backward",
        blurb: "Y = XW + b and the gradients dX, dW and db from an upstream gradient.",
      },
      {
        to: "/ml-loss-gradients",
        name: "Loss gradients",
        blurb: "MSE, cross-entropy from logits, and the softmax Jacobian.",
      },
      {
        to: "/ml-optimizer-steps",
        name: "SGD vs Momentum vs Adam",
        blurb: "One update step from each optimizer side by side on the same parameters.",
      },
      {
        to: "/ml-adam-step",
        name: "Adam step",
        blurb: "Moment estimates, bias correction, and the final parameter update.",
      },
      {
        to: "/ml-regularization",
        name: "L2 weight decay and dropout",
        blurb: "A weight-decay update and inverted dropout with a reproducible mask.",
      },
      {
        to: "/ml-normalization",
        name: "BatchNorm, LayerNorm and RMSNorm",
        blurb: "Compare the three normalizations on the same input.",
      },
    ],
  },
  {
    heading: "Embeddings and representations",
    intro: "Compare vectors and compress data the way retrieval and analysis pipelines do.",
    tools: [
      {
        to: "/ml-similarity-distance",
        name: "Cosine similarity and distances",
        blurb: "Pairwise cosine, Euclidean and Manhattan matrices for row vectors.",
      },
      {
        to: "/ml-svd-pca-low-rank",
        name: "SVD, PCA and low-rank approximation",
        blurb: "Truncated SVD, rank-k reconstruction and PCA projections.",
      },
    ],
  },
];

function MlToolsPage() {
  return (
    <PageLayout
      title="Machine Learning Math Calculators"
      tagline="The matrix operations inside neural networks, computed in your browser with every intermediate step shown."
      showHowItWorks={false}
    >
      <section className="max-w-3xl space-y-3 text-muted-foreground">
        <p>
          Libraries hide the arithmetic behind a single function call. These tools show it: enter
          small matrices, and each page shows the intermediate results (scores, weights, moments,
          gradients) so you can check a hand calculation, debug shape errors, or build intuition for
          how a layer behaves.
        </p>
        <p>
          Everything runs locally in your browser, and you can share any calculation with a link.
        </p>
      </section>

      {groups.map((group) => (
        <section key={group.heading} className="space-y-3">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-foreground">{group.heading}</h2>
            <p className="text-sm text-muted-foreground">{group.intro}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {group.tools.map((tool) => (
              <Link
                key={tool.to}
                to={tool.to}
                className="rounded-lg border border-border bg-card/40 p-4 transition-colors hover:border-primary/60"
              >
                <div className="font-medium text-foreground">{tool.name}</div>
                <p className="mt-1 text-sm text-muted-foreground">{tool.blurb}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <AdSlot placement="belowResult" />
    </PageLayout>
  );
}
