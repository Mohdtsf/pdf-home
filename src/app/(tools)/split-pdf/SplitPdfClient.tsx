"use client";

import { useState, useCallback, useEffect } from "react";
import { Scissors, Download, Loader2, FileText } from "lucide-react";
import { ToolPageLayout } from "@/components/layout/ToolPageLayout";
import { PdfDropzone, type PdfFile } from "@/components/pdf/PdfDropzone";
import type { SplitOptions } from "@/lib/pdf/split";
import { downloadFile, downloadAsZip } from "@/lib/download";
import { usePdfDocument } from "@/hooks/usePdfDocument";
import { FileInfoBanner } from "@/components/pdf/FileInfoBanner";
import { PagePreviewCard } from "@/components/pdf/PagePreviewCard";
import { usePdfWorker } from "@/hooks/usePdfWorker";
import { PreDownloadAd } from "@/components/ads/PreDownloadAd";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";

type SplitMode = "individual" | "ranges" | "every-n";

export function SplitPdfClient() {
  const [file, setFile] = useState<PdfFile | null>(null);
  const [splitMode, setSplitMode] = useState<SplitMode>("individual");
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [rangeFrom, setRangeFrom] = useState(1);
  const [rangeTo, setRangeTo] = useState(1);
  const [everyN, setEveryN] = useState(1);
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [resultFiles, setResultFiles] = useState<{ filename: string, data: Uint8Array }[] | null>(null);

  const { doc, pageCount } = usePdfDocument(file?.buffer || null);
  const { runTask } = usePdfWorker();

  const handleFilesAdded = useCallback((files: PdfFile[]) => {
    setFile(files[0]);
    setPageOrder([]);
  }, []);

  useEffect(() => {
    if (pageCount > 0) {
      setRangeTo(pageCount);
      setSelectedPages(new Set(Array.from({ length: pageCount }, (_, i) => i + 1)));
      setPageOrder(Array.from({ length: pageCount }, (_, i) => i));
    }
  }, [pageCount]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setPageOrder((items) => {
        const oldIndex = items.indexOf(Number(active.id));
        const newIndex = items.indexOf(Number(over.id));
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const togglePage = useCallback((pageNum: number) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageNum)) {
        next.delete(pageNum);
      } else {
        next.add(pageNum);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedPages(new Set(Array.from({ length: pageCount }, (_, i) => i + 1)));
  }, [pageCount]);

  const deselectAll = useCallback(() => {
    setSelectedPages(new Set());
  }, []);

  const handleSplit = useCallback(async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      let options: SplitOptions;

      switch (splitMode) {
        case "individual":
          options = { mode: "individual", pages: Array.from(selectedPages).sort((a, b) => a - b) };
          break;
        case "ranges":
          options = { mode: "ranges", ranges: [{ from: rangeFrom, to: rangeTo }] };
          break;
        case "every-n":
          options = { mode: "every-n", n: everyN };
          break;
      }
      
      // If order has changed, pass it along
      const isCustomOrder = pageOrder.some((val, i) => val !== i);
      if (isCustomOrder) {
        options.pageOrder = pageOrder;
      }

      const results = await runTask<{ filename: string, data: Uint8Array }[]>("SPLIT", { buffer: file.buffer, options });
      setResultFiles(results);
      setShowAd(true);
    } catch (err) {
      console.error("Split failed:", err);
      alert("Failed to split PDF. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [file, splitMode, selectedPages, rangeFrom, rangeTo, everyN, runTask]);

  const handleAdComplete = useCallback(async () => {
    if (resultFiles) {
      if (resultFiles.length === 1) {
        downloadFile(resultFiles[0].data, resultFiles[0].filename);
      } else {
        await downloadAsZip(resultFiles, "split-pdfs.zip");
      }
    }
    setShowAd(false);
  }, [resultFiles]);

  const handleAdCancel = useCallback(() => setShowAd(false), []);

  const handleReset = useCallback(() => {
    setFile(null);
    setSelectedPages(new Set());
    setPageOrder([]);
  }, []);

  return (
    <ToolPageLayout
      title="Split PDF"
      description="Separate PDF pages into individual files or custom ranges."
      icon={Scissors}
      iconGradient="icon-circle-organize"
    >
      {showAd && (
        <PreDownloadAd onComplete={handleAdComplete} onCancel={handleAdCancel} />
      )}
      {!file ? (
        <PdfDropzone
          onFilesAdded={handleFilesAdded}
          multiple={false}
          label="Drop your PDF file here"
          sublabel="Select a PDF to split"
        />
      ) : (
        <div className="space-y-6">
          {/* File Info */}
          <FileInfoBanner file={file} pageCount={pageCount} onReset={handleReset} />

          {/* Split Mode Selector */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: "individual" as SplitMode, label: "Extract Pages" },
              { key: "ranges" as SplitMode, label: "By Range" },
              { key: "every-n" as SplitMode, label: "Every N Pages" },
            ].map((mode) => (
              <button
                key={mode.key}
                onClick={() => setSplitMode(mode.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 ${
                  splitMode === mode.key
                    ? "bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-[#667eea]/20"
                    : "bg-white/5 text-[var(--color-text-secondary)] hover:bg-white/10 hover:text-white"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {/* Mode-specific Controls */}
          {splitMode === "individual" && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Select pages to extract ({selectedPages.size} selected)
                </p>
                <div className="flex gap-2">
                  <button onClick={selectAll} className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] underline">Select all</button>
                  <button onClick={deselectAll} className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] underline">Deselect all</button>
                </div>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={pageOrder.map(String)} strategy={rectSortingStrategy}>
                    {pageOrder.map((originalIndex) => {
                      const pageNum = originalIndex + 1;
                      return (
                        <PagePreviewCard
                          key={originalIndex.toString()}
                          id={originalIndex.toString()}
                          doc={doc}
                          pageNum={pageNum}
                          isSelected={selectedPages.has(pageNum)}
                          onClick={() => togglePage(pageNum)}
                        />
                      );
                    })}
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          )}

          {splitMode === "ranges" && (
            <div className="flex items-center gap-3">
              <label className="text-sm text-[var(--color-text-secondary)]">From page</label>
              <input
                type="number"
                min={1}
                max={pageCount}
                value={rangeFrom}
                onChange={(e) => setRangeFrom(Number(e.target.value))}
                className="w-20 px-3 py-2 rounded-lg bg-black/20 border border-[var(--color-border-glass)] text-[var(--color-text-primary)] text-sm focus:border-[#667eea] focus:outline-none transition-colors"
              />
              <label className="text-sm text-[var(--color-text-secondary)]">to</label>
              <input
                type="number"
                min={rangeFrom}
                max={pageCount}
                value={rangeTo}
                onChange={(e) => setRangeTo(Number(e.target.value))}
                className="w-20 px-3 py-2 rounded-lg bg-black/20 border border-[var(--color-border-glass)] text-[var(--color-text-primary)] text-sm focus:border-[#667eea] focus:outline-none transition-colors"
              />
              <span className="text-xs text-[var(--color-text-muted)]">of {pageCount}</span>
            </div>
          )}

          {splitMode === "every-n" && (
            <div className="flex items-center gap-3">
              <label className="text-sm text-[var(--color-text-secondary)]">Split every</label>
              <input
                type="number"
                min={1}
                max={pageCount}
                value={everyN}
                onChange={(e) => setEveryN(Number(e.target.value))}
                className="w-20 px-3 py-2 rounded-lg bg-black/20 border border-[var(--color-border-glass)] text-[var(--color-text-primary)] text-sm focus:border-[#667eea] focus:outline-none transition-colors"
              />
              <label className="text-sm text-[var(--color-text-secondary)]">pages</label>
              <span className="text-xs text-[var(--color-text-muted)]">
                → {Math.ceil(pageCount / everyN)} files
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
            <button
              onClick={handleSplit}
              disabled={isProcessing || (splitMode === "individual" && selectedPages.size === 0)}
              className="btn-aurora w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(102,126,234,0.4)] transition-all duration-300 active:scale-95"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Splitting...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Split & Download
                </>
              )}
            </button>

            <button onClick={handleReset} className="btn-secondary w-full sm:w-auto hover:-translate-y-1 hover:shadow-lg hover:shadow-white/5 transition-all duration-300 active:scale-95">
              Start Over
            </button>
          </div>
        </div>
      )}
    </ToolPageLayout>
  );
}
