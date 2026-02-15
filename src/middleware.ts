import { NextRequest, NextResponse, userAgent } from "next/server";

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const { device } = userAgent(request);

  // device.type can be: 'mobile', 'tablet', 'console', 'smarttv',
  // 'wearable', 'embedded', or undefined (for desktop browsers)
  const viewport = device.type || "desktop";

  url.searchParams.set("viewport", viewport);

  const response = NextResponse.rewrite(url);

  // Enable SharedArrayBuffer for wasm-vips multi-threading.
  // "credentialless" allows cross-origin resources (e.g. Buy Me a Coffee script)
  // without requiring them to set Cross-Origin-Resource-Policy headers.
  response.headers.set("Cross-Origin-Embedder-Policy", "credentialless");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Service-Worker-Allowed", "/");

  return response;
}
