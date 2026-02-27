import type { Metadata, Viewport } from "next";
import { ToolContainer } from "@/app/common/tool-container";
import { createMetadataFromSchema } from "@/app/common/seo-page-schema";
import { PdfToolSeo } from "../common/pdf-tool-seo";
import { scanPdfSeoConfig } from "./seo-config";
import { PageClient } from "./page-client";

export const metadata: Metadata = createMetadataFromSchema(
  scanPdfSeoConfig.schema,
);

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
        <PageClient />
      </ToolContainer>
      <PdfToolSeo config={scanPdfSeoConfig} />
    </>
  );
}
