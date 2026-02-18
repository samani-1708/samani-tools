import type { Metadata } from "next";
import { createMetadata } from "@/app/common/seo";
import { ToolContainer } from "@/app/common/tool-container";

export const metadata: Metadata = createMetadata({
  title: "Crop PDF",
  description:
    "Crop PDF pages online by selecting a crop box for each page directly in your browser.",
  path: "/pdf/crop-pdf",
  keywords: ["crop pdf", "pdf cropper", "trim pdf", "cut pdf pages", "pdf editor"],
});

export default function CropPdfLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToolContainer>{children}</ToolContainer>
  );
}
