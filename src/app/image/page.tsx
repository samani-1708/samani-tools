import type { Metadata } from "next";
import { IMAGE_TOOLS_HEADER } from "../common/constants";
import { ToolCard } from "../common/tool-card";
import { createMetadata } from "../common/seo";

export const metadata: Metadata = createMetadata({
  title: "Image Tools",
  description:
    "Free browser-based image tools to compress, convert, crop, resize, watermark, and edit photos without uploading to third-party servers.",
  path: "/image",
  keywords: [
    "image tools",
    "image converter",
    "image compressor",
    "photo editor online",
    "watermark image online",
    "crop and resize image",
  ],
});

export default function ImageToolsPage() {
  return (
    <div className="mx-auto text-center flex flex-col px-4 md:px-6 container max-w-7xl justify-center gap-8 items-center mt-12 mb-12">
      <div className="flex flex-col gap-6 max-w-5xl">
        <h1 className="text-3xl font-bold lg:text-5xl">Professional Image Tools Suite</h1>
        <p className="text-lg text-gray-600">
          Convert, crop, compress, resize, and watermark your images with privacy-first tools that run directly in your browser.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
        {IMAGE_TOOLS_HEADER.filter((tool) => !tool.href.includes("more") && !tool.href.includes("pdf-to-image")).map((tool) => (
          <ToolCard {...tool} key={tool.href} />
        ))}
      </div>
    </div>
  );
}
