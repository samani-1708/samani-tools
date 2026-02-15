/**
 * Copies wasm-vips WASM files from node_modules to public/js/wasm-vips/
 */

import { cpSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const destRoot = resolve(root, "public/js/wasm-vips");

const copyList = [
  "node_modules/wasm-vips/lib/vips.wasm",
  "node_modules/wasm-vips/lib/vips-heif.wasm",
  "node_modules/wasm-vips/lib/vips-es6.js",
];

mkdirSync(destRoot, { recursive: true });

for (const src of copyList) {
  const srcPath = resolve(root, src);
  const destPath = resolve(destRoot, src.split("/").pop());
  cpSync(srcPath, destPath);
}

console.log(`[copy-wasm-vips] Copied ${copyList.length} assets to public/js/wasm-vips/`);
