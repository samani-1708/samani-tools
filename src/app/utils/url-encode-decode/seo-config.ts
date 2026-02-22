import { makeToolSeoConfig } from "@/app/common/make-tool-seo-config";

export const urlEncodeDecodeSeoConfig = makeToolSeoConfig({
  title: "URL Encode Decode Online",
  description: "Encode or decode URLs and inspect components in one utility.",
  path: "/utils/url-encode-decode",
  keywords: ["url encode", "url decode", "percent encoding", "uri decoder", "url parser"],
  heroBadge: "URL utility for dev workflows",
  heroTitle: "URL Encode Decode Online",
  heroDescription: "Handle percent-encoding and decode URLs cleanly for debugging and integration.",
  heroHighlights: ["Encode/decode", "Component breakdown", "Fast copy", "Free"],
  introHeading: "Handle URL strings without manual errors",
  introParagraphs: [
    "Encode special characters for safe transport or decode URLs for readability.",
    "Useful for API tests, query troubleshooting, and web development workflows.",
  ],
  howToTitle: "How to encode or decode URLs",
  howToDescription: "Paste URL input, choose mode, and copy transformed output.",
  reasonsTitle: "Why use this URL encoder/decoder?",
  reasonsItems: [
    { icon: "/images/icons/file-symlink.svg", iconAlt: "URL icon", heading: "Safe URL handling", text: "Encode strings correctly for query params and request paths." },
    { icon: "/images/icons/scan-search.svg", iconAlt: "Inspect icon", heading: "Easier troubleshooting", text: "Decode and inspect URLs while debugging request behavior." },
    { icon: "/images/icons/scan-text.svg", iconAlt: "Readability icon", heading: "Readable output", text: "Turn encoded strings into understandable text quickly." },
    { icon: "/images/icons/badge-check.svg", iconAlt: "Validation icon", heading: "Reliable conversions", text: "Get predictable encoding/decoding results for repeated tasks." },
  ],
  faqTitle: "URL encode/decode FAQs",
  trustTitle: "A practical utility for API and web development",
  trustDescription: "Useful for engineers, QA, and anyone handling encoded URLs frequently.",
  steps: [
    { title: "Paste URL or text input" },
    { title: "Choose encode or decode" },
    { title: "Review transformed result" },
    { title: "Copy and use output" },
  ],
  faqs: [
    { question: "What is URL encoding used for?", answer: "It ensures special characters are safely transmitted in URLs." },
    { question: "Can I decode query parameters?", answer: "Yes, you can decode encoded URL components including query strings." },
    { question: "Does this help with API debugging?", answer: "Yes, it's useful when inspecting encoded endpoints and parameters." },
    { question: "Is this tool free?", answer: "Yes, it is free to use." },
  ],
});

