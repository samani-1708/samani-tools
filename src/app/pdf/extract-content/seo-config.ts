import { makePdfToolSeoConfig } from "../common/make-pdf-tool-seo-config";

export const extractContentSeoConfig = makePdfToolSeoConfig({
  title: "Extract PDF Text and Images Online",
  description:
    "Extract text, images, and structured outputs from PDFs with optional OCR for scanned pages.",
  path: "/pdf/extract-content",
  keywords: [
    "extract text from pdf",
    "extract images from pdf",
    "pdf to markdown",
    "pdf to json",
    "pdf ocr extraction",
    "pdf content extractor",
  ],
  heroBadge: "Structured PDF extraction",
  heroTitle: "Extract PDF Text and Images Online",
  heroDescription:
    "Convert static PDFs into reusable text and asset outputs for analysis, indexing, and automation workflows.",
  heroHighlights: ["Text extraction", "Image extraction", "OCR mode", "Markdown and JSON"],
  introHeading: "Turn PDFs into reusable content",
  introParagraphs: [
    "Extract page text, embedded assets, and machine-friendly formats in one streamlined process.",
    "Useful for document migration, AI pipelines, knowledge indexing, and content transformation.",
  ],
  howToTitle: "How to extract PDF content",
  howToDescription:
    "Upload your PDF, choose extraction and OCR options, run processing, and download structured outputs.",
  reasonsTitle: "Why use this extraction tool",
  reasonsItems: [
    {
      icon: "/images/icons/scan-text.svg",
      iconAlt: "Text extraction icon",
      heading: "Page-wise text output",
      text: "Capture document text with structure suitable for downstream processing.",
    },
    {
      icon: "/images/icons/images.svg",
      iconAlt: "Asset extraction icon",
      heading: "Embedded image extraction",
      text: "Export PDF images for reuse, validation, and media workflows.",
    },
    {
      icon: "/images/icons/file-check.svg",
      iconAlt: "Structured output icon",
      heading: "Developer-friendly formats",
      text: "Generate markdown and JSON artifacts for automation and integration.",
    },
    {
      icon: "/images/icons/scan-search.svg",
      iconAlt: "OCR icon",
      heading: "OCR for scanned PDFs",
      text: "Recover readable text from image-based or scanned source documents.",
    },
  ],
  faqTitle: "Extract PDF FAQs",
  trustTitle: "Built for document engineering workflows",
  trustDescription:
    "Supports extraction use cases for research, legal ops, data prep, and AI-assisted analysis.",
  steps: [
    { title: "Upload PDF" },
    { title: "Select extraction settings" },
    { title: "Run extraction" },
    { title: "Download text and assets" },
  ],
  faqs: [
    {
      question: "Can this extract both text and images together?",
      answer: "Yes. Text and embedded image extraction are both supported.",
    },
    {
      question: "Does it handle scanned documents?",
      answer: "Yes. OCR mode can extract text from scanned pages.",
    },
    {
      question: "What output formats are available?",
      answer: "Structured outputs include text representations, markdown, and JSON-style artifacts.",
    },
    {
      question: "Is this suitable for AI pipeline preparation?",
      answer: "Yes. The tool is designed for reusable extraction outputs.",
    },
  ],
});
