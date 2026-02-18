import {
  CompressOptions,
  DecryptOptions,
  EncryptOptions,
  FileObject,
  ImageInput,
  ImageToPdfOptions,
  ImageWatermarkOptions,
  IPdfUtilsLib,
  RotateOptions,
  TextWatermarkOptions,
} from "./types";

interface WorkerRequest {
  id: number;
  args: string[];
  files: Array<{ name: string; buffer: ArrayBuffer }>;
  outputPaths: string[];
}

interface WorkerResponse {
  id: number;
  outputs?: Array<{ path: string; buffer: ArrayBuffer | null }>;
  error?: string;
}

export default class PDFCpuUtils implements IPdfUtilsLib {
  private static worker: Worker | null = null;
  private static requestId = 0;
  private static pending = new Map<
    number,
    { resolve: (value: Map<string, ArrayBuffer | null>) => void; reject: (err: Error) => void }
  >();

  public static async init(): Promise<number> {
    if (!this.worker) {
      this.worker = new Worker("/js/pdfcpu/worker.js", { type: "module" });
      this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
        const { id, outputs, error } = e.data;
        const p = this.pending.get(id);
        if (!p) return;
        this.pending.delete(id);

        if (error) {
          p.reject(new Error(error));
        } else {
          const map = new Map<string, ArrayBuffer | null>();
          for (const o of outputs || []) {
            map.set(o.path, o.buffer);
          }
          p.resolve(map);
        }
      };
      this.worker.onerror = (e) => {
      };
    }
    return 1;
  }

  private async runWorker(
    args: string[],
    files: Array<{ name: string; buffer: ArrayBuffer }>,
    outputPaths: string[]
  ): Promise<Map<string, ArrayBuffer | null>> {
    if (!PDFCpuUtils.worker) {
      await PDFCpuUtils.init();
    }

    const id = ++PDFCpuUtils.requestId;

    return new Promise((resolve, reject) => {
      PDFCpuUtils.pending.set(id, { resolve, reject });

      // Don't use transferables for input — structured clone copies them safely.
      // Transferables detach the source buffer which breaks if buffers are reused.
      const msg: WorkerRequest = { id, args, files, outputPaths };
      PDFCpuUtils.worker!.postMessage(msg);
    });
  }

  private async run(
    args: string[],
    inputFiles: Array<{ name: string; buffer: ArrayBuffer }>,
    outputPath: string
  ): Promise<Uint8Array> {
    const result = await this.runWorker(args, inputFiles, [outputPath]);
    const buf = result.get(outputPath);
    if (!buf) throw new Error(`Output file not found: ${outputPath}`);
    return new Uint8Array(buf);
  }

  private toInput(
    buffer: ArrayBuffer,
    name: string = "input.pdf"
  ): { name: string; buffer: ArrayBuffer } {
    return { name, buffer: buffer.slice(0) };
  }

  public async getPageCount(file: FileObject): Promise<number> {
    throw new Error("un-implemented");
  }

  public async merge(files: FileObject[]): Promise<Uint8Array> {
    const inputFiles = files.map((f, i) => this.toInput(f.buffer, `${i}.pdf`));
    const inputPaths = files.map((_, i) => `/input/${i}.pdf`);

    return this.run(
      ["merge", "-mode", "create", "-opt=false", "--", "/output/merged.pdf", ...inputPaths],
      inputFiles,
      "merged.pdf"
    );
  }

  public async split(
    file: FileObject,
    ranges: number[][]
  ): Promise<Uint8Array[]> {
    // Extract ALL unique pages in a single pdfcpu call to avoid
    // multiple WASM instantiations (each one costs ~5-10s).
    const allPages = new Set<number>();
    for (const range of ranges) {
      for (const page of range) allPages.add(page);
    }

    const sortedPages = Array.from(allPages).sort((a, b) => a - b);
    const inputFile = this.toInput(file.buffer, "input.pdf");
    const pageNumbers = sortedPages.join(",");

    const expectedOutputs = sortedPages.map((pageNum) => {
      const paddedNum = String(pageNum).padStart(4, "0");
      return `input_${paddedNum}.pdf`;
    });

    const outputMap = await this.runWorker(
      ["extract", "-mode", "page", "-pages", pageNumbers, "/input/input.pdf", "/output/"],
      [inputFile],
      expectedOutputs
    );

    // Build a lookup from page number to extracted buffer
    const pageBuffers = new Map<number, ArrayBuffer>();
    for (let i = 0; i < sortedPages.length; i++) {
      const buf = outputMap.get(expectedOutputs[i]);
      if (buf) pageBuffers.set(sortedPages[i], buf);
    }

    // Assemble each range from extracted pages
    const results: Uint8Array[] = [];
    for (const range of ranges) {
      const extractedBuffers: ArrayBuffer[] = [];
      for (const page of range) {
        const buf = pageBuffers.get(page);
        if (buf) extractedBuffers.push(buf);
      }

      if (extractedBuffers.length === 0) {
        continue;
      }

      if (extractedBuffers.length === 1) {
        results.push(new Uint8Array(extractedBuffers[0]));
      } else {
        // Merge extracted pages for this range
        const mergeInputFiles = extractedBuffers.map((buf, j) =>
          this.toInput(buf, `${j}.pdf`)
        );
        const mergePaths = mergeInputFiles.map((_, j) => `/input/${j}.pdf`);
        const merged = await this.run(
          ["merge", "--", "/output/merged.pdf", ...mergePaths],
          mergeInputFiles,
          "merged.pdf"
        );
        results.push(merged);
      }
    }

    return results;
  }

  public async embedImages(
    images: ImageInput[],
    options: ImageToPdfOptions
  ): Promise<Uint8Array> {
    const inputFiles = images.map((img, i) => {
      const ext = img.type === "image/png" ? "png" : "jpg";
      return this.toInput(img.buffer, `image_${i}.${ext}`);
    });

    const imagePaths = inputFiles.map((f) => `/input/${f.name}`);
    const description = this.parseImportOptions(options);

    return this.run(
      ["import", "--", description, "/output/output.pdf", ...imagePaths],
      inputFiles,
      "output.pdf"
    );
  }

  public async compress(
    file: FileObject,
    options: CompressOptions = {}
  ): Promise<Uint8Array> {
    const inputFile = this.toInput(file.buffer, "input.pdf");
    const args = ["optimize"];

    if (options.mode) {
      args.push(`-mode=${options.mode}`);
    }

    args.push("/input/input.pdf", "/output/output.pdf");

    return this.run(args, [inputFile], "output.pdf");
  }

  public async watermarkText(
    file: FileObject,
    options: TextWatermarkOptions
  ): Promise<Uint8Array> {
    const inputFile = this.toInput(file.buffer, "input.pdf");

    const descParts: string[] = [];
    if (options.fontFamily) descParts.push(`font:${options.fontFamily}`);
    if (options.fontSize) descParts.push(`points:${options.fontSize}`);
    if (options.color) {
      const col = options.color.startsWith("#")
        ? options.color
        : `#${options.color}`;
      descParts.push(`fillcolor:${col}`);
    }
    if (typeof options.opacity === "number")
      descParts.push(`op:${options.opacity}`);
    if (typeof options.rotation === "number")
      descParts.push(`rot:${options.rotation}`);
    if (options.position) descParts.push(`pos:${options.position}`);
    if (options.scale) descParts.push(`sc:${options.scale} abs`);

    const command = options.onTop ? "stamp" : "watermark";
    const description = descParts.join(", ");

    return this.run(
      [
        command, "add", "-mode", "text", "--",
        options.text, description,
        "/input/input.pdf", "/output/output.pdf",
      ],
      [inputFile],
      "output.pdf"
    );
  }

  public async watermarkImage(
    file: FileObject,
    imageBuffer: ArrayBuffer,
    imageName: string,
    options: ImageWatermarkOptions
  ): Promise<Uint8Array> {
    const inputFile = this.toInput(file.buffer, "input.pdf");
    const imageFile = this.toInput(imageBuffer, imageName);

    const descParts: string[] = [];
    if (typeof options.opacity === "number")
      descParts.push(`op:${options.opacity}`);
    if (typeof options.rotation === "number")
      descParts.push(`rot:${options.rotation}`);
    if (options.position) descParts.push(`pos:${options.position}`);
    if (options.scale) descParts.push(`sc:${options.scale} abs`);

    const command = options.onTop ? "stamp" : "watermark";
    const description = descParts.join(", ");

    return this.run(
      [
        command, "add", "-mode", "image", "--",
        `/input/${imageName}`, description,
        "/input/input.pdf", "/output/output.pdf",
      ],
      [inputFile, imageFile],
      "output.pdf"
    );
  }

  public async rotate(
    buffer: ArrayBuffer,
    options: RotateOptions
  ): Promise<Uint8Array> {
    const inputFile = this.toInput(buffer, "input.pdf");

    let rotation = options.rotation % 360;
    if (rotation < 0) rotation += 360;

    const args = ["rotate"];

    if (options.pages && options.pages.length > 0) {
      args.push("-pages", options.pages.map((p) => p + 1).join(","));
    }

    args.push("--", "/input/input.pdf", rotation.toString(), "/output/output.pdf");

    return this.run(args, [inputFile], "output.pdf");
  }

  public async encrypt(
    buffer: ArrayBuffer,
    options: EncryptOptions
  ): Promise<Uint8Array> {
    if (!options.ownerPassword && !options.userPassword) {
      throw new Error("At least one password (owner or user) is required");
    }

    const inputFile = this.toInput(buffer, "input.pdf");
    const args = ["encrypt"];

    // -opw is required by pdfcpu
    args.push("-opw", options.ownerPassword || options.userPassword!);

    if (options.userPassword && options.userPassword.length > 0) {
      args.push("-upw", options.userPassword);
    }

    args.push("/input/input.pdf", "/output/output.pdf");

    return this.run(args, [inputFile], "output.pdf");
  }

  public async decrypt(
    buffer: ArrayBuffer,
    options: DecryptOptions
  ): Promise<Uint8Array> {
    const inputFile = this.toInput(buffer, "input.pdf");
    const args = ["decrypt"];

    if (options.userPassword) {
      args.push("-upw", options.userPassword);
    }
    if (options.ownerPassword) {
      args.push("-opw", options.ownerPassword);
    }

    args.push("/input/input.pdf", "/output/output.pdf");

    return this.run(args, [inputFile], "output.pdf");
  }

  private parseImportOptions(options: ImageToPdfOptions): string {
    const parts: string[] = [];

    if (options.pageSize === "natural") {
      parts.push("pos:full");
    } else {
      let size = options.pageSize === "us-letter" ? "Letter" : "A4";
      if (options.orientation === "landscape") {
        size += "L";
      }
      parts.push(`f:${size}`);
    }

    if (options.pageSize !== "natural") {
      parts.push("pos:c");
      switch (options.margin) {
        case "none":
          parts.push("sc:1.0 abs");
          break;
        case "large":
          parts.push("sc:0.7 rel");
          break;
        case "small":
        default:
          parts.push("sc:0.9 rel");
          break;
      }
    }

    return parts.join(", ");
  }
}
