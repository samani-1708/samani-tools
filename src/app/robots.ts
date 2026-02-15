import { type MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*", // applies to all crawlers
      allow: "/",     // allow crawling everything
    },
    sitemap: "https://samani.in/sitemap.xml",
    host: "https://samani.in",
  };
}