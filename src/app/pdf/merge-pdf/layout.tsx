import type { Metadata, Viewport } from "next";
import { createMetadata } from "@/app/common/seo";
import { ToolContainer } from "@/app/common/tool-container";

export const metadata: Metadata = createMetadata({
  title: "Merge PDF",
  description:
    "Merge multiple PDF files into one document in the order you choose.",
  path: "/pdf/merge-pdf",
  keywords: ["merge pdf", "combine pdf", "join pdf files", "pdf merger"],
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
