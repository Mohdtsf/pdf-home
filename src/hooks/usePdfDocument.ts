import { useState, useEffect } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';

export function usePdfDocument(fileBuffer: ArrayBuffer | null) {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!fileBuffer) {
      setDoc(null);
      setPageCount(0);
      setError(null);
      return;
    }

    const loadDoc = async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url,
        ).toString();
        
        // Create a copy of the buffer to prevent pdf.js from transferring and detaching
        // the original ArrayBuffer which is shared across the app.
        const bufferCopy = fileBuffer.slice(0);
        const loadingTask = pdfjs.getDocument(new Uint8Array(bufferCopy));
        const document = await loadingTask.promise;
        setDoc(document);
        setPageCount(document.numPages);
      } catch (err) {
        console.error("Failed to load PDF document:", err);
        setError(err instanceof Error ? err : new Error("Failed to load PDF"));
      }
    };

    loadDoc();
  }, [fileBuffer]);

  return { doc, pageCount, error };
}
