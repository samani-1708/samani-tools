import { makeToolSeoConfig } from "@/app/common/make-tool-seo-config";

export const wordCounterSeoConfig = makeToolSeoConfig({
  title: "Word Counter Online",
  description: "Count words, characters, sentences, and paragraphs instantly.",
  path: "/utils/word-counter",
  keywords: ["word counter", "character counter", "text statistics", "reading time", "text analysis"],
  heroBadge: "Fast writing metrics",
  heroTitle: "Word Counter Online",
  heroDescription: "Track writing length and structure with instant text statistics.",
  heroHighlights: ["Word count", "Character count", "Sentence stats", "Free"],
  introHeading: "Measure text length quickly and accurately",
  introParagraphs: [
    "Check writing limits for social posts, product descriptions, and publishing platforms.",
    "Use instant metrics while drafting content to stay within required boundaries.",
  ],
  howToTitle: "How to count words and characters",
  howToDescription: "Paste or type text and review live statistics immediately.",
  reasonsTitle: "Why use this word counter?",
  reasonsItems: [
    { icon: "/images/icons/scan-text.svg", iconAlt: "Text stats icon", heading: "Live text metrics", text: "See words, characters, and sentence counts as you type." },
    { icon: "/images/icons/layout-grid.svg", iconAlt: "Structure icon", heading: "Better content structure", text: "Track paragraph and sentence distribution for clarity." },
    { icon: "/images/icons/file-check.svg", iconAlt: "Validation icon", heading: "Meet length requirements", text: "Stay aligned with platform and editorial word limits." },
    { icon: "/images/icons/badge-check.svg", iconAlt: "Accuracy icon", heading: "Reliable counting", text: "Use consistent stats during drafting and final review." },
  ],
  faqTitle: "Word counter FAQs",
  trustTitle: "Useful for writing, editing, and publishing workflows",
  trustDescription: "Built for students, marketers, editors, and content teams.",
  steps: [
    { title: "Paste or type text content" },
    { title: "Review word and character counts" },
    { title: "Check sentence and paragraph stats" },
    { title: "Adjust text to meet your target" },
  ],
  faqs: [
    { question: "Does it count characters with spaces?", answer: "Yes, character metrics can include spaces depending on the statistic shown." },
    { question: "Can I use it for social media limits?", answer: "Yes, it is useful for checking platform-specific character constraints." },
    { question: "Does it update live?", answer: "Yes, stats update as text changes." },
    { question: "Is this free?", answer: "Yes, the word counter is free." },
  ],
});

