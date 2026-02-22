import type { Metadata, Viewport } from "next";
import { ToolContainer } from "@/app/common/tool-container";
import { PageClient } from "./page-client";
import { PdfToolSeo } from "../common/pdf-tool-seo";
import { chatPdfSeoConfig } from "./seo-config";
import { createMetadataFromSchema } from "@/app/common/seo-page-schema";

export const metadata: Metadata = createMetadataFromSchema(chatPdfSeoConfig.schema);

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
        <div className="h-full">
          <PageClient />
        </div>
      </ToolContainer>
      <PdfToolSeo config={chatPdfSeoConfig} />
    </>
  );
}
