"use client";

import { usePdfDocument } from "@/hooks/usePdfDocument";
import { PdfViewer } from "./PdfViewer";

interface PdfThumbnailProps {
  buffer: ArrayBuffer;
  className?: string;
}

export function PdfThumbnail({ buffer, className = "" }: PdfThumbnailProps) {
  const { doc } = usePdfDocument(buffer);

  if (!doc) {
    return (
      <div className={`flex items-center justify-center bg-white/5 ${className}`}>
        <div className="w-5 h-5 border-2 border-[#667eea] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden flex items-center justify-center bg-white/5 ${className}`}>
      <PdfViewer doc={doc} pageNumber={1} scale={0.5} className="w-full h-full" />
    </div>
  );
}
