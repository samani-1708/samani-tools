// app/sitemap.ts
import { type MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://samani.in/",
      lastModified: new Date(),
    },
    {
      url: "https://samani.in/pdf",
      lastModified: new Date(),
    },
    {
      url: "https://samani.in/image",
      lastModified: new Date(),
    },
  ];
}
