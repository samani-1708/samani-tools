import type { Metadata, Viewport } from "next";
import { createMetadata } from "@/app/common/seo";

export const metadata: Metadata = createMetadata({
  title: "Compress Image",
  description:
    "Reduce JPG, PNG, WEBP, and AVIF image size with quality controls directly in your browser.",
  path: "/image/compress-image",
  keywords: [
    "compress image",
    "reduce image size",
    "jpg compressor",
    "png compressor",
    "webp compressor",
    "avif compressor",
  ],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
