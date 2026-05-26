import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export type NumberPosition =
  | "top-left" | "top-center" | "top-right"
  | "bottom-left" | "bottom-center" | "bottom-right";

export type NumberFormat = "plain" | "page-of" | "dash" | "fraction";

export interface PageNumberOptions {
  position: NumberPosition;
  format: NumberFormat;
  fontSize: number;
  startNumber: number;
  margin: number;         // Margin from page edge in points
  color: { r: number; g: number; b: number };
}

function formatPageNumber(
  pageNum: number,
  totalPages: number,
  format: NumberFormat
): string {
  switch (format) {
    case "plain":
      return `${pageNum}`;
    case "page-of":
      return `Page ${pageNum} of ${totalPages}`;
    case "dash":
      return `- ${pageNum} -`;
    case "fraction":
      return `${pageNum}/${totalPages}`;
    default:
      return `${pageNum}`;
  }
}

/**
 * Adds page numbers to every page of a PDF.
 */
export async function addPageNumbers(
  pdfBuffer: ArrayBuffer,
  options: PageNumberOptions
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  const totalPages = pages.length;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();
    const pageNum = i + options.startNumber;
    const text = formatPageNumber(pageNum, totalPages + options.startNumber - 1, options.format);
    const textWidth = font.widthOfTextAtSize(text, options.fontSize);

    // Calculate x position
    let x: number;
    if (options.position.includes("left")) {
      x = options.margin;
    } else if (options.position.includes("right")) {
      x = width - textWidth - options.margin;
    } else {
      x = (width - textWidth) / 2;
    }

    // Calculate y position
    let y: number;
    if (options.position.startsWith("top")) {
      y = height - options.margin - options.fontSize;
    } else {
      y = options.margin;
    }

    page.drawText(text, {
      x,
      y,
      size: options.fontSize,
      font,
      color: rgb(options.color.r, options.color.g, options.color.b),
    });
  }

  return doc.save();
}
