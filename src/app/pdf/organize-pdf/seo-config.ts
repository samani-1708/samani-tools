import { makePdfToolSeoConfig } from "../common/make-pdf-tool-seo-config";

export const organizePdfSeoConfig = makePdfToolSeoConfig({
  title: "Organize PDF Pages Online",
  description:
    "Organize PDF pages by reordering, deleting, rotating, and arranging page flow for clean final output.",
  path: "/pdf/organize-pdf",
  keywords: [
    "organize pdf",
    "reorder pdf pages",
    "arrange pdf pages",
    "delete pdf pages",
    "pdf page organizer",
  ],
  heroBadge: "Page organization control",
  heroTitle: "Organize PDF Pages Online",
  heroDescription:
    "Rearrange and refine PDF page order with a simple drag-and-drop page management workflow.",
  heroHighlights: ["Reorder pages", "Delete pages", "Rotate pages", "Fast export"],
  introHeading: "Clean up page sequence in one place",
  introParagraphs: [
    "Sort pages, remove duplicates, and rebuild document flow without re-creating the source file.",
    "Useful for legal packets, reports, proposal decks, and multi-part operational documents.",
  ],
  howToTitle: "How to organize PDF pages",
  howToDescription:
    "Upload your file, reorder and adjust pages, confirm structure, and download the organized PDF.",
  reasonsTitle: "Why use this PDF organizer",
  reasonsItems: [
    {
      icon: "/images/icons/layout-grid.svg",
      iconAlt: "Layout icon",
      heading: "Visual page control",
      text: "Manage sequence with clear page previews and direct interactions.",
    },
    {
      icon: "/images/icons/replace-all.svg",
      iconAlt: "Reorder icon",
      heading: "Fast structural cleanup",
      text: "Reorder, rotate, duplicate, and remove pages in a single workflow.",
    },
    {
      icon: "/images/icons/folder-open.svg",
      iconAlt: "Organization icon",
      heading: "Better document structure",
      text: "Create polished files that are easier to review, share, and archive.",
    },
    {
      icon: "/images/icons/file-check.svg",
      iconAlt: "Result icon",
      heading: "Reliable final output",
      text: "Export sequence-correct PDFs ready for professional use.",
    },
  ],
  faqTitle: "Organize PDF FAQs",
  trustTitle: "Built for large and complex PDFs",
  trustDescription:
    "Ideal for reports, compliance packs, course material, and documentation handoffs.",
  steps: [
    { title: "Upload PDF" },
    { title: "Reorder pages" },
    { title: "Delete or rotate pages" },
    { title: "Download organized PDF" },
  ],
  faqs: [
    {
      question: "Can I reorder pages by drag and drop?",
      answer: "Yes. Page sequence can be changed interactively before export.",
    },
    {
      question: "Can I remove specific pages only?",
      answer: "Yes. You can delete selected pages while keeping the rest intact.",
    },
    {
      question: "Can I rotate pages while organizing?",
      answer: "Yes. Rotation is available in the same workflow.",
    },
    {
      question: "Will layout quality remain stable?",
      answer: "Yes. Organization actions preserve practical page readability.",
    },
  ],
});
