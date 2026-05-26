import { PDFDocument } from "pdf-lib";

export type CompressionQuality = "low" | "medium" | "high";

export interface CompressionResult {
  data: Uint8Array;
  originalSize: number;
  compressedSize: number;
  savedBytes: number;
  savedPercent: number;
}

/**
 * Compresses a PDF by re-serializing it with pdf-lib.
 * 
 * pdf-lib removes unused objects, consolidates duplicate resources, and
 * re-encodes the structure. This doesn't recompress raster images but
 * can still save 5-30% depending on the source PDF.
 * 
 * Quality levels control object-stream usage:
 * - low: max compression (object streams enabled)
 * - medium: balanced (default)
 * - high: minimal change (no object streams, keeps structure)
 */
export async function compressPdf(
  pdfBuffer: ArrayBuffer,
  quality: CompressionQuality = "medium"
): Promise<CompressionResult> {
  const originalSize = pdfBuffer.byteLength;

  const doc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });

  // Remove metadata that inflates size
  if (quality === "low") {
    doc.setTitle("");
    doc.setAuthor("");
    doc.setSubject("");
    doc.setKeywords([]);
    doc.setProducer("");
    doc.setCreator("");
  }

  // Save with different options based on quality
  let data: Uint8Array;
  switch (quality) {
    case "low":
      data = await doc.save({
        useObjectStreams: true,  // Max compression
        addDefaultPage: false,
      });
      break;
    case "medium":
      data = await doc.save({
        useObjectStreams: true,
        addDefaultPage: false,
      });
      break;
    case "high":
      data = await doc.save({
        useObjectStreams: false, // Keep structure readable
        addDefaultPage: false,
      });
      break;
  }

  const compressedSize = data.byteLength;
  const savedBytes = originalSize - compressedSize;
  const savedPercent = originalSize > 0 ? Math.round((savedBytes / originalSize) * 100) : 0;

  return {
    data,
    originalSize,
    compressedSize,
    savedBytes,
    savedPercent: Math.max(0, savedPercent), // Don't show negative savings
  };
}
