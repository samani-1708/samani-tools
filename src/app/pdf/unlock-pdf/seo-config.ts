import { makePdfToolSeoConfig } from "../common/make-pdf-tool-seo-config";

export const unlockPdfSeoConfig = makePdfToolSeoConfig({
  title: "Unlock PDF with Password Online",
  description:
    "Unlock password-protected PDFs with authorized credentials for editing, sharing, and document processing.",
  path: "/pdf/unlock-pdf",
  keywords: [
    "unlock pdf",
    "remove pdf password",
    "decrypt pdf",
    "unlock protected pdf",
    "authorized pdf unlock",
  ],
  heroBadge: "Authorized access workflow",
  heroTitle: "Unlock PDF with Password Online",
  heroDescription:
    "Enter the correct password and generate an unlocked copy for downstream tasks.",
  heroHighlights: ["Password required", "Fast unlock", "Browser-based", "Workflow ready"],
  introHeading: "Remove protection when access is authorized",
  introParagraphs: [
    "Use valid credentials to unlock files for editing, splitting, merging, or archiving.",
    "Designed for legitimate operations where your team already has permission to access content.",
  ],
  howToTitle: "How to unlock a PDF",
  howToDescription:
    "Upload the locked file, enter the valid password, generate an unlocked version, and download it.",
  reasonsTitle: "Why use this PDF unlock tool",
  reasonsItems: [
    {
      icon: "/images/icons/unlock-keyhole.svg",
      iconAlt: "Unlock icon",
      heading: "Credential-based access",
      text: "Unlock documents only when the correct password is provided.",
    },
    {
      icon: "/images/icons/file-key.svg",
      iconAlt: "Key icon",
      heading: "Simple unlocking flow",
      text: "Remove barriers quickly for authorized file processing tasks.",
    },
    {
      icon: "/images/icons/file-check.svg",
      iconAlt: "Workflow icon",
      heading: "Ready for next actions",
      text: "Continue immediately with edit, organize, or conversion tools.",
    },
    {
      icon: "/images/icons/shield.svg",
      iconAlt: "Security icon",
      heading: "Responsible usage design",
      text: "Supports legitimate, permission-based document access workflows.",
    },
  ],
  faqTitle: "Unlock PDF FAQs",
  trustTitle: "Built for authorized document handling",
  trustDescription:
    "Suitable for operations teams, legal staff, and records workflows with valid credentials.",
  steps: [
    { title: "Upload protected PDF" },
    { title: "Enter valid password" },
    { title: "Generate unlocked file" },
    { title: "Download result" },
  ],
  faqs: [
    {
      question: "Do I need the original password to unlock?",
      answer: "Yes. The correct password is required.",
    },
    {
      question: "Can I edit the PDF after unlocking?",
      answer: "Yes. Unlocked output can be used with other PDF tools.",
    },
    {
      question: "Can I lock the file again later?",
      answer: "Yes. Use the lock tool to apply password protection again.",
    },
    {
      question: "Is this for authorized use only?",
      answer: "Yes. This workflow is intended for files you are permitted to access.",
    },
  ],
});
