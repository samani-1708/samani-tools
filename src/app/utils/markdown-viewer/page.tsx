import type { Metadata } from "next";
import { ToolSeo } from "@/app/common/tool-seo";
import { createMetadataFromSchema } from "@/app/common/seo-page-schema";
import { ToolContainer } from "@/app/common/tool-container";
import { markdownViewerSeoConfig } from "./seo-config";
import { PageClient } from "./page-client";

export const metadata: Metadata = createMetadataFromSchema(markdownViewerSeoConfig.schema);

export default function Page() {
  return (
    <>
      <ToolContainer>
        <PageClient />
      </ToolContainer>
      <ToolSeo config={markdownViewerSeoConfig} />
    </>
  );
}
