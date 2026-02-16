import type { Metadata, Viewport } from "next";
import { createMetadata } from "@/app/common/seo";

export const metadata: Metadata = createMetadata({
  title: "Word Counter",
  description: "Count words, characters, sentences, and paragraphs with social media character limits.",
  path: "/utils/word-counter",
  keywords: ["word counter", "character count", "text statistics", "social media limits"],
});

export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, maximumScale: 1, userScalable: false,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="w-full flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>{children}</div>;
}
