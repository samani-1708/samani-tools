import type { Metadata, Viewport } from "next";
import { createMetadata } from "@/app/common/seo";
import { ToolContainer } from "@/app/common/tool-container";

export const metadata: Metadata = createMetadata({
  title: "Compress PDF",
  description:
    "Compress PDF files online and reduce file size while keeping document quality.",
  path: "/pdf/compress-pdf",
  keywords: ["compress pdf", "pdf compressor", "reduce pdf size", "free pdf compressor"],
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
