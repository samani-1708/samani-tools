import { PageSeoJsonLd } from "@/app/common/seo-jsonld";
import { StandardToolSeoSections, type StandardToolSeoProps } from "@/app/common/standard-tool-seo";
import type { SEOPageSchema } from "@/app/common/seo-page-schema";

export type PdfToolSeoConfig = {
  schema: SEOPageSchema;
  sections: StandardToolSeoProps;
};

export function PdfToolSeo({ config }: { config: PdfToolSeoConfig }) {
  return (
    <>
      <StandardToolSeoSections {...config.sections} />
      <PageSeoJsonLd schema={config.schema} />
    </>
  );
}
