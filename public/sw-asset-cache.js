// Service Worker: WASM & heavy asset precaching with cache-first strategy.
// Version bump forces re-install and old cache cleanup.
const CACHE_VERSION = "asset-cache-v1";

const ASSETS = [
  "/js/pdfcpu/pdfcpu-wasm.js",
  "/js/pdfcpu/worker.js",
  "/js/wasm-vips/vips-es6.js",
  "/js/pdflib/worker.js",
  "/js/pdf-lib/1.17.1/pdf-lib.min.js",
  "/js/pdf-worker/4.8.69/pdf-worker.min.js",
  // Large WASM binaries — fetched sequentially below to avoid saturating bandwidth
  "/js/wasm-vips/vips.wasm",
  "/js/pdfcpu/pdfcpu.wasm",
  // Lower-priority: HEIF codec for HEIC/AVIF support
  "/js/wasm-vips/vips-heif.wasm",
];

// Small JS files that can be fetched in parallel
const PARALLEL_ASSETS = ASSETS.filter((a) => !a.endsWith(".wasm"));
// Large WASM files fetched one at a time
const SEQUENTIAL_ASSETS = ASSETS.filter((a) => a.endsWith(".wasm"));

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(async (cache) => {
      // Fetch small assets in parallel
      await cache.addAll(PARALLEL_ASSETS);
      // Fetch large WASM files sequentially to avoid saturating the network
      for (const url of SEQUENTIAL_ASSETS) {
        try {
          await cache.add(url);
        } catch (err) {
          console.warn(`[sw] failed to precache ${url}:`, err);
        }
      }
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key)),
      ),
    ),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Only intercept our known asset paths (WASM, JS under /js/)
  if (!url.pathname.startsWith("/js/")) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    }),
  );
});
