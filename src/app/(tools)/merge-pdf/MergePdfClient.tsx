"use client";
import { useToast } from "@/components/ui/Toast";

import { useState, useCallback } from "react";
import { Merge, Download, Plus, Loader2, Smartphone } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { ProcessingOverlay } from "@/components/ui/ProcessingOverlay";
import { ToolPageLayout } from "@/components/layout/ToolPageLayout";
import { PdfDropzone, type PdfFile } from "@/components/pdf/PdfDropzone";
import { FilePreviewCard } from "@/components/pdf/FilePreviewCard";
import { downloadFile } from "@/lib/download";
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

export function MergePdfClient() {
  const { showToast } = useToast();
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [resultBuffer, setResultBuffer] = useState<Uint8Array | null>(null);
  const { runTask } = usePdfWorker();

  const handleFilesAdded = useCallback((newFiles: PdfFile[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
    setIsDone(false);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFiles((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleRemove = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleMerge = useCallback(async () => {
    if (files.length < 2) return;
    setIsProcessing(true);
    trackEvent({ name: "tool_used", tool: "merge-pdf" });

    try {
      const buffers = files.map((f) => f.buffer);
      const result = await runTask<Uint8Array>("MERGE", { buffers });
      setResultBuffer(result);
      setShowAd(true);
    } catch (err) {
      console.error("Merge failed:", err);
      showToast("Failed to merge PDFs. Please try again.", "error");
    } finally {
      setIsProcessing(false);
    }
  }, [files, runTask]);

  const handleAdComplete = useCallback(() => {
    trackEvent({ name: "download_completed", tool: "merge-pdf" });
    if (resultBuffer) {
      downloadFile(resultBuffer, "merged.pdf");
      setIsDone(true);
    }
    setShowAd(false);
  }, [resultBuffer]);

  const handleAdCancel = useCallback(() => {
    setShowAd(false);
  }, []);

  const handleReset = useCallback(() => {
    setFiles([]);
    setIsDone(false);
  }, []);

  return (
    <ToolPageLayout
      title="Merge PDF"
      description="Combine multiple PDF files into one document. Drag to reorder, then merge."
      icon={Merge}
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
        pdfBlob={resultBuffer ? new Blob([resultBuffer as any], { type: "application/pdf" }) : null} 
        fileName="merged.pdf" 
      />
      {files.length === 0 ? (
        <PdfDropzone
          onFilesAdded={handleFilesAdded}
          multiple
          maxFiles={20}
          label="Drop PDF files to merge"
          sublabel="Select 2 or more PDF files"
        />
      ) : (
        <div className="space-y-4">
          {/* File List */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={files.map(f => f.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {files.map((file, index) => (
                  <FilePreviewCard
                    key={file.id}
                    file={file}
                    index={index}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Add More Files */}
          <PdfDropzone
            onFilesAdded={handleFilesAdded}
            multiple
            maxFiles={20 - files.length}
            label="Add more PDF files"
            sublabel="Drop or click to add"
          />

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
            <button
              onClick={isDone ? () => downloadFile(resultBuffer!, "merged.pdf") : handleMerge}
              disabled={files.length < 2 || (isProcessing && !isDone)}
              className="btn-aurora w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(102,126,234,0.4)] transition-all duration-300 active:scale-95"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Merging...
                </>
              ) : isDone ? (
                <>
                  <Download className="w-5 h-5" />
                  Download Again
                </>
              ) : (
                <>
                  <Merge className="w-5 h-5" />
                  Merge {files.length} PDFs
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

            <button
              onClick={handleReset}
              className="btn-secondary w-full sm:w-auto hover:-translate-y-1 hover:shadow-lg hover:shadow-white/5 transition-all duration-300 active:scale-95"
            >
              Start Over
            </button>
          </div>

          {files.length < 2 && (
            <p className="text-sm text-yellow-400/80 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add at least 2 files to merge
            </p>
          )}
        </div>
      )}
    </ToolPageLayout>
  );
}
