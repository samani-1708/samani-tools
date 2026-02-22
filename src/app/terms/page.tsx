import type { Metadata } from "next";
import { createMetadata, SITE_NAME } from "../common/seo";

export const metadata: Metadata = createMetadata({
  title: "Terms of Service",
  description: `Read the ${SITE_NAME} terms of service for usage rules, limitations, and responsibilities.`,
  path: "/terms",
  keywords: ["terms of service", "usage terms", "utility tools terms"],
});

export default function TermsPage() {
  return (
    <div className="container max-w-4xl mx-auto px-4 md:px-6 py-12 space-y-6">
      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <p className="text-muted-foreground">
        By using {SITE_NAME}, you agree to use the service responsibly and in
        compliance with applicable laws.
      </p>
      <p className="text-muted-foreground">
        The tools are provided as-is without warranties. You are responsible for
        verifying outputs before production use.
      </p>
    </div>
  );
}
