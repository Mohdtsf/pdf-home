"use client";

import { useState, useCallback } from "react";
import { Image as ImageIcon, Download, Loader2, FileText } from "lucide-react";
import { ToolPageLayout } from "@/components/layout/ToolPageLayout";
import { PdfDropzone, type PdfFile } from "@/components/pdf/PdfDropzone";
import { pdfToImages, type ConvertedImage } from "@/lib/pdf/pdfToImages";
import { downloadFile, downloadAsZip } from "@/lib/download";
import { PDFDocument } from "pdf-lib";

export function PdfToJpgClient() {
  const [file, setFile] = useState<PdfFile | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [quality, setQuality] = useState(85);
  const [scale, setScale] = useState(2);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [results, setResults] = useState<ConvertedImage[] | null>(null);

  const handleFilesAdded = useCallback(async (files: PdfFile[]) => {
    const pdfFile = files[0];
    setFile(pdfFile);
    setResults(null);
    const doc = await PDFDocument.load(pdfFile.buffer, { ignoreEncryption: true });
    setPageCount(doc.getPageCount());
  }, []);

  const handleConvert = useCallback(async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress("Converting pages...");

    try {
      const images = await pdfToImages(file.buffer, {
        quality: quality / 100,
        scale,
        format: "jpeg",
      });
      setResults(images);
      setProgress("");
    } catch (err) {
      console.error("Conversion failed:", err);
      alert("Failed to convert PDF to JPG. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [file, quality, scale]);

  const handleDownloadAll = useCallback(async () => {
    if (!results) return;
    if (results.length === 1) {
      downloadFile(results[0].data, results[0].filename, "image/jpeg");
    } else {
      await downloadAsZip(
        results.map((r) => ({ filename: r.filename, data: r.data })),
        "pdf-to-jpg.zip"
      );
    }
  }, [results]);

  const handleReset = useCallback(() => {
    setFile(null);
    setPageCount(0);
    setResults(null);
  }, []);

  return (
    <ToolPageLayout
      title="PDF to JPG"
      description="Convert each page of your PDF into a high-quality JPG image."
      icon={ImageIcon}
      iconGradient="icon-circle-convert"
    >
      {!file ? (
        <PdfDropzone
          onFilesAdded={handleFilesAdded}
          multiple={false}
          label="Drop your PDF file here"
          sublabel="Select a PDF to convert to JPG"
        />
      ) : (
        <div className="space-y-6">
          {/* File Info */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-bg-surface)]">
            <FileText className="w-5 h-5 text-[var(--color-text-secondary)]" />
            <div>
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{pageCount} pages</p>
            </div>
            <button onClick={handleReset} className="ml-auto text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] underline">
              Change file
            </button>
          </div>

          {/* Quality Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-2">
                Image Quality: {quality}%
              </label>
              <input
                type="range"
                min={30}
                max={100}
                value={quality}
                onChange={(e) => { setQuality(Number(e.target.value)); setResults(null); }}
                className="w-full accent-[#6366f1]"
              />
              <div className="flex justify-between text-xs text-[var(--color-text-muted)] mt-1">
                <span>Smaller file</span>
                <span>Better quality</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">
                Resolution: {scale === 1 ? "72 DPI" : scale === 2 ? "144 DPI" : "216 DPI"}
              </label>
              <div className="flex gap-2">
                {[1, 2, 3].map((s) => (
                  <button
                    key={s}
                    onClick={() => { setScale(s); setResults(null); }}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      scale === s
                        ? "bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white"
                        : "bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-hover)]"
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview Results */}
          {results && (
            <div>
              <p className="text-sm font-medium mb-3">Converted {results.length} images</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {results.slice(0, 20).map((img) => {
                  const blobUrl = URL.createObjectURL(
                    new Blob([img.data as any], { type: "image/jpeg" })
                  );
                  return (
                    <div key={img.pageNumber} className="rounded-lg overflow-hidden border border-[var(--color-border-glass)] bg-[var(--color-bg-surface)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={blobUrl} alt={`Page ${img.pageNumber}`} className="w-full aspect-[3/4] object-cover" />
                      <p className="text-xs text-center py-1 text-[var(--color-text-muted)]">Page {img.pageNumber}</p>
                    </div>
                  );
                })}
              </div>
              {results.length > 20 && (
                <p className="text-xs text-[var(--color-text-muted)] mt-2">
                  Showing first 20 of {results.length} pages
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            {!results ? (
              <button
                onClick={handleConvert}
                disabled={isProcessing}
                className="btn-aurora w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> {progress || "Converting..."}</>
                ) : (
                  <><ImageIcon className="w-5 h-5" /> Convert to JPG</>
                )}
              </button>
            ) : (
              <button
                onClick={handleDownloadAll}
                className="btn-aurora w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                {results.length === 1 ? "Download JPG" : `Download ${results.length} JPGs (ZIP)`}
              </button>
            )}
            <button onClick={handleReset} className="btn-secondary w-full sm:w-auto">
              Start Over
            </button>
          </div>
        </div>
      )}
    </ToolPageLayout>
  );
}
