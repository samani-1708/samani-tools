import type { Metadata } from "next";
import { UTILITY_TOOLS_HEADER } from "../common/constants";
import { ToolCard } from "../common/tool-card";
import { createMetadata } from "../common/seo";

export const metadata: Metadata = createMetadata({
  title: "Utility Tools",
  description:
    "Free online utility tools for developers and creators including QR code generation, encoding utilities, hash generation, JSON inspection, JWT debugging, and text comparison.",
  path: "/utils",
  keywords: [
    "utility tools",
    "developer tools",
    "online utilities",
    "web developer utilities",
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
    <div className="mx-auto text-center flex flex-col px-4 md:px-6 container max-w-7xl justify-center gap-10 items-center mt-12 mb-12">
      <div className="flex flex-col gap-4 max-w-5xl">
        <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Utility Toolkit
        </p>
        <h1 className="text-3xl font-bold lg:text-5xl text-balance">
          Text and Productivity Utilities in One Place
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-4xl mx-auto">
          Encode, decode, compare, parse, hash, and transform data with focused tools built for
          technical workflows, debugging, and rapid content operations directly in your browser.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
        {UTILITY_TOOLS_HEADER.map((tool) => (
          <ToolCard {...tool} key={tool.href} />
        ))}
      </div>

      <div className="max-w-5xl text-left sm:text-center space-y-4">
        <h2 className="text-2xl sm:text-3xl font-semibold text-balance">
          Built for repeat technical tasks
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          Use these utilities for API debugging, payload inspection, naming cleanup, text verification,
          and quick data conversions. The toolkit keeps everyday engineering and content tasks fast,
          consistent, and easy to repeat across projects.
        </p>
      </div>
    </div>
  );
}
