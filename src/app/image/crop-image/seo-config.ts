import { makeToolSeoConfig } from "@/app/common/make-tool-seo-config";

export const cropImageSeoConfig = makeToolSeoConfig({
  title: "Crop Images Online",
  description: "Crop images precisely with zoom, rotation, and framing controls.",
  path: "/image/crop-image",
  keywords: ["crop image", "photo cropper", "crop photo online", "image framing", "rotate image"],
  heroBadge: "Precise image framing",
  heroTitle: "Crop Images Online",
  heroDescription: "Trim images to the exact area you want for web, print, or social formats.",
  heroHighlights: ["Precision crop", "Zoom + rotate", "Fast preview", "Free"],
  introHeading: "Keep only the part that matters",
  introParagraphs: [
    "Crop photos and graphics to remove noise and focus attention on your subject.",
    "Useful for profile images, banners, product photos, and content publishing.",
  ],
  howToTitle: "How to crop images online",
  howToDescription: "Upload, adjust the crop area, and export the final image.",
  reasonsTitle: "Why use this image cropper?",
  reasonsItems: [
    { icon: "/images/icons/crop.svg", iconAlt: "Crop icon", heading: "Accurate crop controls", text: "Define crop boundaries precisely with live visual feedback." },
    { icon: "/images/icons/scan-search.svg", iconAlt: "Focus icon", heading: "Cleaner composition", text: "Remove distractions and improve framing for better visual impact." },
    { icon: "/images/icons/replace-all.svg", iconAlt: "Adjust icon", heading: "Flexible adjustments", text: "Use zoom and orientation controls before final export." },
    { icon: "/images/icons/file-check.svg", iconAlt: "Output icon", heading: "Ready-to-use output", text: "Export a polished image for immediate publishing or sharing." },
  ],
  faqTitle: "Crop image FAQs",
  trustTitle: "Reliable image framing in browser",
  trustDescription: "Useful for creators, designers, marketers, and teams preparing visual assets.",
  steps: [
    { title: "Upload an image" },
    { title: "Move and resize crop area" },
    { title: "Apply crop settings" },
    { title: "Download the cropped image" },
  ],
  faqs: [
    { question: "Can I crop to specific dimensions?", answer: "Yes, the tool supports controlled crop dimensions and framing." },
    { question: "Can I rotate while cropping?", answer: "Yes, rotation controls are available in the crop workflow." },
    { question: "Will this reduce quality?", answer: "Cropping itself trims area; export settings determine final quality." },
    { question: "Is this tool free?", answer: "Yes, you can crop images online for free." },
  ],
});

