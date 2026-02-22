import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { cookies } from "next/headers";
import { Toaster } from "@/components/ui/sonner";
import { SITE_NAME, SITE_URL } from "./common/seo";
import { BRAND_NAME } from "./common/constants";
import { LayoutShell } from "./common/layout-shell";
import { GlobalSeoJsonLd } from "./common/seo-jsonld";
import { BuyMeACoffeeFloatingScript } from "@/app/common/bmc";
import { AdsenseScript } from "@/app/common/adsense";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${BRAND_NAME} - Free PDF, Image, and Utility Tools`,
    template: `%s | ${BRAND_NAME}`,
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
    title: `${BRAND_NAME} - Free PDF and Image Tools`,
    description:
      "Edit PDF and image files directly in your browser. Fast, private, and free.",
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: `${BRAND_NAME} - Free PDF and Image Tools`,
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
    { name: "maintainer", url: "https://github.com" },
  ],
  creator: BRAND_NAME,
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

export default async function RootLayout(props: RootLayoutProps) {
  const { children } = props;
  const adsenseEnabled = process.env.NEXT_PUBLIC_ENABLE_ADSENSE === "true";
  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID?.trim();
  const cookieStore = await cookies();
  const savedTheme = cookieStore.get("site-theme")?.value;
  const savedMode = cookieStore.get("site-mode")?.value;
  const theme =
    savedTheme === "forest" ||
    savedTheme === "blue" ||
    savedTheme === "lavender" ||
    savedTheme === "beach" ||
    savedTheme === "default"
      ? savedTheme
      : "default";
  const isDark = savedMode === "dark";

  return (
    <html lang="en" data-theme={theme} className={isDark ? "dark" : undefined}>
      <head>
        <AdsenseScript enabled={adsenseEnabled} clientId={adsenseClientId} />
      </head>
      <body className="flex flex-col min-h-screen">
        <Script id="theme-init" strategy="beforeInteractive">{`
          (function () {
            try {
              var theme = localStorage.getItem('site-theme') || '${theme}';
              var mode = localStorage.getItem('site-mode') || '${savedMode === "dark" ? "dark" : "light"}';
              if (theme !== 'default' && theme !== 'forest' && theme !== 'blue' && theme !== 'lavender' && theme !== 'beach') theme = 'default';
              document.documentElement.setAttribute('data-theme', theme);
              if (mode === 'dark') document.documentElement.classList.add('dark');
              else document.documentElement.classList.remove('dark');
            } catch (_) {
              document.documentElement.setAttribute('data-theme', '${theme}');
              ${isDark ? "document.documentElement.classList.add('dark');" : "document.documentElement.classList.remove('dark');"}
            }
          })();
        `}</Script>
        <GlobalSeoJsonLd />
        <LayoutShell>
          {children}
          <Toaster />
        </LayoutShell>
        {/* Register service worker for WASM/JS asset precaching */}
        <Script id="sw-register" strategy="afterInteractive">{`
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw-asset-cache.js').catch(function() {});
          }
        `}</Script>
        <BuyMeACoffeeFloatingScript />
      </body>
      {/* @ts-ignore */}
      <amp-auto-ads
        type="adsense"
        data-ad-client="ca-pub-2994639271732289"
      />
    </html>
  );
}
