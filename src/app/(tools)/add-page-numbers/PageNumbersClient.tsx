"use client";
import { useToast } from "@/components/ui/Toast";

import { useState, useCallback } from "react";
import { Hash, Download, Loader2, FileText, LayoutGrid, Check } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { ProcessingOverlay } from "@/components/ui/ProcessingOverlay";
import { PreDownloadAd } from "@/components/ads/PreDownloadAd";
import { ToolPageLayout } from "@/components/layout/ToolPageLayout";
import { PdfDropzone, type PdfFile } from "@/components/pdf/PdfDropzone";
import { addPageNumbers, type NumberPosition, type NumberFormat } from "@/lib/pdf/pageNumbers";
import { downloadFile } from "@/lib/download";
import { PDFDocument } from "pdf-lib";

const POSITIONS: { value: NumberPosition; label: string }[] = [
  { value: "top-left", label: "Top Left" },
  { value: "top-center", label: "Top Center" },
  { value: "top-right", label: "Top Right" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "bottom-center", label: "Bottom Center" },
  { value: "bottom-right", label: "Bottom Right" },
];

const FORMATS: { value: NumberFormat; label: string; preview: string }[] = [
  { value: "plain", label: "Simple Number", preview: "1" },
  { value: "page-of", label: "Page X of Y", preview: "Page 1 of 5" },
  { value: "dash", label: "Hyphenated", preview: "- 1 -" },
  { value: "fraction", label: "Fractional", preview: "1/5" },
];

const PRESET_COLORS = [
  { name: "Black", rgb: { r: 0, g: 0, b: 0 }, hex: "#000000" },
  { name: "Slate", rgb: { r: 0.27, g: 0.35, b: 0.47 }, hex: "#475569" },
  { name: "Royal Blue", rgb: { r: 0.15, g: 0.39, b: 0.92 }, hex: "#2563eb" },
  { name: "Red", rgb: { r: 0.86, g: 0.15, b: 0.15 }, hex: "#dc2626" },
];

