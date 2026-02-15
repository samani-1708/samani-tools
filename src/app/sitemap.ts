// app/sitemap.ts
import { type MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://thesamani.com/",
      lastModified: new Date(),
    },
    {
      url: "https://thesamani.com/pdf",
      lastModified: new Date(),
    },
    {
      url: "https://thesamani.com/image",
      lastModified: new Date(),
    },
  ];
}
