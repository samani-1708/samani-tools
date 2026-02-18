import type { Metadata } from "next";
import { createMetadata } from "@/app/common/seo";
import { ToolContainer } from "@/app/common/tool-container";

export const metadata: Metadata = createMetadata({
  title: "Add Page Numbers to PDF",
  description:
    "Add page numbers to PDF files with configurable position, format, and start index.",
  path: "/pdf/page-numbers",
  keywords: ["add page numbers pdf", "pdf page numbers", "number pdf pages", "pdf pagination", "pdf editor"],
});

export default function PageNumbersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
 return (
    <ToolContainer>{children}</ToolContainer>
  );
}
