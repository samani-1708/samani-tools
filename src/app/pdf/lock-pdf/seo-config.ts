import { makePdfToolSeoConfig } from "../common/make-pdf-tool-seo-config";

export const lockPdfSeoConfig = makePdfToolSeoConfig({
  title: "Lock PDF with Password Online",
  description:
    "Password protect PDF files online with encryption controls for secure document sharing.",
  path: "/pdf/lock-pdf",
  keywords: [
    "lock pdf",
    "password protect pdf",
    "encrypt pdf online",
    "secure pdf file",
    "pdf password",
  ],
  heroBadge: "Secure PDF protection",
  heroTitle: "Lock PDF with Password Online",
  heroDescription:
    "Apply strong password protection to confidential PDFs before sending or storing them.",
  heroHighlights: ["Password lock", "Encrypted output", "Fast setup", "Browser-based"],
  introHeading: "Protect sensitive files before distribution",
  introParagraphs: [
    "Set a document password in a few clicks to prevent unauthorized access.",
    "Useful for legal agreements, HR records, financial statements, and internal documents.",
  ],
  howToTitle: "How to lock a PDF with password",
  howToDescription:
    "Upload your PDF, enter and confirm a strong password, apply protection, and download the locked file.",
  reasonsTitle: "Why use this PDF lock tool",
  reasonsItems: [
    {
      icon: "/images/icons/lock-keyhole.svg",
      iconAlt: "Lock icon",
      heading: "Controlled file access",
      text: "Require a password before the PDF can be opened.",
    },
    {
      icon: "/images/icons/shield.svg",
      iconAlt: "Shield icon",
      heading: "Stronger data protection",
      text: "Use encryption-backed protection for confidential document workflows.",
    },
    {
      icon: "/images/icons/file-lock.svg",
      iconAlt: "File protection icon",
      heading: "Business-ready security",
      text: "Safeguard contracts, reports, and sensitive documents before sharing.",
    },
    {
      icon: "/images/icons/badge-check.svg",
      iconAlt: "Compliance icon",
      heading: "Repeatable process",
      text: "Apply consistent protection standards across teams and projects.",
    },
  ],
  faqTitle: "Lock PDF FAQs",
  trustTitle: "Made for secure document operations",
  trustDescription:
    "Designed for controlled sharing in legal, finance, compliance, and internal business use.",
  steps: [
    { title: "Upload PDF" },
    { title: "Set strong password" },
    { title: "Apply lock" },
    { title: "Download protected file" },
  ],
  faqs: [
    {
      question: "Does locking change PDF content?",
      answer: "No. It adds access protection while preserving document content.",
    },
    {
      question: "Can recipients open the file without password?",
      answer: "No. The correct password is required.",
    },
    {
      question: "Can I remove protection later?",
      answer: "Yes. Use the unlock tool with valid credentials.",
    },
    {
      question: "Do I need to install software?",
      answer: "No. The workflow runs directly in your browser.",
    },
  ],
});
