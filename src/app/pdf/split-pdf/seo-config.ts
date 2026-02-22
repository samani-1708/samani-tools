import { makePdfToolSeoConfig } from "../common/make-pdf-tool-seo-config";

export const splitPdfSeoConfig = makePdfToolSeoConfig({
  title: "Split PDF by Page Range Online",
  description:
    "Split PDF files into smaller documents by page range and extract only the pages you need.",
  path: "/pdf/split-pdf",
  keywords: [
    "split pdf",
    "pdf splitter",
    "extract pages from pdf",
    "split pdf by page range",
    "separate pdf pages",
  ],
  heroBadge: "Flexible PDF splitting",
  heroTitle: "Split PDF by Page Range Online",
  heroDescription:
    "Create multiple focused files from one large PDF while preserving content structure and readability.",
  heroHighlights: ["Range split", "Multiple outputs", "Fast processing", "Secure"],
  introHeading: "Separate large PDFs into usable parts",
  introParagraphs: [
    "Define precise split points and export only relevant sections for each audience or workflow.",
    "Useful for legal packets, billing statements, study material, and chapter-level distribution.",
  ],
  howToTitle: "How to split PDF files",
  howToDescription:
    "Upload a PDF, choose divider ranges, generate split outputs, and download the resulting files.",
  reasonsTitle: "Why use this PDF splitter",
  reasonsItems: [
    {
      icon: "/images/icons/split.svg",
      iconAlt: "Split icon",
      heading: "Precise range control",
      text: "Create exact output files from selected pages and boundaries.",
    },
    {
      icon: "/images/icons/file-symlink.svg",
      iconAlt: "Share icon",
      heading: "Targeted sharing",
      text: "Share only the required pages instead of the entire source PDF.",
    },
    {
      icon: "/images/icons/folder-open.svg",
      iconAlt: "Organization icon",
      heading: "Cleaner document sets",
      text: "Break complex files into structured and manageable outputs.",
    },
    {
      icon: "/images/icons/download.svg",
      iconAlt: "Download icon",
      heading: "Immediate multi-file export",
      text: "Download split outputs right after processing completes.",
    },
  ],
  faqTitle: "Split PDF FAQs",
  trustTitle: "Designed for large and multi-topic PDFs",
  trustDescription:
    "Useful for statements, contracts, reports, textbooks, and case documentation.",
  steps: [
    { title: "Upload PDF" },
    { title: "Set page ranges" },
    { title: "Generate split files" },
    { title: "Download outputs" },
  ],
  faqs: [
    {
      question: "Can I split one PDF into many files?",
      answer: "Yes. You can create multiple files from one source document.",
    },
    {
      question: "Will split files keep original quality?",
      answer: "Yes. The splitter preserves practical content clarity and layout.",
    },
    {
      question: "Can I split large PDFs?",
      answer: "Yes, within the page and file limits supported by the tool.",
    },
    {
      question: "Do I need to install software?",
      answer: "No. Splitting is handled directly in your browser.",
    },
  ],
});
