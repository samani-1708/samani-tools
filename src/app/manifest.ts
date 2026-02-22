import type { MetadataRoute } from "next";
import { SITE_NAME, SITE_URL } from "./common/seo";
import { BRAND_NAME } from "./common/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: BRAND_NAME,
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
