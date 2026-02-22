import { makeToolSeoConfig } from "@/app/common/make-tool-seo-config";

export const qrCodeSeoConfig = makeToolSeoConfig({
  title: "QR Code Generator Online",
  description: "Generate styled QR codes with presets, logos, and export options.",
  path: "/utils/qr-code",
  keywords: ["qr code generator", "styled qr", "qr code with logo", "upi qr", "custom qr code"],
  heroBadge: "Styled QR creation",
  heroTitle: "QR Code Generator Online",
  heroDescription: "Create branded and scannable QR codes for links, payments, and profiles.",
  heroHighlights: ["Preset styles", "Logo support", "Multiple exports", "Free"],
  introHeading: "Create QR codes that fit your brand",
  introParagraphs: [
    "Choose visual presets, add logos, and tune colors while keeping codes scan-friendly.",
    "Useful for menus, events, profiles, campaigns, and payment links.",
  ],
  howToTitle: "How to generate a QR code",
  howToDescription: "Enter content, pick style options, preview, and download.",
  reasonsTitle: "Why use this QR generator?",
  reasonsItems: [
    { icon: "/images/icons/layout-grid.svg", iconAlt: "Preset icon", heading: "Rich style presets", text: "Start quickly with ready-made looks and then customize details." },
    { icon: "/images/icons/signature.svg", iconAlt: "Branding icon", heading: "Brand-friendly output", text: "Add logo and styling to align with campaign or product branding." },
    { icon: "/images/icons/scan-search.svg", iconAlt: "Scan icon", heading: "Built for scan usability", text: "Tune contrast and structure for practical real-world scanning." },
    { icon: "/images/icons/download.svg", iconAlt: "Download icon", heading: "Flexible export", text: "Download generated QR in formats suitable for print and digital." },
  ],
  faqTitle: "QR code generator FAQs",
  trustTitle: "Practical QR workflows for creators and teams",
  trustDescription: "Great for marketing, operations, events, and business communication.",
  steps: [
    { title: "Enter URL, text, or other QR content" },
    { title: "Choose style, colors, and logo options" },
    { title: "Preview scan-friendly output" },
    { title: "Download QR file" },
  ],
  faqs: [
    { question: "Can I add a logo to QR codes?", answer: "Yes, logo support is included in the styling workflow." },
    { question: "Can I customize colors and shapes?", answer: "Yes, the tool supports rich visual customization." },
    { question: "Can I generate payment QR codes?", answer: "Yes, payment use cases like UPI are supported by the generator." },
    { question: "Is this free?", answer: "Yes, generating QR codes is free." },
  ],
});

