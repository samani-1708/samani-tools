import { makeToolSeoConfig } from "@/app/common/make-tool-seo-config";

export const watermarkImageSeoConfig = makeToolSeoConfig({
  title: "Watermark Images Online",
  description: "Add text watermarks with controls for size, color, opacity, and position.",
  path: "/image/watermark-image",
  keywords: ["watermark image", "add watermark to photo", "copyright watermark", "text watermark"],
  heroBadge: "Quick ownership marking",
  heroTitle: "Watermark Images Online",
  heroDescription: "Protect and brand images before sharing, publishing, or client delivery.",
  heroHighlights: ["Text watermark", "Opacity controls", "Placement options", "Free"],
  introHeading: "Brand and protect visual assets",
  introParagraphs: [
    "Apply ownership or draft marks to prevent uncredited reuse.",
    "Tune style and placement so watermarks remain visible without overpowering content.",
  ],
  howToTitle: "How to watermark images online",
  howToDescription: "Upload an image, customize watermark settings, and export.",
  reasonsTitle: "Why use this image watermark tool?",
  reasonsItems: [
    { icon: "/images/icons/stamp.svg", iconAlt: "Watermark icon", heading: "Clear ownership marks", text: "Add visible text overlays to identify source and usage status." },
    { icon: "/images/icons/signature.svg", iconAlt: "Branding icon", heading: "Flexible style controls", text: "Customize text, color, rotation, and opacity to match your brand." },
    { icon: "/images/icons/eye.svg", iconAlt: "Visibility icon", heading: "Readable overlays", text: "Balance watermark visibility with image readability." },
    { icon: "/images/icons/download.svg", iconAlt: "Download icon", heading: "Quick export", text: "Download watermarked output immediately for delivery or publication." },
  ],
  faqTitle: "Watermark image FAQs",
  trustTitle: "Practical protection for visual content teams",
  trustDescription: "Useful for photographers, marketers, creators, and internal document workflows.",
  steps: [
    { title: "Upload your image" },
    { title: "Enter watermark text and style settings" },
    { title: "Position and preview the watermark" },
    { title: "Download watermarked image" },
  ],
  faqs: [
    { question: "Can I control watermark opacity?", answer: "Yes, opacity can be adjusted for subtle or strong overlays." },
    { question: "Can I place watermarks in different positions?", answer: "Yes, positioning controls are available." },
    { question: "Does this support branding use cases?", answer: "Yes, it is suitable for adding brand and copyright marks." },
    { question: "Is this tool free?", answer: "Yes, watermarking images online is free." },
  ],
});

