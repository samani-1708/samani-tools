import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { SiteHeader } from "./common/site-header/site-header";
import { SiteFooter } from "./common/site-footer/site-footer";
import { Toaster } from "@/components/ui/sonner";
import { SITE_NAME, SITE_URL } from "./common/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "SamAni - Free PDF and Image Tools",
    template: "%s | SamAni",
  },
  description:
    "Free browser-based tools to edit PDFs and images: merge, split, compress, convert, crop, watermark, resize, and more. Private and secure.",
  keywords: [
    "free pdf tools",
    "free image tools",
    "merge pdf",
    "split pdf",
    "compress pdf",
    "watermark pdf",
    "crop pdf",
    "image to pdf",
    "compress image",
    "convert image",
    "resize image",
    "crop image",
    "watermark image",
    "online file tools",
    "browser based tools",
    "private file processing",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "SamAni - Free PDF and Image Tools",
    description:
      "Edit PDF and image files directly in your browser. Fast, private, and free.",
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "SamAni - Free PDF and Image Tools",
    description:
      "Merge, split, compress, convert, crop, watermark, and resize files in your browser.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  authors: [
    { name: "vtechguys", url: "https://github.com/vtechguys" },
    { name: "samani-1708", url: "https://github.com/samani-1708" },
  ],
  creator: "SamAni",
  publisher: SITE_NAME,
  applicationName: SITE_NAME,
  category: "Technology",
  referrer: "origin-when-cross-origin",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout(props: RootLayoutProps) {
  const { children } = props;

  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        {/* site header */}
        <SiteHeader />

        {/* Main content of page */}
        <main className="flex-1">
          {children}
          <Toaster />
        </main>

        <SiteFooter />
        {/* Register service worker for WASM/JS asset precaching */}
        <Script id="sw-register" strategy="afterInteractive">{`
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw-asset-cache.js').catch(function() {});
          }
        `}</Script>
        {/* buy me a coffee: floating widget */}
        <Script
          type="text/javascript"
          src="https://cdnjs.buymeacoffee.com/1.0.0/button.prod.min.js"
          data-name="bmc-button"
          data-slug="samanitools"
          data-color="#FFDD00"
          data-emoji="☕"
          data-font="Cookie"
          data-text="Buy me a coffee"
          data-outline-color="#000000"
          data-font-color="#000000"
          data-coffee-color="#ffffff"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
