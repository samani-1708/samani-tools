import type { Metadata } from "next";
import { PageLayout } from "../common/layouts";
import { createMetadata } from "../common/seo";

export const metadata: Metadata = createMetadata({
  title: "Image Tools",
  description:
    "Convert, compress, resize, crop, watermark, and edit images directly in your browser. Free, private, and fast.",
  path: "/image",
  keywords: [
    "image tools",
    "image converter",
    "image compressor",
    "watermark image",
    "crop image",
    "resize image",
    "avif webp jpg png",
  ],
});

export default function ImageLayout({ children }: { children: React.ReactNode }) {
  return <PageLayout>{children}</PageLayout>;
}
