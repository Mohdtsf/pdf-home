import { PDFDocument } from "pdf-lib";

export type SplitMode = "ranges" | "individual" | "every-n";

export interface SplitByRangesOptions {
  mode: "ranges";
  ranges: Array<{ from: number; to: number }>; // 1-based page numbers
}

export interface SplitIndividualOptions {
  mode: "individual";
  pages: number[]; // 1-based page numbers to extract
}

export interface SplitEveryNOptions {
  mode: "every-n";
  n: number; // Split into chunks of N pages
}

export type SplitOptions = (
  | SplitByRangesOptions
  | SplitIndividualOptions
  | SplitEveryNOptions
) & { pageOrder?: number[] };

/**
 * Splits a PDF into multiple PDFs based on the provided options.
 * Returns an array of { filename, data } objects.
 */
export async function splitPdf(
  pdfBuffer: ArrayBuffer,
  options: SplitOptions
): Promise<Array<{ filename: string; data: Uint8Array }>> {
  let srcDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  
  if (options.pageOrder && options.pageOrder.length === srcDoc.getPageCount()) {
    const reorderedDoc = await PDFDocument.create();
    const copiedPages = await reorderedDoc.copyPages(srcDoc, options.pageOrder);
    copiedPages.forEach((page) => reorderedDoc.addPage(page));
    srcDoc = reorderedDoc;
  }

  const totalPages = srcDoc.getPageCount();
  const results: Array<{ filename: string; data: Uint8Array }> = [];

  switch (options.mode) {
    case "ranges": {
      for (let i = 0; i < options.ranges.length; i++) {
        const range = options.ranges[i];
        const from = Math.max(1, range.from) - 1; // Convert to 0-based
        const to = Math.min(totalPages, range.to); // Keep 1-based for slice end
        const pageIndices = Array.from({ length: to - from }, (_, j) => from + j);

        const newDoc = await PDFDocument.create();
        const pages = await newDoc.copyPages(srcDoc, pageIndices);
        pages.forEach((page) => newDoc.addPage(page));

        results.push({
          filename: `split_${range.from}-${range.to}.pdf`,
          data: await newDoc.save(),
        });
      }
      break;
    }

    case "individual": {
      for (const pageNum of options.pages) {
        if (pageNum < 1 || pageNum > totalPages) continue;

        const newDoc = await PDFDocument.create();
        const [page] = await newDoc.copyPages(srcDoc, [pageNum - 1]);
        newDoc.addPage(page);

        results.push({
          filename: `page_${pageNum}.pdf`,
          data: await newDoc.save(),
        });
      }
      break;
    }

    case "every-n": {
      const n = Math.max(1, options.n);
      const chunks = Math.ceil(totalPages / n);

      for (let i = 0; i < chunks; i++) {
        const start = i * n;
        const end = Math.min(start + n, totalPages);
        const pageIndices = Array.from({ length: end - start }, (_, j) => start + j);

        const newDoc = await PDFDocument.create();
        const pages = await newDoc.copyPages(srcDoc, pageIndices);
        pages.forEach((page) => newDoc.addPage(page));

        results.push({
          filename: `part_${i + 1}.pdf`,
          data: await newDoc.save(),
        });
      }
      break;
    }
  }

  return results;
}
