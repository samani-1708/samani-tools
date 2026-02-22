import { makePdfToolSeoConfig } from "../common/make-pdf-tool-seo-config";

export const pageNumbersSeoConfig = makePdfToolSeoConfig({
  title: "Add Page Numbers to PDF Online",
  description:
    "Insert page numbers into PDF files with controls for position, range, margin, and starting index.",
  path: "/pdf/page-numbers",
  keywords: [
    "add page numbers to pdf",
    "pdf pagination",
    "number pdf pages",
    "insert page numbers pdf",
    "pdf page numbering tool",
  ],
  heroBadge: "Clear PDF navigation",
  heroTitle: "Add Page Numbers to PDF Online",
  heroDescription:
    "Apply consistent page numbering for better document navigation, referencing, and formal presentation.",
  heroHighlights: ["Position control", "Page range", "Start number", "Fast"],
  introHeading: "Improve document structure with pagination",
  introParagraphs: [
    "Add page numbers to long PDFs so teams can cite and review content quickly.",
    "Useful for legal filings, reports, manuals, academic work, and submission documents.",
  ],
  howToTitle: "How to add page numbers to a PDF",
  howToDescription:
    "Upload your PDF, choose number placement and range, set the start value, and download the updated file.",
  reasonsTitle: "Why use this page numbering tool",
  reasonsItems: [
    {
      icon: "/images/icons/hash.svg",
      iconAlt: "Pagination icon",
      heading: "Accurate references",
      text: "Make it easy to point reviewers to exact pages.",
    },
    {
      icon: "/images/icons/file-check.svg",
      iconAlt: "Presentation icon",
      heading: "Professional formatting",
      text: "Add a polished finishing layer before sharing or printing.",
    },
    {
      icon: "/images/icons/scan-text.svg",
      iconAlt: "Readability icon",
      heading: "Better reading flow",
      text: "Guide readers through long files with predictable numbering.",
    },
    {
      icon: "/images/icons/download.svg",
      iconAlt: "Download icon",
      heading: "Immediate output",
      text: "Download and distribute the numbered PDF right away.",
    },
  ],
  faqTitle: "Page Numbering FAQs",
  trustTitle: "Designed for formal document workflows",
  trustDescription:
    "Useful for reports, legal bundles, coursework, manuals, and compliance records.",
  steps: [
    { title: "Upload PDF" },
    { title: "Select position and range" },
    { title: "Set start number" },
    { title: "Download numbered PDF" },
  ],
  faqs: [
    {
      question: "Can I number only specific pages?",
      answer: "Yes. You can apply numbering to selected page ranges.",
    },
    {
      question: "Can numbering start from a custom value?",
      answer: "Yes. A custom starting number is supported.",
    },
    {
      question: "Can I place numbers at top or bottom?",
      answer: "Yes. Position controls include standard alignment options.",
    },
    {
      question: "Does adding page numbers reduce quality?",
      answer: "No. Numbering does not meaningfully affect output clarity.",
    },
  ],
});
