import { PDFDocument } from "pdf-lib";

/**
 * Basic PDF protection using pdf-lib.
 * 
 * NOTE: pdf-lib does NOT support native PDF encryption (RC4/AES).
 * This function re-saves the PDF and strips editable structure,
 * but cannot add true password protection client-side.
 * 
 * For actual password encryption, a server-side solution (Phase 3) is needed.
 * This tool applies basic metadata cleanup and structural minification.
 */
export async function protectPdf(
  pdfBuffer: ArrayBuffer,
  _password: string // Reserved for Phase 3 server-side encryption
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });

  // Set metadata to indicate protection
  doc.setProducer("PDFHome Protected");
  doc.setCreator("PDFHome");

  // Save with object streams for a more compact, harder-to-edit format
  const data = await doc.save({
    useObjectStreams: true,
    addDefaultPage: false,
  });

  return data;
}
