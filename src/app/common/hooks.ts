import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { v7 as uuid } from "uuid";
import { moveItemInArray } from "./utils";

export interface FileUploaded {
  id: string;
  file: File;
  url: string;
  afterEditUrl?: string;
  name: string;
  type: string;
}

export type UseDragListFnReturnType = ReturnType<typeof useDragList>;

export function useDragList<T extends FileUploaded>(
  onSwap?: (
    event: React.DragEvent,
    fromId: FileUploaded["id"],
    toId: FileUploaded["id"],
  ) => void,
) {
  const [draggingItem, setDraggingItem] = useState<T | null>(null);

  function getDragProps(item: T) {
    return {
      id: item.id,
      draggable: true,
      onDragStart: () => {
        setDraggingItem(item);
      },
      onDragOver: (e: React.DragEvent) => e.preventDefault(),
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        if (!draggingItem || draggingItem.id === item.id) return;
        onSwap?.(e, draggingItem.id, item.id);
        setDraggingItem(null);
      },
    };
  }

  if (!onSwap) {
    return { getDragProps: null };
  }

  return { getDragProps };
}

type FileterValidFilesFn = (files: FileList | File[]) => File[];

/**
 * File management hook for uploaded files
 * @param fileterValidFiles
 * @returns
 */
export function useFileUpload(fileterValidFiles: FileterValidFilesFn) {
  const [files, setFiles] = useState<FileUploaded[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files) return;

    const validFiles = Array.from(fileterValidFiles(files));
    let newFiles: FileUploaded[] = [];
    try {
      // let bufferFiles = await Promise.all(
      //   validFiles.map((file) => file.arrayBuffer())
      // );

      // bufferFiles = bufferFiles.map((buff) => buff.slice(0))

      newFiles = validFiles.map((file) => ({
        id: uuid(),
        file,
        url: URL.createObjectURL(file),
        name: file.name,
        type: file.type,
      }));
    } catch {}

    if (newFiles.length === 0) {
      alert("No valid files selected. Please check file type requirements.");
      // Clear the input value even on error
      if (event.target) {
        event.target.value = "";
      }
      return;
    }

    setFiles((prev) => {
      const updated = [...prev, ...newFiles];
      return updated;
    });

    // Clear the input value to allow selecting the same files again
    if (event.target) {
      event.target.value = "";
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const resetInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setFiles([]);
  };

  return {
    files,
    setFiles,
    fileInputRef,
    handleFileUpload,
    triggerFileInput,
    resetInput,
  };
}

export function useFileListManager2<FileType extends FileUploaded>(
  files: FileType[],
  setFiles: Dispatch<SetStateAction<FileType[]>>,
) {
  const [selectedFileId, setSelectedFileId] = useState<string | null>(
    files[0]?.id || null,
  );

  const selectedFile = files.find((img) => img.id === selectedFileId);

  function addFiles(newFiles: FileType[]) {
    setFiles((prev) => {
      const updated = [...prev, ...newFiles];
      if (!selectedFileId && updated.length > 0) {
        setSelectedFileId(updated[0].id);
      }
      return updated;
    });
  }

  function updateFile(fileId: string, updatedFile: Partial<FileType>) {
    setFiles((files) => {
      const index = files.findIndex((file) => file.id === fileId);
      if (index === -1) return files;

      const nextFiles = [...files];
      nextFiles[index] = {
        ...nextFiles[index],
        ...updatedFile,
      };
      return nextFiles;
    });
  }

  function deleteFile(fileId: string) {
    setFiles((files) => {
      const index = files.findIndex((file) => file.id === fileId);
      if (index === -1) return files;

      const nextFiles = [...files];
      const file = nextFiles[index];

      try {
        if (file.url) URL.revokeObjectURL(file.url);
        if (file.afterEditUrl) URL.revokeObjectURL(file.afterEditUrl);
      } catch (error) {
        console.error(error);
      }

      nextFiles.splice(index, 1);
      return nextFiles;
    });
  }

  function moveUp(id: FileType["id"]) {
    setFiles((currentFiles) => {
      let nextFiles = currentFiles;

      const index = currentFiles.findIndex((file) => file.id == id);

      if (index > -1) {
        nextFiles = moveItemInArray(currentFiles, index, index - 1);
      }

      return nextFiles;
    });
  }

  function swap(fromId: FileType["id"], toId: FileType["id"]) {
    setFiles((currentFiles) => {
      const fromIndex = currentFiles.findIndex((file) => file.id == fromId);
      const tondex = currentFiles.findIndex((file) => file.id == toId);

      return moveItemInArray(currentFiles, fromIndex, tondex);
    });
  }

  function moveDown(id: FileType["id"]) {
    setFiles((currentFiles) => {
      let nextFiles = currentFiles;

      const index = currentFiles.findIndex((file) => file.id == id);

      if (index > -1) {
        nextFiles = moveItemInArray(currentFiles, index, index + 1);
      }

      return nextFiles;
    });
  }

  return {
    moveUp,
    moveDown,
    swap,
    selectedFile,
    selectedFileId,
    setSelectedFileId,
    addFiles,
    updateFile,
    deleteFile,
  };
}

