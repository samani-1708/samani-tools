import type { Metadata, Viewport } from "next";
import { PageClient } from "./page-client";
import { PdfToolSeo } from "../common/pdf-tool-seo";
import { rotatePdfSeoConfig } from "./seo-config";
import { ToolContainer } from "@/app/common/tool-container";
import { createMetadataFromSchema } from "@/app/common/seo-page-schema";

export const metadata: Metadata = createMetadataFromSchema(rotatePdfSeoConfig.schema);

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RotatePdfPage() {
  return (
    <>
      <ToolContainer>
        <PageClient />
      </ToolContainer>
      <PdfToolSeo config={rotatePdfSeoConfig} />
    </>
  );
}
