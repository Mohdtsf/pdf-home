const PDF_MAGIC = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // %PDF

export const MAX_FILE_SIZE_MB = 100;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export class PdfValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PdfValidationError";
  }
}

/**
 * Validates a file is a valid PDF within size limits.
 * Never trust user filenames — generate UUIDs instead.
 */
export function validatePdfFile(buffer: ArrayBuffer): void {
  // 1. Size check
  if (buffer.byteLength > MAX_FILE_SIZE_BYTES) {
    throw new PdfValidationError(
      `File exceeds ${MAX_FILE_SIZE_MB}MB limit. Please use a smaller file.`
    );
  }

  // 2. Empty file check
  if (buffer.byteLength < 5) {
    throw new PdfValidationError("File is empty or too small to be a valid PDF.");
  }

  // 3. Magic bytes check (%PDF-)
  const header = new Uint8Array(buffer.slice(0, 4));
  const isValidMagic = header.every((byte, i) => byte === PDF_MAGIC[i]);

  if (!isValidMagic) {
    throw new PdfValidationError(
      "Invalid file format. Please upload a PDF file."
    );
  }
}

/**
 * Validates a File object (browser File API).
 * Returns the ArrayBuffer for further processing.
 */
export async function validatePdfFileObject(file: File): Promise<ArrayBuffer> {
  // Check MIME type as a first pass (can be spoofed, so we also check magic bytes)
  if (file.type && file.type !== "application/pdf") {
    throw new PdfValidationError(
      "Invalid file type. Please upload a PDF file."
    );
  }

  const buffer = await file.arrayBuffer();
  validatePdfFile(buffer);
  return buffer;
}

/**
 * Generates a safe filename (UUID-based) to prevent XSS via filenames.
 */
export function generateSafeFilename(extension: string = "pdf"): string {
  return `${crypto.randomUUID()}.${extension}`;
}

/**
 * Gets a human-readable file size string.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}
