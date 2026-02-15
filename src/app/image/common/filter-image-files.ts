export function filterImageFiles(files: FileList | File[]): File[] {
  return Array.from(files).filter((file) => {
    if (file.type.startsWith("image/")) return true;
    const lower = file.name.toLowerCase();
    return lower.endsWith(".heic") || lower.endsWith(".heif");
  });
}
