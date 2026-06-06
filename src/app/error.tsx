"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="aurora-bg min-h-[70vh] flex items-center justify-center px-4 py-20">
      <div className="relative z-10 glass-card max-w-lg w-full p-10 text-center">
        {/* Error Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#f43f5e] to-[#ec4899] flex items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-white" />
        </div>

        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
          Something went wrong
        </h2>
        <p className="text-[var(--color-text-secondary)] mb-8">
          An unexpected error occurred. Your files are safe — nothing was uploaded to our servers.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="btn-aurora inline-flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="btn-secondary inline-flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        </div>

        {/* Error digest for debugging */}
        {error.digest && (
          <p className="mt-6 text-xs text-[var(--color-text-muted)]">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
