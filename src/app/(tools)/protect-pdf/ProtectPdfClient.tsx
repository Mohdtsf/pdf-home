"use client";
import { useToast } from "@/components/ui/Toast";

import { useState, useCallback } from "react";
import { ShieldAlert, Download, Loader2, FileText, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { ProcessingOverlay } from "@/components/ui/ProcessingOverlay";
import { PreDownloadAd } from "@/components/ads/PreDownloadAd";
import { ToolPageLayout } from "@/components/layout/ToolPageLayout";
import { PdfDropzone, type PdfFile } from "@/components/pdf/PdfDropzone";
import { protectPdf } from "@/lib/pdf/protect";
import { downloadFile } from "@/lib/download";

export function ProtectPdfClient() {
  const { showToast } = useToast();
  const [file, setFile] = useState<PdfFile | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [resultData, setResultData] = useState<any>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>('');

  const handleFilesAdded = useCallback(async (files: PdfFile[]) => {
    setFile(files[0]);
  }, []);

  const handleProtectPdf = useCallback(async () => {
    if (!file || !password) return;
    setIsProcessing(true);
    trackEvent({ name: "tool_used", tool: "protect-pdf" });

    try {
      const result = await protectPdf(file.buffer, password);
      downloadFile(result, `${file.name.replace(".pdf", "")}_protected.pdf`);
    } catch (err) {
      console.error("Protection failed:", err);
      showToast("Failed to apply protection. Please try again.", "error");
    } finally {
      setIsProcessing(false);
    }
  }, [file, password]);

  const handleReset = useCallback(() => {
    setFile(null);
    setPassword("");
  }, []);

  const handleAdComplete = useCallback(() => {
    trackEvent({ name: "download_completed", tool: "protect-pdf" });
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
      title="Protect PDF"
      description="Apply basic metadata security, strip edit parameters, and obfuscate your PDF stream structure securely inside your browser."
      icon={Lock}
      iconGradient="icon-circle-security"
    >
      {isProcessing && <ProcessingOverlay />}
      {showAd && <PreDownloadAd onComplete={handleAdComplete} onCancel={handleAdCancel} />}
      {!file ? (
        <PdfDropzone
          onFilesAdded={handleFilesAdded}
          multiple={false}
          label="Drop your PDF to protect"
          sublabel="Select a PDF file"
        />
      ) : (
        <div className="space-y-6">
          {/* File Header */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-bg-surface)]">
            <FileText className="w-5 h-5 text-[var(--color-text-secondary)]" />
            <div>
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Ready for metadata protection</p>
            </div>
            <button
              onClick={handleReset}
              className="ml-auto text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] underline"
            >
              Change file
            </button>
          </div>

          {/* Secure Input Area */}
          <div className="space-y-4 p-5 rounded-xl border border-[var(--color-border-glass)] bg-[var(--color-bg-surface)]">
            <label className="text-sm font-medium flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#10b981]" /> Set Security Key
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full pl-4 pr-12 py-3 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-glass)] text-[var(--color-text-primary)] focus:border-[#6366f1] focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">
              This password will be registered with the PDF's security descriptor to discourage unauthorized viewing.
            </p>
          </div>

          {/* Security Advisory Warning */}
          <div className="p-4 rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-yellow-500/5 flex gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-amber-500">Security Advisory</p>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                Client-side tools run strictly in the sandbox of your browser to protect your absolute privacy. 
                They obfuscate and strip metadata tags so the PDF cannot be easily modified or indexed. 
                For strong military-grade server-side encryption (RC4/AES 128/256-bit), look forward to our Phase 3 launch coming soon!
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={handleProtectPdf}
              disabled={isProcessing || !password}
              className="btn-aurora w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Obfuscating & Locking...</>
              ) : (
                <><Lock className="w-5 h-5" /> Protect PDF</>
              )}
            </button>
            <button onClick={handleReset} className="btn-secondary w-full sm:w-auto">
              Cancel
            </button>
          </div>
        </div>
      )}
    </ToolPageLayout>
  );
}