export function useFilePageListManager<
  T extends { id: string; pages: Array<{ id: string }> },
>(files: T[], setFiles: Dispatch<SetStateAction<T[]>>) {
  const firstFile = files[0];

  const [selectedFileId, setSelectedFileId] = useState<string | null>(
    firstFile.id || null,
  );
}

export function fileListManagerUtils<
  T extends { id: string; pages: Array<{ id: string }> },
>(selectedFileId: T["id"], files: T[]) {
  const selectedFile = files.find((f) => f.id === selectedFileId) ?? null;

  // ========== File Operations ==========
  function updateFile(fileId: string, updated: Partial<T>) {
    return files.map((f) => (f.id === fileId ? { ...f, ...updated } : f));
  }

  function deleteFile(fileId: string) {
    return files.filter((f) => f.id !== fileId);
  }

  function moveFileUp(fileId: string) {
    const index = files.findIndex((f) => f.id === fileId);
    return index > 0 ? moveItemInArray(files, index, index - 1) : files;
  }

  function moveFileDown(fileId: string) {
    const index = files.findIndex((f) => f.id === fileId);
    return index !== -1 && index < files.length - 1
      ? moveItemInArray(files, index, index + 1)
      : files;
  }

  function swapFiles(fileIdA: string, fileIdB: string) {
    const indexA = files.findIndex((f) => f.id === fileIdA);
    const indexB = files.findIndex((f) => f.id === fileIdB);
    return moveItemInArray(files, indexA, indexB);
  }

  // ========== Page Operations ==========
  function updatePage(
    fileId: string,
    pageId: string,
    updated: Partial<PageFromPDFFile>,
  ) {
    return files.map((f) => {
      if (f.id !== fileId) return f;
      return {
        ...f,
        pages: f.pages.map((p) => (p.id === pageId ? { ...p, ...updated } : p)),
      };
    });
  }

  function deletePage(fileId: string, pageId: string) {
    return files.map((f) => {
      if (f.id !== fileId) return f;
      return { ...f, pages: f.pages.filter((p) => p.id !== pageId) };
    });
  }

  function movePageUp(fileId: string, pageId: string) {
    return files.map((f) => {
      if (f.id !== fileId) return f;

      const index = f.pages.findIndex((p) => p.id === pageId);
      const newPages =
        index > 0 ? moveItemInArray(f.pages, index, index - 1) : f.pages;

      return { ...f, pages: newPages };
    });
  }

  function movePageDown(fileId: string, pageId: string) {
    return files.map((f) => {
      if (f.id !== fileId) return f;

      const index = f.pages.findIndex((p) => p.id === pageId);
      const newPages =
        index !== -1 && index < f.pages.length - 1
          ? moveItemInArray(f.pages, index, index + 1)
          : f.pages;

      return { ...f, pages: newPages };
    });
  }

  function swapPages(fileId: string, pageIdA: string, pageIdB: string) {
    return files.map((f) => {
      if (f.id !== fileId) return f;

      const indexA = f.pages.findIndex((p) => p.id === pageIdA);
      const indexB = f.pages.findIndex((p) => p.id === pageIdB);

      const newPages =
        indexA !== -1 && indexB !== -1
          ? moveItemInArray(f.pages, indexA, indexB)
          : f.pages;

      return { ...f, pages: newPages };
    });
  }

  return {
    selectedFile,
    updateFile,
    deleteFile,
    moveFileUp,
    moveFileDown,
    swapFiles,

    // Page API
    updatePage,
    deletePage,
    movePageUp,
    movePageDown,
    swapPages,
  };
}

export const hasFileEdits = (file: FileUploaded) => Boolean(file.afterEditUrl);

interface BasePDFFilePage {
  fileId: string;
  pageIndex: number;
  totalPages: number;
}

export type PageFromPDFFile = BasePDFFilePage & FileUploaded;

