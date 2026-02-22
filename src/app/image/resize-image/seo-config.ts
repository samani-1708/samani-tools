import { makeToolSeoConfig } from "@/app/common/make-tool-seo-config";

export const resizeImageSeoConfig = makeToolSeoConfig({
  title: "Resize Images Online",
  description: "Resize image dimensions by pixels or percentage with ratio lock support.",
  path: "/image/resize-image",
  keywords: ["resize image", "change image dimensions", "photo resizer", "online resize"],
  heroBadge: "Controlled image resizing",
  heroTitle: "Resize Images Online",
  heroDescription: "Change width and height for websites, apps, and social formats in seconds.",
  heroHighlights: ["Pixel or % resize", "Aspect ratio lock", "Fast preview", "Free"],
  introHeading: "Resize images for exact destination requirements",
  introParagraphs: [
    "Set the exact dimensions needed for CMS uploads, marketplaces, and campaign assets.",
    "Resize quickly while keeping proportions where required.",
  ],
  howToTitle: "How to resize images online",
  howToDescription: "Upload, set dimensions, apply resize, and download the output image.",
  reasonsTitle: "Why use this image resizer?",
  reasonsItems: [
    { icon: "/images/icons/layout-grid.svg", iconAlt: "Dimensions icon", heading: "Precise size control", text: "Resize to exact pixel values or percentages for target channels." },
    { icon: "/images/icons/badge-check.svg", iconAlt: "Quality icon", heading: "Consistent output", text: "Generate image sizes that match platform specs reliably." },
    { icon: "/images/icons/gauge.svg", iconAlt: "Performance icon", heading: "Quick turnaround", text: "Process files fast without relying on heavy desktop editors." },
    { icon: "/images/icons/download.svg", iconAlt: "Download icon", heading: "Instant download", text: "Export resized images immediately for publishing and sharing." },
  ],
  faqTitle: "Resize image FAQs",
  trustTitle: "Dependable resizing for content workflows",
  trustDescription: "Useful for websites, e-commerce catalogs, ad creatives, and social posts.",
  steps: [
    { title: "Upload your image" },
    { title: "Set target width and height or percentage" },
    { title: "Apply resize settings" },
    { title: "Download resized image" },
  ],
  faqs: [
    { question: "Can I preserve aspect ratio?", answer: "Yes, aspect ratio lock is available for proportional resizing." },
    { question: "Can I resize by percentage?", answer: "Yes, you can resize by exact dimensions or percentages." },
    { question: "Will resizing reduce quality?", answer: "Quality depends on export settings and scale change amount." },
    { question: "Is this free to use?", answer: "Yes, image resizing is free." },
  ],
});

