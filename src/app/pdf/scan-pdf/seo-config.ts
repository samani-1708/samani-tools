import { makePdfToolSeoConfig } from "../common/make-pdf-tool-seo-config";

export const scanPdfSeoConfig = makePdfToolSeoConfig({
  title: "Scan PDF from Phone to Desktop",
  description:
    "Scan documents from your phone camera and send pages live to your desktop browser, then crop, rotate, reorder, and export as one PDF.",
  path: "/pdf/scan-pdf",
  keywords: [
    "scan pdf online",
    "phone to desktop scan",
    "camera to pdf",
    "qr scan pdf",
    "document scanner web",
    "mobile scan to laptop",
  ],
  heroBadge: "Phone-to-desktop scanner",
  heroTitle: "Scan PDF with Your Phone and Build It on Desktop",
  heroDescription:
    "Open a QR session, capture pages on your phone, and assemble a clean PDF in your desktop browser.",
  heroHighlights: ["QR pairing", "Live image transfer", "Crop and rotate", "Merge to PDF"],
  introHeading: "Capture pages without installing an app",
  introParagraphs: [
    "Start a scan session on desktop, connect your phone using QR, and send camera captures directly to your browser.",
    "Edit scanned pages with crop, rotation, and ordering controls before exporting a merged PDF.",
  ],
  howToTitle: "How to use Scan PDF",
  howToDescription:
    "Open the page on desktop, scan the QR on your phone, capture pages, edit images, and download your merged PDF.",
  reasonsTitle: "Why use this scanner workflow",
  reasonsItems: [
    {
      icon: "/images/icons/scan-eye.svg",
      iconAlt: "QR pairing icon",
      heading: "Fast QR pairing",
      text: "Connect phone and desktop in seconds with a one-time session link.",
    },
    {
      icon: "/images/icons/gallery-vertical.svg",
      iconAlt: "Live capture icon",
      heading: "Live page collection",
      text: "Captured photos appear on desktop instantly for review and arrangement.",
    },
    {
      icon: "/images/icons/crop.svg",
      iconAlt: "Image cleanup icon",
      heading: "Clean up before export",
      text: "Rotate and crop scans so every page is aligned and readable.",
    },
    {
      icon: "/images/icons/combine.svg",
      iconAlt: "Merge icon",
      heading: "One-click PDF merge",
      text: "Merge all scanned pages into a single downloadable PDF.",
    },
  ],
  faqTitle: "Scan PDF FAQs",
  trustTitle: "Designed for browser-first scanning",
  trustDescription:
    "Built for quick document capture when you need your phone camera and desktop editing in one flow.",
  steps: [
    { title: "Start session on desktop" },
    { title: "Join from phone via QR" },
    { title: "Capture and send pages" },
    { title: "Edit and export PDF" },
  ],
  faqs: [
    {
      question: "Do I need to install a mobile app?",
      answer: "No. The phone capture flow runs directly in your mobile browser.",
    },
    {
      question: "Can I crop and rotate pages before merging?",
      answer: "Yes. You can rotate, crop, remove, and reorder pages on desktop.",
    },
    {
      question: "Can I scan multiple pages in one session?",
      answer: "Yes. Capture as many pages as you need before exporting.",
    },
    {
      question: "Does this require an account?",
      answer: "No account is required to start scanning and building your PDF.",
    },
  ],
});
