import type { Metadata, Viewport } from "next";
import { createMetadata } from "@/app/common/seo";

export const metadata: Metadata = createMetadata({
  title: "Image to PDF",
  description:
    "Convert JPG and PNG images to PDF with orientation, page-size, and margin options.",
  path: "/pdf/image-to-pdf",
  keywords: ["image to pdf", "jpg to pdf", "png to pdf", "free image to pdf converter"],
});

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
