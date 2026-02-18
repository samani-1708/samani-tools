import type { Metadata, Viewport } from "next";
import { createMetadata } from "@/app/common/seo";
import { ToolContainer } from "@/app/common/tool-container";

export const metadata: Metadata = createMetadata({
  title: "Text Encode Decode",
  description:
    "Encode or decode text using Base64, Hex, URI Component, and HTML Entities in one tool.",
  path: "/utils/text-encode-decode",
  keywords: [
    "text encode decode",
    "base64 encode decode",
    "hex encode decode",
    "uri encode decode",
    "html entities encode decode",
  ],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ToolContainer>{children}</ToolContainer>
  );
}
