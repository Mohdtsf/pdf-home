"use client";

import { PdfThumbnail } from "./PdfThumbnail";
import type { PdfFile } from "./PdfDropzone";

interface FileInfoBannerProps {
  file: PdfFile;
  pageCount: number;
  onReset: () => void;
}

export function FileInfoBanner({ file, pageCount, onReset }: FileInfoBannerProps) {
  return (
    <div className="glass-card flex items-center gap-4 p-4 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 border border-[var(--color-border-glass)] hover:border-[var(--color-border-glass-hover)] group">
      <div className="w-10 h-12 rounded bg-[var(--color-bg-base)] flex items-center justify-center flex-shrink-0 overflow-hidden border border-[var(--color-border-glass)] group-hover:border-[var(--color-border-glass-hover)] transition-colors">
        <PdfThumbnail buffer={file.buffer} className="w-full h-full" />
      </div>
      
      <div>
        <p className="text-sm font-medium text-[var(--color-text-primary)] group-hover:text-indigo-600 transition-colors">
          {file.name}
        </p>
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
          {pageCount} {pageCount === 1 ? "page" : "pages"}
        </p>
      </div>
      
      <button 
        onClick={onReset} 
        className="ml-auto px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] bg-[var(--color-bg-surface-hover)] hover:bg-[var(--color-border-glass)] border border-[var(--color-border-glass)] rounded-lg transition-all active:scale-95"
      >
        Change file
      </button>
    </div>
  );
}
