import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export interface TextAnnotation {
  text: string;
  pageIndex: number;     // 0-based
  x: number;             // Percentage from left (0-100)
  y: number;             // Percentage from top (0-100) — converted to PDF coords internally
  fontSize: number;
  fontFamily: "helvetica" | "courier" | "times";
  color: { r: number; g: number; b: number }; // 0-1 range
}

const FONT_MAP = {
  helvetica: StandardFonts.Helvetica,
  courier: StandardFonts.Courier,
  times: StandardFonts.TimesRoman,
};

/**
 * Adds text annotations to specific pages of a PDF.
 * Positions are specified as percentages for ease of use with interactive UI.
 */
export async function addTextToPdf(
  pdfBuffer: ArrayBuffer,
  annotations: TextAnnotation[]
): Promise<Uint8Array> {
  if (annotations.length === 0) {
    throw new Error("No text annotations provided.");
  }

  const doc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const pages = doc.getPages();

  // Embed all needed fonts
  const embeddedFonts = new Map<string, Awaited<ReturnType<typeof doc.embedFont>>>();
  for (const ann of annotations) {
    if (!embeddedFonts.has(ann.fontFamily)) {
      const font = await doc.embedFont(FONT_MAP[ann.fontFamily]);
      embeddedFonts.set(ann.fontFamily, font);
    }
  }

  for (const ann of annotations) {
    if (ann.pageIndex < 0 || ann.pageIndex >= pages.length) continue;

    const page = pages[ann.pageIndex];
    const { width, height } = page.getSize();
    const font = embeddedFonts.get(ann.fontFamily)!;

    // Convert percentage coordinates to PDF points
    // Note: PDF origin is bottom-left, UI origin is top-left
    const pdfX = (ann.x / 100) * width;
    const pdfY = height - (ann.y / 100) * height; // Flip Y axis

    page.drawText(ann.text, {
      x: pdfX,
      y: pdfY,
      size: ann.fontSize,
      font,
      color: rgb(ann.color.r, ann.color.g, ann.color.b),
    });
  }

  return doc.save();
}
