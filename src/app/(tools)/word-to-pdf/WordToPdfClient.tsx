"use client";
import { useToast } from "@/components/ui/Toast";

import { useState, useCallback } from "react";
import { FileText, Download, Loader2, RefreshCw } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { ProcessingOverlay } from "@/components/ui/ProcessingOverlay";
import { PreDownloadAd } from "@/components/ads/PreDownloadAd";
import { ToolPageLayout } from "@/components/layout/ToolPageLayout";
import { PdfDropzone, type PdfFile } from "@/components/pdf/PdfDropzone";
import { uploadFile, pollJobStatus } from "@/lib/api";
import { formatFileSize } from "@/lib/validatePdf";

export function WordToPdfClient() {
  const { showToast } = useToast();
  const [file, setFile] = useState<PdfFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleFilesAdded = useCallback((files: PdfFile[]) => {
    setFile(files[0]);
    setDownloadUrl(null);
  }, []);

  const validateWordFile = useCallback(async (f: File) => {
    if (f.size > 100 * 1024 * 1024) {
      throw new Error("File size exceeds 100MB limit.");
    }
    return await f.arrayBuffer();
  }, []);

  const handleConvert = useCallback(async () => {
    if (!file) return;
    setIsProcessing(true);
    trackEvent({ name: "tool_used", tool: "word-to-pdf" });
    setDownloadUrl(null);

    try {
      // Use original file name and format
      const fileToUpload = new File([file.buffer], file.name, {
        type: file.file.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      
      const { jobId } = await uploadFile('/convert', fileToUpload, { targetFormat: 'pdf' });
      
      const url = await pollJobStatus(jobId, (progress) => {
        console.log(`Conversion progress: ${progress}%`);
      });

      setDownloadUrl(url);
    } catch (err) {
      console.error("Conversion failed:", err);
      showToast("Failed to convert Word to PDF. Please try again or check your backend connection.", "error");
    } finally {
      setIsProcessing(false);
    }
  }, [file]);

  const handleAdComplete = useCallback(() => {
    trackEvent({ name: "download_completed", tool: "word-to-pdf" });
    setShowAd(false);
    if (!downloadUrl) return;
    
    const a = document.createElement("a");
    a.href = downloadUrl;
    const baseName = file ? file.name.substring(0, file.name.lastIndexOf('.')) || file.name : 'document';
    a.download = `${baseName}.pdf`;
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
      title="Word to PDF"
      description="Convert DOC and DOCX files to PDF online with layout matching original."
      icon={FileText}
      iconGradient="icon-circle-convert"
    >
      {isProcessing && <ProcessingOverlay />}
      {showAd && <PreDownloadAd onComplete={handleAdComplete} onCancel={handleAdCancel} />}
      {!file ? (
        <PdfDropzone
          onFilesAdded={handleFilesAdded}
          multiple={false}
          accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
          acceptLabel="Word files (.doc, .docx) only"
          validateFile={validateWordFile}
          label="Drop your Word file here"
          sublabel="Select a Word document to convert to PDF"
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

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            {!downloadUrl ? (
              <button
                onClick={handleConvert}
                disabled={isProcessing}
                className="btn-aurora w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Converting...</>
                ) : (
                  <><RefreshCw className="w-5 h-5" /> Convert to PDF</>
                )}
              </button>
            ) : (
              <button
                onClick={() => setShowAd(true)}
                className="btn-aurora w-full sm:w-auto flex items-center justify-center gap-2 animate-bounce"
              >
                <Download className="w-5 h-5" /> Download PDF File
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
