export const PDF_TOOL_ROUTES = [
  "/pdf/merge-pdf",
  "/pdf/split-pdf",
  "/pdf/compress-pdf",
  "/pdf/watermark-pdf",
  "/pdf/crop-pdf",
  "/pdf/image-to-pdf",
  "/pdf/rotate-pdf",
  "/pdf/scan-pdf",
  "/pdf/lock-pdf",
  "/pdf/unlock-pdf",
  "/pdf/organize-pdf",
  "/pdf/page-numbers",
  "/pdf/edit-pdf",
  "/pdf/extract-content",
] as const;

export const IMAGE_TOOL_ROUTES = [
  "/image/compress-image",
  "/image/resize-image",
  "/image/crop-image",
  "/image/convert-image",
  "/image/watermark-image",
  "/image/edit-image",
] as const;

export const UTILITY_TOOL_ROUTES = [
  "/utils/qr-code",
  "/utils/word-counter",
  "/utils/text-encode-decode",
  "/utils/hash-generator",
  "/utils/case-converter",
  "/utils/url-encode-decode",
  "/utils/jwt-encode-decode",
  "/utils/json-viewer",
  "/utils/diff-checker",
  "/utils/markdown-viewer",
] as const;
