import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Compress PDF - Free Online PDF Compressor | SamAni",
  description: "Compress PDF files instantly. Reduce file size while maintaining quality. Secure, free, no signup.",
  keywords: ['Compress PDF', 'PDF compressor', 'reduce PDF size', 'free PDF compressor'],
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
