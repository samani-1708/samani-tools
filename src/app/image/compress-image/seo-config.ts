import { makeToolSeoConfig } from "@/app/common/make-tool-seo-config";

export const compressImageSeoConfig = makeToolSeoConfig({
  title: "Compress Images Online",
  description: "Reduce JPG, PNG, WEBP, and AVIF file size with visual quality controls.",
  path: "/image/compress-image",
  keywords: ["compress image", "reduce image size", "jpg compressor", "png compressor", "webp compressor"],
  heroBadge: "Fast browser image compression",
  heroTitle: "Compress Images Online",
  heroDescription: "Shrink image file size for uploads, emails, and faster page delivery.",
  heroHighlights: ["JPG/PNG/WEBP/AVIF", "Quality presets", "Batch-friendly", "Free"],
  introHeading: "Reduce image size without guesswork",
  introParagraphs: [
    "Pick a quality level that balances visual clarity and file size for your use case.",
    "Great for website assets, marketplace uploads, and sharing image-heavy files quickly.",
  ],
  howToTitle: "How to compress images online",
  howToDescription: "Upload images, choose quality settings, and download optimized files.",
  reasonsTitle: "Why use this image compressor?",
  reasonsItems: [
    { icon: "/images/icons/file-archive.svg", iconAlt: "Compression icon", heading: "Built for smaller files", text: "Cut image size for smoother uploads and faster delivery." },
    { icon: "/images/icons/gauge.svg", iconAlt: "Performance icon", heading: "Fast processing", text: "Run compression directly in browser with near-instant results." },
    { icon: "/images/icons/badge-check.svg", iconAlt: "Quality icon", heading: "Predictable output quality", text: "Tune quality and keep images usable for web and docs." },
    { icon: "/images/icons/download.svg", iconAlt: "Download icon", heading: "Quick export", text: "Download optimized output immediately after processing." },
  ],
  faqTitle: "Compress image FAQs",
  trustTitle: "Reliable optimization for web and sharing workflows",
  trustDescription: "Useful for teams and creators who need smaller images without extra tooling.",
  steps: [
    { title: "Upload one or more images" },
    { title: "Select quality or compression level" },
    { title: "Run compression" },
    { title: "Download optimized image files" },
  ],
  faqs: [
    { question: "Will compression lower quality?", answer: "Quality changes depend on your selected level. Lighter compression keeps visuals closer to original." },
    { question: "Can I compress multiple images?", answer: "Yes, the workflow supports processing several files in one session." },
    { question: "Which formats are supported?", answer: "Common formats including JPG, PNG, WEBP, and AVIF are supported." },
    { question: "Is this free to use?", answer: "Yes, you can compress images online for free." },
  ],
});

