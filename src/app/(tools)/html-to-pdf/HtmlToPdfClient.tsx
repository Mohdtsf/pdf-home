"use client";

import { useState, useCallback } from "react";
import { Globe, Download, Loader2, FileText } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { ProcessingOverlay } from "@/components/ui/ProcessingOverlay";
import { PreDownloadAd } from "@/components/ads/PreDownloadAd";
import { ToolPageLayout } from "@/components/layout/ToolPageLayout";
import { pollJobStatus } from "@/lib/api";

export function HtmlToPdfClient() {
  const [url, setUrl] = useState("");
  const [landscape, setLandscape] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConvert = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setError(null);
    setDownloadUrl(null);

    // Basic URL validation
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        setError("URL protocol must be HTTP or HTTPS.");
        return;
      }
    } catch (err) {
      setError("Please enter a valid URL (including http:// or https://).");
      return;
    }

    setIsProcessing(true);
    trackEvent({ name: "tool_used", tool: "html-to-pdf" });

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/html-to-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url, landscape }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to submit conversion job");
      }

      const { jobId } = await response.json();
      
      const download = await pollJobStatus(jobId, (progress) => {
        console.log(`HTML to PDF progress: ${progress}%`);
      });

      setDownloadUrl(download);
    } catch (err: any) {
      console.error("HTML to PDF conversion failed:", err);
      setError(err.message || "Failed to convert URL to PDF. Please try again or check your backend connection.");
    } finally {
      setIsProcessing(false);
    }
  }, [url, landscape]);

  const handleAdComplete = useCallback(() => {
    trackEvent({ name: "download_completed", tool: "html-to-pdf" });
    setShowAd(false);
    if (!downloadUrl) return;
    
    const a = document.createElement("a");
    a.href = downloadUrl;
    
    // Extract hostname for filename or use default
    let displayDomain = "webpage";
    try {
      displayDomain = new URL(url).hostname;
    } catch(e) {}
    
    a.download = `${displayDomain}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [downloadUrl, url]);

  const handleAdCancel = useCallback(() => {
    setShowAd(false);
  }, []);

  const handleReset = useCallback(() => {
    setUrl("");
    setLandscape(false);
    setDownloadUrl(null);
    setError(null);
  }, []);

  return (
    <ToolPageLayout
      title="HTML to PDF"
      description="Save any webpage as a PDF file online. Type or paste the URL, set parameters, and generate high-quality vector PDFs."
      icon={Globe}
      iconGradient="icon-circle-convert"
    >
      {isProcessing && <ProcessingOverlay />}
      {showAd && <PreDownloadAd onComplete={handleAdComplete} onCancel={handleAdCancel} />}
      
      <div className="max-w-2xl mx-auto space-y-6">
        {!downloadUrl ? (
          <form onSubmit={handleConvert} className="space-y-6">
            {/* Input URL */}
            <div className="space-y-2">
              <label htmlFor="webpage-url" className="text-sm font-semibold text-[var(--color-text-secondary)] block">
                Webpage URL to Convert:
              </label>
              <div className="relative flex items-center">
                <Globe className="w-5 h-5 text-[var(--color-text-muted)] absolute left-4" />
                <input
                  id="webpage-url"
                  type="text"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isProcessing}
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-glass)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[#667eea]"
                />
              </div>
            </div>

            {/* Options */}
            <div className="p-5 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-glass)] space-y-4">
              <h3 className="text-md font-semibold flex items-center gap-2 text-[var(--color-text-primary)]">
                <FileText className="w-4 h-4 text-[#764ba2]" /> Page Layout Settings
              </h3>
              
              <div className="flex items-center gap-3">
                <input
                  id="layout-landscape"
                  type="checkbox"
                  checked={landscape}
                  onChange={(e) => setLandscape(e.target.checked)}
                  disabled={isProcessing}
                  className="w-4 h-4 rounded border-[var(--color-border-glass)] text-[#667eea] focus:ring-[#667eea]"
                />
                <label htmlFor="layout-landscape" className="text-sm text-[var(--color-text-secondary)] select-none">
                  Landscape orientation (default: Portrait)
                </label>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isProcessing || !url}
              className="btn-aurora w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Rendering Webpage to PDF...</>
              ) : (
                <><Globe className="w-5 h-5" /> Convert to PDF</>
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-6 text-center py-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
              <FileText className="w-8 h-8" />
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-[var(--color-text-primary)]">Your PDF is ready!</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                Webpage converted successfully: <span className="font-semibold">{url}</span>
              </p>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 max-w-md mx-auto">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowAd(true)}
                className="btn-aurora w-full sm:w-auto flex items-center justify-center gap-2 animate-bounce"
              >
                <Download className="w-5 h-5" /> Download PDF File
              </button>
              <button onClick={handleReset} className="btn-secondary w-full sm:w-auto">
                Convert another URL
              </button>
            </div>
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
}
