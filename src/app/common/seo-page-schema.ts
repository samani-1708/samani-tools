import type { Metadata } from "next";
import { createMetadata, toAbsoluteUrl } from "@/app/common/seo";
import { BRAND_NAME } from "@/app/common/constants";
import { SITE_NAME } from "@/app/common/seo";

export type SEOFaqItem = {
  question: string;
  answer: string;
};

export type SEOFeatureItem = {
  title: string;
  description: string;
  emoji?: string;
};

export type SEOStepItem = {
  title: string;
  description?: string;
  emoji?: string;
};

type SEOSectionBase = {
  header: string;
  subHeader?: string;
};

export type SEOInfoSection = SEOSectionBase & {
  type: "info";
  paragraphs?: string[];
  bullets?: string[];
};

export type SEOFeaturesSection = SEOSectionBase & {
  type: "keyfeatures";
  features: SEOFeatureItem[];
};

export type SEOStepsSection = SEOSectionBase & {
  type: "steps";
  paragraphs?: string[];
  steps: SEOStepItem[];
};

export type SEOFAQSection = SEOSectionBase & {
  type: "faq";
  faqs: SEOFaqItem[];
};

export type SEOPageSection =
  | SEOInfoSection
  | SEOFeaturesSection
  | SEOStepsSection
  | SEOFAQSection;

export interface SEOPageSchema {
  title: string;
  description: string;
  path: string;
  keywords: string[];
  hero?: {
    header: string;
    subHeader?: string;
    highlights?: string[];
  };
  sections: SEOPageSection[];
}

export function createMetadataFromSchema(schema: SEOPageSchema): Metadata {
  return createMetadata({
    title: schema.title,
    description: schema.description,
    path: schema.path,
    keywords: schema.keywords,
  });
}

function getAllFaqs(schema: SEOPageSchema): SEOFaqItem[] {
  return schema.sections
    .filter((section): section is SEOFAQSection => section.type === "faq")
    .flatMap((section) => section.faqs);
}

function getHowToSteps(schema: SEOPageSchema): SEOStepItem[] {
  return schema.sections
    .filter((section): section is SEOStepsSection => section.type === "steps")
    .flatMap((section) => section.steps);
}

export function getPageJsonLd(schema: SEOPageSchema) {
  const pageUrl = toAbsoluteUrl(schema.path);
  const howToSteps = getHowToSteps(schema);
  const faqItems = getAllFaqs(schema);

  const baseEntity = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: schema.title,
    description: schema.description,
    url: pageUrl,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: toAbsoluteUrl("/"),
    },
    publisher: {
      "@type": "Organization",
      name: BRAND_NAME,
      url: toAbsoluteUrl("/"),
    },
    keywords: schema.keywords.join(", "),
  };

  const toolEntity = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: schema.title,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript and a modern web browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description:
      "Free, browser-based document tools where processing happens on-device and files do not leave your device.",
    url: pageUrl,
    provider: {
      "@type": "Organization",
      name: BRAND_NAME,
      url: toAbsoluteUrl("/"),
    },
    featureList: [
      "Local browser processing",
      "No file upload required for processing",
      "No account required",
      "No watermark",
      "Works on desktop and mobile",
    ],
  };

  const nodes: Array<Record<string, unknown>> = [baseEntity, toolEntity];

  if (howToSteps.length > 0) {
    nodes.push({
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: `How to ${schema.title.toLowerCase()}`,
      description: schema.description,
      step: howToSteps.map((step, index) => ({
        "@type": "HowToStep",
        position: index + 1,
        name: step.title,
        text: step.description || step.title,
      })),
    });
  }

  if (faqItems.length > 0) {
    nodes.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    });
  }

  return nodes;
}
