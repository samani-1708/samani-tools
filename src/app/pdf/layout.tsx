import type { Metadata } from "next";
import { PageLayout } from "../common/layouts";
import { createMetadata } from "../common/seo";

export const metadata: Metadata = createMetadata({
  title: "PDF Tools",
  description:
    "Access essential PDF tools in one place: merge, split, compress, rotate, lock, unlock, watermark, crop, and organize PDFs securely in your browser.",
  path: "/pdf",
  keywords: [
    "pdf tools",
    "free pdf editor",
    "pdf converter",
    "merge pdf",
    "split pdf",
    "compress pdf",
    "watermark pdf",
    "organize pdf",
    "browser based pdf tools",
  ],
});

export default function PDFLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageLayout>
      {children}
    </PageLayout>
  );
}
