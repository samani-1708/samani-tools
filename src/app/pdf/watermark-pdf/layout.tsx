import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Watermark PDF - Free Online PDF Watermarking Tool | SamAni",
  description: "Add custom watermarks to your PDF documents. Support for text and image watermarks with full customization. Secure, free, no signup.",
  keywords: ['Watermark PDF', 'PDF watermark', 'add watermark to PDF', 'free PDF watermarking tool'],
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
