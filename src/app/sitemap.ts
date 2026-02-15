import { type MetadataRoute } from "next";
import { IMAGE_TOOL_ROUTES, PDF_TOOL_ROUTES } from "./common/tool-routes";
import { SITE_URL } from "./common/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = [
    "/",
    "/pdf",
    "/image",
    ...PDF_TOOL_ROUTES,
    ...IMAGE_TOOL_ROUTES,
  ];

  return [...new Set(routes)].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "/" ? 1 : path === "/pdf" || path === "/image" ? 0.9 : 0.8,
  }));
}
