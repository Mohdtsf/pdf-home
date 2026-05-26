"use client";

import { useState, useCallback } from "react";
import { FileImage, Download, Loader2, X, GripVertical } from "lucide-react";
import { ToolPageLayout } from "@/components/layout/ToolPageLayout";
import { imagesToPdf, type PageSize, type Orientation } from "@/lib/pdf/imagesToPdf";
import { downloadFile } from "@/lib/download";

interface ImageFile {
  id: string;
  file: File;
  name: string;
  size: number;
  data: ArrayBuffer;
  type: string;
  previewUrl: string;
}

export function JpgToPdfClient() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>("a4");
  const [orientation, setOrientation] = useState<Orientation>("auto");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAddImages = useCallback(async (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter((f) =>
      f.type.startsWith("image/")
    );

    const newImages: ImageFile[] = [];
    for (const file of files) {
      const data = await file.arrayBuffer();
      newImages.push({
        id: crypto.randomUUID(),
        file,
        name: file.name,
        size: file.size,
        data,
        type: file.type,
        previewUrl: URL.createObjectURL(file),
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

    try {
      const result = await imagesToPdf(
        images.map((img) => ({ data: img.data, name: img.name, type: img.type })),
        pageSize,
        orientation
      );
      downloadFile(result, "images-to-pdf.pdf");
    } catch (err) {
      console.error("Conversion failed:", err);
      alert("Failed to convert images to PDF. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [images, pageSize, orientation]);

  const handleReset = useCallback(() => {
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
  }, [images]);

  return (
    <ToolPageLayout
      title="JPG to PDF"
      description="Convert JPG, PNG, or WEBP images into a single PDF document."
      icon={FileImage}
      iconGradient="icon-circle-convert"
    >
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
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {images.map((img) => (
              <div key={img.id} className="relative group rounded-xl overflow-hidden border border-[var(--color-border-glass)] bg-[var(--color-bg-surface)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.previewUrl} alt={img.name} className="w-full aspect-[3/4] object-cover" />
                <button
                  onClick={() => handleRemove(img.id)}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
                <p className="text-xs text-center py-1 text-[var(--color-text-muted)] truncate px-1">{img.name}</p>
              </div>
            ))}
          </div>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
