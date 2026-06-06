import { PDFDocument } from "pdf-lib";

export type FieldType = "signature" | "initials" | "company_stamp" | "text" | "date" | "name";

export interface SignatureFieldOptions {
  id: string;
  type: FieldType;
  imageData?: Uint8Array;   // PNG image data (if type is signature/initials/stamp)
  textContent?: string;     // Text content (if type is text/date/name)
  pageIndex: number;        // 0-based
  x: number;                // Percentage from left (0-100)
  y: number;                // Percentage from top (0-100)
  width: number;            // Width in PDF points (for images)
  height: number;           // Height in PDF points (for images)
  fontSize?: number;        // For text fields
}

import { rgb, StandardFonts } from "pdf-lib";

/**
 * Embeds multiple signature fields (images and text) onto a PDF.
 * Positions are specified as percentages for easy interactive placement.
 */
export async function addMultipleSignatures(
  pdfBuffer: ArrayBuffer,
  fields: SignatureFieldOptions[]
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const pages = doc.getPages();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  for (const field of fields) {
    if (field.pageIndex < 0 || field.pageIndex >= pages.length) {
      continue;
    }

    const page = pages[field.pageIndex];
    const { width: pageWidth, height: pageHeight } = page.getSize();

    // Convert percentage to PDF coordinates
    const pdfX = (field.x / 100) * pageWidth;
    const pdfY = pageHeight - (field.y / 100) * pageHeight - field.height;

    if (field.imageData && (field.type === "signature" || field.type === "initials" || field.type === "company_stamp")) {
      const sigImage = await doc.embedPng(field.imageData);
      page.drawImage(sigImage, {
        x: pdfX,
        y: pdfY,
        width: field.width,
        height: field.height,
      });
    } else if (field.textContent && (field.type === "text" || field.type === "date" || field.type === "name")) {
      const size = field.fontSize || 14;
      page.drawText(field.textContent, {
        x: pdfX,
        y: pdfY + (field.height / 2), // Adjust baseline roughly to middle of the box
        size: size,
        font: font,
        color: rgb(0, 0, 0),
      });
    }
  }

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
