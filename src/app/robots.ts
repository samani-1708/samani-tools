import { type MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*", // applies to all crawlers
      allow: "/",     // allow crawling everything
    },
    sitemap: "https://thesamani.com/sitemap.xml",
    host: "https://thesamani.com",
  };
}