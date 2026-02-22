import type { Metadata } from "next";
import { PageClient } from "./page-client";
import { ToolSeo } from "@/app/common/tool-seo";
import { createMetadataFromSchema } from "@/app/common/seo-page-schema";
import { ToolContainer } from "@/app/common/tool-container";
import { compressImageSeoConfig } from "./seo-config";

export const metadata: Metadata = createMetadataFromSchema(compressImageSeoConfig.schema);

export default function Page() {
  return (
    <>
      <ToolContainer>
        <PageClient />
      </ToolContainer>
      <ToolSeo config={compressImageSeoConfig} />
    </>
  );
}
