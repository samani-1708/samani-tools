import { makePdfToolSeoConfig } from "../common/make-pdf-tool-seo-config";

export const cropPdfSeoConfig = makePdfToolSeoConfig({
  title: "Crop PDF Pages Online",
  description:
    "Crop PDF pages online to trim margins, remove unwanted edges, and clean scanned documents quickly.",
  path: "/pdf/crop-pdf",
  keywords: [
    "crop pdf",
    "trim pdf margins",
    "remove white space pdf",
    "crop scanned pdf",
    "pdf page crop",
  ],
  heroBadge: "Precise page trimming",
  heroTitle: "Crop PDF Pages Online",
  heroDescription:
    "Select the exact content area to keep and remove distracting margins or scan artifacts in seconds.",
  heroHighlights: ["Manual crop", "Range crop", "Scan cleanup", "Fast export"],
  introHeading: "Create cleaner, tighter PDF pages",
  introParagraphs: [
    "Crop one page or apply a consistent crop to multiple pages for faster cleanup.",
    "Useful for scanned records, labels, forms, and documents with heavy extra margins.",
  ],
  howToTitle: "How to crop a PDF",
  howToDescription:
    "Upload your PDF, mark the crop area, apply on selected pages, and download the cleaned file.",
  reasonsTitle: "Why use this PDF crop tool",
  reasonsItems: [
    {
      icon: "/images/icons/crop.svg",
      iconAlt: "Crop icon",
      heading: "Precision crop controls",
      text: "Define exact boundaries and keep only the area that matters.",
    },
    {
      icon: "/images/icons/scan-text.svg",
      iconAlt: "Scan cleanup icon",
      heading: "Better scan presentation",
      text: "Remove scanner shadows, dark borders, and uneven white space quickly.",
    },
    {
      icon: "/images/icons/replace-all.svg",
      iconAlt: "Batch apply icon",
      heading: "Page-range efficiency",
      text: "Apply one crop profile across many pages for consistent layout.",
    },
    {
      icon: "/images/icons/file-check.svg",
      iconAlt: "Output quality icon",
      heading: "Professional-looking output",
      text: "Deliver tidy PDFs ready for sharing, filing, or formal submission.",
    },
  ],
  faqTitle: "Crop PDF FAQs",
  trustTitle: "Optimized for scan and margin cleanup",
  trustDescription:
    "Great for reports, forms, invoices, and archived scans that need layout correction.",
  steps: [
    { title: "Upload PDF" },
    { title: "Select crop area" },
    { title: "Apply to page or range" },
    { title: "Download cropped file" },
  ],
  faqs: [
    {
      question: "Can I crop only one page in a PDF?",
      answer: "Yes. You can crop individual pages or selected ranges.",
    },
    {
      question: "Can I crop all pages at once?",
      answer: "Yes. A consistent crop can be applied across multiple pages.",
    },
    {
      question: "Will cropping damage text quality?",
      answer: "No. Cropping removes area outside your selection while preserving visible content.",
    },
    {
      question: "Is this suitable for scanned documents?",
      answer: "Yes. It is designed to remove scan noise and margin clutter.",
    },
  ],
});
