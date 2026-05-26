"use client";

import { useState, useCallback } from "react";
import { Droplets, Download, Loader2, FileText } from "lucide-react";
import { ToolPageLayout } from "@/components/layout/ToolPageLayout";
import { PdfDropzone, type PdfFile } from "@/components/pdf/PdfDropzone";
import { addWatermark } from "@/lib/pdf/watermark";
import { downloadFile } from "@/lib/download";

const PRESET_COLORS = [
  { name: "Gray", r: 0.5, g: 0.5, b: 0.5 },
  { name: "Red", r: 0.8, g: 0.1, b: 0.1 },
  { name: "Blue", r: 0.1, g: 0.1, b: 0.8 },
  { name: "Black", r: 0, g: 0, b: 0 },
  { name: "Green", r: 0.1, g: 0.6, b: 0.1 },
];

export function AddWatermarkClient() {
  const [file, setFile] = useState<PdfFile | null>(null);
  const [text, setText] = useState("CONFIDENTIAL");
  const [fontSize, setFontSize] = useState(60);
  const [opacity, setOpacity] = useState(0.3);
  const [rotation, setRotation] = useState(-45);
  const [colorIdx, setColorIdx] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFilesAdded = useCallback((files: PdfFile[]) => {
    setFile(files[0]);
  }, []);

  const handleApply = useCallback(async () => {
    if (!file || !text.trim()) return;
    setIsProcessing(true);

    try {
      const color = PRESET_COLORS[colorIdx];
      const result = await addWatermark(file.buffer, {
        text,
        fontSize,
        opacity,
        rotation,
        color,
      });
      downloadFile(result, "watermarked.pdf");
    } catch (err) {
      console.error("Watermark failed:", err);
      alert("Failed to add watermark. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [file, text, fontSize, opacity, rotation, colorIdx]);

  const handleReset = useCallback(() => setFile(null), []);

  return (
    <ToolPageLayout
      title="Add Watermark"
      description="Stamp a text watermark on every page of your PDF."
      icon={Droplets}
      iconGradient="icon-circle-edit"
    >
      {!file ? (
        <PdfDropzone onFilesAdded={handleFilesAdded} multiple={false} label="Drop your PDF file here" sublabel="Select a PDF to watermark" />
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-bg-surface)]">
            <FileText className="w-5 h-5 text-[var(--color-text-secondary)]" />
            <p className="text-sm font-medium">{file.name}</p>
            <button onClick={handleReset} className="ml-auto text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] underline">Change file</button>
          </div>

          {/* Watermark Text */}
          <div>
            <label className="text-sm font-medium block mb-2">Watermark Text</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-glass)] text-[var(--color-text-primary)] text-sm focus:border-[#6366f1] focus:outline-none"
              placeholder="e.g. CONFIDENTIAL, DRAFT, DO NOT COPY"
            />
          </div>

          {/* Live Preview */}
          <div className="relative p-8 rounded-xl bg-white border border-[var(--color-border-glass)] flex items-center justify-center min-h-[180px] overflow-hidden">
            <p className="text-[var(--color-text-muted)] text-sm absolute z-0">PDF Page Preview</p>
            <p
              className="relative z-10 font-bold select-none whitespace-nowrap"
              style={{
                fontSize: `${Math.min(fontSize, 40)}px`,
                opacity: opacity,
                transform: `rotate(${rotation}deg)`,
                color: `rgb(${PRESET_COLORS[colorIdx].r * 255}, ${PRESET_COLORS[colorIdx].g * 255}, ${PRESET_COLORS[colorIdx].b * 255})`,
              }}
            >
              {text || "WATERMARK"}
            </p>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-2">Font Size: {fontSize}px</label>
              <input type="range" min={20} max={120} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full accent-[#6366f1]" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Opacity: {Math.round(opacity * 100)}%</label>
              <input type="range" min={5} max={100} value={opacity * 100} onChange={(e) => setOpacity(Number(e.target.value) / 100)} className="w-full accent-[#6366f1]" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Rotation: {rotation}°</label>
              <input type="range" min={-90} max={90} value={rotation} onChange={(e) => setRotation(Number(e.target.value))} className="w-full accent-[#6366f1]" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Color</label>
              <div className="flex gap-2">
                {PRESET_COLORS.map((c, i) => (
                  <button
                    key={c.name}
                    onClick={() => setColorIdx(i)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${colorIdx === i ? "border-[#6366f1] scale-110" : "border-[var(--color-border-glass)]"}`}
                    style={{ background: `rgb(${c.r * 255}, ${c.g * 255}, ${c.b * 255})` }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button onClick={handleApply} disabled={isProcessing || !text.trim()} className="btn-aurora w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> Applying...</> : <><Download className="w-5 h-5" /> Add Watermark & Download</>}
            </button>
            <button onClick={handleReset} className="btn-secondary w-full sm:w-auto">Start Over</button>
          </div>
        </div>
      )}
    </ToolPageLayout>
  );
}
