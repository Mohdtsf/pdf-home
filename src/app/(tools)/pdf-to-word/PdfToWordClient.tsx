"use client";
import { useToast } from "@/components/ui/Toast";

import { useState, useCallback } from "react";
import { FileText, Download, Loader2, RefreshCw, CheckCircle2 } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { ProcessingOverlay } from "@/components/ui/ProcessingOverlay";
import { PreDownloadAd } from "@/components/ads/PreDownloadAd";
import { ToolPageLayout } from "@/components/layout/ToolPageLayout";
import { PdfDropzone, type PdfFile } from "@/components/pdf/PdfDropzone";
import { FilePreviewCard } from "@/components/pdf/FilePreviewCard";
import { uploadFile, pollJobStatus } from "@/lib/api";
import { downloadAsZip } from "@/lib/download";
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

export function PdfToWordClient() {
  const { showToast } = useToast();
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [results, setResults] = useState<{ url: string; baseName: string }[]>([]);
  const [useOcr, setUseOcr] = useState(false);

  const handleFilesAdded = useCallback((newFiles: PdfFile[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
    setIsDone(false);
    setResults([]);
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
    setIsDone(false);
    setResults([]);
  }, []);

  const handleConvert = useCallback(async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    trackEvent({ name: "tool_used", tool: "pdf-to-word" });
    setResults([]);

    try {
      const convertPromises = files.map(async (file) => {
        const fileToUpload = new File([file.buffer], file.name, { type: 'application/pdf' });
        const { jobId } = await uploadFile('/convert', fileToUpload, { 
          targetFormat: 'docx',
          useOcr: useOcr.toString(),
        });
        
        const url = await pollJobStatus(jobId, (progress) => {
          console.log(`Conversion progress (${file.name}): ${progress}%`);
        });

        const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        return { url, baseName };
      });

      const completedResults = await Promise.all(convertPromises);
      setResults(completedResults);
      setShowAd(true);
    } catch (err) {
      console.error("Conversion failed:", err);
      showToast("Failed to convert PDF to Word. Please try again or check your backend connection.", "error");
    } finally {
      setIsProcessing(false);
    }
  }, [files, useOcr, showToast]);

  const handleDownload = useCallback(async () => {
    if (results.length === 0) return;
    
    if (results.length === 1) {
      const a = document.createElement("a");
      a.href = results[0].url;
      a.download = `${results[0].baseName}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      showToast("Preparing ZIP file for download...", "success");
      try {
        const downloadedFiles = await Promise.all(
          results.map(async (r) => {
            const resp = await fetch(r.url);
            const buf = await resp.arrayBuffer();
            return { filename: `${r.baseName}.docx`, data: new Uint8Array(buf) };
          })
        );
        await downloadAsZip(downloadedFiles, "converted-word-files.zip");
      } catch (err) {
        console.error("Failed to download zip:", err);
        showToast("Failed to create ZIP file. Try downloading individually.", "error");
      }
    }
  }, [results, showToast]);

  const handleAdComplete = useCallback(() => {
    trackEvent({ name: "download_completed", tool: "pdf-to-word" });
    handleDownload();
    setIsDone(true);
    setShowAd(false);
  }, [handleDownload]);

  const handleAdCancel = useCallback(() => {
    setShowAd(false);
    setIsDone(true);
  }, []);

  const handleReset = useCallback(() => {
    setFiles([]);
    setResults([]);
    setIsDone(false);
  }, []);

  return (
    <ToolPageLayout
      title="PDF to Word"
      description="Convert your PDF files to editable DOCX documents with high accuracy."
      icon={FileText}
      iconGradient="icon-circle-convert"
    >
      {isProcessing && <ProcessingOverlay />}
      {showAd && <PreDownloadAd onComplete={handleAdComplete} onCancel={handleAdCancel} />}
      
      {files.length === 0 ? (
        <PdfDropzone
          onFilesAdded={handleFilesAdded}
          multiple
          maxFiles={20}
          label="Drop your PDF files here"
          sublabel="Select PDFs to convert to Word"
        />
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Area: Files Preview */}
          <div className="flex-1 space-y-6">
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
            
            {files.length < 20 && (
              <PdfDropzone
                onFilesAdded={handleFilesAdded}
                multiple
                maxFiles={20 - files.length}
                label="Add more PDF files"
                sublabel="Drop or click to add"
              />
            )}
          </div>

          {/* Right Sidebar: Conversion Options */}
          <div className="w-full lg:w-[320px] shrink-0">
            <div className="glass-card p-5 rounded-xl border border-[var(--color-border-glass)] sticky top-24">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" /> Conversion Options
              </h3>
              
              <div className="space-y-3">
                {/* NO OCR Option */}
                <label className={`block cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 ${!useOcr ? 'border-indigo-500 bg-indigo-500/5 shadow-sm' : 'border-[var(--color-border-glass)] bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-surface-hover)]'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm">NO OCR</span>
                    {!useOcr && <CheckCircle2 className="w-5 h-5 text-indigo-500" />}
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)]">Convert PDFs with selectable text into editable Word files.</p>
                  <input type="radio" className="hidden" checked={!useOcr} onChange={() => setUseOcr(false)} />
                </label>

                {/* OCR Option */}
                <label className={`block cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 ${useOcr ? 'border-indigo-500 bg-indigo-500/5 shadow-sm' : 'border-[var(--color-border-glass)] bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-surface-hover)]'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">OCR</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/20 text-green-600 dark:text-green-400">Free</span>
                    </div>
                    {useOcr && <CheckCircle2 className="w-5 h-5 text-indigo-500" />}
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)]">Convert scanned PDFs with non-selectable text into editable Word files.</p>
                  <input type="radio" className="hidden" checked={useOcr} onChange={() => setUseOcr(true)} />
                </label>
              </div>

              <div className="mt-6 space-y-3">
                {!isDone ? (
                  <button
                    onClick={handleConvert}
                    disabled={isProcessing}
                    className="btn-aurora w-full flex items-center justify-center gap-2 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(102,126,234,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                    ) : (
                      <><RefreshCw className="w-5 h-5" /> Convert to Word</>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleDownload}
                    className="btn-aurora w-full flex items-center justify-center gap-2 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(102,126,234,0.4)] transition-all duration-300 animate-bounce"
                  >
                    <Download className="w-5 h-5" /> Download {results.length > 1 ? 'ZIP' : 'Word'} File
                  </button>
                )}
                <button
                  onClick={handleReset}
                  className="btn-secondary w-full hover:-translate-y-1 transition-all duration-300"
                >
                  Start Over
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ToolPageLayout>
  );
}
