import type { Metadata } from "next";
import { Separator } from "@/components/ui/separator";
import { IMAGE_TOOLS_HEADER, PDF_TOOLS_HEADER } from "./common/constants";
import { SITE_HERO_CONFIG, SiteHero } from "./site-hero";
import { ToolCard } from "./common/tool-card";
import { createMetadata } from "./common/seo";

export const metadata: Metadata = createMetadata({
  title: "Free PDF and Image Tools",
  description:
    "All-in-one toolkit for PDF and image editing in your browser. Merge, split, compress, crop, convert, watermark, and resize with privacy-first processing.",
  path: "/",
  keywords: [
    "pdf and image tools",
    "online file editor",
    "free browser tools",
    "merge split compress convert",
    "private file processing",
  ],
});

export default function Home() {
  return (
    <>
      <SiteHero config={SITE_HERO_CONFIG} />
      <Separator />
      <div className="mx-auto mt-12 text-center flex flex-col px-4 md:px-6 container  max-w-7xl justify-center gap-8 items-center mb-12">
        <div className="flex flex-col gap-6 max-w-5xl">
          <h3 className="text-2xl font-bold lg:text-4xl">
            All-in-one PDF toolkit, right where you need it
          </h3>
          <p className="text-base text-gray-600">
            Access every essential PDF tool in one place — completely free and
            simple to use. Merge, split, compress, convert, rotate, unlock, or
            watermark your PDFs in just a few clicks.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 ">
          {PDF_TOOLS_HEADER.map((tool) => (
            <ToolCard {...tool} key={tool.href} />
          ))}
        </div>
      </div>
      <Separator />
      <div className="mx-auto text-center flex flex-col px-4 md:px-6 container  max-w-7xl justify-center gap-8 items-center mt-12 mb-12">
        <div className="flex flex-col gap-6 max-w-5xl">
          <h3 className="text-2xl font-bold lg:text-4xl">
            Image Editing, Supercharged
          </h3>
          <p className="text-base text-gray-600">
            Your powerful, forever-free online photo studio — crop, compress,
            convert, and more in just a few clicks.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-col-3 lg:grid-cols-3 xl:grid-cols-5 gap-6 ">
          {IMAGE_TOOLS_HEADER.map((tool) => (
            <ToolCard {...tool} key={tool.href} />
          ))}
        </div>
      </div>
    </>
  );
}
