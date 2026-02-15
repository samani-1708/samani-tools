import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { SiteHeader } from "./common/site-header/site-header";
import { SiteFooter } from "./common/site-footer/site-footer";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "SamAni - PDF, Image, Text utility tools",
  description:
    "A collection of finely crafted utility tools built with open source and love, for private and secure use.",
  keywords: [
    "image to pdf",
    "convert jpg to pdf",
    "online pdf tool",
    "private tool",
    "secure tool",
    "pdf tool",
    "image tool",
    "text tool",
    "utility tool",
    "free online editor",
    "compress image",
    "merge pdf",
  ],
  robots: {
    index: true,
    follow: true,
  },
  authors: [
    { name: "vtechguys", url: "https://github.com/vtechguys" },
    { name: "samani-1708", url: "https://github.com/samani-1708" },
  ],
  creator: "SamAni",
  publisher: "SamAni",
  category: "Utility",
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
