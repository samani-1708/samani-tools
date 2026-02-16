import type { Metadata, Viewport } from "next";
import { createMetadata } from "@/app/common/seo";

export const metadata: Metadata = createMetadata({
  title: "URL Encode/Decode",
  description: "Encode or decode URLs with a detailed breakdown of URL components.",
  path: "/utils/url-encode-decode",
  keywords: ["url encode", "url decode", "percent encoding", "uri component", "url parser"],
});

export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, maximumScale: 1, userScalable: false,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="w-full flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>{children}</div>;
}
