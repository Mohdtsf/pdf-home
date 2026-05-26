import { X, GripVertical } from "lucide-react";
import { PdfThumbnail } from "./PdfThumbnail";
import type { PdfFile } from "./PdfDropzone";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface FilePreviewCardProps {
  file: PdfFile;
  index: number;
  onRemove: (id: string) => void;
}

export function FilePreviewCard({
  file,
  index,
  onRemove,
}: FilePreviewCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: file.id });

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
      className={`relative rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-3 glass-card hover:-translate-y-1 hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 group flex flex-col ${
        isDragging ? "ring-2 ring-indigo-500/50 shadow-2xl scale-105" : ""
      }`}
    >
      
      {/* Remove Button */}
      <button
        onClick={() => onRemove(file.id)}
        className="absolute -top-2 -right-2 z-10 w-6 h-6 rounded-full bg-red-500/80 hover:bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg"
        title="Remove file"
      >
        <X className="w-3 h-3" />
      </button>

      {/* Thumbnail */}
      <div className="aspect-[3/4] rounded-lg overflow-hidden mb-3 border border-slate-100 dark:border-slate-800 group-hover:border-slate-200 dark:group-hover:border-slate-700 transition-colors relative flex-shrink-0 bg-slate-50 dark:bg-slate-950">
        <PdfThumbnail buffer={file.buffer} className="w-full h-full" />
      </div>
      
      {/* File Info & Controls */}
      <div className="flex flex-col items-center justify-between flex-1 gap-2">
        <div className="text-xs font-medium text-center text-[var(--color-text-secondary)] group-hover:text-indigo-600 transition-colors truncate w-full px-1" title={file.file.name}>
          {file.file.name}
        </div>
        
        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-full mt-auto">
          <button
            {...attributes}
            {...listeners}
            className="p-1 rounded cursor-grab active:cursor-grabbing bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors border border-slate-200/40 dark:border-slate-700/40"
            title="Drag to reorder"
          >
            <GripVertical className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
