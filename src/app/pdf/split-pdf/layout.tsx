import type { Metadata, Viewport } from "next";
import { createMetadata } from "@/app/common/seo";

export const metadata: Metadata = createMetadata({
  title: "Split PDF",
  description:
    "Split PDF files by page ranges or extract single pages with browser-based processing.",
  path: "/pdf/split-pdf",
  keywords: ["split pdf", "pdf splitter", "extract pdf pages", "free pdf splitter"],
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
    <div className="w-full flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
      {children}
    </div>
  );
}
