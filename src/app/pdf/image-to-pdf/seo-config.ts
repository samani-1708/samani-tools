import { makePdfToolSeoConfig } from "../common/make-pdf-tool-seo-config";

export const imageToPdfSeoConfig = makePdfToolSeoConfig({
  title: "Image to PDF Converter Online",
  description:
    "Convert JPG, PNG, and other image files to PDF online and combine multiple images into one document.",
  path: "/pdf/image-to-pdf",
  keywords: [
    "image to pdf",
    "jpg to pdf",
    "png to pdf",
    "convert image to pdf",
    "combine images to pdf",
  ],
  heroBadge: "Fast image conversion",
  heroTitle: "Image to PDF Converter Online",
  heroDescription:
    "Convert photos and scans into polished PDF documents with ordering and layout controls.",
  heroHighlights: ["JPG to PDF", "PNG to PDF", "Multi-image combine", "High clarity"],
  introHeading: "Turn image files into shareable PDF documents",
  introParagraphs: [
    "Upload one or many images, define sequence, and generate one clean PDF for delivery.",
    "Useful for application forms, receipts, scanned records, and visual document packs.",
  ],
  howToTitle: "How to convert images to PDF",
  howToDescription:
    "Upload image files, arrange order, apply conversion options, and download the final PDF.",
  reasonsTitle: "Why use this image-to-PDF tool",
  reasonsItems: [
    {
      icon: "/images/icons/images.svg",
      iconAlt: "Image stack icon",
      heading: "Multi-format image support",
      text: "Convert common formats like JPG and PNG into universally compatible PDF output.",
    },
    {
      icon: "/images/icons/image-up.svg",
      iconAlt: "Conversion icon",
      heading: "Quick conversion workflow",
      text: "Generate PDFs in seconds without installing any desktop software.",
    },
    {
      icon: "/images/icons/files.svg",
      iconAlt: "Document pack icon",
      heading: "Single-file document bundles",
      text: "Merge multiple images into one structured PDF for easier sharing.",
    },
    {
      icon: "/images/icons/download.svg",
      iconAlt: "Download icon",
      heading: "Ready-to-use output",
      text: "Download and distribute your PDF immediately after conversion.",
    },
  ],
  faqTitle: "Image to PDF FAQs",
  trustTitle: "Reliable for everyday document conversion",
  trustDescription:
    "Helpful for education, finance, legal intake, and operational record workflows.",
  steps: [
    { title: "Upload image files" },
    { title: "Arrange output order" },
    { title: "Apply conversion" },
    { title: "Download PDF" },
  ],
  faqs: [
    {
      question: "Can I convert multiple images into one PDF?",
      answer: "Yes. You can combine multiple image files into one PDF document.",
    },
    {
      question: "Will image clarity be preserved?",
      answer: "Yes. The converter is designed to keep practical output quality.",
    },
    {
      question: "Which image formats are supported?",
      answer: "Common formats such as JPG and PNG are supported.",
    },
    {
      question: "Does this work on mobile browsers?",
      answer: "Yes. It works on modern iOS and Android browsers.",
    },
  ],
});
