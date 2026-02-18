import type { Metadata, Viewport } from "next";
import { createMetadata } from "@/app/common/seo";
import { ToolContainer } from "@/app/common/tool-container";

export const metadata: Metadata = createMetadata({
  title: "Edit PDF",
  description:
    "Edit PDF files with text annotations, freehand drawing, and text highlighting. Free online PDF editor.",
  path: "/pdf/edit-pdf",
  keywords: ["edit pdf", "pdf editor", "annotate pdf", "draw on pdf", "free pdf editor"],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ToolContainer>{children}</ToolContainer>
  );
}
