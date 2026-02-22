import { makeToolSeoConfig } from "@/app/common/make-tool-seo-config";

export const hashGeneratorSeoConfig = makeToolSeoConfig({
  title: "Hash Generator Online",
  description: "Generate MD5, SHA-1, SHA-2, SHA-3, and RIPEMD-160 hashes for text and files.",
  path: "/utils/hash-generator",
  keywords: ["hash generator", "sha256", "md5", "checksum tool", "file hash"],
  heroBadge: "Multi-algorithm hash tool",
  heroTitle: "Hash Generator Online",
  heroDescription: "Create checksums for data verification, integrity checks, and workflow automation.",
  heroHighlights: ["MD5/SHA family", "Text + file input", "Fast output", "Free"],
  introHeading: "Generate reliable hashes quickly",
  introParagraphs: [
    "Compute hashes for text and files to validate integrity or compare versions.",
    "Useful in security checks, deployment verification, and data transfer workflows.",
  ],
  howToTitle: "How to generate hashes",
  howToDescription: "Choose algorithm, provide text or file input, and copy the generated hash.",
  reasonsTitle: "Why use this hash generator?",
  reasonsItems: [
    { icon: "/images/icons/hash.svg", iconAlt: "Hash icon", heading: "Multiple algorithms", text: "Generate common checksums in one interface." },
    { icon: "/images/icons/file-check.svg", iconAlt: "Integrity icon", heading: "Integrity verification", text: "Confirm file consistency across systems and transfers." },
    { icon: "/images/icons/gauge.svg", iconAlt: "Performance icon", heading: "Fast processing", text: "Compute hashes quickly for routine validation tasks." },
    { icon: "/images/icons/badge-check.svg", iconAlt: "Reliability icon", heading: "Consistent output", text: "Get deterministic hash results for repeated checks." },
  ],
  faqTitle: "Hash generator FAQs",
  trustTitle: "Practical checksum generation for technical workflows",
  trustDescription: "Useful for developers, operations teams, and data verification tasks.",
  steps: [
    { title: "Choose a hash algorithm" },
    { title: "Enter text or upload a file" },
    { title: "Generate hash value" },
    { title: "Copy or compare result" },
  ],
  faqs: [
    { question: "Which algorithms are supported?", answer: "Common algorithms including MD5, SHA-1, SHA-2 variants, SHA-3, and RIPEMD-160 are available." },
    { question: "Can I hash files as well as text?", answer: "Yes, both text input and file hashing are supported." },
    { question: "Are hashes deterministic?", answer: "Yes, the same input with the same algorithm produces the same hash." },
    { question: "Is this free?", answer: "Yes, this hash generator is free to use." },
  ],
});

