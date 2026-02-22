import { makeToolSeoConfig } from "@/app/common/make-tool-seo-config";

export const jwtEncodeDecodeSeoConfig = makeToolSeoConfig({
  title: "JWT Encode Decode and Verify Online",
  description: "Decode JWT tokens, inspect payloads, and verify signatures in one workflow.",
  path: "/utils/jwt-encode-decode",
  keywords: ["jwt decode", "jwt verify", "jwt encode", "json web token", "jwt debugger"],
  heroBadge: "JWT debugging utility",
  heroTitle: "JWT Encode Decode and Verify Online",
  heroDescription: "Inspect token structure and validate signatures for authentication workflows.",
  heroHighlights: ["Decode payload", "Verify signature", "Encode token", "Free"],
  introHeading: "Inspect and validate JWTs with clarity",
  introParagraphs: [
    "Decode header and payload fields quickly when debugging auth flows.",
    "Verify token signatures to confirm integrity before trusting claims.",
  ],
  howToTitle: "How to decode and verify JWT tokens",
  howToDescription: "Paste token, inspect claims, provide secret/key, and verify signature.",
  reasonsTitle: "Why use this JWT tool?",
  reasonsItems: [
    { icon: "/images/icons/file-key.svg", iconAlt: "JWT key icon", heading: "Token verification flow", text: "Check signature validity before using claims in debugging." },
    { icon: "/images/icons/scan-text.svg", iconAlt: "Payload inspection icon", heading: "Readable payload inspection", text: "Review claims and timestamps in a structured format." },
    { icon: "/images/icons/shield.svg", iconAlt: "Security icon", heading: "Security-focused checks", text: "Catch token issues early during authentication testing." },
    { icon: "/images/icons/badge-check.svg", iconAlt: "Validation icon", heading: "Reliable diagnostics", text: "Get fast clarity on whether a token is valid or malformed." },
  ],
  faqTitle: "JWT tool FAQs",
  trustTitle: "Useful for API and authentication troubleshooting",
  trustDescription: "Built for developers handling token-based auth and API integrations.",
  steps: [
    { title: "Paste JWT token input" },
    { title: "Decode header and payload" },
    { title: "Provide secret/key and verify signature" },
    { title: "Review output and copy values" },
  ],
  faqs: [
    { question: "Can I decode JWT without verification?", answer: "Yes, decode and inspection work independently from signature verification." },
    { question: "Can I verify signatures?", answer: "Yes, verification is supported when appropriate credentials are provided." },
    { question: "Is this useful for debugging auth issues?", answer: "Yes, it helps inspect claims and validate token structure quickly." },
    { question: "Is it free?", answer: "Yes, the JWT encode/decode tool is free." },
  ],
});

