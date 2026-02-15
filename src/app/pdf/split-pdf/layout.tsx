import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Split PDF - Free Online PDF Splitter | SamAni",
  description: "Split PDF files instantly. Extract pages by range, split into individual pages, or split by size. Secure, free, no signup.",
  keywords: ['Split PDF', 'PDF splitter', 'extract PDF pages', 'free PDF splitter'],
};

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
