import {
  PageConfig,
  PageCopy as NativePageCopy,
} from "@/app/common/page-copy/page-copy";

export const pageConfig: PageConfig = {
  header: "Complete PDF Toolkit - Free Online PDF Editor & Converter",
  subHeader: "Professional-grade PDF tools for every document need",
  description:
    "Access the most comprehensive collection of PDF tools online. From basic operations like merge and split to advanced features like watermarking and compression - all free, secure, and browser-based with no downloads or signups required.",
  sections: [
    {
      type: "info",
      header: "Why Choose Our PDF Tools?",
      paragraphs: [
        "Whether you're a student organizing research papers, a professional preparing business documents, or someone who regularly works with PDFs, our comprehensive toolkit has everything you need in one convenient location.",
        "Our PDF tools are designed with privacy and efficiency in mind. All processing happens locally in your browser, ensuring your sensitive documents never leave your device while delivering lightning-fast results.",
        "From combining multiple invoices into a single file to compressing large presentations for email sharing, our tools handle every PDF task with professional-grade quality and ease of use.",
      ],
    },
    {
      type: "keyfeatures",
      header: "Comprehensive PDF Solutions",
      features: [
        {
          emoji: "🔄",
          title: "Merge & Split PDFs",
          description: "Combine multiple PDFs or extract specific pages with drag-and-drop simplicity. Perfect for organizing documents, creating compilations, or sharing specific sections.",
        },
        {
          emoji: "🗜️",
          title: "Advanced Compression",
          description: "Reduce PDF file sizes by up to 90% while maintaining visual quality. Ideal for email attachments, web uploads, and storage optimization.",
        },
        {
          emoji: "🖼️",
          title: "Image & Scan Conversion",
          description: "Transform images, scanned documents, and photos into professional PDFs. Supports all major image formats with automatic optimization.",
        },
        {
          emoji: "🛡️",
          title: "Watermark & Protection",
          description: "Add custom watermarks, text overlays, or stamps to protect your intellectual property and brand your documents professionally.",
        },
        {
          emoji: "⚡",
          title: "Lightning Fast Processing",
          description: "Browser-based processing ensures instant results without uploading files to external servers. Your documents stay private and secure.",
        },
        {
          emoji: "📱",
          title: "Universal Compatibility",
          description: "Works seamlessly on desktop, tablet, and mobile devices. No software installation required - just open your browser and start working.",
        },
        {
          emoji: "🆓",
          title: "Completely Free",
          description: "All tools are 100% free with no hidden costs, watermarks, or usage limits. Professional-grade features accessible to everyone.",
        },
        {
          emoji: "🔒",
          title: "Privacy First",
          description: "Zero data collection, no cloud uploads, and complete local processing. Your sensitive documents remain private and secure at all times.",
        },
      ],
    },
    {
      type: "info",
      header: "Perfect for Every Use Case",
      paragraphs: [
        "**Students & Researchers**: Combine research papers, compress thesis documents, and organize academic materials efficiently. Create professional presentations and portfolios.",
        "**Business Professionals**: Merge contracts and proposals, compress large reports for sharing, add company watermarks, and maintain document security standards.",
        "**Legal & Compliance**: Handle sensitive documents with complete privacy, organize case files, and ensure document integrity with professional watermarking.",
        "**Content Creators**: Convert design assets to PDFs, compress portfolios for web sharing, and protect creative work with custom watermarks and branding.",
        "**Personal Use**: Organize family documents, compress photo albums, create digital scrapbooks, and manage household paperwork efficiently.",
      ],
    },
    {
      type: "steps",
      header: "How Our PDF Tools Work",
      subHeader: "Simple 3-Step Process",
      steps: [
        {
          emoji: "📂",
          title: "Upload Your Files",
          description:
            "Select PDF files from your device or drag-and-drop them directly into any tool. Supports multiple file selection for batch operations.",
        },
        {
          emoji: "⚙️",
          title: "Configure & Process",
          description:
            "Choose your settings, reorder files if needed, and click process. All operations happen instantly in your browser with real-time preview.",
        },
        {
          emoji: "💾",
          title: "Download Results",
          description:
            "Get your processed PDFs instantly with a single click. No waiting, no email notifications - just immediate, professional results.",
        },
      ],
    },
    {
      type: "info",
      header: "Advanced Features & Capabilities",
      paragraphs: [
        "**Smart Compression**: Our intelligent compression algorithms analyze each PDF to determine optimal settings, preserving text clarity while significantly reducing file sizes.",
        "**Batch Processing**: Handle multiple files simultaneously with our efficient batch processing capabilities, saving time on large document collections.",
        "**Format Flexibility**: Convert between various formats including images (JPG, PNG, TIFF), documents, and maintain formatting integrity across all operations.",
        "**Professional Watermarking**: Add text, images, or transparent overlays with precise positioning, opacity control, and scaling options for professional branding.",
        "**Security Features**: Password protection capabilities and secure local processing ensure your confidential documents remain protected throughout the editing process.",
      ],
    },
  ],
};

export function PageCopy() {
  return <NativePageCopy config={pageConfig} />;
}