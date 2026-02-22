import { makeToolSeoConfig } from "@/app/common/make-tool-seo-config";

export const diffCheckerSeoConfig = makeToolSeoConfig({
  title: "Diff Checker Online",
  description: "Compare two text inputs with line, word, and character-level differences.",
  path: "/utils/diff-checker",
  keywords: ["diff checker", "text compare", "text diff", "compare strings", "side by side diff"],
  heroBadge: "Precise text comparison",
  heroTitle: "Diff Checker Online",
  heroDescription: "Find changes between two versions quickly with clear visual diff modes.",
  heroHighlights: ["Line/word/char diff", "Side-by-side view", "Developer-friendly", "Free"],
  introHeading: "Spot exactly what changed",
  introParagraphs: [
    "Compare drafts, code snippets, or config files with readable highlighting.",
    "Useful for reviews, QA checks, release notes, and content revisions.",
  ],
  howToTitle: "How to compare two texts",
  howToDescription: "Paste both versions, choose diff mode, and review highlighted changes.",
  reasonsTitle: "Why use this diff checker?",
  reasonsItems: [
    { icon: "/images/icons/replace-all.svg", iconAlt: "Diff icon", heading: "Granular change detection", text: "Inspect edits at line, word, or character resolution." },
    { icon: "/images/icons/eye.svg", iconAlt: "Review icon", heading: "Readable visual output", text: "Quickly identify inserts, removals, and modifications." },
    { icon: "/images/icons/files.svg", iconAlt: "Version icon", heading: "Version review helper", text: "Compare drafts and revisions before publishing or merging." },
    { icon: "/images/icons/badge-check.svg", iconAlt: "Validation icon", heading: "Reliable verification", text: "Check if updates changed exactly what you intended." },
  ],
  faqTitle: "Diff checker FAQs",
  trustTitle: "Fast text comparison for technical and content teams",
  trustDescription: "Great for developers, QA reviewers, editors, and documentation workflows.",
  steps: [
    { title: "Paste original text in the first panel" },
    { title: "Paste updated text in the second panel" },
    { title: "Choose comparison mode" },
    { title: "Review highlighted differences" },
  ],
  faqs: [
    { question: "Can I compare large text blocks?", answer: "Yes, the tool is built to handle substantial text comparisons." },
    { question: "Does it support side-by-side comparison?", answer: "Yes, side-by-side and unified viewing modes are available." },
    { question: "Can I use this for code snippets?", answer: "Yes, it is useful for source and config comparisons." },
    { question: "Is it free?", answer: "Yes, this diff checker is free." },
  ],
});

