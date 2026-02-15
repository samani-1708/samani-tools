import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();

const requiredCreateMetadataFiles = [
  "src/app/page.tsx",
  "src/app/image/page.tsx",
  "src/app/pdf/page.tsx",
  "src/app/image/layout.tsx",
  "src/app/pdf/layout.tsx",
  "src/app/image/compress-image/layout.tsx",
  "src/app/image/convert-image/layout.tsx",
  "src/app/image/crop-image/layout.tsx",
  "src/app/image/edit-image/layout.tsx",
  "src/app/image/resize-image/layout.tsx",
  "src/app/image/watermark-image/layout.tsx",
  "src/app/pdf/compress-pdf/layout.tsx",
  "src/app/pdf/crop-pdf/layout.tsx",
  "src/app/pdf/image-to-pdf/layout.tsx",
  "src/app/pdf/lock-pdf/layout.tsx",
  "src/app/pdf/merge-pdf/layout.tsx",
  "src/app/pdf/organize-pdf/layout.tsx",
  "src/app/pdf/page-numbers/layout.tsx",
  "src/app/pdf/rotate-pdf/layout.tsx",
  "src/app/pdf/split-pdf/layout.tsx",
  "src/app/pdf/unlock-pdf/layout.tsx",
  "src/app/pdf/watermark-pdf/layout.tsx",
];

const requiredFiles = [
  "src/app/common/seo.ts",
  "src/app/common/tool-routes.ts",
  "src/app/robots.ts",
  "src/app/sitemap.ts",
  "src/app/manifest.ts",
  ...requiredCreateMetadataFiles,
];

const failures = [];

for (const relPath of requiredFiles) {
  const fullPath = path.join(repoRoot, relPath);
  if (!fs.existsSync(fullPath)) {
    failures.push(`Missing required SEO file: ${relPath}`);
  }
}

for (const relPath of requiredCreateMetadataFiles) {
  const fullPath = path.join(repoRoot, relPath);
  if (!fs.existsSync(fullPath)) continue;
  const content = fs.readFileSync(fullPath, "utf8");
  if (!content.includes("createMetadata(")) {
    failures.push(`Missing createMetadata() usage in: ${relPath}`);
  }
}

const robotsPath = path.join(repoRoot, "src/app/robots.ts");
if (fs.existsSync(robotsPath)) {
  const robotsContent = fs.readFileSync(robotsPath, "utf8");
  if (!robotsContent.includes("sitemap.xml")) {
    failures.push("robots.ts does not reference sitemap.xml");
  }
}

const sitemapPath = path.join(repoRoot, "src/app/sitemap.ts");
if (fs.existsSync(sitemapPath)) {
  const sitemapContent = fs.readFileSync(sitemapPath, "utf8");
  if (!sitemapContent.includes("IMAGE_TOOL_ROUTES") || !sitemapContent.includes("PDF_TOOL_ROUTES")) {
    failures.push("sitemap.ts is not using centralized tool routes");
  }
}

if (failures.length > 0) {
  console.error("SEO check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("SEO check passed.");
