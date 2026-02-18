import type { Metadata, Viewport } from "next";
import { createMetadata } from "@/app/common/seo";
import { ToolContainer } from "@/app/common/tool-container";

export const metadata: Metadata = createMetadata({
  title: "Image to PDF",
  description:
    "Convert JPG and PNG images to PDF with orientation, page-size, and margin options.",
  path: "/pdf/image-to-pdf",
  keywords: ["image to pdf", "jpg to pdf", "png to pdf", "free image to pdf converter"],
});

export const viewport: Viewport = {
  width: "device-width",
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
