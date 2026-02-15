import type { MetadataRoute } from "next";
import { SITE_NAME, SITE_URL } from "./common/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "SamAni",
    description:
      "Free PDF and image utilities for merge, split, convert, crop, compress, watermark, and resize workflows.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#111111",
    categories: ["productivity", "utilities"],
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
    id: SITE_URL,
  };
}
