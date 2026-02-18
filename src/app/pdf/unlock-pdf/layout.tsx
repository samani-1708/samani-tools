import type { Metadata } from "next";
import { createMetadata } from "@/app/common/seo";
import { ToolContainer } from "@/app/common/tool-container";

export const metadata: Metadata = createMetadata({
  title: "Unlock PDF",
  description:
    "Remove PDF password protection online for files you are authorized to open.",
  path: "/pdf/unlock-pdf",
  keywords: ["unlock pdf", "remove pdf password", "decrypt pdf", "pdf password remover", "unprotect pdf"],
});

export default function UnlockPdfLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToolContainer>{children}</ToolContainer>
  );
}
