"use client";

import { useState, useCallback } from "react";
import { PenTool, Download, Loader2, FileText, Type, Paintbrush } from "lucide-react";
import { ToolPageLayout } from "@/components/layout/ToolPageLayout";
import { PdfDropzone, type PdfFile } from "@/components/pdf/PdfDropzone";
import { addSignature, dataUrlToUint8Array } from "@/lib/pdf/sign";
import { SignatureCanvas } from "@/components/pdf/SignatureCanvas";
import { SignatureTyped } from "@/components/pdf/SignatureTyped";
import { downloadFile } from "@/lib/download";
import { PDFDocument } from "pdf-lib";

export function SignPdfClient() {
  const [file, setFile] = useState<PdfFile | null>(null);
  const [pageCount, setPageCount] = useState(0);
  
  // Signature States
  const [signatureType, setSignatureType] = useState<"draw" | "type">("draw");
  const [signatureData, setSignatureData] = useState<string | null>(null);
  
  // Placement States
  const [pageIndex, setPageIndex] = useState(0);
  const [posX, setPosX] = useState(10);
  const [posY, setPosY] = useState(80);
  const [sigWidth, setSigWidth] = useState(150);
  const [sigHeight, setSigHeight] = useState(60);
  
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleSignatureChange = useCallback((dataUrl: string | null) => {
    setSignatureData(dataUrl);
  }, []);

  const handleApplySignature = useCallback(async () => {
    if (!file || !signatureData) return;
    setIsProcessing(true);

    try {
      const imageData = dataUrlToUint8Array(signatureData);
      const result = await addSignature(file.buffer, {
        imageData,
        pageIndex,
        x: posX,
        y: posY,
        width: sigWidth,
        height: sigHeight,
      });

      downloadFile(result, "signed.pdf");
    } catch (err) {
      console.error("Signing failed:", err);
      alert("Failed to apply signature. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [file, signatureData, pageIndex, posX, posY, sigWidth, sigHeight]);

  const handleReset = useCallback(() => {
    setFile(null);
    setPageCount(0);
    setSignatureData(null);
  }, []);

  return (
    <ToolPageLayout
      title="Sign PDF"
      description="Draw or type your signature to securely sign PDF documents entirely in your browser."
      icon={PenTool}
      iconGradient="icon-circle-edit"
    >
      {!file ? (
        <PdfDropzone
          onFilesAdded={handleFilesAdded}
          multiple={false}
          label="Drop your PDF file here"
          sublabel="Select a PDF to sign"
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
            <button
              onClick={handleReset}
              className="ml-auto text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] underline"
            >
              Change file
            </button>
          </div>

          {/* Signature Mode & Creator */}
          <div className="space-y-4">
            <div className="flex gap-2 p-1 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-glass)] max-w-xs">
              <button
                type="button"
                onClick={() => { setSignatureType("draw"); setSignatureData(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                  signatureType === "draw" ? "bg-[#6366f1] text-white" : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                <Paintbrush className="w-3.5 h-3.5" /> Draw
              </button>
              <button
                type="button"
                onClick={() => { setSignatureType("type"); setSignatureData(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                  signatureType === "type" ? "bg-[#6366f1] text-white" : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                <Type className="w-3.5 h-3.5" /> Type
              </button>
            </div>

            <div className="p-5 rounded-xl border border-[var(--color-border-glass)] bg-[var(--color-bg-surface)]">
              {signatureType === "draw" ? (
                <SignatureCanvas onSignatureChange={handleSignatureChange} />
              ) : (
                <SignatureTyped onSave={handleSignatureChange} />
              )}
            </div>
          </div>

          {signatureData && (
            <>
              {/* Placement Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-xl border border-[var(--color-border-glass)] bg-[var(--color-bg-surface)]">
                <div>
                  <label className="text-sm font-medium block mb-2">Page Selection: Page {pageIndex + 1}</label>
                  <input
                    type="range"
                    min={0}
                    max={pageCount - 1}
                    value={pageIndex}
                    onChange={(e) => setPageIndex(Number(e.target.value))}
                    className="w-full accent-[#6366f1]"
                  />
                  <div className="flex justify-between text-xs text-[var(--color-text-muted)] mt-1">
                    <span>Page 1</span>
                    <span>Page {pageCount}</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-2">Signature Size: {sigWidth}px × {sigHeight}px</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs text-[var(--color-text-muted)]">Width</span>
                      <input
                        type="range"
                        min={50}
                        max={400}
                        value={sigWidth}
                        onChange={(e) => {
                          const w = Number(e.target.value);
                          setSigWidth(w);
                          // keep aspect ratio rough estimation
                          setSigHeight(Math.round(w * 0.4));
                        }}
                        className="w-full accent-[#6366f1] mt-1"
                      />
                    </div>
                    <div>
                      <span className="text-xs text-[var(--color-text-muted)]">Height</span>
                      <input
                        type="range"
                        min={20}
                        max={200}
                        value={sigHeight}
                        onChange={(e) => setSigHeight(Number(e.target.value))}
                        className="w-full accent-[#6366f1] mt-1"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-2">Horizontal Alignment: {posX}%</label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={posX}
                    onChange={(e) => setPosX(Number(e.target.value))}
                    className="w-full accent-[#6366f1]"
                  />
                  <div className="flex justify-between text-xs text-[var(--color-text-muted)] mt-1">
                    <span>Left</span>
                    <span>Right</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-2">Vertical Alignment: {posY}%</label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={posY}
                    onChange={(e) => setPosY(Number(e.target.value))}
                    className="w-full accent-[#6366f1]"
                  />
                  <div className="flex justify-between text-xs text-[var(--color-text-muted)] mt-1">
                    <span>Top</span>
                    <span>Bottom</span>
                  </div>
                </div>
              </div>

              {/* Real-time Preview Overlay Card */}
              <div className="p-4 rounded-xl border border-[#10b981]/20 bg-gradient-to-br from-[#10b981]/5 to-[#059669]/5">
                <p className="text-sm font-medium text-[#10b981] mb-2">Signature Position Preview</p>
                <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                  Your signature will be placed on **Page {pageIndex + 1}**, approximately **{posX}%** from the left margin, and **{posY}%** from the top margin of the page.
                </p>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={handleApplySignature}
              disabled={isProcessing || !signatureData}
              className="btn-aurora w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Applying Signature...</>
              ) : (
                <><PenTool className="w-5 h-5" /> Sign & Download PDF</>
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
