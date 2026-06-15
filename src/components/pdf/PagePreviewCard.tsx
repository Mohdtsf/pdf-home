"use client";

import { PdfViewer } from "./PdfViewer";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Check } from "lucide-react";

interface PagePreviewCardProps {
  id?: string;
  doc: PDFDocumentProxy | null;
  pageNum: number;
  isSelected?: boolean;
  isHighlighted?: boolean;
  onClick?: () => void;
  rotation?: number;
  controls?: ReactNode;
}

export function PagePreviewCard({
  id,
  doc,
  pageNum,
  isSelected = false,
  isHighlighted = false,
  onClick,
  rotation = 0,
  controls,
}: PagePreviewCardProps) {
  // Combine selection and highlighting logic for styling
  const activeStyle = isSelected || isHighlighted 
    ? "!border-[#667eea] !ring-2 !ring-[#667eea]/20 shadow-[0_0_15px_rgba(102,126,234,0.15)] !bg-indigo-50/5 dark:!bg-indigo-950/20" 
    : "!border-[var(--color-border-glass)] !bg-[var(--glass-bg)] hover:!bg-[var(--glass-bg-hover)]";

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: id ?? `page-${pageNum}`, disabled: !id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`relative rounded-xl border transition-all duration-300 p-3 glass-card hover:-translate-y-1 hover:shadow-xl ${activeStyle} ${onClick ? "cursor-pointer group" : "group"} ${
        isDragging ? "ring-2 ring-indigo-500/50 shadow-2xl scale-105" : ""
      }`}
    >
      {/* Checkbox Badge */}
      {(onClick || isSelected) && (
        <div className={`absolute top-4 left-4 z-10 flex h-6 w-6 items-center justify-center rounded-full border transition-all duration-300 ${
          isSelected 
            ? "bg-gradient-to-r from-[#667eea] to-[#764ba2] border-transparent text-white shadow-md scale-100 opacity-100" 
            : "bg-white/80 dark:bg-slate-800/80 border-slate-300 dark:border-slate-600 text-transparent opacity-0 group-hover:opacity-100 scale-90 hover:scale-100"
        }`}>
          <Check className="w-3 h-3 stroke-[3]" />
        </div>
      )}
      <div className="aspect-[3/4] bg-slate-50 rounded-lg flex items-center justify-center overflow-hidden pointer-events-none mb-3 border border-slate-100 group-hover:border-slate-200 transition-colors relative">
        {doc ? (
          <PdfViewer doc={doc} pageNumber={pageNum} scale={1} rotation={rotation} className="w-full h-full object-contain" />
        ) : (
          <div className="w-6 h-6 border-2 border-[#667eea] border-t-transparent rounded-full animate-spin"></div>
        )}
        
        {/* Selection Glow Overlay */}
        {(isSelected || isHighlighted) && (
          <div className="absolute inset-0 bg-gradient-to-tr from-[#667eea]/10 to-[#764ba2]/10 mix-blend-overlay"></div>
        )}
      </div>

      {id && (
        <button
          {...attributes}
          {...listeners}
          className="absolute top-4 right-4 p-1.5 rounded-lg cursor-grab active:cursor-grabbing bg-white/80 hover:bg-white backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 border border-slate-200/60 shadow-sm z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4 text-slate-500" />
        </button>
      )}
      
      {controls ? (
        controls
      ) : (
        <div className="flex items-center justify-center mt-2">
          <div className="text-xs font-medium text-center text-[var(--color-text-secondary)] group-hover:text-indigo-600 transition-colors">
            Page {pageNum}
          </div>
        </div>
      )}
    </div>
  );
}
