import type { NextConfig } from "next";
import path from "path";

const enableBmc = process.env.NEXT_PUBLIC_ENABLE_BMC === "true";
const bmcModulePath = enableBmc
  ? "./src/app/common/bmc.tsx"
  : "./src/app/common/bmc-disabled.tsx";

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  async headers() {
    // App-wide CSP. BMC CDN entries are included for when BMC is re-enabled.
    const appCSP = [
      "default-src 'self'",
      // unsafe-inline: required for Next.js inline scripts (theme init, SW registration)
      // wasm-unsafe-eval: allows WebAssembly without full unsafe-eval
      "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://cdnjs.buymeacoffee.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' blob: data: https://cdn.buymeacoffee.com",
      // wss:/ws: for chat-pdf WebSocket (endpoint is env-var configured)
      "connect-src 'self' blob: ws: wss:",
      "worker-src 'self' blob:",
      "frame-src 'self'",
      "media-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: appCSP },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        // pdfjs viewer: additionally block crawlers and lock down CSP to self-only
        source: "/pdfjs-viewer/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Content-Security-Policy", value: "default-src 'self' blob:; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; connect-src 'self' blob:; worker-src 'self' blob:; object-src 'none'; base-uri 'self';" },
        ],
      },
    ];
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias["@/app/common/bmc"] = path.resolve(
      __dirname,
      bmcModulePath,
    );

    return config;
  },
  turbopack: {
    resolveAlias: {
      canvas: "./empty-module.ts",
      "@/app/common/bmc": bmcModulePath,
    },
  },
};

export default nextConfig;
