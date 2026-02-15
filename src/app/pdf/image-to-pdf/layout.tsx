import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Image to PDF - Free Online Converter | SamAni",
  description:
    "Convert images to PDF instantly. Support for JPG, PNG. Set orientation, page size, and margins. Free, secure, no signup.",
  keywords: [
    "Image to PDF",
    "JPG to PDF",
    "PNG to PDF",
    "free image converter",
  ],
};

export const viewport: Viewport = {
  width: "device-width",
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
    <div
      className="w-full flex flex-col overflow-hidden"
      style={{ height: "calc(100vh - 64px)" }}
    >
      {children}
    </div>
  );
}
