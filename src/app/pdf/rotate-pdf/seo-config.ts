import { makePdfToolSeoConfig } from "../common/make-pdf-tool-seo-config";

export const rotatePdfSeoConfig = makePdfToolSeoConfig({
  title: "Rotate PDF Pages Online",
  description:
    "Rotate PDF pages online to fix sideways scans and upside-down pages without losing layout quality.",
  path: "/pdf/rotate-pdf",
  keywords: [
    "rotate pdf",
    "rotate pdf pages",
    "fix sideways pdf",
    "rotate scanned pdf",
    "pdf page rotation",
  ],
  heroBadge: "Quick orientation fix",
  heroTitle: "Rotate PDF Pages Online",
  heroDescription:
    "Rotate individual pages or full documents to correct orientation for reading, printing, and sharing.",
  heroHighlights: ["Single-page rotate", "Bulk rotate", "No quality loss", "Fast"],
  introHeading: "Correct page direction in seconds",
  introParagraphs: [
    "Fix upside-down or landscape mismatch pages without rebuilding the source document.",
    "Useful for scanned forms, phone captures, imported reports, and mixed-orientation files.",
  ],
  howToTitle: "How to rotate PDF pages",
  howToDescription:
    "Upload your file, select one page or all pages, rotate left or right, and download the corrected PDF.",
  reasonsTitle: "Why use this PDF rotator",
  reasonsItems: [
    {
      icon: "/images/icons/rotate-cw.svg",
      iconAlt: "Rotate icon",
      heading: "Immediate orientation repair",
      text: "Correct page direction issues quickly across any document type.",
    },
    {
      icon: "/images/icons/replace-all.svg",
      iconAlt: "Bulk icon",
      heading: "Page-level or full-file control",
      text: "Rotate one page, a range, or the complete file in one run.",
    },
    {
      icon: "/images/icons/scan-search.svg",
      iconAlt: "Readability icon",
      heading: "Readable final documents",
      text: "Improve usability for reviewers on desktop, tablet, and mobile.",
    },
    {
      icon: "/images/icons/badge-check.svg",
      iconAlt: "Quality icon",
      heading: "Preserved document structure",
      text: "Maintain normal text and layout quality while changing orientation.",
    },
  ],
  faqTitle: "Rotate PDF FAQs",
  trustTitle: "Reliable for scanned and mixed-layout files",
  trustDescription:
    "Ideal for forms, reports, IDs, manuals, and archived PDFs with orientation issues.",
  steps: [
    { title: "Upload PDF" },
    { title: "Select pages to rotate" },
    { title: "Apply clockwise or anticlockwise" },
    { title: "Download rotated PDF" },
  ],
  faqs: [
    {
      question: "Can I rotate just one page?",
      answer: "Yes. Single-page rotation is supported.",
    },
    {
      question: "Can I rotate all pages together?",
      answer: "Yes. Full-document rotation is available.",
    },
    {
      question: "Will comments or text be lost after rotation?",
      answer: "No. Rotation changes orientation while preserving document content.",
    },
    {
      question: "Can I rotate PDFs on mobile devices?",
      answer: "Yes. The tool supports modern mobile browsers.",
    },
  ],
});
