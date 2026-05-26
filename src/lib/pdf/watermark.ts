import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";

export interface WatermarkOptions {
  text: string;
  fontSize: number;       // e.g., 60
  opacity: number;        // 0.0 - 1.0
  rotation: number;       // Degrees, e.g., -45 for diagonal
  color: { r: number; g: number; b: number }; // 0-1 range
}

/**
 * Adds a text watermark to every page of a PDF.
 * The watermark is centered on each page with configurable opacity and rotation.
 */
export async function addWatermark(
  pdfBuffer: ArrayBuffer,
  options: WatermarkOptions
): Promise<Uint8Array> {
  const { text, fontSize, opacity, rotation, color } = options;

  if (!text.trim()) {
    throw new Error("Watermark text cannot be empty.");
  }

  const doc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();

    // Calculate text width for centering
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const textHeight = fontSize;

    // Center position
    const x = (width - textWidth) / 2;
    const y = (height - textHeight) / 2;

    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(color.r, color.g, color.b),
      opacity,
      rotate: degrees(rotation),
    });
  }

  return doc.save();
}
