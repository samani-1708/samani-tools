import type { Metadata } from "next";
import { IMAGE_TOOLS_HEADER } from "../common/constants";
import { ToolCard } from "../common/tool-card";
import { createMetadata } from "../common/seo";

export const metadata: Metadata = createMetadata({
  title: "Image Tools",
  description:
    "Free online image tools to compress, convert, crop, resize, watermark, and edit images in your browser with a privacy-first workflow.",
  path: "/image",
  keywords: [
    "image tools",
    "online image tools",
    "image converter",
    "image compressor",
    "image editor online",
    "resize image online",
    "photo editor online",
    "watermark image",
    "crop image online",
  ],
});

export default function ImageToolsPage() {
  return (
    <div className="mx-auto text-center flex flex-col px-4 md:px-6 container max-w-7xl justify-center gap-10 items-center mt-12 mb-12">
      <div className="flex flex-col gap-4 max-w-5xl">
        <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Image Toolkit
        </p>
        <h1 className="text-3xl font-bold lg:text-5xl text-balance">
          Professional Image Tools for Daily Content Work
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-4xl mx-auto">
          Compress, convert, crop, resize, watermark, and edit image files with fast browser-based controls.
          Build cleaner visual assets for web publishing, marketing, product catalogs, and team workflows.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
        {IMAGE_TOOLS_HEADER.filter((tool) => !tool.href.includes("more") && !tool.href.includes("pdf-to-image")).map((tool) => (
          <ToolCard {...tool} key={tool.href} />
        ))}
      </div>

      <div className="max-w-5xl text-left sm:text-center space-y-4">
        <h2 className="text-2xl sm:text-3xl font-semibold text-balance">
          Why teams use these image tools
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          These tools are built for practical image operations: reducing file size, matching exact dimensions,
          preparing platform-compatible formats, and applying visual ownership marks before distribution.
          Use them for campaign assets, e-commerce images, documentation visuals, and internal media workflows.
        </p>
      </div>
    </div>
  );
}
