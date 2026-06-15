"use client";

import { useCallback, useState, useRef } from "react";
import { Upload, FileText, X, AlertCircle } from "lucide-react";
import { validatePdfFileObject, PdfValidationError, formatFileSize } from "@/lib/validatePdf";

export interface PdfFile {
  id: string;
  file: File;
  name: string;
  size: number;
  buffer: ArrayBuffer;
}

interface PdfDropzoneProps {
  onFilesAdded: (files: PdfFile[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  label?: string;
  sublabel?: string;
  accept?: string;
  acceptLabel?: string;
  validateFile?: (file: File) => Promise<ArrayBuffer>;
}

export function PdfDropzone({
  onFilesAdded,
  multiple = false,
  maxFiles = 20,
  label = "Drop your PDF files here",
  sublabel = "or click to browse",
  accept = "application/pdf,.pdf",
  acceptLabel = "PDF files only",
  validateFile,
}: PdfDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    async (fileList: FileList | File[]) => {
      setError(null);
      setIsProcessing(true);

      try {
        const files = Array.from(fileList).slice(0, maxFiles);
        const pdfFiles: PdfFile[] = [];

        for (const file of files) {
          try {
            let buffer: ArrayBuffer;
            if (validateFile) {
              buffer = await validateFile(file);
            } else {
              buffer = await validatePdfFileObject(file);
            }
            pdfFiles.push({
              id: crypto.randomUUID(),
              file,
              name: file.name,
              size: file.size,
              buffer,
            });
          } catch (err: any) {
            if (err instanceof PdfValidationError) {
              setError(`${file.name}: ${err.message}`);
            } else {
              setError(`${file.name}: ${err.message || 'Failed to process file'}`);
            }
          }
        }

        if (pdfFiles.length > 0) {
          onFilesAdded(pdfFiles);
        }
      } finally {
        setIsProcessing(false);
      }
    },
    [onFilesAdded, maxFiles, validateFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files);
        // Reset input so same file can be re-selected
        e.target.value = "";
      }
    },
    [processFiles]
  );

  return (
    <div>
      <div
        className={`dropzone ${isDragOver ? "drag-over" : ""} ${isProcessing ? "opacity-60 pointer-events-none" : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label="Upload files"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
          aria-hidden="true"
        />

        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center">
            {isProcessing ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-7 h-7 text-white" />
            )}
          </div>

          <div>
            <p className="text-lg font-semibold text-[var(--color-text-primary)]">
              {isProcessing ? "Processing..." : label}
            </p>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              {sublabel}
            </p>
          </div>

          <p className="text-xs text-[var(--color-text-muted)]">
            {acceptLabel} • Max 100MB per file
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto p-1 hover:bg-red-500/10 rounded"
            aria-label="Dismiss error"
          >
            <X className="w-3.5 h-3.5 text-red-400" />
          </button>
        </div>
      )}
    </div>
  );
}

