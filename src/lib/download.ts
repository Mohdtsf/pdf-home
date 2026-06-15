/**
 * Triggers a browser download for a Uint8Array.
 */
export function downloadFile(data: Uint8Array, filename: string, mimeType: string = "application/pdf"): void {
  const arrayBuffer = new ArrayBuffer(data.byteLength);
  new Uint8Array(arrayBuffer).set(data);
  const blob = new Blob([arrayBuffer], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Creates a ZIP Blob from multiple files.
 */
export async function createZipBlob(
  files: Array<{ filename: string; data: Uint8Array }>
): Promise<Blob> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();

  for (const file of files) {
    const buf = new ArrayBuffer(file.data.byteLength);
    new Uint8Array(buf).set(file.data);
    zip.file(file.filename, buf);
  }

  return await zip.generateAsync({ type: "blob" });
}

/**
 * Downloads multiple files as a ZIP archive.
 */
export async function downloadAsZip(
  files: Array<{ filename: string; data: Uint8Array }>,
  zipFilename: string = "pdfhome-output.zip"
): Promise<void> {
  const zipBlob = await createZipBlob(files);
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = zipFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
