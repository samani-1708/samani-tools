import {
  BookOpenIcon,
  ComponentIcon,
  CropIcon,
  FileImage,
  HashIcon,
  LockIcon,
  LucideProps,
  MergeIcon,
  PencilRuler,
  RotateCcwIcon,
  ScalingIcon,
  SplitIcon,
  StampIcon,
  UnlockIcon,
} from "lucide-react";
import { ForwardRefExoticComponent, RefAttributes } from "react";

export type IconComponentLucide = ForwardRefExoticComponent<
  Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
>;

type ColorToken = {
  BG: string;
  HOVER_BG: string;
  TEXT: string;
};

const COLOR_TOKENS = {
  ORANGE: {
    BG: "oklch(70.5% 0.213 47.604)",
    HOVER_BG: "oklch(95.4% 0.038 75.164)",
    TEXT: "oklch(47% 0.157 37.304)",
  },
  RED: {
    BG: "oklch(63.7% 0.237 25.331)",
    HOVER_BG: "oklch(93.6% 0.032 17.717)",
    TEXT: "oklch(44.4% 0.177 26.899)",
  },
  AMBER: {
    BG: "oklch(76.9% 0.188 70.08)",
    HOVER_BG: "oklch(96.2% 0.059 95.617)",
    TEXT: "oklch(47.3% 0.137 46.201)",
  },
  YELLOW: {
    BG: "oklch(79.5% 0.184 86.047)",
    HOVER_BG: "oklch(97.3% 0.071 103.193)",
    TEXT: "oklch(47.6% 0.114 61.907)",
  },
  LIME: {
    BG: "oklch(76.8% 0.233 130.85)",
    HOVER_BG: "oklch(96.7% 0.067 122.328)",
    TEXT: "oklch(45.3% 0.124 130.933)",
  },
  EMERALD: {
    BG: "oklch(69.6% 0.17 162.48)",
    HOVER_BG: "oklch(95% 0.052 163.051)",
    TEXT: "oklch(43.2% 0.095 166.913)",
  },
  CYAN: {
    BG: "oklch(71.5% 0.143 215.221)",
    HOVER_BG: "oklch(95.6% 0.045 203.388)",
    TEXT: "oklch(45% 0.085 224.283)",
  },
  PURPLE: {
    BG: "oklch(62.7% 0.265 303.9)",
    HOVER_BG: "oklch(94.6% 0.033 307.174)",
    TEXT: "oklch(43.8% 0.218 303.724)",
  },
  ROSE: {
    BG: "oklch(64.5% 0.246 16.439)",
    HOVER_BG: "oklch(94.1% 0.03 12.58)",
    TEXT: "oklch(45.5% 0.188 13.697)",
  },
  PINK: {
    BG: "oklch(65.6% 0.241 354.308)",
    HOVER_BG: "oklch(94.8% 0.028 342.258)",
    TEXT: "oklch(45.9% 0.187 3.815)",
  },
} as const;

export type ToolInfo = {
  title: string;
  href: string;
  icon: IconComponentLucide;
  description: string;
  theme: ColorToken;
};

const MERGE_PDF: ToolInfo = {
  title: "Merge PDF",
  href: "/pdf/merge-pdf",
  icon: MergeIcon,
  theme: COLOR_TOKENS.ORANGE,
  description:
    "Combine PDFs in the order you want with the easiest PDF merger available.",
} as const;

const SPLIT_PDF: ToolInfo = {
  title: "Split PDF",
  href: "/pdf/split-pdf",
  icon: SplitIcon,
  theme: COLOR_TOKENS.AMBER,
  description:
    "Separate one page or a whole set for easy conversion into independent PDF files.",
} as const;

const COMPRESS_PDF: ToolInfo = {
  title: "Compress PDF",
  href: "/pdf/compress-pdf",
  icon: ComponentIcon,
  theme: COLOR_TOKENS.LIME,
  description: "Reduce the file size of your PDFs without sacrificing quality.",
} as const;

const WATERMARK_PDF: ToolInfo = {
  title: "Watermark PDF",
  href: "/pdf/watermark-pdf",
  icon: StampIcon,
  theme: COLOR_TOKENS.PURPLE,
  description: "Add custom watermarks to your PDF documents.",
} as const;

const CROP_PDF: ToolInfo = {
  title: "Crop PDF",
  href: "/pdf/crop-pdf",
  icon: CropIcon,
  theme: COLOR_TOKENS.ROSE,
  description: "Crop PDF to match your desired dimensions",
} as const;

