import type { Metadata } from "next";
import { PageLayout } from "../common/layouts";

export const metadata: Metadata = {
  title: "PDF Tools - Free Online Privacy first PDF tools | SamAni",
  description:
    "Access all essential PDF tools in one place. Merge, split, compress, convert, rotate, lock unlock, watermark PDFs and more. 100% free, secure, private that works in your browser, you data never leaves your device.",
  keywords:
    "PDF tools, free PDF editor, PDF converter, merge PDF, split PDF, compress PDF, watermark PDF, scan to PDF, image to PDF, PDF manipulation, online PDF tools, browser-based PDF editor",
  openGraph: {
    title: "PDF Tools - Free Online PDF | SamAni",
    description:
      "Complete suite of PDF tools - merge, split, compress, convert, watermark and more. Free, secure, no signup required.",
    type: "website",
    url: "/pdf",
    siteName: "SamAni Tools",
    images: [
      {
        url: "/images/og/pdf/og.png",
        width: 1200,
        height: 630,
        alt: "SamAni PDF Tools - Free Online PDF",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PDF Tools - Free Online PDF",
    description:
      "Complete suite of PDF tools - merge, split, compress, convert, watermark and more. Free, secure, no signup required.",
    images: ["/images/og/pdf/og.png"],
  },
  alternates: {
    canonical: "/pdf",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function PDFLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageLayout>
      {children}
    </PageLayout>
  );
}
