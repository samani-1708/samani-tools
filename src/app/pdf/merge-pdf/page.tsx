import type { Metadata, Viewport } from "next";
import { PageClient } from "./page-client";
import { ToolContainer } from "@/app/common/tool-container";
import { mergePdfMetadata, mergePdfSeoSchema } from "./seo-schema";
import { MergePdfSeoContent } from "./seo-content";
import { PageSeoJsonLd } from "@/app/common/seo-jsonld";

export const metadata: Metadata = mergePdfMetadata;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function Page() {
  return (
    <>
      <ToolContainer>
        <div id="merge-pdf-tool" className="h-full">
        <PageClient />
        </div>
      </ToolContainer>
      <MergePdfSeoContent />
      <PageSeoJsonLd schema={mergePdfSeoSchema} />
    </>
  );
}