const IMAGE_TO_PDF: ToolInfo = {
  title: "Image to PDF",
  href: "/pdf/image-to-pdf",
  icon: FileImage,
  theme: COLOR_TOKENS.YELLOW,

  description:
    "Convert images to PDF format with ease. Supports multiple image formats.",
} as const;

const ROTATE_PDF: ToolInfo = {
  title: "Rotate PDF",
  href: "/pdf/rotate-pdf",
  icon: RotateCcwIcon,
  theme: COLOR_TOKENS.CYAN,
  description:
    "Rotate PDF pages by 90, 180, or 270 degrees. Works on all devices.",
} as const;

const LOCK_PDF: ToolInfo = {
  title: "Lock PDF",
  href: "/pdf/lock-pdf",
  icon: LockIcon,
  theme: COLOR_TOKENS.RED,
  description:
    "Protect your PDF with a password to prevent unauthorized access.",
} as const;

const UNLOCK_PDF: ToolInfo = {
  title: "Unlock PDF",
  href: "/pdf/unlock-pdf",
  icon: UnlockIcon,
  theme: COLOR_TOKENS.EMERALD,
  description:
    "Remove password protection from your PDF files instantly.",
} as const;

const ORGANIZE_PDF: ToolInfo = {
  title: "Organize PDF",
  href: "/pdf/organize-pdf",
  icon: BookOpenIcon,
  theme: COLOR_TOKENS.PINK,
  description:
    "Delete, rotate, reorder, and add pages. Drag and drop to rearrange.",
} as const;

const PAGE_NUMBERS_PDF: ToolInfo = {
  title: "Page Numbers",
  href: "/pdf/page-numbers",
  icon: HashIcon,
  theme: COLOR_TOKENS.AMBER,
  description:
    "Add page numbers to your PDF with customizable position and format.",
} as const;

export const BRAND_NAME = "SamAni";

export const PDF_TOOLS_HEADER: ToolInfo[] = [
  MERGE_PDF,
  SPLIT_PDF,
  COMPRESS_PDF,
  WATERMARK_PDF,
  CROP_PDF,
  IMAGE_TO_PDF,
  ROTATE_PDF,
  LOCK_PDF,
  UNLOCK_PDF,
  ORGANIZE_PDF,
  PAGE_NUMBERS_PDF,
  // MORE_PDF_TOOLS,
] as const;

// tools/imageTools.ts
const COMPRESS_IMAGE: ToolInfo = {
  title: "Compress Image",
  href: "/image/compress-image",
  icon: ComponentIcon,
  theme: COLOR_TOKENS.EMERALD,
  description:
    "Effortlessly reduce image file sizes while maintaining quality.",
} as const;

const RESIZE_IMAGE: ToolInfo = {
  title: "Resize Image",
  href: "/image/resize-image",
  icon: ScalingIcon,
  theme: COLOR_TOKENS.CYAN,

  description: "Easily adjust image dimensions for web or print use.",
} as const;

const CROP_IMAGE: ToolInfo = {
  title: "Crop Image",
  href: "/image/crop-image",
  icon: CropIcon,
  theme: COLOR_TOKENS.PINK,

  description: "Quickly crop images to focus on the most important parts.",
} as const;

const CONVERT_IMAGE: ToolInfo = {
  title: "Convert Image",
  href: "/image/convert-image",
  icon: FileImage,
  theme: COLOR_TOKENS.YELLOW,

  description: "Convert images between various formats with ease.",
} as const;

const WATERMARK_IMAGE: ToolInfo = {
  title: "Watermark Image",
  href: "/image/watermark-image",
  icon: StampIcon,
  theme: COLOR_TOKENS.PURPLE,

  description:
    "Add custom watermarks to your images for branding or copyright protection.",
} as const;

const EDIT_IMAGE: ToolInfo = {
  title: "Edit Image",
  href: "/image/edit-image",
  icon: PencilRuler,
  theme: COLOR_TOKENS.ORANGE,
  description:
    "Use a full-feature image editor with crop, filters, annotations, resize, and export.",
} as const;

export const IMAGE_TOOLS_HEADER: ToolInfo[] = [
  COMPRESS_IMAGE,
  RESIZE_IMAGE,
  CROP_IMAGE,
  CONVERT_IMAGE,
  WATERMARK_IMAGE,
  EDIT_IMAGE,
] as const;


export const MEDIA_QUERIES = {
  sm: 'width >= 40rem',
  md: 'width >= 48rem',
  lg: 'width >= 64rem',
  xl: 'width >= 80rem',
  '2xl': 'width >= 96rem'
};
