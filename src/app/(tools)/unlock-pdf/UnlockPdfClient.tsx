"use client";

import { useState, useCallback } from "react";
import { Unlock, Download, Loader2, FileText, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { ProcessingOverlay } from "@/components/ui/ProcessingOverlay";
import { PreDownloadAd } from "@/components/ads/PreDownloadAd";
import { ToolPageLayout } from "@/components/layout/ToolPageLayout";
import { PdfDropzone, type PdfFile } from "@/components/pdf/PdfDropzone";
import { unlockPdf } from "@/lib/pdf/unlock";
import { downloadFile } from "@/lib/download";

export function UnlockPdfClient() {
  const [file, setFile] = useState<PdfFile | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [unlockSuccess, setUnlockSuccess] = useState(false);
  const [unlockedData, setUnlockedData] = useState<Uint8Array | null>(null);

  const handleFilesAdded = useCallback(async (files: PdfFile[]) => {
    const pdfFile = files[0];
    setFile(pdfFile);
    setIsProcessing(true);
    trackEvent({ name: "tool_used", tool: "unlock-pdf" });
    setErrorMsg(null);
    setUnlockSuccess(false);
    setUnlockedData(null);

    try {
      // Auto attempt to unlock without password (e.g. owner restrictions)
      const res = await unlockPdf(pdfFile.buffer);
      setUnlockedData(res.data);
      setUnlockSuccess(true);
    } catch (err: any) {
      // If it fails, prompt the user for password
      console.log("PDF requires password to open.");
      setErrorMsg(err.message || "This PDF requires a password to open. Please enter the password below.");
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleUnlockWithPassword = useCallback(async () => {
    if (!file || !password) return;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const res = await unlockPdf(file.buffer, password);
      setUnlockedData(res.data);
      setUnlockSuccess(true);
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err.message || "Incorrect password. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [file, password]);

  const handleAdComplete = useCallback(() => {
    trackEvent({ name: "download_completed", tool: "unlock-pdf" });
    setShowAd(false);
    if (!unlockedData || !file) return;
    downloadFile(unlockedData, `${file.name.replace(".pdf", "")}_unlocked.pdf`);
  }, [unlockedData, file]);

  const handleAdCancel = useCallback(() => {
    setShowAd(false);
  }, []);

  const handleReset = useCallback(() => {
    setFile(null);
    setPassword("");
    setErrorMsg(null);
    setUnlockSuccess(false);
    setUnlockedData(null);
  }, []);

  return (
    <ToolPageLayout
      title="Unlock PDF"
      description="Instantly remove password protection, owner restrictions, and printing locks from your PDFs locally."
      icon={Unlock}
      iconGradient="icon-circle-security"
    >
      {isProcessing && <ProcessingOverlay />}
      {showAd && <PreDownloadAd onComplete={handleAdComplete} onCancel={handleAdCancel} />}
      {!file ? (
        <PdfDropzone
          onFilesAdded={handleFilesAdded}
          multiple={false}
          label="Drop your locked PDF here"
          sublabel="Select a password-protected PDF to unlock"
        />
      ) : (
        <div className="space-y-6">
          {/* File Header */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-bg-surface)]">
            <FileText className="w-5 h-5 text-[var(--color-text-secondary)]" />
            <div>
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-[var(--color-text-muted)]">
                {unlockSuccess ? "Decryption complete!" : "Encryption detected"}
              </p>
            </div>
            <button
              onClick={handleReset}
              className="ml-auto text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] underline"
            >
              Change file
            </button>
          </div>

          {/* Decryption Success Screen */}
          {unlockSuccess && unlockedData && (
            <div className="space-y-5">
              <div className="p-5 rounded-xl border border-[#10b981]/20 bg-gradient-to-br from-[#10b981]/5 to-[#059669]/5 flex gap-3">
                <CheckCircle2 className="w-6 h-6 text-[#10b981] shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-[#10b981]">PDF Decrypted Successfully!</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1 leading-relaxed">
                    All printing, copying, editing, and password restrictions have been completely stripped. You can now download the unlocked file.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  onClick={() => setShowAd(true)}
                  className="btn-aurora w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" /> Download Unlocked PDF
                </button>
                <button onClick={handleReset} className="btn-secondary w-full sm:w-auto">
                  Unlock Another File
                </button>
              </div>
            </div>
          )}

          {/* Decryption Password Entry Form */}
          {!unlockSuccess && (
            <div className="space-y-5">
              {/* Error/Prompt Message */}
              {errorMsg && (
                <div className="p-4 rounded-xl border border-red-500/20 bg-gradient-to-br from-red-500/5 to-rose-500/5 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{errorMsg}</p>
                </div>
              )}

              {/* Password Input */}
              <div className="space-y-4 p-5 rounded-xl border border-[var(--color-border-glass)] bg-[var(--color-bg-surface)]">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#6366f1]" /> Enter Decryption Key
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter PDF password..."
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
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  onClick={handleUnlockWithPassword}
                  disabled={isProcessing || !password}
                  className="btn-aurora w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Unlocking...</>
                  ) : (
                    <><Unlock className="w-5 h-5" /> Unlock PDF</>
                  )}
                </button>
                <button onClick={handleReset} className="btn-secondary w-full sm:w-auto">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </ToolPageLayout>
  );
}
