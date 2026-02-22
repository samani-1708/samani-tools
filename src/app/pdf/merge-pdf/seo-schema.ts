import {
  createMetadataFromSchema,
  SEOPageSchema,
} from "@/app/common/seo-page-schema";

export const mergePdfSeoSchema: SEOPageSchema = {
  title: "Merge PDF Files Online",
  description:
    "Merge PDF files online into one organized document with page-order control and clean output.",
  path: "/pdf/merge-pdf",
  keywords: [
    "merge pdf",
    "combine pdf files",
    "join pdf online",
    "pdf merger",
    "merge multiple pdf files",
    "reorder files before merge",
  ],
  hero: {
    header: "Merge PDF Files Online",
    subHeader:
      "Combine multiple PDF documents into one file with simple ordering controls for professional output.",
    highlights: ["Fast merge", "Order control", "Multi-file support", "Browser-based"],
  },
  sections: [
    {
      type: "info",
      header: "Combine documents in a clean, predictable workflow",
      paragraphs: [
        "Upload multiple files, arrange sequence, and generate one consolidated PDF for sharing or archive use.",
        "Useful for proposal packs, legal bundles, reports, invoices, and cross-team handoff documents.",
      ],
      bullets: [
        "Merge many PDFs into one output",
        "Reorder file sequence before final export",
        "Preserve practical readability and structure",
      ],
    },
    {
      type: "keyfeatures",
      header: "Why use this merge PDF tool",
      features: [
        {
          emoji: "🧩",
          title: "Precise order control",
          description: "Arrange the exact sequence needed for final document flow.",
        },
        {
          emoji: "⚡",
          title: "Fast processing",
          description: "Generate merged output quickly for high-frequency tasks.",
        },
        {
          emoji: "🧾",
          title: "Readable final output",
          description: "Keep page clarity and structure suitable for professional use.",
        },
        {
          emoji: "📤",
          title: "Share-ready files",
          description: "Export one clean PDF for simpler review and distribution.",
        },
        {
          emoji: "📱",
          title: "Cross-device compatibility",
          description: "Run merges in modern desktop and mobile browsers.",
        },
        {
          emoji: "🛠️",
          title: "Tool-chain continuity",
          description: "Continue to split, compress, watermark, or secure the merged result.",
        },
      ],
    },
    {
      type: "steps",
      header: "How to merge PDF files",
      subHeader: "Four quick steps",
      steps: [
        {
          emoji: "1️⃣",
          title: "Upload PDF files",
          description: "Select all documents you want to combine.",
        },
        {
          emoji: "2️⃣",
          title: "Arrange order",
          description: "Set the sequence of files before processing.",
        },
        {
          emoji: "3️⃣",
          title: "Run merge",
          description: "Generate one consolidated PDF output.",
        },
        {
          emoji: "4️⃣",
          title: "Download merged file",
          description: "Save and share your final combined document.",
        },
      ],
    },
    {
      type: "faq",
      header: "Merge PDF FAQs",
      faqs: [
        {
          question: "Can I merge more than two PDF files at once?",
          answer: "Yes. You can combine multiple files in one merge run.",
        },
        {
          question: "Can I reorder files before merging?",
          answer: "Yes. File order can be adjusted before final export.",
        },
        {
          question: "Will merged output preserve readability?",
          answer: "Yes. The merge flow is designed to maintain practical document quality.",
        },
        {
          question: "Can I continue editing after merge?",
          answer: "Yes. You can use other PDF tools after generating the merged file.",
        },
      ],
    },
  ],
};

export const mergePdfMetadata = createMetadataFromSchema(mergePdfSeoSchema);
