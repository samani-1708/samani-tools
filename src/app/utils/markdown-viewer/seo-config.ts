import { makeToolSeoConfig } from "@/app/common/make-tool-seo-config";

export const markdownViewerSeoConfig = makeToolSeoConfig({
  title: "Markdown Viewer Online",
  description: "Render and read markdown with clean typography, code blocks, tables, and print-friendly output.",
  path: "/utils/markdown-viewer",
  keywords: ["markdown viewer", "markdown preview", "gfm markdown", "markdown renderer", "markdown print to pdf"],
  heroBadge: "Markdown utility",
  heroTitle: "Markdown Viewer Online",
  heroDescription: "Write or paste markdown, preview it with rich formatting, and print it to PDF in one workflow.",
  heroHighlights: ["GFM support", "Code blocks", "Typography theme", "Print to PDF"],
  introHeading: "Preview markdown with clean structure and readable output",
  introParagraphs: [
    "Render markdown files with a polished text layout that is easy to review and share.",
    "Useful for notes, docs drafts, release notes, and README previews before publishing.",
  ],
  howToTitle: "How to use the markdown viewer",
  howToDescription: "Paste markdown or upload a .md file, review output, and print when ready.",
  reasonsTitle: "Why use this markdown viewer?",
  reasonsItems: [
    { icon: "/images/icons/scan-text.svg", iconAlt: "Typography icon", heading: "Readable typography", text: "Large headings, code blocks, lists, and tables render in a clean, document-style layout." },
    { icon: "/images/icons/file-check.svg", iconAlt: "Compatibility icon", heading: "Modern markdown support", text: "Handles GitHub-style tables, checklists, and fenced code blocks for practical documentation work." },
    { icon: "/images/icons/download.svg", iconAlt: "Export icon", heading: "Print-ready output", text: "Use your browser print dialog to export directly to PDF." },
    { icon: "/images/icons/layout-grid.svg", iconAlt: "Workflow icon", heading: "Split and preview modes", text: "Switch between source and rendered output while editing markdown quickly." },
  ],
  faqTitle: "Markdown viewer FAQs",
  trustTitle: "A practical markdown workspace for docs and notes",
  trustDescription: "Built for developers, writers, and teams drafting markdown-based content.",
  steps: [
    { title: "Paste markdown or upload a .md file" },
    { title: "Choose preview, split, or source mode" },
    { title: "Review formatting and code blocks" },
    { title: "Print to PDF or download markdown" },
  ],
  faqs: [
    { question: "Does this support GitHub Flavored Markdown?", answer: "Yes, tables, task lists, and fenced code blocks are supported." },
    { question: "Can I print markdown to PDF?", answer: "Yes, use the Print to PDF button to open your browser print flow." },
    { question: "Can I upload existing markdown files?", answer: "Yes, upload a .md file and it will load into the viewer." },
    { question: "Is this free to use?", answer: "Yes, this markdown viewer is free." },
  ],
});
