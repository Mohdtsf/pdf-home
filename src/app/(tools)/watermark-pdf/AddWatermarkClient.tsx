"use client";

import { useState, useCallback, useEffect } from "react";
import { Droplets, Download, Loader2, FileText, Image as ImageIcon, Bold, Italic, Underline } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { ProcessingOverlay } from "@/components/ui/ProcessingOverlay";
import { PreDownloadAd } from "@/components/ads/PreDownloadAd";
import { ToolPageLayout } from "@/components/layout/ToolPageLayout";
import { PdfDropzone, type PdfFile } from "@/components/pdf/PdfDropzone";
import { PdfViewer } from "@/components/pdf/PdfViewer";
import { usePdfDocument } from "@/hooks/usePdfDocument";
import { addWatermark } from "@/lib/pdf/watermark";
import { downloadFile } from "@/lib/download";

const PRESET_COLORS = [
  { name: "Gray", r: 0.5, g: 0.5, b: 0.5, hex: "#808080" },
  { name: "Red", r: 0.88, g: 0.28, b: 0.28, hex: "#e14747" },
  { name: "Blue", r: 0.18, g: 0.36, b: 0.90, hex: "#2e5ce6" },
  { name: "Black", r: 0, g: 0, b: 0, hex: "#000000" },
  { name: "Green", r: 0.13, g: 0.59, b: 0.34, hex: "#219653" },
];

type WatermarkPosition =
  | "top-left" | "top-center" | "top-right"
  | "middle-left" | "middle-center" | "middle-right"
  | "bottom-left" | "bottom-center" | "bottom-right";

