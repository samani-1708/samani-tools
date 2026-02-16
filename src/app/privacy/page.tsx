import type { Metadata } from "next";
import { createMetadata } from "../common/seo";

export const metadata: Metadata = createMetadata({
  title: "Privacy Policy",
  description:
    "Read the 🤗 SamAni Tools privacy policy. Learn how files are processed in-browser and what data we do or do not collect.",
  path: "/privacy",
  keywords: ["privacy policy", "file privacy", "browser processing"],
});

export default function PrivacyPage() {
  return (
    <div className="container max-w-4xl mx-auto px-4 md:px-6 py-12 space-y-6">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="text-muted-foreground">
        🤗 SamAni Tools prioritizes privacy. Wherever possible, file processing is
        performed directly in your browser.
      </p>
      <p className="text-muted-foreground">
        We do not require account creation for core functionality and do not
        intentionally store your uploaded file contents on our servers.
      </p>
    </div>
  );
}

