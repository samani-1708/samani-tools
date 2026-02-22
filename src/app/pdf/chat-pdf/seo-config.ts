import { makePdfToolSeoConfig } from "../common/make-pdf-tool-seo-config";

export const chatPdfSeoConfig = makePdfToolSeoConfig({
  title: "Chat with PDF Files Online",
  description:
    "Upload one or more PDFs, extract context, and ask grounded questions with a document-aware chat workflow.",
  path: "/pdf/chat-pdf",
  keywords: [
    "chat with pdf",
    "pdf ai chat",
    "ask questions on pdf",
    "pdf qna",
    "multi pdf chat",
    "pdf context chat",
  ],
  heroBadge: "AI-assisted PDF analysis",
  heroTitle: "Chat with PDF Files Online",
  heroDescription:
    "Turn long PDFs into a searchable conversation so you can summarize, verify, and explore content faster.",
  heroHighlights: ["Multi-PDF chat", "OCR support", "Context retrieval", "Local model ready"],
  introHeading: "Get answers from documents without endless scrolling",
  introParagraphs: [
    "Upload PDFs and build a structured context layer for question answering and summary workflows.",
    "Useful for research papers, policies, manuals, contracts, and technical documentation.",
  ],
  howToTitle: "How to chat with PDF files",
  howToDescription:
    "Upload PDFs, complete extraction, configure your model connection, and ask questions in chat.",
  reasonsTitle: "Why use this Chat PDF tool",
  reasonsItems: [
    {
      icon: "/images/icons/scan-text.svg",
      iconAlt: "Extraction icon",
      heading: "Context-first extraction",
      text: "Parse documents before Q&A so responses are grounded in source material.",
    },
    {
      icon: "/images/icons/files.svg",
      iconAlt: "Multi-file icon",
      heading: "Cross-document querying",
      text: "Ask one question across multiple uploaded PDFs in the same session.",
    },
    {
      icon: "/images/icons/scan-search.svg",
      iconAlt: "Grounding icon",
      heading: "Traceable answer flow",
      text: "Use chunk retrieval and context syncing for reliable response quality.",
    },
    {
      icon: "/images/icons/file-check.svg",
      iconAlt: "Model icon",
      heading: "Flexible model integration",
      text: "Connect local or hosted LLM backends depending on your setup.",
    },
  ],
  faqTitle: "Chat PDF FAQs",
  trustTitle: "Built for document-heavy analysis work",
  trustDescription:
    "Designed for students, analysts, legal teams, and operations users handling long PDFs.",
  steps: [
    { title: "Upload one or more PDFs" },
    { title: "Extract and index context" },
    { title: "Connect model backend" },
    { title: "Ask questions in chat" },
  ],
  faqs: [
    {
      question: "Can I chat with multiple PDFs at the same time?",
      answer: "Yes. The session can include context from multiple uploaded documents.",
    },
    {
      question: "Does this support scanned PDFs?",
      answer: "Yes. OCR can be enabled for scanned or image-based pages.",
    },
    {
      question: "Can I use local models?",
      answer: "Yes. Local model workflows are supported in compatible setups.",
    },
    {
      question: "Are responses tied to extracted context?",
      answer: "Yes. Retrieval uses extracted chunks for grounded answers.",
    },
  ],
});
