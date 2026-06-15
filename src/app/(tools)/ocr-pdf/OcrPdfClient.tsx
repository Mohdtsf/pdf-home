"use client";
import { useToast } from "@/components/ui/Toast";

import { useState, useCallback } from "react";
import { FileText, Download, Loader2, Languages, Eye } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { ProcessingOverlay } from "@/components/ui/ProcessingOverlay";
import { PreDownloadAd } from "@/components/ads/PreDownloadAd";
import { ToolPageLayout } from "@/components/layout/ToolPageLayout";
import { PdfDropzone, type PdfFile } from "@/components/pdf/PdfDropzone";
import { uploadFile, pollJobStatus } from "@/lib/api";
import { formatFileSize } from "@/lib/validatePdf";

const OCR_LANGUAGES = [
  { code: "eng", name: "English" },
  { code: "spa", name: "Spanish (Español)" },
  { code: "fra", name: "French (Français)" },
  { code: "deu", name: "German (Deutsch)" },
  { code: "chi_sim", name: "Chinese Simplified (简体中文)" },
];

export function OcrPdfClient() {
  const { showToast } = useToast();
  const [file, setFile] = useState<PdfFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [language, setLanguage] = useState("eng");

  const handleFilesAdded = useCallback((files: PdfFile[]) => {
    setFile(files[0]);
    setDownloadUrl(null);
  }, []);

  const handleOcr = useCallback(async () => {
    if (!file) return;
    setIsProcessing(true);
    trackEvent({ name: "tool_used", tool: "ocr-pdf" });
    setDownloadUrl(null);

    try {
      const fileToUpload = new File([file.buffer], file.name, { type: 'application/pdf' });
      
      const { jobId } = await uploadFile('/ocr', fileToUpload, { language });
      
      const url = await pollJobStatus(jobId, (progress) => {
        console.log(`OCR progress: ${progress}%`);
      });

      setDownloadUrl(url);
    } catch (err) {
      console.error("OCR failed:", err);
      showToast("Failed to OCR PDF. Please try again or check your backend connection.", "error");
    } finally {
      setIsProcessing(false);
    }
  }, [file, language]);

  const handleAdComplete = useCallback(() => {
    trackEvent({ name: "download_completed", tool: "ocr-pdf" });
    setShowAd(false);
    if (!downloadUrl) return;
    
    const a = document.createElement("a");
    a.href = downloadUrl;
    const baseName = file ? file.name.substring(0, file.name.lastIndexOf('.')) || file.name : 'document';
    a.download = `${baseName}-ocr.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [downloadUrl, file]);

  const handleAdCancel = useCallback(() => {
    setShowAd(false);
  }, []);

  const handleReset = useCallback(() => {
    setFile(null);
    setDownloadUrl(null);
  }, []);

  return (
    <ToolPageLayout
      title="OCR PDF"
      description="Make scanned PDF files searchable and selectable with high-accuracy optical character recognition (OCR)."
      icon={Eye}
      iconGradient="icon-circle-edit"
    >
      {isProcessing && <ProcessingOverlay />}
      {showAd && <PreDownloadAd onComplete={handleAdComplete} onCancel={handleAdCancel} />}
      {!file ? (
        <PdfDropzone
          onFilesAdded={handleFilesAdded}
          multiple={false}
          label="Drop your scanned PDF file here"
          sublabel="Select a PDF to run OCR text recognition"
        />
      ) : (
        <div className="space-y-6">
          {/* File Info */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-glass)]">
            <FileText className="w-5 h-5 text-[var(--color-text-secondary)]" />
            <div>
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{formatFileSize(file.size)}</p>
            </div>
            <button onClick={handleReset} className="ml-auto text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] underline">
              Change file
            </button>
          </div>

          {/* OCR Options */}
          <div className="p-5 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-glass)] space-y-4">
            <h3 className="text-md font-semibold flex items-center gap-2">
              <Languages className="w-4 h-4 text-[#764ba2]" /> OCR Settings
            </h3>
            
            <div className="space-y-2">
              <label htmlFor="ocr-lang" className="text-sm text-[var(--color-text-secondary)] block">
                Primary Language of the Document:
              </label>
              <select
                id="ocr-lang"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                disabled={isProcessing || !!downloadUrl}
                className="w-full max-w-xs px-3 py-2.5 rounded-xl bg-[var(--color-bg-container)] border border-[var(--color-border-glass)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[#667eea]"
              >
                {OCR_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            {!downloadUrl ? (
              <button
                onClick={handleOcr}
                disabled={isProcessing}
                className="btn-aurora w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Performing OCR...</>
                ) : (
                  <><Eye className="w-5 h-5" /> Start OCR</>
                )}
              </button>
            ) : (
              <button
                onClick={() => setShowAd(true)}
                className="btn-aurora w-full sm:w-auto flex items-center justify-center gap-2 animate-bounce"
              >
                <Download className="w-5 h-5" /> Download Searchable PDF
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
