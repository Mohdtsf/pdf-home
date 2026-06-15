import { PDFDocument, StandardFonts, rgb, RGB, degrees } from "pdf-lib";

export type EditorObjectType = 
  | "text" 
  | "edit-text" 
  | "shape" 
  | "image" 
  | "signature" 
  | "mark";

export interface EditorObject {
  id: string;
  type: EditorObjectType;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  width: number; // px in workspace view
  height: number; // px in workspace view
  pageIndex: number;
  
  // Text & Edit-Text specific properties
  textContent?: string;
  fontFamily?: "helvetica" | "courier" | "times";
  fontSize?: number;
  color?: string; // hex string e.g., "#000000"
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: "left" | "center" | "right";
  isOriginalText?: boolean;
  originalTextRect?: { x: number; y: number; w: number; h: number }; // In original PDF points coordinates
  uiWhiteout?: { xPct: number; yPct: number; wPct: number; hPct: number }; // For UI rendering
  
  // Shape specific properties
  shapeType?: "rectangle" | "circle" | "line" | "arrow";
  fillColor?: string; // hex or 'transparent'
  strokeColor?: string; // hex
  strokeWidth?: number; // px
  
  // Image / Signature / Stamp properties
  dataUrl?: string; // PNG base64 data url
  
  // Mark specific properties
  markType?: "check" | "cross";
}

// Convert hex string to RGB (0-1 range)
function hexToRgb(hex: string): RGB {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  return rgb(isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b);
}

