import { mergePdfSeoSchema } from "./seo-schema";
import { StandardToolSeoSections } from "@/app/common/standard-tool-seo";
import { PDF_TOOLS_HEADER } from "@/app/common/constants";

const mergerToolItems = [
  {
    icon: "/images/icons/combine.svg",
    iconAlt: "Merge icon",
    heading: "Combine multiple PDF files",
    text: "Create one organized output from many input documents.",
  },
  {
    icon: "/images/icons/replace-all.svg",
    iconAlt: "Order icon",
    heading: "Arrange final sequence",
    text: "Control page and file flow before export.",
  },
  {
    icon: "/images/icons/folder-open.svg",
    iconAlt: "Organization icon",
    heading: "Cleaner file bundles",
    text: "Produce tidy packages for review, approval, and sharing.",
  },
  {
    icon: "/images/icons/download.svg",
    iconAlt: "Download icon",
    heading: "Immediate output access",
    text: "Download the merged result as soon as processing completes.",
  },
  {
    icon: "/images/icons/layout-grid.svg",
    iconAlt: "Device icon",
    heading: "Cross-platform workflow",
    text: "Use the merge tool across modern desktop and mobile browsers.",
  },
  {
    icon: "/images/icons/badge-check.svg",
    iconAlt: "Reliability icon",
    heading: "Consistent merge results",
    text: "Run repeatable merges for operational and professional workflows.",
  },
];

const articleCards = ["/pdf/organize-pdf", "/pdf/compress-pdf", "/pdf/split-pdf"]
  .map((path) => PDF_TOOLS_HEADER.find((tool) => tool.href === path))
  .filter((tool): tool is (typeof PDF_TOOLS_HEADER)[number] => Boolean(tool))
  .map((tool) => ({
    title: tool.title,
    description: tool.description,
    icon: tool.icon,
    iconBg: tool.theme.BG,
    href: tool.href,
  }));

export function MergePdfSeoContent() {
  const [infoSection, , stepsSection, faqSection] = mergePdfSeoSchema.sections;

  if (
    !infoSection ||
    infoSection.type !== "info" ||
    !stepsSection ||
    stepsSection.type !== "steps" ||
    !faqSection ||
    faqSection.type !== "faq"
  ) {
    return null;
  }

  return (
    <StandardToolSeoSections
      hero={{
        badge: "Practical in-browser PDF merging",
        title: mergePdfSeoSchema.hero?.header || mergePdfSeoSchema.title,
        description:
          mergePdfSeoSchema.hero?.subHeader || mergePdfSeoSchema.description,
        highlights: mergePdfSeoSchema.hero?.highlights || [],
      }}
      intro={{
        heading: infoSection.header,
        paragraphs: infoSection.paragraphs || [],
        bullets: (infoSection.bullets || []).map((text) => ({ text })),
      }}
      howTo={{
        title: "How to combine PDF files",
        description: "Upload files, set order, merge, and download.",
        steps: stepsSection.steps,
      }}
      reasons={{
        title: "Why use our merge PDF tool",
        items: mergerToolItems,
      }}
      faq={{
        title: faqSection.header,
        items: faqSection.faqs,
      }}
      resources={{
        title: "Related tools",
        cards: articleCards,
      }}
    />
  );
}
