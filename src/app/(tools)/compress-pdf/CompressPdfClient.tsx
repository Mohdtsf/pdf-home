"use client";

import { useState, useCallback } from "react";
import { Minimize2, Download, Loader2, FileText, TrendingDown } from "lucide-react";
import { ToolPageLayout } from "@/components/layout/ToolPageLayout";
import { PdfDropzone, type PdfFile } from "@/components/pdf/PdfDropzone";
import { compressPdf, type CompressionQuality, type CompressionResult } from "@/lib/pdf/compress";
import { downloadFile } from "@/lib/download";
import { formatFileSize } from "@/lib/validatePdf";

export function CompressPdfClient() {
  const [file, setFile] = useState<PdfFile | null>(null);
  const [quality, setQuality] = useState<CompressionQuality>("medium");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<CompressionResult | null>(null);

  const handleFilesAdded = useCallback((files: PdfFile[]) => {
    setFile(files[0]);
    setResult(null);
  }, []);

  const handleCompress = useCallback(async () => {
    if (!file) return;
    setIsProcessing(true);
    setResult(null);

    try {
      const res = await compressPdf(file.buffer, quality);
      setResult(res);
    } catch (err) {
      console.error("Compression failed:", err);
      alert("Failed to compress PDF. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [file, quality]);

  const handleDownload = useCallback(() => {
    if (!result) return;
    downloadFile(result.data, "compressed.pdf");
  }, [result]);

  const handleReset = useCallback(() => {
    setFile(null);
    setResult(null);
  }, []);

  const qualities: { key: CompressionQuality; label: string; desc: string }[] = [
    { key: "low", label: "Maximum", desc: "Smallest file size" },
    { key: "medium", label: "Balanced", desc: "Good balance" },
    { key: "high", label: "Minimal", desc: "Best quality" },
  ];

  return (
    <ToolPageLayout
      title="Compress PDF"
      description="Reduce your PDF file size while maintaining quality."
      icon={Minimize2}
      iconGradient="icon-circle-optimize"
    >
      {!file ? (
        <PdfDropzone
          onFilesAdded={handleFilesAdded}
          multiple={false}
          label="Drop your PDF file here"
          sublabel="Select a PDF to compress"
        />
      ) : (
        <div className="space-y-6">
          {/* File Info */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-bg-surface)]">
            <FileText className="w-5 h-5 text-[var(--color-text-secondary)]" />
            <div>
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{formatFileSize(file.size)}</p>
            </div>
            <button onClick={handleReset} className="ml-auto text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] underline">
              Change file
            </button>
          </div>

          {/* Quality Selector */}
          <div>
            <p className="text-sm font-medium mb-3">Compression Level</p>
            <div className="grid grid-cols-3 gap-3">
              {qualities.map((q) => (
                <button
                  key={q.key}
                  onClick={() => { setQuality(q.key); setResult(null); }}
                  className={`p-4 rounded-xl text-center transition-all border ${
                    quality === q.key
                      ? "bg-gradient-to-br from-[#06b6d4]/10 to-[#0ea5e9]/10 border-[#06b6d4]/40"
                      : "bg-[var(--color-bg-surface)] border-[var(--color-border-glass)] hover:border-[var(--color-border-glass-hover)]"
                  }`}
                >
                  <p className="text-sm font-semibold">{q.label}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">{q.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          {result && (
            <div className="p-5 rounded-xl bg-gradient-to-br from-[#10b981]/5 to-[#059669]/5 border border-[#10b981]/20">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-5 h-5 text-[#10b981]" />
                <p className="text-sm font-semibold text-[#10b981]">
                  {result.savedPercent > 0
                    ? `Saved ${result.savedPercent}%`
                    : "File already optimized"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[var(--color-text-muted)]">Before</p>
                  <p className="font-semibold">{formatFileSize(result.originalSize)}</p>
                </div>
                <div>
                  <p className="text-[var(--color-text-muted)]">After</p>
                  <p className="font-semibold">{formatFileSize(result.compressedSize)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            {!result ? (
              <button
                onClick={handleCompress}
                disabled={isProcessing}
                className="btn-aurora w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Compressing...</>
                ) : (
                  <><Minimize2 className="w-5 h-5" /> Compress PDF</>
                )}
              </button>
            ) : (
              <button
                onClick={handleDownload}
                className="btn-aurora w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" /> Download Compressed PDF
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
