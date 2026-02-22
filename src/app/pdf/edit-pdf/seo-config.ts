import { makePdfToolSeoConfig } from "../common/make-pdf-tool-seo-config";

export const editPdfSeoConfig = makePdfToolSeoConfig({
  title: "Edit PDF Online",
  description:
    "Edit PDF files online with annotation and markup tools for review, collaboration, and document updates.",
  path: "/pdf/edit-pdf",
  keywords: [
    "edit pdf",
    "annotate pdf",
    "highlight pdf",
    "pdf editor online",
    "add notes to pdf",
  ],
  heroBadge: "Direct PDF editing",
  heroTitle: "Edit PDF Online",
  heroDescription:
    "Update documents with highlights, comments, and markup tools in a fast browser workflow.",
  heroHighlights: ["Annotations", "Highlights", "Signoff-ready", "No install"],
  introHeading: "Review and refine PDFs in one interface",
  introParagraphs: [
    "Apply clear feedback with visual context so reviewers can act faster.",
    "Useful for contract review, report revisions, and team-based document feedback loops.",
  ],
  howToTitle: "How to edit PDF documents",
  howToDescription:
    "Upload your PDF, choose editing tools, apply changes, and download the updated file.",
  reasonsTitle: "Why use this PDF editor",
  reasonsItems: [
    {
      icon: "/images/icons/file-edit.svg",
      iconAlt: "Edit icon",
      heading: "Contextual document edits",
      text: "Place comments and highlights exactly where issues need attention.",
    },
    {
      icon: "/images/icons/pencil.svg",
      iconAlt: "Markup icon",
      heading: "Practical markup controls",
      text: "Use text notes, drawing tools, and visual markers for clear communication.",
    },
    {
      icon: "/images/icons/eye.svg",
      iconAlt: "Readability icon",
      heading: "Stronger review clarity",
      text: "Make feedback easy to scan for teammates, clients, and stakeholders.",
    },
    {
      icon: "/images/icons/signature.svg",
      iconAlt: "Workflow icon",
      heading: "Faster handoff cycle",
      text: "Export edited files quickly to continue approval or delivery workflows.",
    },
  ],
  faqTitle: "Edit PDF FAQs",
  trustTitle: "Built for real review and revision workflows",
  trustDescription:
    "Used for business documents, legal drafts, proposals, and operational records.",
  steps: [
    { title: "Upload PDF" },
    { title: "Choose edit tools" },
    { title: "Apply changes" },
    { title: "Download edited PDF" },
  ],
  faqs: [
    {
      question: "Can I highlight and annotate PDF text?",
      answer: "Yes. You can use multiple markup methods for document review.",
    },
    {
      question: "Do edits preserve the original file layout?",
      answer: "Yes. The editing flow is designed to keep practical document structure intact.",
    },
    {
      question: "Can I use this PDF editor on mobile?",
      answer: "Yes. It works on modern mobile and desktop browsers.",
    },
    {
      question: "Is this useful for team collaboration?",
      answer: "Yes. It helps teams communicate changes directly in the file context.",
    },
  ],
});
