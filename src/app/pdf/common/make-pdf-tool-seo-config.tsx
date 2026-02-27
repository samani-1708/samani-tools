import { LockIcon, ShieldCheckIcon } from "lucide-react";
import type { SEOFaqItem, SEOPageSchema, SEOStepItem } from "@/app/common/seo-page-schema";
import type { StandardToolSeoProps } from "@/app/common/standard-tool-seo";
import type { PdfToolSeoConfig } from "./pdf-tool-seo";
import { PDF_TOOLS_HEADER } from "@/app/common/constants";

type Input = {
  title: string;
  description: string;
  path: string;
  keywords: string[];
  heroBadge: string;
  heroTitle: string;
  heroDescription: string;
  heroHighlights: string[];
  introHeading: string;
  introParagraphs: string[];
  howToTitle: string;
  howToDescription: string;
  reasonsTitle: string;
  reasonsItems?: StandardToolSeoProps["reasons"]["items"];
  faqTitle: string;
  trustTitle: string;
  trustDescription: string;
  steps: SEOStepItem[];
  faqs: SEOFaqItem[];
};

type RelatedTool = {
  path: string;
  title: string;
  description: string;
  icon: StandardToolSeoProps["resources"]["cards"][number]["icon"];
  iconBg: string;
};

const defaultReasons = [
  {
    icon: "/images/icons/gauge.svg",
    iconAlt: "Performance icon for fast document processing",
    heading: "Fast workflow",
    text: "Upload, process, and export in a few guided steps.",
  },
  {
    icon: "/images/icons/layout-grid.svg",
    iconAlt: "Browser compatibility icon",
    heading: "Works in modern browsers",
    text: "Use the tool on desktop and mobile without extra software.",
  },
  {
    icon: "/images/icons/badge-check.svg",
    iconAlt: "Quality icon",
    heading: "Reliable output quality",
    text: "Get consistent results suitable for work and personal use.",
  },
  {
    icon: "/images/icons/download.svg",
    iconAlt: "Download and share icon",
    heading: "Download and share",
    text: "Save your processed PDF immediately and share when needed.",
  },
  {
    icon: "/images/icons/folder-open.svg",
    iconAlt: "Organization icon",
    heading: "Keeps files organized",
    text: "Maintain cleaner document sets with focused PDF workflows.",
  },
  {
    icon: "/images/icons/files.svg",
    iconAlt: "Professional usage icon",
    heading: "Built for professional tasks",
    text: "Suitable for reports, contracts, forms, and project documents.",
  },
];

const relatedTools: RelatedTool[] = PDF_TOOLS_HEADER.map((tool) => ({
  path: tool.href,
  title: tool.title,
  description: tool.description,
  icon: tool.icon,
  iconBg: tool.theme.BG,
}));

const relatedToolMap: Record<string, string[]> = {
  "/pdf/merge-pdf": ["/pdf/organize-pdf", "/pdf/compress-pdf", "/pdf/split-pdf"],
  "/pdf/split-pdf": ["/pdf/merge-pdf", "/pdf/organize-pdf", "/pdf/compress-pdf"],
  "/pdf/compress-pdf": ["/pdf/merge-pdf", "/pdf/split-pdf", "/pdf/organize-pdf"],
  "/pdf/organize-pdf": ["/pdf/merge-pdf", "/pdf/rotate-pdf", "/pdf/page-numbers"],
  "/pdf/crop-pdf": ["/pdf/rotate-pdf", "/pdf/organize-pdf", "/pdf/compress-pdf"],
  "/pdf/rotate-pdf": ["/pdf/organize-pdf", "/pdf/crop-pdf", "/pdf/page-numbers"],
  "/pdf/page-numbers": ["/pdf/organize-pdf", "/pdf/merge-pdf", "/pdf/watermark-pdf"],
  "/pdf/watermark-pdf": ["/pdf/lock-pdf", "/pdf/page-numbers", "/pdf/compress-pdf"],
  "/pdf/lock-pdf": ["/pdf/unlock-pdf", "/pdf/watermark-pdf", "/pdf/merge-pdf"],
  "/pdf/unlock-pdf": ["/pdf/lock-pdf", "/pdf/edit-pdf", "/pdf/organize-pdf"],
  "/pdf/edit-pdf": ["/pdf/organize-pdf", "/pdf/merge-pdf", "/pdf/watermark-pdf"],
  "/pdf/image-to-pdf": ["/pdf/merge-pdf", "/pdf/compress-pdf", "/pdf/organize-pdf"],
  "/pdf/scan-pdf": ["/pdf/image-to-pdf", "/pdf/organize-pdf", "/pdf/merge-pdf"],
  "/pdf/extract-content": ["/pdf/chat-pdf", "/pdf/edit-pdf", "/pdf/organize-pdf"],
  "/pdf/chat-pdf": ["/pdf/extract-content", "/pdf/merge-pdf", "/pdf/edit-pdf"],
};

function getRelatedResources(path: string) {
  const priority = relatedToolMap[path] || [];
  const prioritySet = new Set(priority);
  const ordered = [
    ...priority,
    ...relatedTools
      .filter((tool) => tool.path !== path && !prioritySet.has(tool.path))
      .map((tool) => tool.path),
  ];

  return ordered
    .slice(0, 3)
    .map((toolPath) => relatedTools.find((tool) => tool.path === toolPath))
    .filter((tool): tool is RelatedTool => Boolean(tool))
    .map((tool) => ({
      title: tool.title,
      description: tool.description,
      icon: tool.icon,
      iconBg: tool.iconBg,
      href: tool.path,
    }));
}

export function makePdfToolSeoConfig(input: Input): PdfToolSeoConfig {
  const schema: SEOPageSchema = {
    title: input.title,
    description: input.description,
    path: input.path,
    keywords: input.keywords,
    hero: {
      header: input.heroTitle,
      subHeader: input.heroDescription,
      highlights: input.heroHighlights,
    },
    sections: [
      {
        type: "info",
        header: input.introHeading,
        paragraphs: input.introParagraphs,
      },
      {
        type: "steps",
        header: input.howToTitle,
        paragraphs: [input.howToDescription],
        steps: input.steps,
      },
      {
        type: "faq",
        header: input.faqTitle,
        faqs: input.faqs,
      },
    ],
  };

  const sections: StandardToolSeoProps = {
    hero: {
      badge: input.heroBadge,
      title: input.heroTitle,
      description: input.heroDescription,
      highlights: input.heroHighlights,
    },
    intro: {
      heading: input.introHeading,
      paragraphs: input.introParagraphs,
    },
    howTo: {
      title: input.howToTitle,
      description: input.howToDescription,
      steps: input.steps,
    },
    reasons: {
      title: input.reasonsTitle,
      items: input.reasonsItems || defaultReasons,
    },
    faq: {
      title: input.faqTitle,
      items: input.faqs,
    },
    resources: {
      title: "Related tools",
      cards: getRelatedResources(input.path),
    },
    trust: {
      title: input.trustTitle,
      description: input.trustDescription,
      tags: [
        { label: "Local processing", icon: <LockIcon className="h-4 w-4" /> },
        { label: "Privacy first", icon: <ShieldCheckIcon className="h-4 w-4" /> },
      ],
    },
  };

  return { schema, sections };
}