// Convert dataUrl to Uint8Array
function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function compileEditedPdf(
  pdfBuffer: ArrayBuffer,
  objects: EditorObject[],
  drawings: Record<number, string>, // pageIndex -> base64 PNG dataUrl
  pageRotations: Record<number, number> = {},
  deletedPages: number[] = []
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const pages = doc.getPages();

  // Helper to load and embed appropriate fonts dynamically
  const fontCache = new Map<string, any>();
  const getEmbeddedFont = async (family: "helvetica" | "courier" | "times" = "helvetica", bold = false, italic = false) => {
    const key = `${family}-${bold ? "bold" : "regular"}-${italic ? "italic" : "regular"}`;
    if (fontCache.has(key)) return fontCache.get(key);

    let fontType: StandardFonts;
    if (family === "courier") {
      if (bold && italic) fontType = StandardFonts.CourierBoldOblique;
      else if (bold) fontType = StandardFonts.CourierBold;
      else if (italic) fontType = StandardFonts.CourierOblique;
      else fontType = StandardFonts.Courier;
    } else if (family === "times") {
      if (bold && italic) fontType = StandardFonts.TimesRomanBoldItalic;
      else if (bold) fontType = StandardFonts.TimesRomanBold;
      else if (italic) fontType = StandardFonts.TimesRomanItalic;
      else fontType = StandardFonts.TimesRoman;
    } else {
      // helvetica
      if (bold && italic) fontType = StandardFonts.HelveticaBoldOblique;
      else if (bold) fontType = StandardFonts.HelveticaBold;
      else if (italic) fontType = StandardFonts.HelveticaOblique;
      else fontType = StandardFonts.Helvetica;
    }

    const font = await doc.embedFont(fontType);
    fontCache.set(key, font);
    return font;
  };

  // Apply rotations to all pages first
  for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
    const page = pages[pageIdx];
    const rotationAngle = pageRotations[pageIdx] || 0;
    if (rotationAngle !== 0) {
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees((currentRotation + rotationAngle) % 360));
    }
  }

  // Draw objects page by page
  for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
    const page = pages[pageIdx];
    const { width: pageWidth, height: pageHeight } = page.getSize();

    // 1. Process whiteouts for modified original text
    const pageObjects = objects.filter((obj) => obj.pageIndex === pageIdx);
    const modifiedOriginals = pageObjects.filter((obj) => obj.type === "edit-text" && obj.isOriginalText && obj.originalTextRect);

    for (const obj of modifiedOriginals) {
      if (obj.originalTextRect) {
        // Whiteout the original bounding box in PDF points coordinates directly
        // Make it slightly larger to avoid outline artifacts
        page.drawRectangle({
          x: obj.originalTextRect.x - 1,
          y: obj.originalTextRect.y - 1,
          width: obj.originalTextRect.w + 2,
          height: obj.originalTextRect.h + 2,
          color: rgb(1, 1, 1), // white fill
        });
      }
    }

    // 2. Draw annotations and new/edited objects
    for (const obj of pageObjects) {
      // Convert UI percentage coordinates to PDF points coordinates
      const pdfX = (obj.x / 100) * pageWidth;
      // Flip Y axis: UI origin is top-left, PDF origin is bottom-left
      const pdfHeight = (obj.height / 700) * pageHeight; // standard preview container height reference is ~700px
      const pdfWidth = (obj.width / 500) * pageWidth; // standard preview container width reference is ~500px
      
      // Calculate y position relative to PDF coordinate system
      const pdfY = pageHeight - (obj.y / 100) * pageHeight - pdfHeight;

      if (obj.type === "text" || obj.type === "edit-text") {
        if (!obj.textContent) continue;
        const font = await getEmbeddedFont(obj.fontFamily, obj.bold, obj.italic);
        const size = obj.fontSize || 14;
        const textColor = obj.color ? hexToRgb(obj.color) : rgb(0, 0, 0);

        // Adjust text baseline: drawText expects baseline, so we position it near bottom-left of the box
        page.drawText(obj.textContent, {
          x: pdfX,
          y: pdfY + (pdfHeight * 0.15), // Offset slightly from bottom for text baseline
          size: size,
          font: font,
          color: textColor,
        });
      } 
      else if (obj.type === "shape" && obj.shapeType) {
        const strokeColor = obj.strokeColor ? hexToRgb(obj.strokeColor) : rgb(0, 0, 0);
        const strokeWidth = obj.strokeWidth || 2;
        const hasFill = obj.fillColor && obj.fillColor !== "transparent";
        const fillColor = hasFill ? hexToRgb(obj.fillColor!) : undefined;

        if (obj.shapeType === "rectangle") {
          page.drawRectangle({
            x: pdfX,
            y: pdfY,
            width: pdfWidth,
            height: pdfHeight,
            borderWidth: strokeWidth,
            borderColor: strokeColor,
            color: fillColor,
          });
        } 
        else if (obj.shapeType === "circle") {
          page.drawEllipse({
            x: pdfX + pdfWidth / 2,
            y: pdfY + pdfHeight / 2,
            xScale: pdfWidth / 2,
            yScale: pdfHeight / 2,
            borderWidth: strokeWidth,
            borderColor: strokeColor,
            color: fillColor,
          });
        } 
        else if (obj.shapeType === "line") {
          page.drawLine({
            start: { x: pdfX, y: pdfY + pdfHeight },
            end: { x: pdfX + pdfWidth, y: pdfY },
            thickness: strokeWidth,
            color: strokeColor,
          });
        } 
        else if (obj.shapeType === "arrow") {
          const startX = pdfX;
          const startY = pdfY + pdfHeight;
          const endX = pdfX + pdfWidth;
          const endY = pdfY;

          // Draw shaft
          page.drawLine({
            start: { x: startX, y: startY },
            end: { x: endX, y: endY },
            thickness: strokeWidth,
            color: strokeColor,
          });

          // Draw head
          const angle = Math.atan2(endY - startY, endX - startX);
          const headLength = 12 + strokeWidth;
          const headAngle = Math.PI / 6; // 30 deg

          const arrow1X = endX - headLength * Math.cos(angle - headAngle);
          const arrow1Y = endY - headLength * Math.sin(angle - headAngle);
          const arrow2X = endX - headLength * Math.cos(angle + headAngle);
          const arrow2Y = endY - headLength * Math.sin(angle + headAngle);

          page.drawLine({
            start: { x: endX, y: endY },
            end: { x: arrow1X, y: arrow1Y },
            thickness: strokeWidth,
            color: strokeColor,
          });
          page.drawLine({
            start: { x: endX, y: endY },
            end: { x: arrow2X, y: arrow2Y },
            thickness: strokeWidth,
            color: strokeColor,
          });
        }
      } 
      else if ((obj.type === "image" || obj.type === "signature") && obj.dataUrl) {
        try {
          const imageBytes = dataUrlToUint8Array(obj.dataUrl);
          const image = obj.dataUrl.includes("image/jpeg") 
            ? await doc.embedJpg(imageBytes) 
            : await doc.embedPng(imageBytes);

          page.drawImage(image, {
            x: pdfX,
            y: pdfY,
            width: pdfWidth,
            height: pdfHeight,
          });
        } catch (err) {
          console.error("Error drawing image onto PDF page:", err);
        }
      } 
      else if (obj.type === "mark" && obj.markType) {
        const color = obj.color ? hexToRgb(obj.color) : rgb(0.9, 0.1, 0.1);
        const strokeWidth = 3;

        if (obj.markType === "check") {
          // Drawing lines relative to checkmark bounding box
          page.drawLine({
            start: { x: pdfX + pdfWidth * 0.15, y: pdfY + pdfHeight * 0.4 },
            end: { x: pdfX + pdfWidth * 0.45, y: pdfY + pdfHeight * 0.1 },
            thickness: strokeWidth,
            color,
          });
          page.drawLine({
            start: { x: pdfX + pdfWidth * 0.45, y: pdfY + pdfHeight * 0.1 },
            end: { x: pdfX + pdfWidth * 0.85, y: pdfY + pdfHeight * 0.85 },
            thickness: strokeWidth,
            color,
          });
        } else if (obj.markType === "cross") {
          // Drawing two crossing lines
          page.drawLine({
            start: { x: pdfX + pdfWidth * 0.2, y: pdfY + pdfHeight * 0.8 },
            end: { x: pdfX + pdfWidth * 0.8, y: pdfY + pdfHeight * 0.2 },
            thickness: strokeWidth,
            color,
          });
          page.drawLine({
            start: { x: pdfX + pdfWidth * 0.2, y: pdfY + pdfHeight * 0.2 },
            end: { x: pdfX + pdfWidth * 0.8, y: pdfY + pdfHeight * 0.8 },
            thickness: strokeWidth,
            color,
          });
        }
      }
    }

    // 3. Process drawings (freehand pencil/highlighter canvas overlay)
    if (drawings[pageIdx]) {
      try {
        const drawingBytes = dataUrlToUint8Array(drawings[pageIdx]);
        const drawingImage = await doc.embedPng(drawingBytes);
        page.drawImage(drawingImage, {
          x: 0,
          y: 0,
          width: pageWidth,
          height: pageHeight,
        });
      } catch (err) {
        console.error(`Error drawing overlay canvas on page ${pageIdx}:`, err);
      }
    }
  }

  // Delete pages at the end from back to front
  if (deletedPages.length > 0) {
    const sortedDeleted = [...deletedPages].sort((a, b) => b - a);
    for (const idx of sortedDeleted) {
      if (idx >= 0 && idx < doc.getPageCount()) {
        doc.removePage(idx);
      }
    }
  }

  return doc.save();
}
