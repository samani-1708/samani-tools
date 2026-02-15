import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Merge Pdf - Free Online PDF Merge | SamAni",
  description: "",
  keywords: ['JPG to PDF', 'convert JPG to PDF', 'merge JPG files', 'free JPG to PDF converter'],
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
    <div className="w-full flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 64px)'}}>
      {children}
    </div>
  );
}
