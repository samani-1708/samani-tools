export type ViewportProps = {
  viewport: "desktop" | "tablet" | "mobile";
};

export interface FileUploaded {
  id: string;
  file: File;
  url: string;
  afterEditUrl?: string;
  name: string;
  type: string;
}

interface BasePDFFilePage {
  fileId: string;
  pageIndex: number;
  totalPages: number;
}

export type PageFromPDFFile = BasePDFFilePage & FileUploaded;

export type PDFLibType = typeof import("pdf-lib");
