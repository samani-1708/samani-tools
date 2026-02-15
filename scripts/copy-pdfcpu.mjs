/**
 * Copies pdfcpu-wasm assets from node_modules to public/js/pdfcpu/
 * so they are served as static files.
 *
 * Runs as a prebuild step — the copied files are gitignored.
 */

import { cpSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const src = resolve(root, "node_modules/pdfcpu-wasm");
const dest = resolve(root, "public/js/pdfcpu");

mkdirSync(dest, { recursive: true });

cpSync(resolve(src, "pdfcpu.wasm"), resolve(dest, "pdfcpu.wasm"));
cpSync(resolve(src, "index.js"), resolve(dest, "pdfcpu-wasm.js"));

console.log("[copy-pdfcpu] Copied pdfcpu.wasm and pdfcpu-wasm.js to public/js/pdfcpu/");
