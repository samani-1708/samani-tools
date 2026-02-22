import { LockIcon, ShieldCheckIcon } from "lucide-react";
import type { SEOFaqItem, SEOPageSchema, SEOStepItem } from "@/app/common/seo-page-schema";
import type { StandardToolSeoProps } from "@/app/common/standard-tool-seo";
import type { ToolSeoConfig } from "@/app/common/tool-seo";
import { IMAGE_TOOLS_HEADER, UTILITY_TOOLS_HEADER } from "@/app/common/constants";

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
  introImageSrc?: string;
  introImageAlt?: string;
  howToTitle: string;
  howToDescription: string;
  howToImageSrc?: string;
  howToImageAlt?: string;
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
    iconAlt: "Performance icon for fast processing",
    heading: "Fast workflow",
    text: "Upload, process, and export in a few guided steps.",
  },
  {
    icon: "/images/icons/layout-grid.svg",
    iconAlt: "Browser compatibility icon",
    heading: "Works in modern browsers",
    text: "Use this tool on desktop and mobile without extra software.",
  },
  {
    icon: "/images/icons/badge-check.svg",
    iconAlt: "Output quality icon",
    heading: "Reliable output quality",
    text: "Get consistent results suitable for work and personal use.",
  },
  {
    icon: "/images/icons/download.svg",
    iconAlt: "Download icon",
    heading: "Download and share",
    text: "Save your result immediately and share when needed.",
  },
];

const imageRelatedTools: RelatedTool[] = IMAGE_TOOLS_HEADER.map((tool) => ({
  path: tool.href,
  title: tool.title,
  description: tool.description,
  icon: tool.icon,
  iconBg: tool.theme.BG,
}));

const utilityRelatedTools: RelatedTool[] = UTILITY_TOOLS_HEADER.map((tool) => ({
  path: tool.href,
  title: tool.title,
  description: tool.description,
  icon: tool.icon,
  iconBg: tool.theme.BG,
}));

const imageRelatedMap: Record<string, string[]> = {
  "/image/compress-image": ["/image/resize-image", "/image/convert-image", "/image/edit-image"],
  "/image/resize-image": ["/image/crop-image", "/image/compress-image", "/image/edit-image"],
  "/image/crop-image": ["/image/resize-image", "/image/edit-image", "/image/watermark-image"],
  "/image/convert-image": ["/image/compress-image", "/image/resize-image", "/image/watermark-image"],
  "/image/watermark-image": ["/image/edit-image", "/image/convert-image", "/image/compress-image"],
  "/image/edit-image": ["/image/crop-image", "/image/resize-image", "/image/watermark-image"],
};

const utilityRelatedMap: Record<string, string[]> = {
  "/utils/qr-code": ["/utils/url-encode-decode", "/utils/word-counter", "/utils/markdown-viewer"],
  "/utils/word-counter": ["/utils/case-converter", "/utils/markdown-viewer", "/utils/text-encode-decode"],
  "/utils/text-encode-decode": ["/utils/url-encode-decode", "/utils/hash-generator", "/utils/json-viewer"],
  "/utils/hash-generator": ["/utils/text-encode-decode", "/utils/jwt-encode-decode", "/utils/json-viewer"],
  "/utils/case-converter": ["/utils/word-counter", "/utils/text-encode-decode", "/utils/markdown-viewer"],
  "/utils/url-encode-decode": ["/utils/text-encode-decode", "/utils/json-viewer", "/utils/qr-code"],
  "/utils/jwt-encode-decode": ["/utils/json-viewer", "/utils/hash-generator", "/utils/text-encode-decode"],
  "/utils/json-viewer": ["/utils/diff-checker", "/utils/jwt-encode-decode", "/utils/text-encode-decode"],
  "/utils/diff-checker": ["/utils/json-viewer", "/utils/word-counter", "/utils/markdown-viewer"],
  "/utils/markdown-viewer": ["/utils/word-counter", "/utils/diff-checker", "/utils/case-converter"],
};

function getRelatedResources(path: string) {
  const isImageTool = path.startsWith("/image/");
  const source = isImageTool ? imageRelatedTools : utilityRelatedTools;
  const map = isImageTool ? imageRelatedMap : utilityRelatedMap;
  const priority = map[path] || [];
  const prioritySet = new Set(priority);

  const ordered = [
    ...priority,
    ...source
      .filter((tool) => tool.path !== path && !prioritySet.has(tool.path))
      .map((tool) => tool.path),
  ];

  return ordered
    .slice(0, 3)
    .map((toolPath) => source.find((tool) => tool.path === toolPath))
    .filter((tool): tool is RelatedTool => Boolean(tool))
    .map((tool) => ({
      title: tool.title,
      description: tool.description,
      icon: tool.icon,
      iconBg: tool.iconBg,
      href: tool.path,
    }));
}

export function makeToolSeoConfig(input: Input): ToolSeoConfig {
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
