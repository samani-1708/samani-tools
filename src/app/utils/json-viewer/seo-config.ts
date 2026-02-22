import { makeToolSeoConfig } from "@/app/common/make-tool-seo-config";

export const jsonViewerSeoConfig = makeToolSeoConfig({
  title: "JSON Viewer and Formatter Online",
  description: "Format, minify, and inspect JSON with searchable tree and text views.",
  path: "/utils/json-viewer",
  keywords: ["json viewer", "json formatter", "json beautifier", "json minifier", "json parser"],
  heroBadge: "Developer JSON utility",
  heroTitle: "JSON Viewer and Formatter Online",
  heroDescription: "Inspect and clean JSON payloads quickly with readable formatting tools.",
  heroHighlights: ["Tree + raw view", "Format/minify", "Searchable", "Free"],
  introHeading: "Work with JSON faster and with fewer errors",
  introParagraphs: [
    "Beautify minified payloads and inspect nested structures with clarity.",
    "Helpful for API debugging, integration checks, and data preparation tasks.",
  ],
  howToTitle: "How to format and inspect JSON",
  howToDescription: "Paste JSON input, choose view mode, and copy the formatted result.",
  reasonsTitle: "Why use this JSON viewer?",
  reasonsItems: [
    { icon: "/images/icons/layout-grid.svg", iconAlt: "Tree view icon", heading: "Readable data structure", text: "Explore nested objects and arrays without scanning raw walls of text." },
    { icon: "/images/icons/scan-search.svg", iconAlt: "Search icon", heading: "Faster debugging", text: "Find fields and compare payloads quickly during API work." },
    { icon: "/images/icons/replace-all.svg", iconAlt: "Format icon", heading: "Format and minify", text: "Switch between clean and compact JSON representations instantly." },
    { icon: "/images/icons/file-check.svg", iconAlt: "Validation icon", heading: "Cleaner handoffs", text: "Share readable JSON outputs with teammates during implementation." },
  ],
  faqTitle: "JSON viewer FAQs",
  trustTitle: "A practical JSON workspace for daily engineering tasks",
  trustDescription: "Designed for developers, testers, and analysts handling API payloads.",
  steps: [
    { title: "Paste your JSON input" },
    { title: "Format or minify as needed" },
    { title: "Inspect in text or tree view" },
    { title: "Copy cleaned output" },
  ],
  faqs: [
    { question: "Can I format minified JSON?", answer: "Yes, the tool can beautify compact JSON into readable output." },
    { question: "Can I minify formatted JSON?", answer: "Yes, you can switch back to a compact representation." },
    { question: "Does it support nested structures?", answer: "Yes, nested objects and arrays are supported." },
    { question: "Is this tool free?", answer: "Yes, the JSON viewer is free." },
  ],
});

