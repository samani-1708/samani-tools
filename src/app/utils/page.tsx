import type { Metadata } from "next";
import { UTILITY_TOOLS_HEADER } from "../common/constants";
import { ToolCard } from "../common/tool-card";
import { createMetadata } from "../common/seo";

export const metadata: Metadata = createMetadata({
  title: "Utility Tools",
  description:
    "Free browser-based utility tools for developers and creators: QR code generation, text encode/decode, hash generation, JSON viewer, JWT tools, diff checker, and more.",
  path: "/utils",
  keywords: [
    "developer tools",
    "online utilities",
    "qr code generator",
    "json viewer",
    "hash generator",
    "jwt decode",
    "diff checker",
    "text encode decode",
  ],
});

export default function UtilityToolsPage() {
  return (
    <div className="mx-auto text-center flex flex-col px-4 md:px-6 container max-w-7xl justify-center gap-8 items-center mt-12 mb-12">
      <div className="flex flex-col gap-6 max-w-5xl">
        <h1 className="text-3xl font-bold lg:text-5xl">
          Developer & Utility Tools
        </h1>
        <p className="text-lg text-gray-600">
          Encode, decode, compare, parse, hash, and transform with privacy-first
          tools that run directly in your browser.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
        {UTILITY_TOOLS_HEADER.map((tool) => (
          <ToolCard {...tool} key={tool.href} />
        ))}
      </div>
    </div>
  );
}

