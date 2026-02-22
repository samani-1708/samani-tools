import { PageSeoJsonLd } from "@/app/common/seo-jsonld";
import { StandardToolSeoSections, type StandardToolSeoProps } from "@/app/common/standard-tool-seo";
import type { SEOPageSchema } from "@/app/common/seo-page-schema";

export type ToolSeoConfig = {
  schema: SEOPageSchema;
  sections: StandardToolSeoProps;
};

export function ToolSeo({ config }: { config: ToolSeoConfig }) {
  return (
    <>
      <StandardToolSeoSections {...config.sections} />
      <PageSeoJsonLd schema={config.schema} />
    </>
  );
}

