import { PDFDocument } from "pdf-lib";

export interface UnlockResult {
  data: Uint8Array;
  wasEncrypted: boolean;
  pageCount: number;
}

/**
 * Attempts to unlock a PDF by re-loading it with `ignoreEncryption: true`.
 * 
 * This works for PDFs with owner-password-only restrictions (print/copy/edit locks).
 * User-password-locked PDFs that prevent opening will still require the correct password.
 */
export async function unlockPdf(
  pdfBuffer: ArrayBuffer,
  password?: string
): Promise<UnlockResult> {
  try {
    // Try loading with ignoreEncryption flag — strips owner password restrictions
    const doc = await PDFDocument.load(pdfBuffer, {
      ignoreEncryption: true,
      password: password,
    } as any);

    const pageCount = doc.getPageCount();

    // Re-save without encryption
    const data = await doc.save({
      useObjectStreams: false,
      addDefaultPage: false,
    });

    return {
      data,
      wasEncrypted: true,
      pageCount,
    };
  } catch (error) {
    // If loading fails, it might need a user password
    if (password) {
      throw new Error(
        "Failed to unlock PDF with the provided password. Please check and try again."
      );
    }
    throw new Error(
      "This PDF requires a password to open. Please enter the password and try again."
    );
  }
}
