import type { Metadata } from "next";
import { PageLayout } from "../common/layouts";

export const metadata: Metadata = {
  title: "Image Tools - Free Online Image Editor | SamAni",
  description:
    "Convert, compress, resize, crop, and watermark images directly in your browser. Free, private, and fast.",
  keywords:
    "image tools, image converter, image compressor, watermark image, crop image, resize image, avif, webp, jpg, png",
  alternates: {
    canonical: "/image",
  },
};

export default function ImageLayout({ children }: { children: React.ReactNode }) {
  return <PageLayout>{children}</PageLayout>;
}
