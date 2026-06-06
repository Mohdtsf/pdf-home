"use client";

import { useState, useCallback, useEffect } from "react";
import { FileImage, Download, Loader2, X, GripVertical } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { ProcessingOverlay } from "@/components/ui/ProcessingOverlay";
import { PreDownloadAd } from "@/components/ads/PreDownloadAd";
import { ToolPageLayout } from "@/components/layout/ToolPageLayout";
import { imagesToPdf, type PageSize, type Orientation, type PageMargin } from "@/lib/pdf/imagesToPdf";
import { downloadFile } from "@/lib/download";
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
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ImageFile {
  id: string;
  file: File;
  name: string;
  size: number;
  data: ArrayBuffer;
  type: string;
  previewUrl: string;
  width?: number;
  height?: number;
}

export function JpgToPdfClient() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>("a4");
  const [orientation, setOrientation] = useState<Orientation>("auto");
  const [margin, setMargin] = useState<PageMargin>("none");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [resultData, setResultData] = useState<any>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>('');

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("mock") === "true") {
        const mockImages: ImageFile[] = [
          {
            id: "mock-1-portrait",
            name: "portrait-image.png",
            size: 10240,
            type: "image/png",
            previewUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='800'><defs><linearGradient id='g1' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' style='stop-color:%236366f1;stop-opacity:1' /><stop offset='100%' style='stop-color:%23ec4899;stop-opacity:1' /></linearGradient></defs><rect width='600' height='800' fill='url(%23g1)'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='32' fill='white'>Portrait (600x800)</text></svg>",
            width: 600,
            height: 800,
            data: new ArrayBuffer(0),
            file: new File([], "portrait-image.png"),
          },
          {
            id: "mock-2-landscape",
            name: "landscape-image.png",
            size: 10240,
            type: "image/png",
            previewUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'><defs><linearGradient id='g2' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' style='stop-color:%2310b981;stop-opacity:1' /><stop offset='100%' style='stop-color:%2306b6d4;stop-opacity:1' /></linearGradient></defs><rect width='800' height='600' fill='url(%23g2)'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='32' fill='white'>Landscape (800x600)</text></svg>",
            width: 800,
            height: 600,
            data: new ArrayBuffer(0),
            file: new File([], "landscape-image.png"),
          },
          {
            id: "mock-3-square",
            name: "square-image.png",
            size: 10240,
            type: "image/png",
            previewUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='500' height='500'><defs><linearGradient id='g3' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' style='stop-color:%23f59e0b;stop-opacity:1' /><stop offset='100%' style='stop-color:%23ef4444;stop-opacity:1' /></linearGradient></defs><rect width='500' height='500' fill='url(%23g3)'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='32' fill='white'>Square (500x500)</text></svg>",
            width: 500,
            height: 500,
            data: new ArrayBuffer(0),
            file: new File([], "square-image.png"),
          }
        ];
        setImages(mockImages);
      }
    }
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
      setImages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleAddImages = useCallback(async (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter((f) =>
      f.type.startsWith("image/")
    );

    const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          resolve({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.onerror = () => {
          resolve({ width: 800, height: 600 });
        };
        img.src = url;
      });
    };

    const newImages: ImageFile[] = [];
    for (const file of files) {
      const data = await file.arrayBuffer();
      const previewUrl = URL.createObjectURL(file);
      const dimensions = await getImageDimensions(previewUrl);
      newImages.push({
        id: crypto.randomUUID(),
        file,
        name: file.name,
        size: file.size,
        data,
        type: file.type,
        previewUrl,
        width: dimensions.width,
        height: dimensions.height,
      });
    }

    setImages((prev) => [...prev, ...newImages]);
  }, []);

  const handleRemove = useCallback((id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) URL.revokeObjectURL(img.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const handleConvert = useCallback(async () => {
    if (images.length === 0) return;
    setIsProcessing(true);
    trackEvent({ name: "tool_used", tool: "jpg-to-pdf" });

    try {
      const result = await imagesToPdf(
        images.map((img) => ({ data: img.data, name: img.name, type: img.type })),
        pageSize,
        orientation,
        margin
      );
      setResultData(result);
      setDownloadFilename("images-to-pdf.pdf");
      setShowAd(true);
    } catch (err) {
      console.error("Conversion failed:", err);
      alert("Failed to convert images to PDF. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [images, pageSize, orientation, margin]);

  const handleReset = useCallback(() => {
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
  }, [images]);

  const handleAdComplete = useCallback(() => {
    trackEvent({ name: "download_completed", tool: "jpg-to-pdf" });
    setShowAd(false);
    if (resultData && downloadFilename) {
      setResultData(resultData);
      setDownloadFilename(downloadFilename);
      setShowAd(true);
    }
  }, [resultData, downloadFilename]);

  const handleAdCancel = useCallback(() => {
    setShowAd(false);
  }, []);

  return (
    <ToolPageLayout
      title="JPG to PDF"
      description="Convert JPG, PNG, or WEBP images into a single PDF document."
      icon={FileImage}
      iconGradient="icon-circle-convert"
    >
      {isProcessing && <ProcessingOverlay />}
      {showAd && <PreDownloadAd onComplete={handleAdComplete} onCancel={handleAdCancel} />}
      {images.length === 0 ? (
        <div
          className="dropzone"
          onClick={() => document.getElementById("img-input")?.click()}
          onDrop={(e) => { e.preventDefault(); handleAddImages(e.dataTransfer.files); }}
          onDragOver={(e) => e.preventDefault()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") document.getElementById("img-input")?.click(); }}
        >
          <input
            id="img-input"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            multiple
            onChange={(e) => { if (e.target.files) handleAddImages(e.target.files); e.target.value = ""; }}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center">
              <FileImage className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-lg font-semibold">Drop your images here</p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">JPG, PNG, or WEBP files</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Image Thumbnails */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={images.map((img) => img.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {images.map((img, index) => (
                  <JpgSortableCard
                    key={img.id}
                    img={img}
                    index={index}
                    onRemove={handleRemove}
                    pageSize={pageSize}
                    orientation={orientation}
                    margin={margin}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Add More */}
          <button
            onClick={() => document.getElementById("img-input-more")?.click()}
            className="w-full p-3 rounded-xl border-2 border-dashed border-[var(--color-border-glass)] text-sm text-[var(--color-text-secondary)] hover:border-[var(--color-border-glass-hover)] transition-colors"
          >
            + Add more images
            <input
              id="img-input-more"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              multiple
              onChange={(e) => { if (e.target.files) handleAddImages(e.target.files); e.target.value = ""; }}
              className="hidden"
            />
          </button>

          {/* Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium block mb-2">Page Size</label>
              <div className="flex gap-2">
                {(["a4", "letter", "fit"] as PageSize[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setPageSize(s)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      pageSize === s
                        ? "bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white"
                        : "bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-hover)]"
                    }`}
                  >
                    {s === "a4" ? "A4" : s === "letter" ? "Letter" : "Fit Image"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Orientation</label>
              <div className="flex gap-2">
                {(["auto", "portrait", "landscape"] as Orientation[]).map((o) => (
                  <button
                    key={o}
                    onClick={() => setOrientation(o)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                      orientation === o
                        ? "bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white"
                        : "bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-hover)]"
                    }`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Margin</label>
              <div className="flex gap-2">
                {(["none", "small", "big"] as PageMargin[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMargin(m)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                      margin === m
                        ? "bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white"
                        : "bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-hover)]"
                    }`}
                  >
                    {m === "none" ? "No Margin" : m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={handleConvert}
              disabled={isProcessing}
              className="btn-aurora w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Converting...</>
              ) : (
                <><Download className="w-5 h-5" /> Convert {images.length} Images to PDF</>
              )}
            </button>
            <button onClick={handleReset} className="btn-secondary w-full sm:w-auto">
              Start Over
            </button>
          </div>
        </div>
      )}
    </ToolPageLayout>
  );
}

interface JpgSortableCardProps {
  img: ImageFile;
  index: number;
  onRemove: (id: string) => void;
  pageSize: PageSize;
  orientation: Orientation;
  margin: PageMargin;
}

function JpgSortableCard({
  img,
  index,
  onRemove,
  pageSize,
  orientation,
  margin,
}: JpgSortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: img.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  const getPreviewStyle = () => {
    const imgWidth = img.width || 800;
    const imgHeight = img.height || 600;

    const A4 = { width: 595.28, height: 841.89 };
    const LETTER = { width: 612, height: 792 };
    
    let m = 0;
    if (margin === "small") m = 20;
    else if (margin === "big") m = 40;

    let pageWidth = A4.width;
    let pageHeight = A4.height;

    if (pageSize === "fit") {
      pageWidth = imgWidth + 2 * m;
      pageHeight = imgHeight + 2 * m;
    } else {
      const dims = pageSize === "letter" ? LETTER : A4;
      const isLandscape = orientation === "auto" ? imgWidth > imgHeight : orientation === "landscape";
      pageWidth = isLandscape ? dims.height : dims.width;
      pageHeight = isLandscape ? dims.width : dims.height;
    }

    const printableWidth = Math.max(10, pageWidth - 2 * m);
    const printableHeight = Math.max(10, pageHeight - 2 * m);

    const imgAspect = imgWidth / imgHeight;
    const printableAspect = printableWidth / printableHeight;

    let drawWidth: number;
    let drawHeight: number;

    if (imgAspect > printableAspect) {
      drawWidth = printableWidth;
      drawHeight = printableWidth / imgAspect;
    } else {
      drawHeight = printableHeight;
      drawWidth = printableHeight * imgAspect;
    }

    const widthPct = (drawWidth / pageWidth) * 100;
    const heightPct = (drawHeight / pageHeight) * 100;
    const leftPct = ((pageWidth - drawWidth) / 2 / pageWidth) * 100;
    const topPct = ((pageHeight - drawHeight) / 2 / pageHeight) * 100;

    return {
      width: `${widthPct}%`,
      height: `${heightPct}%`,
      left: `${leftPct}%`,
      top: `${topPct}%`,
      aspectRatio: `${pageWidth} / ${pageHeight}`,
    };
  };

  const previewStyle = getPreviewStyle();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-3 glass-card hover:-translate-y-1 hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 group flex flex-col items-center justify-between ${
        isDragging ? "ring-2 ring-indigo-500/50 shadow-2xl scale-105" : ""
      }`}
    >
      <div className="absolute top-2 left-2 z-10 w-6 h-6 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center shadow-md">
        {index + 1}
      </div>

      <button
        onClick={() => onRemove(img.id)}
        className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-red-500/80 hover:bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg"
        title="Remove image"
      >
        <X className="w-3 h-3" />
      </button>

      <div className="w-full h-44 flex items-center justify-center bg-slate-50/50 dark:bg-slate-950/50 rounded-lg p-3 border border-slate-100 dark:border-slate-800/80 shadow-inner">
        <div 
          className="relative shadow-md rounded overflow-hidden bg-white border border-slate-200 dark:border-slate-800 transition-all flex-shrink-0 flex items-center justify-center max-w-full max-h-full"
          style={{ 
            aspectRatio: previewStyle.aspectRatio,
            width: parseFloat(previewStyle.aspectRatio) > 1 ? "100%" : "auto",
            height: parseFloat(previewStyle.aspectRatio) > 1 ? "auto" : "100%",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img.previewUrl}
            alt={img.name}
            className="absolute object-contain shadow-[0_1px_4px_rgba(0,0,0,0.1)] border border-slate-200/40 rounded-[2px]"
            style={{
              width: previewStyle.width,
              height: previewStyle.height,
              left: previewStyle.left,
              top: previewStyle.top,
            }}
          />
        </div>
      </div>

      <div className="flex flex-col items-center justify-between w-full mt-3 gap-2">
        <div className="text-xs font-medium text-center text-[var(--color-text-secondary)] truncate w-full px-1" title={img.name}>
          {img.name}
        </div>
        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-full">
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
