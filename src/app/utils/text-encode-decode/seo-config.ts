import { makeToolSeoConfig } from "@/app/common/make-tool-seo-config";

export const textEncodeDecodeSeoConfig = makeToolSeoConfig({
  title: "Text Encode Decode Online",
  description: "Encode and decode Base64, Hex, URI component, and HTML entities in one place.",
  path: "/utils/text-encode-decode",
  keywords: ["text encode decode", "base64", "hex encode", "uri encode", "html entities"],
  heroBadge: "Multi-format text encoding",
  heroTitle: "Text Encode Decode Online",
  heroDescription: "Convert text across common encoding schemes used in dev and data workflows.",
  heroHighlights: ["Base64", "Hex", "URI", "HTML entities"],
  introHeading: "Switch between text encodings quickly",
  introParagraphs: [
    "Encode and decode values without jumping between separate tools.",
    "Useful for debugging APIs, payload prep, and handling escaped content.",
  ],
  howToTitle: "How to encode or decode text",
  howToDescription: "Paste text, choose encoding mode, and copy transformed output.",
  reasonsTitle: "Why use this text encoder/decoder?",
  reasonsItems: [
    { icon: "/images/icons/replace-all.svg", iconAlt: "Transform icon", heading: "Multiple encoding modes", text: "Handle Base64, Hex, URI, and HTML entity conversions in one tool." },
    { icon: "/images/icons/scan-text.svg", iconAlt: "Debug icon", heading: "Faster debugging", text: "Decode payload strings quickly during integration and API troubleshooting." },
    { icon: "/images/icons/files.svg", iconAlt: "Workflow icon", heading: "Cleaner data handling", text: "Prepare or normalize text before storage, transport, or display." },
    { icon: "/images/icons/badge-check.svg", iconAlt: "Reliability icon", heading: "Consistent output", text: "Get predictable conversions for repeat technical workflows." },
  ],
  faqTitle: "Text encode/decode FAQs",
  trustTitle: "Useful for developers and technical content workflows",
  trustDescription: "Designed for routine encoding and decoding tasks in browser.",
  steps: [
    { title: "Paste input text" },
    { title: "Select encode or decode mode" },
    { title: "Choose target format" },
    { title: "Copy the result" },
  ],
  faqs: [
    { question: "Can I switch between multiple formats?", answer: "Yes, common encode/decode formats are supported in one interface." },
    { question: "Is this useful for API debugging?", answer: "Yes, especially for inspecting encoded request and response values." },
    { question: "Does it support HTML entities?", answer: "Yes, HTML entity encode/decode is included." },
    { question: "Is this free?", answer: "Yes, this utility is free to use." },
  ],
});

