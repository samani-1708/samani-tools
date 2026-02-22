import type { Metadata } from "next";
import { createMetadata, SITE_NAME } from "../common/seo";

export const metadata: Metadata = createMetadata({
  title: "About",
  description: `Learn about ${SITE_NAME}, our privacy-first approach, and our mission to build high-quality browser-based file and utility tools.`,
  path: "/about",
  keywords: [
    "about utility tools",
    "privacy first tools",
    "browser based tools",
  ],
});

export default function AboutPage() {
  return (
    <div className="container max-w-4xl mx-auto px-4 md:px-6 py-12 space-y-6">
      <h1 className="text-3xl font-bold">About {SITE_NAME}</h1>
      <p className="text-muted-foreground">
        {SITE_NAME} is a collection of practical PDF, image, and utility tools
        designed to run directly in your browser.
      </p>
      <p className="text-muted-foreground">
        Our goal is simple: build fast, reliable, and privacy-first tooling so
        you can get work done without uploading sensitive files to unknown
        services.
      </p>
    </div>
  );
}
