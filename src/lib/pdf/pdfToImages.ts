/**
 * Converts PDF pages to JPG images using PDF.js canvas rendering.
 * Runs entirely client-side.
 */
export interface PdfToImageOptions {
  quality: number;        // 0.0 - 1.0 (JPG quality)
  scale: number;          // Render scale (1 = 72dpi, 2 = 144dpi, 3 = 216dpi)
  pages?: number[];       // 1-based page numbers (undefined = all pages)
  format?: "jpeg" | "png";
}

export interface ConvertedImage {
  filename: string;
  data: Uint8Array;
  pageNumber: number;
  width: number;
  height: number;
}

export async function pdfToImages(
  pdfBuffer: ArrayBuffer,
  options: PdfToImageOptions
): Promise<ConvertedImage[]> {
  const { quality = 0.85, scale = 2, format = "jpeg" } = options;

  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const bufferCopy = pdfBuffer.slice(0);
  const doc = await pdfjs.getDocument(new Uint8Array(bufferCopy)).promise;

  const totalPages = doc.numPages;
  const pagesToConvert = options.pages
    ? options.pages.filter((p) => p >= 1 && p <= totalPages)
    : Array.from({ length: totalPages }, (_, i) => i + 1);

  const results: ConvertedImage[] = [];

  for (const pageNum of pagesToConvert) {
    const page = await doc.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    // Create an offscreen canvas
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get canvas context");

    // Render page to canvas
    await page.render({
      canvasContext: ctx as any,
      viewport: viewport,
    } as any).promise;

    // Export canvas as image blob
    const mimeType = format === "png" ? "image/png" : "image/jpeg";
    const extension = format === "png" ? "png" : "jpg";

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Canvas to blob failed"))),
        mimeType,
        quality
      );
    });

    const arrayBuffer = await blob.arrayBuffer();

    results.push({
      filename: `page_${pageNum}.${extension}`,
      data: new Uint8Array(arrayBuffer),
      pageNumber: pageNum,
      width: viewport.width,
      height: viewport.height,
    });

    // Cleanup
    canvas.width = 0;
    canvas.height = 0;
  }

  doc.destroy();
  return results;
}
