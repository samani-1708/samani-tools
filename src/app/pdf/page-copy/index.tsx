import {
  PageConfig,
  PageCopy as NativePageCopy,
} from "@/app/common/page-copy/page-copy";

export const pageConfig: PageConfig = {
  header: "Free PDF Tools for Editing, Conversion, and Document Workflows",
  subHeader: "One browser toolkit for complete PDF operations",
  description:
    "Use a full set of PDF tools to merge, split, compress, crop, rotate, lock, unlock, watermark, extract, and chat with documents online.",
  sections: [
    {
      type: "info",
      header: "Why teams use browser-based PDF tools",
      paragraphs: [
        "Document work demands speed, quality, and reliable controls. This toolkit is designed for repeatable daily PDF tasks.",
        "From simple edits to structured extraction and AI-assisted workflows, each tool supports practical business and academic use.",
      ],
    },
    {
      type: "keyfeatures",
      header: "Core PDF capabilities",
      features: [
        {
          icon: "/images/icons/combine.svg",
          iconAlt: "Merge and split icon",
          title: "Merge and split control",
          description:
            "Combine multiple PDFs or split long files into focused outputs by exact page ranges.",
        },
        {
          icon: "/images/icons/file-archive.svg",
          iconAlt: "Compression icon",
          title: "Smart compression",
          description:
            "Reduce file size for upload limits and email sharing while preserving readability.",
        },
        {
          icon: "/images/icons/image-up.svg",
          iconAlt: "Conversion icon",
          title: "Image-to-PDF conversion",
          description:
            "Turn photos and scans into structured PDF documents with ordering controls.",
        },
        {
          icon: "/images/icons/stamp.svg",
          iconAlt: "Watermark icon",
          title: "Watermark and branding",
          description:
            "Apply status labels and brand identifiers for controlled internal and external distribution.",
        },
        {
          icon: "/images/icons/lock-keyhole.svg",
          iconAlt: "Security icon",
          title: "Lock and unlock workflows",
          description:
            "Protect sensitive files with passwords and unlock authorized files for downstream processing.",
        },
        {
          icon: "/images/icons/layout-grid.svg",
          iconAlt: "Organization icon",
          title: "Page-level management",
          description:
            "Reorder, rotate, crop, and number pages for polished professional output.",
        },
        {
          icon: "/images/icons/scan-text.svg",
          iconAlt: "Extraction icon",
          title: "Text and asset extraction",
          description:
            "Extract PDF text and images into reusable outputs for indexing, analysis, and automation.",
        },
        {
          icon: "/images/icons/scan-search.svg",
          iconAlt: "Chat icon",
          title: "Chat with PDF",
          description:
            "Ask document-aware questions across one or more PDFs using extracted context.",
        },
      ],
    },
    {
      type: "steps",
      header: "How the PDF workflow works",
      subHeader: "Simple process, reliable output",
      steps: [
        {
          emoji: "1️⃣",
          title: "Upload source files",
          description:
            "Start with one PDF or multiple files depending on the selected tool.",
        },
        {
          emoji: "2️⃣",
          title: "Configure controls",
          description:
            "Set ranges, order, quality, security, and formatting options.",
        },
        {
          emoji: "3️⃣",
          title: "Process documents",
          description:
            "Run the selected action with predictable page-level behavior.",
        },
        {
          emoji: "4️⃣",
          title: "Download results",
          description:
            "Save final output and continue with related PDF actions when needed.",
        },
      ],
    },
    {
      type: "info",
      header: "Use cases across teams and industries",
      paragraphs: [
        "Business teams prepare proposals, reports, contracts, and client deliverables faster.",
        "Legal and compliance teams organize evidence bundles, apply numbering, and enforce file access controls.",
        "Education and research workflows benefit from chapter extraction, annotation, and document summarization.",
        "Operations teams can standardize recurring document tasks with one consistent browser toolkit.",
      ],
    },
  ],
};

export function PageCopy() {
  return <NativePageCopy config={pageConfig} />;
}
