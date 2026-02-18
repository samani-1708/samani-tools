import type { Metadata } from "next";
import { createMetadata } from "@/app/common/seo";
import { ToolContainer } from "@/app/common/tool-container";

export const metadata: Metadata = createMetadata({
  title: "Lock PDF",
  description:
    "Protect PDF files with password encryption directly in your browser.",
  path: "/pdf/lock-pdf",
  keywords: ["lock pdf", "password protect pdf", "encrypt pdf", "secure pdf", "pdf security"],
});

export default function LockPdfLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToolContainer>{children}</ToolContainer>
  );
}
