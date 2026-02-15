import type { Metadata, Viewport } from "next";
import { createMetadata } from "@/app/common/seo";

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
    <div className="w-full flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
      {children}
    </div>
  );
}
