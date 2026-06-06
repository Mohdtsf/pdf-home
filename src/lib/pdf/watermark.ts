import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";

export interface WatermarkOptions {
  type: "text" | "image";
  // Text Options
  text?: string;
  fontFamily?: "helvetica" | "times" | "courier";
  fontSize?: number;
  color?: { r: number; g: number; b: number };
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  // Image Options
  imageBuffer?: ArrayBuffer;
  imageType?: "png" | "jpeg";
  imageScale?: number;
  // Common Options
  position: "top-left" | "top-center" | "top-right" | 
            "middle-left" | "middle-center" | "middle-right" | 
            "bottom-left" | "bottom-center" | "bottom-right";
  isMosaic: boolean;
  opacity: number;          // 0.0 - 1.0
  rotation: number;         // Degrees
  layer: "over" | "under";
  fromPage?: number;        // 1-indexed
  toPage?: number;          // 1-indexed
}

/**
 * Adds a text or image watermark to selected pages of a PDF.
 */
export async function addWatermark(
  pdfBuffer: ArrayBuffer,
  options: WatermarkOptions
): Promise<Uint8Array> {
  const {
    type,
    text = "WATERMARK",
    fontFamily = "helvetica",
    fontSize = 60,
    color = { r: 0.5, g: 0.5, b: 0.5 },
    isBold = false,
    isItalic = false,
    isUnderline = false,
    imageBuffer,
    imageType = "png",
    imageScale = 0.5,
    position,
    isMosaic,
    opacity,
    rotation,
    layer,
    fromPage,
    toPage,
  } = options;

  const doc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const pages = doc.getPages();

  const from = Math.max(1, fromPage || 1);
  const to = Math.min(pages.length, toPage || pages.length);

  // 1. Prepare Font or Image
  let font: any;
  let embeddedImage: any;
  let elementWidth = 0;
  let elementHeight = 0;

  if (type === "text") {
    let fontName = StandardFonts.Helvetica;
    if (fontFamily === "times") {
      if (isBold && isItalic) fontName = StandardFonts.TimesRomanBoldItalic;
      else if (isBold) fontName = StandardFonts.TimesRomanBold;
      else if (isItalic) fontName = StandardFonts.TimesRomanItalic;
      else fontName = StandardFonts.TimesRoman;
    } else if (fontFamily === "courier") {
      if (isBold && isItalic) fontName = StandardFonts.CourierBoldOblique;
      else if (isBold) fontName = StandardFonts.CourierBold;
      else if (isItalic) fontName = StandardFonts.CourierOblique;
      else fontName = StandardFonts.Courier;
    } else {
      if (isBold && isItalic) fontName = StandardFonts.HelveticaBoldOblique;
      else if (isBold) fontName = StandardFonts.HelveticaBold;
      else if (isItalic) fontName = StandardFonts.HelveticaOblique;
      else fontName = StandardFonts.Helvetica;
    }
    font = await doc.embedFont(fontName);
    elementWidth = font.widthOfTextAtSize(text, fontSize);
    elementHeight = fontSize;
  } else if (type === "image" && imageBuffer) {
    if (imageType === "png") {
      embeddedImage = await doc.embedPng(imageBuffer);
    } else {
      embeddedImage = await doc.embedJpg(imageBuffer);
    }
    elementWidth = embeddedImage.width * imageScale;
    elementHeight = embeddedImage.height * imageScale;
  } else {
    throw new Error("No image buffer provided for image watermark.");
  }

  const margin = 40; // margin from edges

  // 2. Iterate pages
  for (let i = from - 1; i < to; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();

    // Helper to draw single watermark element
    const drawElement = (x: number, y: number) => {
      if (type === "text") {
        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(color.r, color.g, color.b),
          opacity,
          rotate: degrees(rotation),
        });

        if (isUnderline) {
          const underlineY = y - 2;
          const underlineHeight = Math.max(1, fontSize / 15);
          page.drawRectangle({
            x,
            y: underlineY,
            width: elementWidth,
            height: underlineHeight,
            color: rgb(color.r, color.g, color.b),
            opacity,
            rotate: degrees(rotation),
          });
        }
      } else if (type === "image" && embeddedImage) {
        page.drawImage(embeddedImage, {
          x,
          y,
          width: elementWidth,
          height: elementHeight,
          opacity,
          rotate: degrees(rotation),
        });
      }
    };

    // 3. Draw Watermark(s)
    if (isMosaic) {
      // Tile 3x4 across the page
      const cols = 3;
      const rows = 4;
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const x = (width / (cols + 1)) * (c + 1) - elementWidth / 2;
          const y = (height / (rows + 1)) * (r + 1) - elementHeight / 2;
          drawElement(x, y);
        }
      }
    } else {
      // Calculate coordinates for selected position
      let x = (width - elementWidth) / 2;
      let y = (height - elementHeight) / 2;

      // X alignment
      if (position.includes("left")) {
        x = margin;
      } else if (position.includes("right")) {
        x = width - elementWidth - margin;
      }

      // Y alignment
      if (position.startsWith("top")) {
        y = height - elementHeight - margin;
      } else if (position.startsWith("bottom")) {
        y = margin;
      }

      drawElement(x, y);
    }
  }

  return doc.save();
}
