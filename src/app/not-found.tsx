import Link from "next/link";
import { FileText, ArrowLeft, Merge, Minimize2, FileOutput } from "lucide-react";

export default function NotFound() {
  return (
    <div className="aurora-bg min-h-[70vh] flex items-center justify-center px-4 py-20">
      <div className="relative z-10 glass-card max-w-lg w-full p-10 text-center">
        {/* 404 Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center">
          <FileText className="w-10 h-10 text-white" />
        </div>

        <h1 className="text-5xl font-bold gradient-text-aurora mb-3">404</h1>
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
          Page Not Found
        </h2>
        <p className="text-[var(--color-text-secondary)] mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        {/* Back Home Button */}
        <Link
          href="/"
          className="btn-aurora inline-flex items-center gap-2 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Popular Tools */}
        <div className="border-t border-[var(--color-border-glass)] pt-6">
          <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-4">
            Popular Tools
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link
              href="/merge-pdf"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-hover)] transition-all"
            >
              <Merge className="w-4 h-4" />
              Merge PDF
            </Link>
            <Link
              href="/compress-pdf"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-hover)] transition-all"
            >
              <Minimize2 className="w-4 h-4" />
              Compress PDF
            </Link>
            <Link
              href="/pdf-to-jpg"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-hover)] transition-all"
            >
              <FileOutput className="w-4 h-4" />
              PDF to JPG
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
