import { BRAND_NAME } from "@/app/common/constants";
import { getPageJsonLd, SEOPageSchema } from "@/app/common/seo-page-schema";
import { SITE_NAME, toAbsoluteUrl } from "@/app/common/seo";

function JsonLdScript({
  id,
  data,
}: {
  id: string;
  data: Record<string, unknown>;
}) {
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function GlobalSeoJsonLd() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND_NAME,
    url: toAbsoluteUrl("/"),
    brand: SITE_NAME,
    description:
      "Privacy-first browser tools for PDF, image, and utility workflows. Your files are processed on-device.",
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: toAbsoluteUrl("/"),
    publisher: {
      "@type": "Organization",
      name: BRAND_NAME,
    },
  };

  return (
    <>
      <JsonLdScript id="jsonld-organization" data={organization} />
      <JsonLdScript id="jsonld-website" data={website} />
    </>
  );
}

export function PageSeoJsonLd({ schema }: { schema: SEOPageSchema }) {
  const nodes = getPageJsonLd(schema);

  return (
    <>
      {nodes.map((node, index) => (
        <JsonLdScript
          key={`${schema.path}-${index}`}
          id={`jsonld-${schema.path.replace(/\W+/g, "-")}-${index}`}
          data={node}
        />
      ))}
    </>
  );
}
