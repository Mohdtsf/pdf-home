import { PDFDocument } from "pdf-lib";

export type PageSize = "a4" | "letter" | "fit";
export type Orientation = "portrait" | "landscape" | "auto";

interface ImageFile {
  data: ArrayBuffer;
  name: string;
  type: string; // MIME type
}

// Standard page dimensions in PDF points (72 dpi)
const PAGE_SIZES = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
};

/**
 * Converts multiple images into a single PDF document.
 * Each image becomes a full page.
 */
export async function imagesToPdf(
  images: ImageFile[],
  pageSize: PageSize = "a4",
  orientation: Orientation = "auto"
): Promise<Uint8Array> {
  if (images.length === 0) {
    throw new Error("No images provided.");
  }

  const doc = await PDFDocument.create();

  for (const image of images) {
    // Embed the image based on MIME type
    let embedded;
    const data = new Uint8Array(image.data);

    if (image.type === "image/png") {
      embedded = await doc.embedPng(data);
    } else if (image.type === "image/jpeg" || image.type === "image/jpg") {
      embedded = await doc.embedJpg(data);
    } else {
      // For WEBP and other formats, convert to PNG via canvas
      const pngData = await convertToCanvasPng(image.data, image.type);
      embedded = await doc.embedPng(pngData);
    }

    const imgWidth = embedded.width;
    const imgHeight = embedded.height;
    const imgAspect = imgWidth / imgHeight;

    // Determine page dimensions
    let pageWidth: number;
    let pageHeight: number;

    if (pageSize === "fit") {
      // Page matches image dimensions
      pageWidth = imgWidth;
      pageHeight = imgHeight;
    } else {
      const dims = PAGE_SIZES[pageSize];

      // Determine orientation
      let isLandscape: boolean;
      if (orientation === "auto") {
        isLandscape = imgWidth > imgHeight;
      } else {
        isLandscape = orientation === "landscape";
      }

      pageWidth = isLandscape ? dims.height : dims.width;
      pageHeight = isLandscape ? dims.width : dims.height;
    }

    const page = doc.addPage([pageWidth, pageHeight]);

    // Scale image to fit within page while maintaining aspect ratio
    const pageAspect = pageWidth / pageHeight;
    let drawWidth: number;
    let drawHeight: number;

    if (imgAspect > pageAspect) {
      // Image is wider than page — constrain by width
      drawWidth = pageWidth;
      drawHeight = pageWidth / imgAspect;
    } else {
      // Image is taller than page — constrain by height
      drawHeight = pageHeight;
      drawWidth = pageHeight * imgAspect;
    }

    // Center the image on the page
    const x = (pageWidth - drawWidth) / 2;
    const y = (pageHeight - drawHeight) / 2;

    page.drawImage(embedded, {
      x,
      y,
      width: drawWidth,
      height: drawHeight,
    });
  }

  return doc.save();
}

/**
 * Converts any image format to PNG using a canvas element.
 * Needed for WEBP and other formats that pdf-lib doesn't support natively.
 */
async function convertToCanvasPng(data: ArrayBuffer, mimeType: string): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (pngBlob) => {
          if (!pngBlob) {
            reject(new Error("Canvas to blob conversion failed"));
            return;
          }
          pngBlob.arrayBuffer().then((buf) => {
            resolve(new Uint8Array(buf));
            URL.revokeObjectURL(url);
            canvas.width = 0;
            canvas.height = 0;
          });
        },
        "image/png"
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load image: ${mimeType}`));
    };

    img.src = url;
  });
}
