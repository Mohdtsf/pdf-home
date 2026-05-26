import { PDFDocument } from "pdf-lib";

/**
 * Merges multiple PDF files into a single PDF.
 * Runs entirely client-side using pdf-lib.
 *
 * @param pdfBuffers - Array of ArrayBuffer, each representing a PDF file
 * @returns ArrayBuffer of the merged PDF
 */
export async function mergePdfs(pdfBuffers: ArrayBuffer[]): Promise<Uint8Array> {
  if (pdfBuffers.length === 0) {
    throw new Error("No PDF files provided for merging.");
  }

  if (pdfBuffers.length === 1) {
    // If only one file, return it directly (still valid to "merge" one file)
    const doc = await PDFDocument.load(pdfBuffers[0]);
    return doc.save();
  }

  const mergedDoc = await PDFDocument.create();

  for (const buffer of pdfBuffers) {
    const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const pages = await mergedDoc.copyPages(pdfDoc, pdfDoc.getPageIndices());
    pages.forEach((page) => mergedDoc.addPage(page));
  }

  return mergedDoc.save();
}
