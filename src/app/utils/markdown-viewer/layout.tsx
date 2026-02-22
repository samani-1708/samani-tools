import type { Metadata, Viewport } from "next";
import { createMetadata } from "@/app/common/seo";

export const metadata: Metadata = createMetadata({
  title: "Markdown Viewer",
  description: "Preview markdown with typography, table support, syntax-highlighted code blocks, and print-ready output.",
  path: "/utils/markdown-viewer",
  keywords: ["markdown viewer", "markdown preview", "gfm markdown", "markdown to pdf", "markdown editor"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
