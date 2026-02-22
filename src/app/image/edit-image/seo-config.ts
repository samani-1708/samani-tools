import { makeToolSeoConfig } from "@/app/common/make-tool-seo-config";

export const editImageSeoConfig = makeToolSeoConfig({
  title: "Edit Images Online",
  description: "Edit photos with crop, filters, text, drawing, and adjustment tools.",
  path: "/image/edit-image",
  keywords: ["edit image online", "photo editor", "annotate image", "image filters", "browser image editor"],
  heroBadge: "All-in-one image editing",
  heroTitle: "Edit Images Online",
  heroDescription: "Use a full editing workspace for quick fixes and polished exports.",
  heroHighlights: ["Crop + resize", "Text + draw", "Filters", "Free"],
  introHeading: "One workspace for core image edits",
  introParagraphs: [
    "Make practical edits without bouncing between separate tools and apps.",
    "Useful for social content, product images, screenshots, and team feedback loops.",
  ],
  howToTitle: "How to edit images online",
  howToDescription: "Upload your image, apply edits, and export the final result.",
  reasonsTitle: "Why use this image editor?",
  reasonsItems: [
    { icon: "/images/icons/file-edit.svg", iconAlt: "Editing icon", heading: "Comprehensive editing", text: "Handle crop, adjustments, annotation, and overlays in one flow." },
    { icon: "/images/icons/pencil.svg", iconAlt: "Annotation icon", heading: "Clear markups", text: "Add notes, highlights, and drawings for review-ready visuals." },
    { icon: "/images/icons/eye.svg", iconAlt: "Preview icon", heading: "Visual control", text: "Preview changes as you work so output matches expectations." },
    { icon: "/images/icons/download.svg", iconAlt: "Download icon", heading: "Fast export", text: "Download edited images immediately in your chosen format." },
  ],
  faqTitle: "Image editor FAQs",
  trustTitle: "Practical editing for day-to-day content work",
  trustDescription: "Designed for fast turnaround when teams need usable visuals quickly.",
  steps: [
    { title: "Upload an image to edit" },
    { title: "Apply tools like crop, filters, and annotations" },
    { title: "Review final preview" },
    { title: "Download edited output" },
  ],
  faqs: [
    { question: "Can I annotate images with text and drawing?", answer: "Yes, the editor includes text and markup capabilities." },
    { question: "Can I use this for social media assets?", answer: "Yes, it's suitable for quick social and marketing edits." },
    { question: "Do I need to install software?", answer: "No, it runs in browser with no installation required." },
    { question: "Is it free?", answer: "Yes, you can edit images online for free." },
  ],
});

