import type { Metadata } from "next";
import { createMetadata } from "@/app/common/seo";
import { ToolContainer } from "@/app/common/tool-container";

export const metadata: Metadata = createMetadata({
  title: "Organize PDF",
  description:
    "Organize PDF pages online by reordering, rotating, deleting, or adding pages.",
  path: "/pdf/organize-pdf",
  keywords: ["organize pdf", "rearrange pdf pages", "delete pdf pages", "reorder pdf", "pdf page manager"],
});

export default function OrganizePdfLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToolContainer>{children}</ToolContainer>
  );
}
