import { makeToolSeoConfig } from "@/app/common/make-tool-seo-config";

export const caseConverterSeoConfig = makeToolSeoConfig({
  title: "Case Converter Online",
  description: "Convert text between camelCase, snake_case, kebab-case, title case, and more.",
  path: "/utils/case-converter",
  keywords: ["case converter", "camel case", "snake case", "kebab case", "text transform"],
  heroBadge: "Fast text case transforms",
  heroTitle: "Case Converter Online",
  heroDescription: "Switch naming and writing styles instantly for code, docs, and content.",
  heroHighlights: ["Multiple case styles", "Instant transform", "Developer-friendly", "Free"],
  introHeading: "Convert text casing without manual cleanup",
  introParagraphs: [
    "Transform variable names, headings, and raw text to your required format in seconds.",
    "Useful for development workflows, content editing, and naming consistency checks.",
  ],
  howToTitle: "How to convert text case",
  howToDescription: "Paste text, select output style, and copy the transformed result.",
  reasonsTitle: "Why use this case converter?",
  reasonsItems: [
    { icon: "/images/icons/replace-all.svg", iconAlt: "Transform icon", heading: "Instant transformation", text: "Convert large text blocks quickly without manual edits." },
    { icon: "/images/icons/files.svg", iconAlt: "Consistency icon", heading: "Cleaner naming consistency", text: "Keep variable names and headings aligned across files." },
    { icon: "/images/icons/badge-check.svg", iconAlt: "Accuracy icon", heading: "Reliable output", text: "Get predictable case conversion for common naming patterns." },
    { icon: "/images/icons/layout-grid.svg", iconAlt: "Workflow icon", heading: "Useful for code and docs", text: "Works well for both developer and writing tasks." },
  ],
  faqTitle: "Case converter FAQs",
  trustTitle: "Simple utility for repeat text formatting work",
  trustDescription: "Ideal for developers, writers, and editors who need quick casing changes.",
  steps: [
    { title: "Paste or type your text" },
    { title: "Select target case format" },
    { title: "Review transformed output" },
    { title: "Copy and use the result" },
  ],
  faqs: [
    { question: "Which case styles are available?", answer: "Common styles like camelCase, snake_case, kebab-case, and title case are supported." },
    { question: "Can I convert long text blocks?", answer: "Yes, the tool can process long text content quickly." },
    { question: "Is this useful for developers?", answer: "Yes, it is commonly used for variable and key naming workflows." },
    { question: "Is it free?", answer: "Yes, the case converter is free to use." },
  ],
});

