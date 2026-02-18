import type { Metadata, Viewport } from "next";
import { createMetadata } from "@/app/common/seo";
import { ToolContainer } from "@/app/common/tool-container";

export const metadata: Metadata = createMetadata({
  title: "Watermark PDF",
  description:
    "Add text or image watermarks to PDF files with position, style, and opacity controls.",
  path: "/pdf/watermark-pdf",
  keywords: ["watermark pdf", "pdf watermark", "add watermark to pdf", "free pdf watermark tool"],
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
