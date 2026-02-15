import type { Metadata } from "next";
import { PDF_TOOLS_HEADER } from "../common/constants";
import { ToolCard } from "../common/tool-card";
import { createMetadata } from "../common/seo";

export const metadata: Metadata = createMetadata({
  title: "PDF Tools",
  description:
    "Free online PDF tools to merge, split, compress, rotate, crop, watermark, lock, unlock, and organize PDF files directly in your browser.",
  path: "/pdf",
  keywords: [
    "pdf tools",
    "merge pdf",
    "split pdf",
    "compress pdf online",
    "watermark pdf",
    "lock unlock pdf",
    "organize pdf pages",
  ],
});

export default function PDFToolsPage() {
  return (
    <>
      <div className="mx-auto text-center flex flex-col px-4 md:px-6 container max-w-7xl justify-center gap-8 items-center mt-12 mb-12">
        <div className="flex flex-col gap-6 max-w-5xl">
          <h1 className="text-3xl font-bold lg:text-5xl">
            Professional PDF Tools Suite
          </h1>
          <p className="text-lg text-gray-600">
            Transform, edit, and manage your PDF documents with our comprehensive collection of free online tools. 
            No software installation, no signup required - just powerful PDF solutions that work instantly in your browser.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
          {PDF_TOOLS_HEADER.filter(tool => tool.href !== "/pdf").map((tool) => (
            <ToolCard {...tool} key={tool.href} />
          ))}
        </div>
      </div>
    </>
  );
}