export function PageNumbersClient() {
  const { showToast } = useToast();
  const [file, setFile] = useState<PdfFile | null>(null);
  const [pageCount, setPageCount] = useState(0);

  // Configuration States
  const [position, setPosition] = useState<NumberPosition>("bottom-center");
  const [format, setFormat] = useState<NumberFormat>("page-of");
  const [fontSize, setFontSize] = useState(10);
  const [margin, setMargin] = useState(30);
  const [startNumber, setStartNumber] = useState(1);
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [resultData, setResultData] = useState<any>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>('');

  const handleFilesAdded = useCallback(async (files: PdfFile[]) => {
    const pdfFile = files[0];
    setFile(pdfFile);
    try {
      const doc = await PDFDocument.load(pdfFile.buffer, { ignoreEncryption: true });
      setPageCount(doc.getPageCount());
    } catch (err) {
      console.error("Failed to load PDF metadata:", err);
    }
  }, []);

  const handleApplyPageNumbers = useCallback(async () => {
    if (!file) return;
    setIsProcessing(true);
    trackEvent({ name: "tool_used", tool: "add-page-numbers" });

    try {
      const result = await addPageNumbers(file.buffer, {
        position,
        format,
        fontSize,
        startNumber,
        margin,
        color: selectedColor.rgb,
      });

      setResultData(result);
      setDownloadFilename("numbered.pdf");
      setShowAd(true);
    } catch (err) {
      console.error("Numbering failed:", err);
      showToast("Failed to apply page numbers. Please try again.", "error");
    } finally {
      setIsProcessing(false);
    }
  }, [file, position, format, fontSize, startNumber, margin, selectedColor]);

  const handleReset = useCallback(() => {
    setFile(null);
    setPageCount(0);
  }, []);

  const handleAdComplete = useCallback(() => {
    trackEvent({ name: "download_completed", tool: "add-page-numbers" });
    setShowAd(false);
    if (resultData && downloadFilename) {
      setResultData(resultData);
      setDownloadFilename(downloadFilename);
      setShowAd(true);
    }
  }, [resultData, downloadFilename]);

  const handleAdCancel = useCallback(() => {
    setShowAd(false);
  }, []);

  return (
    <ToolPageLayout
      title="Add Page Numbers"
      description="Add customizable page numbering formats to your PDF pages easily and 100% locally."
      icon={Hash}
      iconGradient="icon-circle-sort"
    >
      {isProcessing && <ProcessingOverlay />}
      {showAd && <PreDownloadAd onComplete={handleAdComplete} onCancel={handleAdCancel} />}
      {!file ? (
        <PdfDropzone
          onFilesAdded={handleFilesAdded}
          multiple={false}
          label="Drop your PDF here"
          sublabel="Select a PDF to number pages"
        />
      ) : (
        <div className="space-y-6">
          {/* File Metadata */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-bg-surface)]">
            <FileText className="w-5 h-5 text-[var(--color-text-secondary)]" />
            <div>
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{pageCount} pages</p>
            </div>
            <button
              onClick={handleReset}
              className="ml-auto text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] underline"
            >
              Change file
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Position Picker Grid */}
            <div className="space-y-4">
              <label className="text-sm font-medium flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-[#6366f1]" /> Page Placement Position
              </label>
              <div className="grid grid-cols-3 gap-2 p-4 rounded-xl border border-[var(--color-border-glass)] bg-[var(--color-bg-surface)] min-h-[160px] relative">
                {POSITIONS.map((pos) => {
                  const isSelected = position === pos.value;
                  return (
                    <button
                      key={pos.value}
                      type="button"
                      onClick={() => setPosition(pos.value)}
                      className={`p-3 rounded-lg border text-center transition-all text-xs font-semibold flex flex-col justify-center items-center ${
                        isSelected
                          ? "bg-[#6366f1] border-[#6366f1] text-white shadow-lg shadow-[#6366f1]/20"
                          : "bg-[var(--color-bg-surface-hover)] border-[var(--color-border-glass)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-glass-hover)]"
                      }`}
                    >
                      {pos.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Formatting Picker */}
            <div className="space-y-4">
              <label className="text-sm font-medium">Number Style Format</label>
              <div className="grid grid-cols-2 gap-2">
                {FORMATS.map((fmt) => {
                  const isSelected = format === fmt.value;
                  return (
                    <button
                      key={fmt.value}
                      type="button"
                      onClick={() => setFormat(fmt.value)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "bg-gradient-to-br from-[#06b6d4]/10 to-[#0ea5e9]/10 border-[#06b6d4]/40"
                          : "bg-[var(--color-bg-surface)] border-[var(--color-border-glass)] hover:border-[var(--color-border-glass-hover)]"
                      }`}
                    >
                      <p className="text-xs text-[var(--color-text-muted)]">{fmt.label}</p>
                      <p className="text-lg font-bold mt-1 text-[var(--color-text-primary)]">{fmt.preview}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sizing, margin, and offsets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 p-5 rounded-xl border border-[var(--color-border-glass)] bg-[var(--color-bg-surface)]">
            <div>
              <label className="text-sm font-medium block mb-2">Font Size: {fontSize}pt</label>
              <input
                type="range"
                min={6}
                max={24}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full accent-[#6366f1]"
              />
              <div className="flex justify-between text-xs text-[var(--color-text-muted)] mt-1">
                <span>Small</span>
                <span>Large</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Page Margins: {margin}px</label>
              <input
                type="range"
                min={10}
                max={80}
                value={margin}
                onChange={(e) => setMargin(Number(e.target.value))}
                className="w-full accent-[#6366f1]"
              />
              <div className="flex justify-between text-xs text-[var(--color-text-muted)] mt-1">
                <span>Narrow</span>
                <span>Wide</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Start Page Number</label>
              <input
                type="number"
                min={1}
                value={startNumber}
                onChange={(e) => setStartNumber(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-glass)] text-[var(--color-text-primary)] text-sm focus:border-[#6366f1] focus:outline-none transition-colors"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-sm font-medium block mb-2">Select Number Color</label>
              <div className="flex gap-2">
                {PRESET_COLORS.map((c) => {
                  const isSelected = selectedColor.hex === c.hex;
                  return (
                    <button
                      key={c.name}
                      onClick={() => setSelectedColor(c)}
                      className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center`}
                      style={{ backgroundColor: c.hex, borderColor: isSelected ? "#6366f1" : "transparent" }}
                      title={c.name}
                    >
                      {isSelected && (
                        <Check className={`w-4 h-4 ${c.hex === "#000000" ? "text-white" : "text-black"}`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={handleApplyPageNumbers}
              disabled={isProcessing}
              className="btn-aurora w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Numbering Pages...</>
              ) : (
                <><Download className="w-5 h-5" /> Add Page Numbers</>
              )}
            </button>
            <button onClick={handleReset} className="btn-secondary w-full sm:w-auto">
              Start Over
            </button>
          </div>
        </div>
      )}
    </ToolPageLayout>
  );
}