export type PDFLibType = typeof import("pdf-lib");

/**
 * A hook that loads pdf-lib library asynchronously
 * @returns
 */
export function usePDFLib() {
  const moudleRef = useRef<PDFLibType | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!isLoaded || !moudleRef.current) {
      async function load() {
        try {
          const moudleLoading = await import("pdf-lib");
          moudleRef.current = moudleLoading;
          setIsLoaded(true);
        } catch (e) {
          console.error(e);
          alert("Error loading pdf-lib library");
        }
      }

      load();
    }

    return () => {};
  }, [isLoaded]);

  return { isLoaded, PDFLib: moudleRef.current };
}

export type FileWithPages = {
  file: FileUploaded;
  fileId: FileUploaded["id"];
  isProcessing: boolean;
  pages: PageFromPDFFile[];
};

export function usePDFFilePages2(
  isLoaded: boolean,
  pdfLib: PDFLibType | null,
  files: FileUploaded[],
) {
  const [isProcessing, setIsProcessing] = useState(false);

  const [pages, setPages] = useState<PageFromPDFFile[]>([]);

  useEffect(() => {
    let isCancelled = false;
    let timeout = null;

    if (isLoaded && pdfLib) {
      const loadPages = async () => {
        const allPages: PageFromPDFFile[] = [];

        for (const file of files) {
          const buff = await file.file.arrayBuffer();

          const pdf = await pdfLib.PDFDocument.load(buff.slice(), {
            ignoreEncryption: true,
          });

          const totalPages = pdf.getPageCount();

          for (let i = 0; i < totalPages; i++) {
            allPages.push({
              ...file,
              id: uuid(),
              fileId: file.id,
              pageIndex: i,
              totalPages,
            });
          }
        }

        if (!isCancelled) {
          setPages(allPages);
          setIsProcessing(false);
        }
      };

      timeout = setTimeout(() => loadPages());
    }

    return () => {
      isCancelled = true;

      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [files, isLoaded, pdfLib]);

  return {
    isProcessing,
    isLoaded,
    pages,
    setPages,
  };
}

/**
 * Loads file and pages
 * @param isLoaded
 * @param pdfLib
 * @param files
 * @param delay
 * @returns
 */
export function usePDFFilePages(
  isLoaded: boolean,
  pdfLib: PDFLibType | null,
  files: FileUploaded[],
  delay = 200,
) {
  const [fileStates, setFileStates] = useState<FileWithPages[]>([]);

  const resetFileStates = () => {
    setFileStates([]);
  };

  useEffect(() => {
    let isCancelled = false;
    let timeout: NodeJS.Timeout;

    if (isLoaded && pdfLib) {
      timeout = setTimeout(() => {
        const workPromise = files.map((file) => loadFilePages(file, pdfLib));

        Promise.all(workPromise)
          .then((fileUpdates) => {
            if (!isCancelled) setFileStates(fileUpdates);
          })
          .catch((e) => console.error(e));
      }, delay);
    }

    return () => {
      isCancelled = true;
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [files, isLoaded, pdfLib, delay]);

  return {
    fileStates,
    setFileStates,
    resetFileStates,
  };
}

async function loadFilePages(
  file: FileUploaded,
  pdfLib: PDFLibType,
): Promise<FileWithPages> {
  const buff = await file.file.arrayBuffer();

  const pdf = await pdfLib.PDFDocument.load(buff.slice(), {
    ignoreEncryption: true,
  });

  const totalPages = pdf.getPageCount();

  const pages: PageFromPDFFile[] = [];

  for (let i = 0; i < totalPages; i++) {
    pages.push({
      ...file,
      id: uuid(),
      fileId: file.id,
      pageIndex: i,
      totalPages,
    });
  }

  return {
    file,
    fileId: file.id,
    isProcessing: false,
    pages,
  };
}

export function useZip() {
  const zipRef = useRef<typeof import("jszip") | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!isLoaded && !zipRef.current) {
      import("jszip").then((module) => {
        zipRef.current = new module.default();
      });
    }
  }, [isLoaded]);

  const utils = {
    zip: (files: Array<{ name: string; buffer: ArrayBuffer | Uint8Array }>) => {
      if (zipRef.current) {
        for (let i = 0; i < files.length; i++) {
          zipRef.current.file(files[i].name, files[i].buffer);
        }
        return zipRef.current.generateAsync({ type: "blob" });
      }

      return Promise.reject(new Error("Js-Zip not downloaded yet"));
    },
  } as const;

  return [isLoaded, utils] as const;
}
