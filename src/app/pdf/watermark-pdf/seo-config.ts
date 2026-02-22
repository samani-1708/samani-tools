import { makePdfToolSeoConfig } from "../common/make-pdf-tool-seo-config";

export const watermarkPdfSeoConfig = makePdfToolSeoConfig({
  title: "Add Watermark to PDF Online",
  description:
    "Add text watermarks to PDF pages online with controls for font, size, color, and opacity.",
  path: "/pdf/watermark-pdf",
  keywords: [
    "watermark pdf",
    "add watermark to pdf",
    "pdf text watermark",
    "confidential watermark pdf",
    "brand pdf pages",
  ],
  heroBadge: "Protect and brand PDFs",
  heroTitle: "Add Watermark to PDF Online",
  heroDescription:
    "Apply clear document labels such as Draft or Confidential and reinforce branding across pages.",
  heroHighlights: ["Custom text", "Opacity control", "Font styling", "All-page apply"],
  introHeading: "Mark ownership and sharing intent clearly",
  introParagraphs: [
    "Add visible labels to prevent misuse and communicate document status immediately.",
    "Useful for internal drafts, client copies, legal reviews, and compliance-marked documents.",
  ],
  howToTitle: "How to watermark a PDF",
  howToDescription:
    "Upload your file, enter watermark text, style it, apply to pages, and download the updated PDF.",
  reasonsTitle: "Why use this watermark tool",
  reasonsItems: [
    {
      icon: "/images/icons/stamp.svg",
      iconAlt: "Watermark icon",
      heading: "Clear document labeling",
      text: "Mark PDFs with status labels like Draft, Internal, or Confidential.",
    },
    {
      icon: "/images/icons/signature.svg",
      iconAlt: "Brand icon",
      heading: "Consistent brand identity",
      text: "Apply organization names or project labels for a uniform look.",
    },
    {
      icon: "/images/icons/eye.svg",
      iconAlt: "Visibility icon",
      heading: "Balanced visual control",
      text: "Tune text style and opacity for readable, non-intrusive watermarks.",
    },
    {
      icon: "/images/icons/badge-check.svg",
      iconAlt: "Consistency icon",
      heading: "Uniform page coverage",
      text: "Apply one watermark setup across the entire document quickly.",
    },
  ],
  faqTitle: "Watermark PDF FAQs",
  trustTitle: "Useful for protection and branding workflows",
  trustDescription:
    "Great for legal drafts, reports, contracts, and confidential business documents.",
  steps: [
    { title: "Upload PDF" },
    { title: "Enter watermark text" },
    { title: "Set font, color, and opacity" },
    { title: "Download watermarked PDF" },
  ],
  faqs: [
    {
      question: "Can I customize watermark style?",
      answer: "Yes. You can adjust text, color, size, and opacity.",
    },
    {
      question: "Will watermark apply to all pages?",
      answer: "Yes. The workflow supports all-page application.",
    },
    {
      question: "Is this useful for confidential labeling?",
      answer: "Yes. It is ideal for Draft, Internal, and Confidential marks.",
    },
    {
      question: "Can I watermark PDFs without installing apps?",
      answer: "Yes. Everything runs in your browser.",
    },
  ],
});
