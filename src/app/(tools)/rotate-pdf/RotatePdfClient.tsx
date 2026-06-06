"use client";

import { useState, useCallback, useEffect } from "react";
import { RotateCw, Download, Loader2, FileText, RotateCcw } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { ProcessingOverlay } from "@/components/ui/ProcessingOverlay";
import { ToolPageLayout } from "@/components/layout/ToolPageLayout";
import { PdfDropzone, type PdfFile } from "@/components/pdf/PdfDropzone";
import type { RotationAngle, PageRotation } from "@/lib/pdf/rotate";
import { downloadFile } from "@/lib/download";
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

export function RotatePdfClient() {
  const [file, setFile] = useState<PdfFile | null>(null);
  const [pageRotations, setPageRotations] = useState<Map<number, RotationAngle>>(new Map());
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [resultBuffer, setResultBuffer] = useState<Uint8Array | null>(null);

  const { doc, pageCount } = usePdfDocument(file?.buffer || null);
  const { runTask } = usePdfWorker();

  const handleFilesAdded = useCallback((files: PdfFile[]) => {
    setFile(files[0]);
    setPageRotations(new Map());
    setPageOrder([]);
    setSelectedPages(new Set());
  }, []);

  const rotatePageBy = useCallback((pageIndex: number, angle: RotationAngle) => {
    setPageRotations((prev) => {
      const next = new Map(prev);
      const current = (next.get(pageIndex) ?? 0) as number;
      const newAngle = ((current + angle) % 360) as RotationAngle;
      if (newAngle === 0) {
        next.delete(pageIndex);
      } else {
        next.set(pageIndex, newAngle);
      }
      return next;
    });
  }, []);

  const rotateSelectedOrAll = useCallback((angle: RotationAngle) => {
    setPageRotations((prev) => {
      const next = new Map(prev);
      const targetPages = selectedPages.size > 0 
        ? Array.from(selectedPages) 
        : Array.from({ length: pageCount }, (_, i) => i);
        
      targetPages.forEach((i) => {
        const current = (prev.get(i) ?? 0) as number;
        const newAngle = ((current + angle) % 360) as RotationAngle;
        if (newAngle === 0) {
          next.delete(i);
        } else {
          next.set(i, newAngle);
        }
      });
      return next;
    });
  }, [pageCount, selectedPages]);

  const togglePageSelection = useCallback((pageIndex: number) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageIndex)) {
        next.delete(pageIndex);
      } else {
        next.add(pageIndex);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedPages(new Set(Array.from({ length: pageCount }, (_, i) => i)));
  }, [pageCount]);

  const clearSelection = useCallback(() => {
    setSelectedPages(new Set());
  }, []);

  useEffect(() => {
    if (pageCount > 0 && pageOrder.length === 0) {
      setPageOrder(Array.from({ length: pageCount }, (_, i) => i));
    }
  }, [pageCount, pageOrder.length]);

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

  const resetRotations = useCallback(() => {
    setPageRotations(new Map());
  }, []);

  const handleRotate = useCallback(async () => {
    const isCustomOrder = pageOrder.some((val, i) => val !== i);
    if (!file || (pageRotations.size === 0 && !isCustomOrder)) return;
    setIsProcessing(true);
    trackEvent({ name: "tool_used", tool: "rotate-pdf" });

    try {
      const rotations: PageRotation[] = Array.from(pageRotations.entries()).map(
        ([pageIndex, angle]) => ({ pageIndex, angle })
      );
      
      const payload: any = { buffer: file.buffer, rotations };
      if (isCustomOrder) {
        payload.pageOrder = pageOrder;
      }
      
      const result = await runTask<Uint8Array>("ROTATE", payload);
      setResultBuffer(result);
      setShowAd(true);
    } catch (err) {
      console.error("Rotate failed:", err);
      alert("Failed to rotate PDF. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [file, pageRotations, runTask]);

  const handleAdComplete = useCallback(() => {
    trackEvent({ name: "download_completed", tool: "rotate-pdf" });
    if (resultBuffer) {
      downloadFile(resultBuffer, "rotated.pdf");
    }
    setShowAd(false);
  }, [resultBuffer]);

  const handleAdCancel = useCallback(() => setShowAd(false), []);

  const handleReset = useCallback(() => {
    setFile(null);
    setPageRotations(new Map());
    setPageOrder([]);
    setSelectedPages(new Set());
  }, []);

  const getRotationLabel = (angle: RotationAngle): string => {
    switch (angle) {
      case 90: return "90°";
      case 180: return "180°";
      case 270: return "270°";
      default: return "0°";
    }
  };

  return (
    <ToolPageLayout
      title="Rotate PDF"
      description="Rotate individual pages or all pages at once. Preview before downloading."
      icon={RotateCw}
      iconGradient="icon-circle-organize"
    >
      {isProcessing && <ProcessingOverlay />}
      {showAd && <PreDownloadAd onComplete={handleAdComplete} onCancel={handleAdCancel} />}
      {showAd && (
        <PreDownloadAd onComplete={handleAdComplete} onCancel={handleAdCancel} />
      )}
      {!file ? (
        <PdfDropzone
          onFilesAdded={handleFilesAdded}
          multiple={false}
          label="Drop your PDF file here"
          sublabel="Select a PDF to rotate"
        />
      ) : (
        <div className="space-y-6">
          {/* File Info */}
          <FileInfoBanner file={file} pageCount={pageCount} onReset={handleReset} />

          {/* Bulk Actions */}
          <div className="flex flex-col gap-3 glass-card p-4 rounded-xl border border-[var(--color-border-glass)]">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-[var(--color-text-primary)] mr-2">
                {selectedPages.size > 0 ? `Rotate ${selectedPages.size} selected:` : "Rotate all pages:"}
              </span>
              {([90, 180, 270] as RotationAngle[]).map((angle) => (
                <button
                  key={angle}
                  onClick={() => rotateSelectedOrAll(angle)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-bg-base)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-hover)] hover:text-[var(--color-text-primary)] border border-[var(--color-border-glass)] transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
                >
                  {angle}° CW
                </button>
              ))}
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={selectedPages.size === pageCount ? clearSelection : selectAll}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-bg-base)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-hover)] hover:text-[var(--color-text-primary)] border border-[var(--color-border-glass)] transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
                >
                  {selectedPages.size === pageCount ? "Deselect All" : "Select All"}
                </button>
                <button
                  onClick={resetRotations}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Page Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={pageOrder.map(String)} strategy={rectSortingStrategy}>
                {pageOrder.map((originalIndex) => {
                  const rotation = pageRotations.get(originalIndex) ?? 0;
                  const isRotated = rotation !== 0;
                  const pageNum = originalIndex + 1;

                  return (
                    <PagePreviewCard
                      key={originalIndex.toString()}
                      id={originalIndex.toString()}
                      doc={doc}
                      pageNum={pageNum}
                      rotation={rotation}
                      isSelected={selectedPages.has(originalIndex)}
                      isHighlighted={isRotated}
                      onClick={() => togglePageSelection(originalIndex)}
                      controls={
                        <div className="flex items-center justify-between mt-2">
                          <button
                            onClick={() => rotatePageBy(originalIndex, 270)}
                            className="p-1.5 rounded hover:bg-[var(--color-bg-surface-hover)] transition-colors hover:text-[var(--color-text-primary)]"
                            aria-label={`Rotate page ${pageNum} counter-clockwise`}
                          >
                            <RotateCcw className="w-4 h-4 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]" />
                          </button>

                          <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                            {isRotated ? getRotationLabel(rotation as RotationAngle) : `P${pageNum}`}
                          </span>

                          <button
                            onClick={() => rotatePageBy(originalIndex, 90)}
                            className="p-1.5 rounded hover:bg-[var(--color-bg-surface-hover)] transition-colors hover:text-[var(--color-text-primary)]"
                            aria-label={`Rotate page ${pageNum} clockwise`}
                          >
                            <RotateCw className="w-4 h-4 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]" />
                          </button>
                        </div>
                      }
                    />
                  );
                })}
              </SortableContext>
            </DndContext>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
            <button
              onClick={handleRotate}
              disabled={isProcessing || (pageRotations.size === 0 && !pageOrder.some((val, i) => val !== i))}
              className="btn-aurora w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(102,126,234,0.4)] transition-all duration-300 active:scale-95"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Rotating...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Rotate & Download
                </>
              )}
            </button>

            <button onClick={handleReset} className="btn-secondary w-full sm:w-auto hover:-translate-y-1 hover:shadow-lg hover:shadow-white/5 transition-all duration-300 active:scale-95">
              Start Over
            </button>
          </div>

          {pageRotations.size === 0 && !pageOrder.some((val, i) => val !== i) && (
            <p className="text-sm text-[var(--color-text-muted)]">
              Drag pages to reorder, click a page to select it, or use the rotation arrows below each page.
            </p>
          )}
        </div>
      )}
    </ToolPageLayout>
  );
}
