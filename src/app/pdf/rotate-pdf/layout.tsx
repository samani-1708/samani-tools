import type { Metadata } from "next";
import { createMetadata } from "@/app/common/seo";
import { ToolContainer } from "@/app/common/tool-container";

export const metadata: Metadata = createMetadata({
  title: "Rotate PDF",
  description:
    "Rotate PDF pages by 90, 180, or 270 degrees with quick page-level controls.",
  path: "/pdf/rotate-pdf",
  keywords: ["rotate pdf", "pdf rotator", "turn pdf pages", "flip pdf", "pdf editor"],
});

export default function RotatePdfLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToolContainer>{children}</ToolContainer>
  );
}
