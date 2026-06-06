"use client";

import { useState, useCallback } from "react";
import { Type, Download, Loader2, FileText } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { ProcessingOverlay } from "@/components/ui/ProcessingOverlay";
import { PreDownloadAd } from "@/components/ads/PreDownloadAd";
import { ToolPageLayout } from "@/components/layout/ToolPageLayout";
import { PdfDropzone, type PdfFile } from "@/components/pdf/PdfDropzone";
import { addTextToPdf, type TextAnnotation } from "@/lib/pdf/addText";
import { downloadFile } from "@/lib/download";
import { PDFDocument } from "pdf-lib";

const PRESET_COLORS = [
  { name: "Black", r: 0, g: 0, b: 0 },
  { name: "Red", r: 0.9, g: 0.1, b: 0.1 },
  { name: "Blue", r: 0.1, g: 0.1, b: 0.9 },
  { name: "Green", r: 0.1, g: 0.6, b: 0.1 },
  { name: "White", r: 1, g: 1, b: 1 },
  { name: "Gray", r: 0.5, g: 0.5, b: 0.5 },
];

export function AddTextClient() {
  const [file, setFile] = useState<PdfFile | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [text, setText] = useState("Your text here");
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState<"helvetica" | "courier" | "times">("helvetica");
  const [colorIdx, setColorIdx] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [posX, setPosX] = useState(10);
  const [posY, setPosY] = useState(10);
  const [applyAll, setApplyAll] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [resultData, setResultData] = useState<any>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>('');

  const handleFilesAdded = useCallback(async (files: PdfFile[]) => {
    const pdfFile = files[0];
    setFile(pdfFile);
    const doc = await PDFDocument.load(pdfFile.buffer, { ignoreEncryption: true });
    setPageCount(doc.getPageCount());
  }, []);

  const handleApply = useCallback(async () => {
    if (!file || !text.trim()) return;
    setIsProcessing(true);
    trackEvent({ name: "tool_used", tool: "add-text-to-pdf" });

    try {
      const color = PRESET_COLORS[colorIdx];
      const annotations: TextAnnotation[] = [];

      if (applyAll) {
        for (let i = 0; i < pageCount; i++) {
          annotations.push({ text, pageIndex: i, x: posX, y: posY, fontSize, fontFamily, color });
        }
      } else {
        annotations.push({ text, pageIndex, x: posX, y: posY, fontSize, fontFamily, color });
      }

      const result = await addTextToPdf(file.buffer, annotations);
      setResultData(result);
      setDownloadFilename("text-added.pdf");
      setShowAd(true);
    } catch (err) {
      console.error("Add text failed:", err);
      alert("Failed to add text. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [file, text, fontSize, fontFamily, colorIdx, pageIndex, posX, posY, applyAll, pageCount]);

  const handleReset = useCallback(() => {
    setFile(null);
    setPageCount(0);
  }, []);

  const handleAdComplete = useCallback(() => {
    trackEvent({ name: "download_completed", tool: "add-text-to-pdf" });
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
      title="Add Text"
      description="Insert custom text anywhere on your PDF pages."
      icon={Type}
      iconGradient="icon-circle-edit"
    >
      {isProcessing && <ProcessingOverlay />}
      {showAd && <PreDownloadAd onComplete={handleAdComplete} onCancel={handleAdCancel} />}
      {!file ? (
        <PdfDropzone onFilesAdded={handleFilesAdded} multiple={false} label="Drop your PDF file here" sublabel="Select a PDF to add text" />
      ) : (
        <div className="space-y-5">
          {/* File Info */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-bg-surface)]">
            <FileText className="w-5 h-5 text-[var(--color-text-secondary)]" />
            <div>
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{pageCount} pages</p>
            </div>
            <button onClick={handleReset} className="ml-auto text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] underline">Change file</button>
          </div>

          {/* Text Input */}
          <div>
            <label className="text-sm font-medium block mb-2">Text Content</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-glass)] text-[var(--color-text-primary)] text-sm focus:border-[#6366f1] focus:outline-none transition-colors resize-none"
              placeholder="Enter your text here..."
            />
          </div>

          {/* Font & Color Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium block mb-2">Font</label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value as typeof fontFamily)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border-glass)] text-[var(--color-text-primary)] text-sm focus:border-[#6366f1] focus:outline-none"
              >
                <option value="helvetica">Helvetica</option>
                <option value="courier">Courier</option>
                <option value="times">Times Roman</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Size: {fontSize}px</label>
              <input type="range" min={8} max={72} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full accent-[#6366f1]" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Color</label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map((c, i) => (
                  <button
                    key={c.name}
                    onClick={() => setColorIdx(i)}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${colorIdx === i ? "border-[#6366f1] scale-110" : "border-[var(--color-border-glass)]"}`}
                    style={{ background: `rgb(${c.r * 255}, ${c.g * 255}, ${c.b * 255})` }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Position Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium block mb-2">Page: {pageIndex + 1}</label>
              <input type="range" min={0} max={pageCount - 1} value={pageIndex} onChange={(e) => setPageIndex(Number(e.target.value))} className="w-full accent-[#6366f1]" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">X Position: {posX}%</label>
              <input type="range" min={0} max={100} value={posX} onChange={(e) => setPosX(Number(e.target.value))} className="w-full accent-[#6366f1]" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Y Position: {posY}%</label>
              <input type="range" min={0} max={100} value={posY} onChange={(e) => setPosY(Number(e.target.value))} className="w-full accent-[#6366f1]" />
            </div>
          </div>

          {/* Apply All Toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={applyAll} onChange={(e) => setApplyAll(e.target.checked)} className="w-4 h-4 accent-[#6366f1]" />
            <span className="text-sm">Apply to all pages</span>
          </label>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button onClick={handleApply} disabled={isProcessing || !text.trim()} className="btn-aurora w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> Adding Text...</> : <><Download className="w-5 h-5" /> Add Text & Download</>}
            </button>
            <button onClick={handleReset} className="btn-secondary w-full sm:w-auto">Start Over</button>
          </div>
        </div>
      )}
    </ToolPageLayout>
  );
}
