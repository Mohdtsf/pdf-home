"use client";
import { useToast } from "@/components/ui/Toast";

import { useState, useCallback, useEffect } from "react";
import { Scissors, Download, Loader2, Smartphone } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { ProcessingOverlay } from "@/components/ui/ProcessingOverlay";
import { ToolPageLayout } from "@/components/layout/ToolPageLayout";
import { PdfDropzone, type PdfFile } from "@/components/pdf/PdfDropzone";
import type { SplitOptions } from "@/lib/pdf/split";
import { downloadFile, downloadAsZip, createZipBlob } from "@/lib/download";
import { usePdfDocument } from "@/hooks/usePdfDocument";
import { FileInfoBanner } from "@/components/pdf/FileInfoBanner";
import { PagePreviewCard } from "@/components/pdf/PagePreviewCard";
import { usePdfWorker } from "@/hooks/usePdfWorker";
import { PreDownloadAd } from "@/components/ads/PreDownloadAd";
import { ShareModal } from "@/components/pdf/ShareModal";
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
  const { showToast } = useToast();
  const [file, setFile] = useState<PdfFile | null>(null);
  const [splitMode, setSplitMode] = useState<SplitMode>("individual");
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [rangeFrom, setRangeFrom] = useState(1);
  const [rangeTo, setRangeTo] = useState(1);
  const [everyN, setEveryN] = useState(1);
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [showAllGroups, setShowAllGroups] = useState(false);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareBlob, setShareBlob] = useState<Blob | null>(null);
  const [shareFilename, setShareFilename] = useState<string>("split.pdf");
  const [resultFiles, setResultFiles] = useState<{ filename: string, data: Uint8Array }[] | null>(null);

  const { doc, pageCount } = usePdfDocument(file?.buffer || null);
  const { runTask } = usePdfWorker();

  const handleFilesAdded = useCallback((files: PdfFile[]) => {
    setFile(files[0]);
    setPageOrder([]);
    setIsDone(false);
  }, []);

  useEffect(() => {
    if (pageCount > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRangeTo(pageCount);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedPages(new Set(Array.from({ length: pageCount }, (_, i) => i + 1)));
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const getEveryNChunks = useCallback(() => {
    const chunks: number[][] = [];
    let currentChunk: number[] = [];
    
    pageOrder.forEach((originalIndex) => {
      currentChunk.push(originalIndex);
      if (currentChunk.length === everyN) {
        chunks.push(currentChunk);
        currentChunk = [];
      }
    });
    
    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }
    
    return chunks;
  }, [pageOrder, everyN]);

  const handleSplit = useCallback(async () => {
    if (!file) return;
    setIsProcessing(true);
    trackEvent({ name: "tool_used", tool: "split-pdf" });

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
      showToast("Failed to split PDF. Please try again.", "error");
    } finally {
      setIsProcessing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, splitMode, selectedPages, rangeFrom, rangeTo, everyN, runTask]);

  const handleDownloadAgain = useCallback(async () => {
    if (!resultFiles) return;
    if (resultFiles.length === 1) {
      downloadFile(resultFiles[0].data, resultFiles[0].filename);
    } else {
      await downloadAsZip(resultFiles, "split-pdfs.zip");
    }
  }, [resultFiles]);

  const handleAdComplete = useCallback(async () => {
    trackEvent({ name: "download_completed", tool: "split-pdf" });
    await handleDownloadAgain();
    setIsDone(true);
    setShowAd(false);
  }, [handleDownloadAgain]);

  useEffect(() => {
    let isMounted = true;
    if (resultFiles) {
      if (resultFiles.length === 1) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setShareBlob(new Blob([resultFiles[0].data as any], { type: "application/pdf" }));
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setShareFilename(resultFiles[0].filename);
      } else {
        createZipBlob(resultFiles).then(blob => {
          if (isMounted) {
            setShareBlob(blob);
            setShareFilename("split-pdfs.zip");
          }
        });
      }
    } else {
      setShareBlob(null);
    }
    return () => { isMounted = false; };
  }, [resultFiles]);

  const handleAdCancel = useCallback(() => setShowAd(false), []);

  const handleReset = useCallback(() => {
    setFile(null);
    setSelectedPages(new Set());
    setPageOrder([]);
    setIsDone(false);
    setResultFiles(null);
  }, []);

  return (
    <ToolPageLayout
      title="Split PDF"
      description="Separate PDF pages into individual files or custom ranges."
      icon={Scissors}
      iconGradient="icon-circle-organize"
    >
      {isProcessing && <ProcessingOverlay />}
      {showAd && <PreDownloadAd onComplete={handleAdComplete} onCancel={handleAdCancel} />}
      {showAd && (
        <PreDownloadAd onComplete={handleAdComplete} onCancel={handleAdCancel} />
      )}
      <ShareModal 
        isOpen={showShareModal} 
        onClose={() => setShowShareModal(false)} 
        pdfBlob={shareBlob} 
        fileName={shareFilename} 
      />
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
                    : "bg-[var(--color-bg-base)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-hover)] hover:text-[var(--color-text-primary)] border border-[var(--color-border-glass)]"
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
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <label className="text-sm text-[var(--color-text-secondary)]">From page</label>
                <input
                  type="number"
                  min={1}
                  max={pageCount}
                  value={rangeFrom}
                  onChange={(e) => {
                    const val = Math.max(1, Math.min(pageCount, Number(e.target.value)));
                    setRangeFrom(val);
                    if (val > rangeTo) setRangeTo(val);
                  }}
                  className="w-20 px-3 py-2 rounded-lg bg-[var(--color-bg-base)] border border-[var(--color-border-glass)] text-[var(--color-text-primary)] text-sm focus:border-[#667eea] focus:outline-none transition-colors"
                />
                <label className="text-sm text-[var(--color-text-secondary)]">to</label>
                <input
                  type="number"
                  min={rangeFrom}
                  max={pageCount}
                  value={rangeTo}
                  onChange={(e) => setRangeTo(Math.max(rangeFrom, Math.min(pageCount, Number(e.target.value))))}
                  className="w-20 px-3 py-2 rounded-lg bg-[var(--color-bg-base)] border border-[var(--color-border-glass)] text-[var(--color-text-primary)] text-sm focus:border-[#667eea] focus:outline-none transition-colors"
                />
                <span className="text-xs text-[var(--color-text-muted)]">of {pageCount}</span>
              </div>

              {/* Pages Preview Grid */}
              <div className="space-y-3">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Preview of pages in range ({rangeTo - rangeFrom + 1} pages selected):
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {pageOrder
                    .filter((originalIndex) => {
                      const pageNum = originalIndex + 1;
                      return pageNum >= rangeFrom && pageNum <= rangeTo;
                    })
                    .map((originalIndex) => {
                      const pageNum = originalIndex + 1;
                      return (
                        <PagePreviewCard
                          key={originalIndex.toString()}
                          doc={doc}
                          pageNum={pageNum}
                          isSelected={true}
                        />
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {splitMode === "every-n" && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <label className="text-sm text-[var(--color-text-secondary)]">Split every</label>
                <input
                  type="number"
                  min={1}
                  max={pageCount}
                  value={everyN}
                  onChange={(e) => setEveryN(Math.max(1, Math.min(pageCount, Number(e.target.value))))}
                  className="w-20 px-3 py-2 rounded-lg bg-[var(--color-bg-base)] border border-[var(--color-border-glass)] text-[var(--color-text-primary)] text-sm focus:border-[#667eea] focus:outline-none transition-colors"
                />
                <label className="text-sm text-[var(--color-text-secondary)]">pages</label>
                <span className="text-xs text-[var(--color-text-muted)]">
                  → {Math.ceil(pageCount / everyN)} files
                </span>
              </div>

              {/* Pages Preview Grid Grouped by Chunk */}
              <div className="space-y-4">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Preview of split files:
                </p>
                <div className="space-y-4">
                  {(() => {
                    const chunks = getEveryNChunks();
                    const visibleChunks = showAllGroups ? chunks : chunks.slice(0, 6);
                    
                    return (
                      <>
                        {visibleChunks.map((chunk, chunkIndex) => {
                          const pageRangeText = chunk.length === 1
                            ? `Page ${chunk[0] + 1}`
                            : `Pages ${chunk[0] + 1} to ${chunk[chunk.length - 1] + 1}`;
                            
                          return (
                            <div key={chunkIndex} className="glass-card p-4 rounded-xl border border-[var(--color-border-glass)] space-y-3">
                              <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
                                File {chunkIndex + 1} ({pageRangeText})
                              </h4>
                              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                {chunk.map((originalIndex) => {
                                  const pageNum = originalIndex + 1;
                                  return (
                                    <PagePreviewCard
                                      key={originalIndex.toString()}
                                      doc={doc}
                                      pageNum={pageNum}
                                      isSelected={true}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                        
                        {chunks.length > 6 && (
                          <div className="flex justify-center pt-2">
                            <button
                              type="button"
                              onClick={() => setShowAllGroups(!showAllGroups)}
                              className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-bg-base)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-hover)] border border-[var(--color-border-glass)] transition-all duration-300 active:scale-95"
                            >
                              {showAllGroups ? "Show Less Previews" : `Show All Previews (${chunks.length} Files)`}
                            </button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
            <button
              onClick={isDone ? handleDownloadAgain : handleSplit}
              disabled={!isDone && (isProcessing || (splitMode === "individual" && selectedPages.size === 0))}
              className="btn-aurora w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(102,126,234,0.4)] transition-all duration-300 active:scale-95"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Splitting...
                </>
              ) : isDone ? (
                <>
                  <Download className="w-5 h-5" />
                  Download Again
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Split & Download
                </>
              )}
            </button>

            {isDone && (
              <button
                onClick={() => setShowShareModal(true)}
                className="btn-secondary w-full sm:w-auto flex items-center justify-center gap-2 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 active:scale-95"
              >
                <Smartphone className="w-5 h-5" />
                Share to Mobile
              </button>
            )}

            <button onClick={handleReset} className="btn-secondary w-full sm:w-auto hover:-translate-y-1 hover:shadow-lg hover:shadow-white/5 transition-all duration-300 active:scale-95">
              Start Over
            </button>
          </div>
        </div>
      )}
    </ToolPageLayout>
  );
}
