import { makeToolSeoConfig } from "@/app/common/make-tool-seo-config";

export const convertImageSeoConfig = makeToolSeoConfig({
  title: "Convert Image Formats Online",
  description: "Convert between JPG, PNG, WEBP, AVIF, and TIFF formats quickly.",
  path: "/image/convert-image",
  keywords: ["convert image", "jpg to png", "png to jpg", "webp converter", "avif converter"],
  heroBadge: "Simple format conversion",
  heroTitle: "Convert Image Formats Online",
  heroDescription: "Switch image formats for compatibility, quality, and delivery needs.",
  heroHighlights: ["Multi-format", "Batch-ready", "Fast export", "Free"],
  introHeading: "Convert images for the target platform",
  introParagraphs: [
    "Move between modern and legacy formats to match product, web, or print requirements.",
    "Useful when clients, CMS tools, or platforms require a specific file type.",
  ],
  howToTitle: "How to convert image formats",
  howToDescription: "Upload files, choose output format, and export converted images.",
  reasonsTitle: "Why use this image converter?",
  reasonsItems: [
    { icon: "/images/icons/image-up.svg", iconAlt: "Image conversion icon", heading: "Fast format switching", text: "Convert images quickly for web, docs, or social platforms." },
    { icon: "/images/icons/images.svg", iconAlt: "Multi-image icon", heading: "Works for multiple files", text: "Process several images in one pass to save time." },
    { icon: "/images/icons/layout-grid.svg", iconAlt: "Compatibility icon", heading: "Better compatibility", text: "Match destination format requirements without desktop tools." },
    { icon: "/images/icons/download.svg", iconAlt: "Download icon", heading: "Immediate results", text: "Get converted files right away and continue your workflow." },
  ],
  faqTitle: "Image conversion FAQs",
  trustTitle: "Practical conversion for web and content teams",
  trustDescription: "Designed for quick and repeatable file-format changes in daily workflows.",
  steps: [
    { title: "Upload your image files" },
    { title: "Choose target output format" },
    { title: "Start conversion" },
    { title: "Download converted files" },
  ],
  faqs: [
    { question: "Can I convert multiple images together?", answer: "Yes, batch conversion is supported in the workflow." },
    { question: "Which output formats can I choose?", answer: "You can export to common formats like JPG, PNG, WEBP, AVIF, and TIFF." },
    { question: "Will metadata be preserved?", answer: "Metadata handling depends on format and pipeline settings." },
    { question: "Can I use this on mobile?", answer: "Yes, the tool works in modern mobile browsers." },
  ],
});

