import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — MatrixDojo" },
      {
        name: "description",
        content:
          "How MatrixDojo handles your data: calculations stay in your browser, and advertising partners such as Google may use cookies.",
      },
      { property: "og:title", content: "MatrixDojo Privacy Policy" },
      {
        property: "og:description",
        content: "Calculations run locally. Learn how advertising cookies are used on MatrixDojo.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <PageLayout
      title="Privacy Policy"
      tagline="What MatrixDojo collects, what it doesn't, and how advertising works on this site."
      showHowItWorks={false}
    >
      <section className="max-w-3xl space-y-6 text-muted-foreground">
        <div className="space-y-2">
          <h2 className="text-foreground text-xl font-semibold">Your calculations</h2>
          <p>
            Every matrix calculation runs entirely in your browser. The values you enter are never
            uploaded to or stored on our servers.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-foreground text-xl font-semibold">Advertising and cookies</h2>
          <p>
            MatrixDojo is free because it shows ads served by Google AdSense. Third-party vendors,
            including Google, use cookies to serve ads based on your prior visits to this and other
            websites.
          </p>
          <p>
            Google's use of advertising cookies enables it and its partners to serve ads to you
            based on your visits to this site and/or other sites on the Internet. You can opt out of
            personalized advertising in{" "}
            <a
              className="text-foreground underline underline-offset-4"
              href="https://adssettings.google.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Ads Settings
            </a>
            , or opt out of some third-party vendors' use of cookies at{" "}
            <a
              className="text-foreground underline underline-offset-4"
              href="https://www.aboutads.info/choices/"
              target="_blank"
              rel="noopener noreferrer"
            >
              aboutads.info
            </a>
            .
          </p>
          <p>
            Learn more about{" "}
            <a
              className="text-foreground underline underline-offset-4"
              href="https://policies.google.com/technologies/partner-sites"
              target="_blank"
              rel="noopener noreferrer"
            >
              how Google uses information from sites that use its services
            </a>
            .
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-foreground text-xl font-semibold">Consent</h2>
          <p>
            Visitors in the European Economic Area, the United Kingdom, and Switzerland are asked
            for consent before personalized ads are shown. You can change your choice at any time
            from the privacy settings link shown by the consent message.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-foreground text-xl font-semibold">Changes</h2>
          <p>If this policy changes, the updated version will be posted on this page.</p>
        </div>
      </section>
    </PageLayout>
  );
}
