import { PDFDocument, degrees } from "pdf-lib";

export type RotationAngle = 0 | 90 | 180 | 270;

export interface PageRotation {
  pageIndex: number; // 0-based
  angle: RotationAngle;
}

/**
 * Rotates specific pages in a PDF by given angles.
 *
 * @param pdfBuffer - The original PDF as ArrayBuffer
 * @param rotations - Array of { pageIndex, angle } to rotate specific pages
 * @returns The modified PDF as Uint8Array
 */
export async function rotatePdfPages(
  pdfBuffer: ArrayBuffer,
  rotations: PageRotation[],
  pageOrder?: number[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });

  if (pageOrder && pageOrder.length === pdfDoc.getPageCount()) {
    const newDoc = await PDFDocument.create();
    const copiedPages = await newDoc.copyPages(pdfDoc, pageOrder);
    
    for (let i = 0; i < pageOrder.length; i++) {
      const originalIndex = pageOrder[i];
      const page = copiedPages[i];
      
      const rotation = rotations.find(r => r.pageIndex === originalIndex);
      if (rotation && rotation.angle !== 0) {
        const currentRotation = page.getRotation().angle;
        page.setRotation(degrees((currentRotation + rotation.angle) % 360));
      }
      newDoc.addPage(page);
    }
    return newDoc.save();
  }

  for (const { pageIndex, angle } of rotations) {
    if (pageIndex < 0 || pageIndex >= pdfDoc.getPageCount()) continue;
    if (angle === 0) continue;

    const page = pdfDoc.getPage(pageIndex);
    const currentRotation = page.getRotation().angle;
    page.setRotation(degrees((currentRotation + angle) % 360));
  }

  return pdfDoc.save();
}

/**
 * Rotates ALL pages in a PDF by the same angle.
 */
export async function rotateAllPages(
  pdfBuffer: ArrayBuffer,
  angle: RotationAngle
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const currentRotation = page.getRotation().angle;
    page.setRotation(degrees((currentRotation + angle) % 360));
  }

  return pdfDoc.save();
}
