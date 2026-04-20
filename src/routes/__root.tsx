import { Outlet, Link, createRootRoute, HeadContent, Scripts, useRouterState } from "@tanstack/react-router";

import appCss from "../styles.css?url";

const SITE_NAME = "MatrixDojo";
const SITE_URL = "https://matrixdojo.app";
const DEFAULT_OG_IMAGE = `${SITE_URL}/social-preview.svg`;
const DEFAULT_TITLE = "MatrixDojo — Fast Online Matrix Calculators";
const DEFAULT_DESCRIPTION =
  "Free online matrix calculators for multiplication, decomposition, eigen tools, sparse operations, and more. Fast, accurate, and browser-based.";

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  description: DEFAULT_DESCRIPTION,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

function toOperationName(pathname: string) {
  if (pathname === "/") return "Matrix Multiplication";
  return pathname
    .replace(/^\/+/, "")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getRouteStructuredData(pathname: string) {
  const canonicalUrl = new URL(pathname, SITE_URL).toString();
  const operationName = toOperationName(pathname);
  const pageTitle = `${operationName} Calculator`;
  const pageDescription = `Use MatrixDojo to run ${operationName.toLowerCase()} instantly in your browser with clear results and practical validation checks.`;

  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${pageTitle} | ${SITE_NAME}`,
    url: canonicalUrl,
    description: pageDescription,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What does the ${operationName} calculator do?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `It computes ${operationName.toLowerCase()} directly in your browser and shows results immediately.`,
        },
      },
      {
        "@type": "Question",
        name: "Is MatrixDojo free to use?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. MatrixDojo is free to use for matrix calculations with no signup required.",
        },
      },
    ],
  };

  return [webPageJsonLd, faqJsonLd];
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: ({ location }) => {
    const pathname = location?.pathname ?? "/";
    const canonicalUrl = new URL(pathname, SITE_URL).toString();

    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title: DEFAULT_TITLE },
        { name: "description", content: DEFAULT_DESCRIPTION },
        { name: "author", content: SITE_NAME },
        { name: "robots", content: "index, follow, max-image-preview:large" },
        { property: "og:site_name", content: SITE_NAME },
        { property: "og:title", content: DEFAULT_TITLE },
        { property: "og:description", content: DEFAULT_DESCRIPTION },
        { property: "og:type", content: "website" },
        { property: "og:url", content: canonicalUrl },
        { property: "og:image", content: DEFAULT_OG_IMAGE },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: DEFAULT_TITLE },
        { name: "twitter:description", content: DEFAULT_DESCRIPTION },
        { name: "twitter:image", content: DEFAULT_OG_IMAGE },
      ],
      links: [
        { rel: "canonical", href: canonicalUrl },
        { rel: "icon", href: "/favicon.ico", sizes: "any" },
        { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" },
        { rel: "icon", type: "image/png", sizes: "192x192", href: "/favicon-192.png" },
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
        { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
        { rel: "manifest", href: "/site.webmanifest" },
        {
          rel: "stylesheet",
          href: appCss,
        },
      ],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const routeStructuredData = getRouteStructuredData(pathname);

  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script type="application/ld+json">{JSON.stringify(websiteJsonLd)}</script>
        {routeStructuredData.map((schema) => (
          <script key={schema["@type"]} type="application/ld+json">
            {JSON.stringify(schema)}
          </script>
        ))}
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return <Outlet />;
}