export function AddWatermarkClient() {
  const [file, setFile] = useState<PdfFile | null>(null);
  const [type, setType] = useState<"text" | "image">("text");

  // Text Options
  const [text, setText] = useState("Confidential");
  const [fontFamily, setFontFamily] = useState<"helvetica" | "times" | "courier">("helvetica");
  const [fontSize, setFontSize] = useState(40);
  const [colorIdx, setColorIdx] = useState(1); // Default Red preset
  const [customColor, setCustomColor] = useState("#e14747");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  // Image Options
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageScale, setImageScale] = useState(0.5);

  // Common Options
  const [position, setPosition] = useState<WatermarkPosition>("middle-center");
  const [isMosaic, setIsMosaic] = useState(false);
  const [opacity, setOpacity] = useState(0.4);
  const [rotation, setRotation] = useState(-45);
  const [layer, setLayer] = useState<"over" | "under">("over");

  // Page range states
  const [fromPage, setFromPage] = useState(1);
  const [toPage, setToPage] = useState(1);

  const [isProcessing, setIsProcessing] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [resultData, setResultData] = useState<any>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>('');

  // Load PDF Document for client page rendering and page count validation
  const { doc, pageCount } = usePdfDocument(file?.buffer ?? null);

  useEffect(() => {
    if (pageCount > 0) {
      setFromPage(1);
      setToPage(pageCount);
    }
  }, [pageCount]);

  const handleFilesAdded = useCallback((files: PdfFile[]) => {
    setFile(files[0]);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setImageFile(selectedFile);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const hexToRgb = (hex: string) => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
    return result
      ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
      : { r: 0.5, g: 0.5, b: 0.5 };
  };

  const getActiveColor = () => {
    if (colorIdx === -1) {
      return hexToRgb(customColor);
    }
    const preset = PRESET_COLORS[colorIdx];
    return { r: preset.r, g: preset.g, b: preset.b };
  };

  const handleApply = useCallback(async () => {
    if (!file) return;
    setIsProcessing(true);
    trackEvent({ name: "tool_used", tool: "watermark-pdf" });

    try {
      let imageBuffer: ArrayBuffer | undefined;
      let imgType: "png" | "jpeg" = "png";

      if (type === "image" && imageFile) {
        imageBuffer = await imageFile.arrayBuffer();
        imgType = imageFile.type.includes("jpeg") || imageFile.type.includes("jpg") ? "jpeg" : "png";
      }

      const activeColor = getActiveColor();

      const result = await addWatermark(file.buffer, {
        type,
        text,
        fontFamily,
        fontSize,
        color: activeColor,
        isBold,
        isItalic,
        isUnderline,
        imageBuffer,
        imageType: imgType,
        imageScale,
        position,
        isMosaic,
        opacity,
        rotation,
        layer,
        fromPage,
        toPage,
      });

      downloadFile(result, `${file.name.replace(".pdf", "")}_watermarked.pdf`);
    } catch (err) {
      console.error("Watermark failed:", err);
      alert("Failed to apply watermark. Please check options and try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [file, type, text, fontFamily, fontSize, colorIdx, customColor, isBold, isItalic, isUnderline, imageFile, imageScale, position, isMosaic, opacity, rotation, layer, fromPage, toPage]);

  const handleReset = useCallback(() => {
    setFile(null);
    setImageFile(null);
    setImagePreviewUrl(null);
  }, []);

  const getPositionFlexClasses = (pos: WatermarkPosition) => {
    switch (pos) {
      case "top-left": return "items-start justify-start text-left";
      case "top-center": return "items-start justify-center text-center";
      case "top-right": return "items-start justify-end text-right";
      case "middle-left": return "items-center justify-start text-left";
      case "middle-center": return "items-center justify-center text-center";
      case "middle-right": return "items-center justify-end text-right";
      case "bottom-left": return "items-end justify-start text-left";
      case "bottom-center": return "items-end justify-center text-center";
      case "bottom-right": return "items-end justify-end text-right";
      default: return "items-center justify-center text-center";
    }
  };

  const activeColorObject = getActiveColor();

  // Multi-page scale factor to adjust visual overlays in smaller layout cells
  const PREVIEW_SCALE_FACTOR = 0.35;

  const scaledWatermarkElementStyle = {
    opacity: opacity,
    transform: `rotate(${rotation}deg)`,
    transformOrigin: "center",
    transition: "all 0.15s ease-out",
  };

  const renderScaledWatermarkElement = () => {
    if (type === "text") {
      return (
        <span
          className={`whitespace-nowrap select-none font-medium leading-none ${fontFamily === "courier" ? "font-mono" : fontFamily === "times" ? "font-serif" : "font-sans"
            } ${isBold ? "font-bold" : ""} ${isItalic ? "italic" : ""} ${isUnderline ? "underline" : ""}`}
          style={{
            fontSize: `${Math.max(6, fontSize * PREVIEW_SCALE_FACTOR)}px`,
            color: `rgb(${activeColorObject.r * 255}, ${activeColorObject.g * 255}, ${activeColorObject.b * 255})`,
          }}
        >
          {text || "WATERMARK"}
        </span>
      );
    } else {
      if (imagePreviewUrl) {
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imagePreviewUrl}
            alt="watermark preview"
            style={{
              width: `${Math.max(15, imageScale * 180 * PREVIEW_SCALE_FACTOR)}px`,
              height: "auto",
            }}
            className="max-w-none object-contain select-none"
          />
        );
      }
      return (
        <div className="p-1 border border-dashed border-indigo-400/50 rounded bg-indigo-500/10 text-[6px] text-indigo-500 font-medium text-center">
          [Img]
        </div>
      );
    }
  };

  const handleAdComplete = useCallback(() => {
    trackEvent({ name: "download_completed", tool: "watermark-pdf" });
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
      title="Add Watermark"
      description="Add a customizable text or image watermark over your PDF pages."
      icon={Droplets}
      iconGradient="icon-circle-edit"
      maxWidth="max-w-7xl"
    >
      {isProcessing && <ProcessingOverlay />}
      {showAd && <PreDownloadAd onComplete={handleAdComplete} onCancel={handleAdCancel} />}
      {!file ? (
        <PdfDropzone
          onFilesAdded={handleFilesAdded}
          multiple={false}
          label="Drop your PDF file here"
          sublabel="Select a PDF to begin watermarking"
        />
      ) : (
        <div className="space-y-6 max-w-7xl mx-auto">
          {/* Top File info bar */}
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--color-bg-base)] border border-[var(--color-border-glass)] shadow-sm transition-colors">
            <FileText className="w-5 h-5 text-[var(--color-text-secondary)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">{file.name}</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB • {pageCount} pages</p>
            </div>
            <button
              onClick={handleReset}
              className="ml-auto text-xs font-semibold text-[var(--color-text-secondary)] hover:text-indigo-600 underline transition-colors"
            >
              Change file
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Scrollable Grid representing all pages cleanly */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col p-5 bg-[var(--color-bg-base)] rounded-2xl border border-[var(--color-border-glass)] shadow-inner">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Live Preview ({pageCount} {pageCount === 1 ? "Page" : "Pages"})
                </p>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-500 font-semibold px-2.5 py-1 rounded-full border border-indigo-500/20">
                  Scale Accurate Preview
                </span>
              </div>

              {/* Scrollable grid of page cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 max-h-[640px] overflow-y-auto pr-2 scrollbar-thin">
                {Array.from({ length: pageCount }).map((_, idx) => {
                  const pageNum = idx + 1;
                  const isPageStamped = pageNum >= fromPage && pageNum <= toPage;

                  return (
                    <div
                      key={pageNum}
                      className={`relative flex flex-col items-center p-3 rounded-xl border transition-all duration-300 ${isPageStamped
                        ? "border-indigo-500/30 bg-[var(--color-bg-surface)] shadow-sm"
                        : "border-[var(--color-border-glass)] bg-[var(--color-bg-base)] opacity-50"
                        }`}
                    >
                      {/* Page Sheet Container */}
                      <div className="relative w-full aspect-[3/4] bg-white rounded-lg border border-[var(--color-border-glass)] overflow-hidden shadow-sm flex items-center justify-center">
                        {doc ? (
                          <PdfViewer doc={doc} pageNumber={pageNum} className="w-full h-full object-contain" />
                        ) : (
                          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        )}

                        {/* Stamped visual overlay */}
                        {doc && isPageStamped && (
                          <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                            {isMosaic ? (
                              <div className="w-full h-full grid grid-cols-3 grid-rows-4 p-2 gap-1 items-center justify-items-center">
                                {Array.from({ length: 12 }).map((_, mIdx) => (
                                  <div key={mIdx} style={scaledWatermarkElementStyle}>
                                    {renderScaledWatermarkElement()}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className={`w-full h-full absolute inset-0 flex p-3 ${getPositionFlexClasses(position)}`}>
                                <div style={scaledWatermarkElementStyle}>
                                  {renderScaledWatermarkElement()}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Page unstamped block */}
                        {!isPageStamped && (
                          <div className="absolute inset-0 bg-slate-100/20 backdrop-blur-[0.5px] flex items-center justify-center">
                            <span className="text-[9px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] bg-[var(--color-bg-surface)] border border-[var(--color-border-glass)] px-2 py-0.5 rounded shadow-sm">
                              No Stamp
                            </span>
                          </div>
                        )}
                      </div>

                      <span className="text-[10px] font-semibold text-[var(--color-text-secondary)] mt-2">
                        Page {pageNum}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Premium sidebar settings card (sticky and independently scrollable) */}
            <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-6 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto pr-1 space-y-5 bg-[var(--color-bg-surface)] p-5 rounded-2xl border border-[var(--color-border-glass)] shadow-xl transition-colors text-[var(--color-text-primary)]">
              <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Watermark Options</h3>

              {/* Text / Image Select Tabs */}
              <div className="flex bg-[var(--color-bg-base)] p-1 rounded-xl border border-[var(--color-border-glass)]">
                <button
                  type="button"
                  onClick={() => setType("text")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${type === "text"
                    ? "bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow-md"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-hover)]"
                    }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Place text
                </button>
                <button
                  type="button"
                  onClick={() => setType("image")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${type === "image"
                    ? "bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow-md"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-hover)]"
                    }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  Place image
                </button>
              </div>

              {/* Text Form options */}
              {type === "text" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1">Text</label>
                    <input
                      type="text"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-[var(--color-bg-surface-hover)] border border-[var(--color-border-glass)] text-[var(--color-text-primary)] text-sm focus:border-indigo-500 focus:outline-none transition-colors"
                      placeholder="CONFIDENTIAL"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1">Font Family</label>
                      <select
                        value={fontFamily}
                        onChange={(e) => setFontFamily(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-surface-hover)] border border-[var(--color-border-glass)] text-[var(--color-text-primary)] text-xs focus:border-indigo-500 focus:outline-none transition-colors"
                      >
                        <option value="helvetica">Arial / Helvetica</option>
                        <option value="times">Times New Roman</option>
                        <option value="courier">Courier / Mono</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1">Size: {fontSize}px</label>
                      <input
                        type="range"
                        min={10}
                        max={100}
                        value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                        className="w-full accent-[#6366f1] mt-2.5"
                      />
                    </div>
                  </div>

                  {/* Font Stylers (B, I, U) */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsBold(!isBold)}
                      className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold flex items-center justify-center transition-all ${isBold
                        ? "border-[#6366f1] bg-[#6366f1]/10 text-[#6366f1]"
                        : "border-[var(--color-border-glass)] bg-[var(--color-bg-surface-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                        }`}
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsItalic(!isItalic)}
                      className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold flex items-center justify-center transition-all ${isItalic
                        ? "border-[#6366f1] bg-[#6366f1]/10 text-[#6366f1]"
                        : "border-[var(--color-border-glass)] bg-[var(--color-bg-surface-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                        }`}
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsUnderline(!isUnderline)}
                      className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold flex items-center justify-center transition-all ${isUnderline
                        ? "border-[#6366f1] bg-[#6366f1]/10 text-[#6366f1]"
                        : "border-[var(--color-border-glass)] bg-[var(--color-bg-surface-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                        }`}
                    >
                      <Underline className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Colors Picker */}
                  <div>
                    <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1">Text Color</label>
                    <div className="flex flex-wrap items-center gap-2">
                      {PRESET_COLORS.map((c, i) => (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => setColorIdx(i)}
                          className={`w-6 h-6 rounded-full border transition-all ${colorIdx === i ? "border-[#6366f1] scale-110 shadow-md ring-2 ring-indigo-500/20" : "border-[var(--color-border-glass)]"
                            }`}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        />
                      ))}

                      {/* Custom Picker Color */}
                      <div className="relative flex items-center gap-1.5 ml-1">
                        <input
                          type="color"
                          value={customColor}
                          onChange={(e) => {
                            setCustomColor(e.target.value);
                            setColorIdx(-1);
                          }}
                          className="w-6 h-6 rounded-full overflow-hidden border border-[var(--color-border-glass)] cursor-pointer"
                        />
                        <span className="text-[10px] font-semibold text-[var(--color-text-secondary)]">Custom</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Image Form Options */}
              {type === "image" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1.5">Select Image</label>
                    <div className="flex flex-col items-center gap-3 p-4 border border-dashed border-[var(--color-border-glass)] rounded-xl bg-[var(--color-bg-base)]">
                      {imagePreviewUrl ? (
                        <div className="relative w-16 h-16 border border-[var(--color-border-glass)] rounded-lg overflow-hidden bg-white shadow-sm flex items-center justify-center p-1">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imagePreviewUrl} alt="preview" className="max-w-full max-h-full object-contain" />
                        </div>
                      ) : (
                        <ImageIcon className="w-7 h-7 text-[var(--color-text-muted)]" />
                      )}

                      <label className="cursor-pointer btn-secondary text-xs px-4 py-1.5 flex items-center justify-center gap-2">
                        Add Image
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[9px] text-[var(--color-text-muted)] text-center">Supports PNG or JPG images</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1">Image Scale: {Math.round(imageScale * 100)}%</label>
                    <input
                      type="range"
                      min={10}
                      max={150}
                      value={imageScale * 100}
                      onChange={(e) => setImageScale(Number(e.target.value) / 100)}
                      className="w-full accent-[#6366f1]"
                    />
                  </div>
                </div>
              )}

              {/* Grid Position & Rotation Box */}
              <div className="grid grid-cols-2 gap-4 items-start">
                <div>
                  <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1.5">Position</label>
                  <div className="flex gap-3 items-center">
                    <div className="w-16 h-16 flex-shrink-0 border border-[var(--color-border-glass)] grid grid-cols-3 grid-rows-3 gap-1 p-1 bg-[var(--color-bg-base)] rounded-xl transition-colors">
                      {(["top-left", "top-center", "top-right", "middle-left", "middle-center", "middle-right", "bottom-left", "bottom-center", "bottom-right"] as WatermarkPosition[]).map((pos) => (
                        <button
                          key={pos}
                          type="button"
                          disabled={isMosaic}
                          onClick={() => setPosition(pos)}
                          className={`rounded-md flex items-center justify-center transition-all ${isMosaic
                            ? "bg-red-500/10"
                            : position === pos
                              ? "bg-red-500/90 shadow-sm"
                              : "bg-[var(--color-bg-surface-hover)] hover:bg-[var(--color-bg-surface)]"
                            }`}
                        >
                          <div className={`w-1 h-1 rounded-full ${isMosaic || position === pos ? "bg-white" : "bg-[var(--color-text-muted)]"}`} />
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        id="mosaic"
                        checked={isMosaic}
                        onChange={(e) => setIsMosaic(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-[var(--color-border-glass)] text-indigo-600 focus:ring-indigo-500 accent-[#6366f1]"
                      />
                      <label htmlFor="mosaic" className="text-[10px] font-bold text-[var(--color-text-secondary)] select-none cursor-pointer">Mosaic</label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1">Rotation</label>
                  <select
                    value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-surface-hover)] border border-[var(--color-border-glass)] text-[var(--color-text-primary)] text-xs focus:border-indigo-500 focus:outline-none transition-colors"
                  >
                    <option value={0}>0° Horizontal</option>
                    <option value={45}>45° Diagonal</option>
                    <option value={-45}>-45° Diagonal</option>
                    <option value={90}>90° Vertical</option>
                    <option value={180}>180° Inverted</option>
                  </select>
                </div>
              </div>

              {/* Slider for Transparency & Layer Placement */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1">Transparency</label>
                  <select
                    value={1 - opacity}
                    onChange={(e) => setOpacity(1 - Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-surface-hover)] border border-[var(--color-border-glass)] text-[var(--color-text-primary)] text-xs focus:border-indigo-500 focus:outline-none transition-colors"
                  >
                    <option value={0}>0% (Solid)</option>
                    <option value={0.25}>25% Transparent</option>
                    <option value={0.4}>40% Transparent</option>
                    <option value={0.5}>50% Transparent</option>
                    <option value={0.75}>75% Transparent</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1">Layer Placement</label>
                  <div className="flex bg-[var(--color-bg-base)] p-0.5 rounded-xl border border-[var(--color-border-glass)]">
                    <button
                      type="button"
                      onClick={() => setLayer("over")}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${layer === "over"
                        ? "bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] shadow-sm"
                        : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                        }`}
                    >
                      Over PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => setLayer("under")}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${layer === "under"
                        ? "bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] shadow-sm"
                        : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                        }`}
                    >
                      Below PDF
                    </button>
                  </div>
                </div>
              </div>

              {/* Pages range selection */}
              <div>
                <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1.5">Pages To Stamp</label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 flex items-center gap-2 bg-[var(--color-bg-surface-hover)] border border-[var(--color-border-glass)] p-2 rounded-xl">
                    <span className="text-[10px] text-[var(--color-text-secondary)] font-bold">From</span>
                    <input
                      type="number"
                      min={1}
                      max={pageCount || 1}
                      value={fromPage}
                      onChange={(e) => setFromPage(Math.min(pageCount || 1, Math.max(1, Number(e.target.value))))}
                      className="w-full bg-transparent border-none text-[var(--color-text-primary)] focus:outline-none text-xs font-bold text-center"
                    />
                  </div>
                  <div className="flex-1 flex items-center gap-2 bg-[var(--color-bg-surface-hover)] border border-[var(--color-border-glass)] p-2 rounded-xl">
                    <span className="text-[10px] text-[var(--color-text-secondary)] font-bold">To</span>
                    <input
                      type="number"
                      min={1}
                      max={pageCount || 1}
                      value={toPage}
                      onChange={(e) => setToPage(Math.min(pageCount || 1, Math.max(fromPage, Number(e.target.value))))}
                      className="w-full bg-transparent border-none text-[var(--color-text-primary)] focus:outline-none text-xs font-bold text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={isProcessing || (type === "image" && !imageFile)}
                  className="btn-aurora w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold"
                >
                  {isProcessing ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Stamping...</>
                  ) : (
                    <><Download className="w-4 h-4" /> Add watermark</>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="btn-secondary w-full sm:w-auto text-xs font-bold"
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
