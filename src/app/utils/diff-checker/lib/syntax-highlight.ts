import type { HighlighterCore } from "shiki";

let highlighterPromise: Promise<HighlighterCore> | null = null;

async function getHighlighter(): Promise<HighlighterCore> {
  if (!highlighterPromise) {
    highlighterPromise = (async () => {
      const { createHighlighterCore } = await import("shiki");
      const { createJavaScriptRegexEngine } = await import(
        "shiki/engine/javascript"
      );

      const h = await createHighlighterCore({
        themes: [import("shiki/themes/github-light.mjs")],
        langs: [
          import("shiki/langs/javascript.mjs"),
          import("shiki/langs/typescript.mjs"),
          import("shiki/langs/python.mjs"),
          import("shiki/langs/html.mjs"),
          import("shiki/langs/css.mjs"),
          import("shiki/langs/json.mjs"),
          import("shiki/langs/markdown.mjs"),
          import("shiki/langs/go.mjs"),
          import("shiki/langs/rust.mjs"),
          import("shiki/langs/java.mjs"),
          import("shiki/langs/cpp.mjs"),
          import("shiki/langs/sql.mjs"),
          import("shiki/langs/yaml.mjs"),
          import("shiki/langs/xml.mjs"),
          import("shiki/langs/bash.mjs"),
        ],
        engine: createJavaScriptRegexEngine(),
      });
      return h;
    })();
  }
  return highlighterPromise;
}

export async function highlightCode(
  code: string,
  lang: string
): Promise<string> {
  if (lang === "plaintext" || !code.trim()) {
    return escapeHtml(code);
  }

  try {
    const h = await getHighlighter();
    const html = h.codeToHtml(code, {
      lang,
      theme: "github-light",
    });
    const match = html.match(/<code[^>]*>([\s\S]*?)<\/code>/);
    if (match) {
      return match[1]
        .replace(/<span class="line">/g, "")
        .replace(/<\/span>$/g, "");
    }
    return escapeHtml(code);
  } catch {
    return escapeHtml(code);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
