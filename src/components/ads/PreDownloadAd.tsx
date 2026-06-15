"use client";

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { createPortal } from "react-dom";
import { AdBanner } from "./AdBanner";

interface PreDownloadAdProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function PreDownloadAd({ onComplete, onCancel }: PreDownloadAdProps) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative text-[var(--color-text-primary)]">
        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-full hover:bg-[var(--color-bg-surface-hover)] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 text-center space-y-6">
          <h3 className="text-2xl font-bold font-heading">Your file is ready!</h3>
          
          {/* Real AdSense unit or dev placeholder */}
          <div className="min-h-[250px] flex items-center justify-center">
            <AdBanner slot="pre-download" format="rectangle" responsive={false} className="w-full" />
          </div>

          <div className="flex flex-col items-center justify-center pt-4">
            {countdown > 0 ? (
              <p className="text-[var(--color-text-secondary)] text-lg">
                Download starting automatically in <span className="text-[var(--color-text-primary)] font-bold">{countdown}</span>s...
              </p>
            ) : (
              <button 
                onClick={onComplete}
                className="btn-aurora flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download Now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
