import { PDFDocument } from "pdf-lib";

export interface SignatureOptions {
  imageData: Uint8Array;    // PNG image data of the signature
  pageIndex: number;        // 0-based
  x: number;                // Percentage from left (0-100)
  y: number;                // Percentage from top (0-100)
  width: number;            // Width in PDF points
  height: number;           // Height in PDF points
}

/**
 * Embeds a signature image (PNG) onto a specific page of a PDF.
 * Position is specified as percentages for easy interactive placement.
 */
export async function addSignature(
  pdfBuffer: ArrayBuffer,
  signature: SignatureOptions
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const pages = doc.getPages();

  if (signature.pageIndex < 0 || signature.pageIndex >= pages.length) {
    throw new Error(`Invalid page index: ${signature.pageIndex}`);
  }

  const page = pages[signature.pageIndex];
  const { width: pageWidth, height: pageHeight } = page.getSize();

  // Embed the signature PNG
  const sigImage = await doc.embedPng(signature.imageData);

  // Convert percentage to PDF coordinates
  const pdfX = (signature.x / 100) * pageWidth;
  const pdfY = pageHeight - (signature.y / 100) * pageHeight - signature.height;

  page.drawImage(sigImage, {
    x: pdfX,
    y: pdfY,
    width: signature.width,
    height: signature.height,
  });

  return doc.save();
}

/**
 * Converts a canvas data URL to a Uint8Array of PNG data.
 */
export function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
