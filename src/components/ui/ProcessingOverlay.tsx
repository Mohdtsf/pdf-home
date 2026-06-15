"use client";

import { Loader2 } from "lucide-react";
import { createPortal } from "react-dom";

interface ProcessingOverlayProps {
  message?: string;
  progress?: number; // 0-100, undefined means indeterminate
}

/**
 * Full-page processing overlay with spinner and optional progress.
 * Used during heavy PDF operations.
 */
export function ProcessingOverlay({
  message = "Processing your PDF...",
  progress,
}: ProcessingOverlayProps) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="glass-card p-8 text-center max-w-xs w-full mx-4">
        {/* Spinner */}
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>

        {/* Message */}
        <p className="text-[var(--color-text-primary)] font-medium mb-4">
          {message}
        </p>

        {/* Progress Bar */}
        {progress !== undefined && (
          <div className="w-full">
            <div className="progress-bar">
              <div
                className="progress-bar-fill bg-gradient-to-r from-[#6366f1] to-[#8b5cf6]"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-2">
              {Math.round(progress)}%
            </p>
          </div>
        )}

        {/* Privacy note */}
        <p className="text-xs text-[var(--color-text-muted)] mt-4">
          All processing happens in your browser
        </p>
      </div>
    </div>,
    document.body
  );
}
