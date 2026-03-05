import type { Metadata } from "next";
import { createMetadata, SITE_NAME } from "../common/seo";
import { ExternalLinkIcon, GithubIcon } from "lucide-react";

export const metadata: Metadata = createMetadata({
  title: "About",
  description: `Learn about ${SITE_NAME}, our privacy-first approach, and the open-source libraries that power our PDF, image, and utility tools.`,
  path: "/about",
  keywords: [
    "about utility tools",
    "open source libraries",
    "react nextjs pdf-lib",
    "privacy first tools",
    "browser based tools",
  ],
});

type Library = {
  name: string;
  category: string;
  description: string;
  githubUrl: string;
  docsUrl?: string;
  packageName?: string;
  logoUrl?: string;
  logoAlt?: string;
};

const LIBRARIES: Library[] = [
  {
    name: "React",
    category: "Core UI",
    description: "Component architecture and interactive UI rendering.",
    githubUrl: "https://github.com/facebook/react",
    docsUrl: "https://react.dev/",
    packageName: "react",
    logoUrl: "https://cdn.simpleicons.org/react/61DAFB",
    logoAlt: "React logo",
  },
  {
    name: "Next.js",
    category: "App Framework",
    description: "Routing, metadata, rendering, and production app structure.",
    githubUrl: "https://github.com/vercel/next.js",
    docsUrl: "https://nextjs.org/",
    packageName: "next",
    logoUrl: "https://cdn.simpleicons.org/nextdotjs/111111",
    logoAlt: "Next.js logo",
  },
  {
    name: "pdf-lib",
    category: "PDF Engine",
    description: "Client-side PDF creation and manipulation workflows.",
    githubUrl: "https://github.com/Hopding/pdf-lib",
    docsUrl: "https://pdf-lib.js.org/",
    packageName: "pdf-lib",
    logoUrl: "/images/icons/file-edit.svg",
    logoAlt: "PDF icon",
  },
  {
    name: "pdfcpu",
    category: "PDF Engine",
    description: "Advanced PDF operations through a performant processing core.",
    githubUrl: "https://github.com/pdfcpu/pdfcpu",
    docsUrl: "https://pdfcpu.io/",
    packageName: "pdfcpu-wasm",
    logoUrl: "/images/icons/files.svg",
    logoAlt: "PDFCPU icon",
  },
  {
    name: "wasm-vips",
    category: "Image Processing",
    description: "High-performance image processing via WebAssembly.",
    githubUrl: "https://github.com/kleisauke/wasm-vips",
    packageName: "wasm-vips",
    logoUrl: "/images/icons/image-up.svg",
    logoAlt: "Image processing icon",
  },
  {
    name: "Tesseract.js",
    category: "OCR",
    description: "In-browser OCR for extracting text from images and scans.",
    githubUrl: "https://github.com/naptha/tesseract.js",
    docsUrl: "https://tesseract.projectnaptha.com/",
    packageName: "tesseract.js",
    logoUrl: "https://cdn.simpleicons.org/tesseract/5A4FCF",
    logoAlt: "Tesseract logo",
  },
  {
    name: "TipTap",
    category: "Rich Text",
    description: "Structured editor features used in content-focused tooling.",
    githubUrl: "https://github.com/ueberdosis/tiptap",
    docsUrl: "https://tiptap.dev/",
    packageName: "@tiptap/react",
    logoUrl: "https://cdn.simpleicons.org/tiptap/111111",
    logoAlt: "TipTap logo",
  },
  {
    name: "Lucide",
    category: "Icons",
    description: "Consistent icon system used across tool interfaces.",
    githubUrl: "https://github.com/lucide-icons/lucide",
    docsUrl: "https://lucide.dev/",
    packageName: "lucide-react",
    logoUrl: "https://cdn.simpleicons.org/lucide/111111",
    logoAlt: "Lucide logo",
  },
];

function LibraryLogo({ library }: { library: Library }) {
  if (library.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={library.logoUrl}
        alt={library.logoAlt || `${library.name} logo`}
        className="h-10 w-10 object-contain"
      />
    );
  }

  return (
    <span className="text-sm font-bold tracking-wide text-foreground">
      {library.name.slice(0, 2).toUpperCase()}
    </span>
  );
}

export default function AboutPage() {
  return (
    <div className="container max-w-6xl mx-auto px-4 md:px-6 py-12 space-y-10">
      <section className="space-y-4 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          About {SITE_NAME}
        </h1>
        <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
          {SITE_NAME} is built on open-source software. We rely on proven OSS
          libraries to deliver browser-based PDF, image, and utility workflows
          with a privacy-first approach.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Major Open-Source Libraries We Use
        </h2>
        <p className="text-muted-foreground">
          Core technologies that power this project, with links to their GitHub repositories.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        {LIBRARIES.map((library) => (
          <article
            key={library.name}
            className="rounded-2xl border border-border/70 bg-card/70 p-5 md:p-6"
          >
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-xl bg-muted/80 border border-border/70 flex items-center justify-center shrink-0">
                <LibraryLogo library={library} />
              </div>

              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold">{library.name}</h3>
                  <span className="text-xs rounded-full border border-border px-2 py-0.5 text-muted-foreground">
                    {library.category}
                  </span>
                  {library.packageName && (
                    <code className="text-xs rounded bg-muted px-2 py-0.5">
                      {library.packageName}
                    </code>
                  )}
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  {library.description}
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  <a
                    href={library.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted transition-colors"
                  >
                    <GithubIcon className="h-4 w-4" />
                    GitHub
                    <ExternalLinkIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  </a>

                  {library.docsUrl && (
                    <a
                      href={library.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted transition-colors"
                    >
                      Docs
                      <ExternalLinkIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
