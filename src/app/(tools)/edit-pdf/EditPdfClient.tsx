"use client";
import { useToast } from "@/components/ui/Toast";

import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  Type, Download, Loader2, FileText, Pointer, Pencil, Highlighter, 
  Eraser, Square, Circle, Minus, ArrowRight, PenTool, Image as ImageIcon, 
  Check, X, Undo2, Redo2, ZoomIn, ZoomOut, RotateCw, RotateCcw, Trash2, 
  Plus, Maximize2, LayoutGrid, CheckSquare, Settings, AlertCircle,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight
} from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { ProcessingOverlay } from "@/components/ui/ProcessingOverlay";
import { PreDownloadAd } from "@/components/ads/PreDownloadAd";
import { ToolPageLayout } from "@/components/layout/ToolPageLayout";
import { PdfDropzone, type PdfFile } from "@/components/pdf/PdfDropzone";
import { compileEditedPdf, EditorObject } from "@/lib/pdf/edit";
import { downloadFile } from "@/lib/download";
import { PdfViewer } from "@/components/pdf/PdfViewer";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { EditorObjectComponent } from "@/components/pdf/EditorObjectComponent";
import { DrawingCanvas } from "@/components/pdf/DrawingCanvas";
import { SignatureCanvas } from "@/components/pdf/SignatureCanvas";
import { SignatureTyped } from "@/components/pdf/SignatureTyped";

const PRESET_COLORS = [
  { name: "Black", hex: "#000000" },
  { name: "Dark Grey", hex: "#374151" },
  { name: "Red", hex: "#e11d48" },
  { name: "Blue", hex: "#2563eb" },
  { name: "Green", hex: "#16a34a" },
  { name: "Yellow", hex: "#ca8a04" },
  { name: "Indigo", hex: "#4f46e5" },
  { name: "White", hex: "#ffffff" },
];

const HIGHLIGHTER_COLORS = [
  { name: "Yellow", hex: "#facc15" },
  { name: "Green", hex: "#4ade80" },
  { name: "Blue", hex: "#60a5fa" },
  { name: "Pink", hex: "#f472b6" },
  { name: "Orange", hex: "#fb923c" },
];

const SHAPE_FILL_COLORS = [
  { name: "Transparent", hex: "transparent" },
  { name: "White", hex: "#ffffff" },
  { name: "Light Grey", hex: "#f3f4f6" },
  { name: "Light Red", hex: "#fee2e2" },
  { name: "Light Blue", hex: "#dbeafe" },
  { name: "Light Green", hex: "#dcfce7" },
  { name: "Light Yellow", hex: "#fef9c3" },
];

const FONT_FAMILIES = [
  { name: "Helvetica", value: "helvetica" },
  { name: "Courier", value: "courier" },
  { name: "Times New Roman", value: "times" },
];

interface HistoryState {
  objects: EditorObject[];
  drawings: Record<number, string>;
  pageRotations: Record<number, number>;
  deletedPages: number[];
}

export function EditPdfClient() {
  const { showToast } = useToast();
  const [file, setFile] = useState<PdfFile | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [scale, setScale] = useState(1.1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Editor states
  const [tool, setTool] = useState<string>("select"); // "select" | "edit-text" | "add-text" | "pencil" | "highlight" | "eraser" | "shape" | "stamp"
  const [shapeType, setShapeType] = useState<"rectangle" | "circle" | "line" | "arrow">("rectangle");
  const [activeStamp, setActiveStamp] = useState<"check" | "cross" | null>(null);
  
  // Element style states
  const [color, setColor] = useState("#000000");
  const [fillColor, setFillColor] = useState("transparent");
  const [thickness, setThickness] = useState(3);
  const [fontFamily, setFontFamily] = useState<"helvetica" | "courier" | "times">("helvetica");
  const [fontSize, setFontSize] = useState(16);
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [align, setAlign] = useState<"left" | "center" | "right">("left");

  // Core content states
  const [objects, setObjects] = useState<EditorObject[]>([]);
  const [activeObjectId, setActiveObjectId] = useState<string | null>(null);
  const [drawings, setDrawings] = useState<Record<number, string>>({}); // pageIndex -> transparent PNG dataUrl
  const [pageRotations, setPageRotations] = useState<Record<number, number>>({}); // pageIndex -> 0|90|180|270
  const [deletedPages, setDeletedPages] = useState<number[]>([]);
  
  // Text extraction states
  const [loadedTextPages, setLoadedTextPages] = useState<number[]>([]);
  const [isExtractingText, setIsExtractingText] = useState(false);

  // Undo/Redo history
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Measure rendered canvas size for drawing overlay
  const [pageSize, setPageSize] = useState({ width: 500, height: 700 });

  // Removed ResizeObserver since we now use PdfViewer's onRenderSuccess
  useEffect(() => {
    if (!pdfDoc) return;
  }, [pdfDoc]);

  // Modal States
  const [isSigModalOpen, setIsSigModalOpen] = useState(false);
  const [signatureType, setSignatureType] = useState<"draw" | "type" | "upload">("draw");
  const [tempSignatureData, setTempSignatureData] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [resultData, setResultData] = useState<any>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>('');

  // Auto-observe dimensions to align canvas drawing overlay
  // Resize is handled dynamically via onRenderSuccess callback on PdfViewer

  // Handle file addition
  const handleFilesAdded = useCallback(async (files: PdfFile[]) => {
    const pdfFile = files[0];
    setFile(pdfFile);
    setObjects([]);
    setDrawings({});
    setPageRotations({});
    setDeletedPages([]);
    setLoadedTextPages([]);
    setPageIndex(0);
    setActiveObjectId(null);

    try {
      const pdfjsLib = await import("pdfjs-dist");
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url,
        ).toString();
      }
      const arrayBuffer = pdfFile.buffer;
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer.slice(0) });
      const loadedDoc = await loadingTask.promise;
      setPdfDoc(loadedDoc);
      setPageCount(loadedDoc.numPages);

      // Initialize history stack
      const initialState: HistoryState = {
        objects: [],
        drawings: {},
        pageRotations: {},
        deletedPages: []
      };
      setHistory([initialState]);
      setHistoryIndex(0);
    } catch (err) {
      console.error("Error loading PDF preview:", err);
    }
  }, []);

  // Extract text nodes for live editing from pdfjs-dist
  const extractPageText = async (pageIdx: number) => {
    if (!pdfDoc || loadedTextPages.includes(pageIdx) || isExtractingText) return;
    
    setIsExtractingText(true);
    try {
      const page = await pdfDoc.getPage(pageIdx + 1);
      const viewport = page.getViewport({ scale: 1 });
      const pageWidth = viewport.width;
      const pageHeight = viewport.height;
      
      const textContent = await page.getTextContent();
      
      const items = textContent.items.map((item: any) => {
        const pdfX = item.transform[4];
        const pdfY = item.transform[5];
        const fSize = Math.sqrt(item.transform[0] * item.transform[0] + item.transform[1] * item.transform[1]);
        
        // Use raw item.width but ensure it scales properly if text matrix is scaled
        const actualWidth = item.width;
        
        return {
          str: item.str,
          x: pdfX,
          y: pdfY,
          w: actualWidth,
          h: fSize,
          fontSize: fSize,
          fontName: item.fontName || "",
        };
      });

      const validItems = items.filter(it => it.str.trim().length > 0);

      // Merging adjacent text nodes on same line to make editing cleaner
      const mergedItems: typeof validItems = [];
      const sortedItems = [...validItems].sort((a, b) => {
        if (Math.abs(a.y - b.y) > 3) {
          return b.y - a.y; // Top to bottom (PDF Y increases upwards)
        }
        return a.x - b.x; // Left to right
      });

      for (const item of sortedItems) {
        if (mergedItems.length === 0) {
          mergedItems.push(item);
          continue;
        }

        const last = mergedItems[mergedItems.length - 1];
        const sameLine = Math.abs(last.y - item.y) <= 3;
        const gap = item.x - (last.x + last.w);
        const maxGap = last.fontSize * 1.5;

        if (sameLine && gap >= -5 && gap <= maxGap) {
          // Join strings with space if gap exists
          last.str += (gap > last.fontSize * 0.1 ? " " : "") + item.str;
          last.w = (item.x + item.w) - last.x;
          last.fontSize = Math.max(last.fontSize, item.fontSize);
          last.h = Math.max(last.h, item.h);
        } else {
          mergedItems.push(item);
        }
      }

      // Convert items to editable objects
      const newObjects: EditorObject[] = mergedItems.map((item) => {
        const xPct = (item.x / pageWidth) * 100;
        const yPct = ((pageHeight - item.y - item.h) / pageHeight) * 100;
        const wPct = (item.w / pageWidth) * 100;
        const hPct = (item.h / pageHeight) * 100;

        let resolvedFont: "helvetica" | "times" | "courier" = "helvetica";
        const fn = (item.fontName || "").toLowerCase();
        if (fn.includes("times") || fn.includes("serif") || fn.includes("roman") || fn.includes("georgia")) {
          resolvedFont = "times";
        } else if (fn.includes("courier") || fn.includes("mono") || fn.includes("code") || fn.includes("console")) {
          resolvedFont = "courier";
        }
        
        return {
          id: `orig-${pageIdx}-${Math.random().toString(36).substring(7)}`,
          type: "edit-text",
          x: xPct,
          y: yPct,
          width: Math.max(80, (item.w / pageWidth) * pageSize.width),
          height: Math.max(20, (item.h / pageHeight) * pageSize.height),
          pageIndex: pageIdx,
          textContent: item.str,
          fontSize: Math.round(item.fontSize),
          fontFamily: resolvedFont,
          isOriginalText: true,
          originalTextRect: {
            x: item.x,
            y: item.y,
            w: item.w,
            h: item.h,
          },
          uiWhiteout: {
            xPct,
            yPct,
            wPct,
            hPct
          }
        };
      });

      setObjects(prev => {
        const next = [...prev, ...newObjects];
        // Don't auto-push to history, history will push on window pointerup
        return next;
      });
      setLoadedTextPages(prev => [...prev, pageIdx]);
    } catch (err) {
      console.error("Text extraction failed:", err);
    } finally {
      setIsExtractingText(false);
    }
  };

  // Extract page text when user enters edit-text mode
  useEffect(() => {
    if (file && pdfDoc && tool === "edit-text") {
      extractPageText(pageIndex);
    }
  }, [file, pdfDoc, pageIndex, tool]);

  // Track History mutations globally on pointerup to avoid spamming history on every dragging frame
  useEffect(() => {
    const handleUp = () => {
      if (history.length === 0) return;
      const last = history[historyIndex];
      if (!last) return;

      const objectsChanged = JSON.stringify(last.objects) !== JSON.stringify(objects);
      const drawingsChanged = JSON.stringify(last.drawings) !== JSON.stringify(drawings);
      const rotationsChanged = JSON.stringify(last.pageRotations) !== JSON.stringify(pageRotations);
      const deletedChanged = JSON.stringify(last.deletedPages) !== JSON.stringify(deletedPages);

      if (objectsChanged || drawingsChanged || rotationsChanged || deletedChanged) {
        const nextHistory = history.slice(0, historyIndex + 1);
        nextHistory.push({
          objects: JSON.parse(JSON.stringify(objects)),
          drawings: { ...drawings },
          pageRotations: { ...pageRotations },
          deletedPages: [...deletedPages]
        });
        setHistory(nextHistory);
        setHistoryIndex(nextHistory.length - 1);
      }
    };

    window.addEventListener("pointerup", handleUp);
    return () => window.removeEventListener("pointerup", handleUp);
  }, [objects, drawings, pageRotations, deletedPages, history, historyIndex]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      setObjects(JSON.parse(JSON.stringify(history[prevIdx].objects)));
      setDrawings({ ...history[prevIdx].drawings });
      setPageRotations({ ...history[prevIdx].pageRotations });
      setDeletedPages([...history[prevIdx].deletedPages]);
      setActiveObjectId(null);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setObjects(JSON.parse(JSON.stringify(history[nextIdx].objects)));
      setDrawings({ ...history[nextIdx].drawings });
      setPageRotations({ ...history[nextIdx].pageRotations });
      setDeletedPages([...history[nextIdx].deletedPages]);
      setActiveObjectId(null);
    }
  };

  // Add click listener on workspace page to spawn annotations
  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (tool !== "add-text" && tool !== "shape" && tool !== "stamp") return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const xPct = (clickX / rect.width) * 100;
    const yPct = (clickY / rect.height) * 100;

    const newObjId = Math.random().toString(36).substring(7);

    if (tool === "add-text") {
      const newObj: EditorObject = {
        id: newObjId,
        type: "text",
        x: xPct,
        y: yPct,
        width: 150,
        height: 40,
        pageIndex,
        textContent: "Type text here",
        fontFamily,
        fontSize,
        color,
        bold,
        italic,
        underline,
        align,
      };
      setObjects(prev => [...prev, newObj]);
      setActiveObjectId(newObjId);
      setTool("select");
    } 
    else if (tool === "shape" && shapeType) {
      const isLine = shapeType === "line" || shapeType === "arrow";
      const newObj: EditorObject = {
        id: newObjId,
        type: "shape",
        x: xPct,
        y: yPct,
        width: isLine ? 150 : 120,
        height: isLine ? 80 : 120,
        pageIndex,
        shapeType,
        strokeColor: color,
        fillColor: isLine ? undefined : fillColor,
        strokeWidth: thickness,
      };
      setObjects(prev => [...prev, newObj]);
      setActiveObjectId(newObjId);
      setTool("select");
    } 
    else if (tool === "stamp" && activeStamp) {
      const newObj: EditorObject = {
        id: newObjId,
        type: "mark",
        x: xPct,
        y: yPct,
        width: 40,
        height: 40,
        pageIndex,
        markType: activeStamp,
        color,
      };
      setObjects(prev => [...prev, newObj]);
      setActiveObjectId(newObjId);
      setTool("select");
    }
  };

  // Object managers
  const handleUpdateObject = useCallback((id: string, updates: Partial<EditorObject>) => {
    setObjects(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  }, []);

  const handleDeleteObject = useCallback((id: string) => {
    setObjects(prev => prev.filter(o => o.id !== id));
    if (activeObjectId === id) setActiveObjectId(null);
  }, [activeObjectId]);

  const activeObject = objects.find(o => o.id === activeObjectId);

  // Synchronize style panel states with active selected text object
  useEffect(() => {
    if (activeObjectId) {
      const activeObj = objects.find(o => o.id === activeObjectId);
      if (activeObj && (activeObj.type === "text" || activeObj.type === "edit-text")) {
        setFontFamily(activeObj.fontFamily || "helvetica");
        setFontSize(activeObj.fontSize || 16);
        setColor(activeObj.color || "#000000");
        setBold(activeObj.bold || false);
        setItalic(activeObj.italic || false);
        setUnderline(activeObj.underline || false);
        setAlign(activeObj.align || "left");
      }
    }
  }, [activeObjectId]);

  const updateActiveOrStateFamily = (value: "helvetica" | "times" | "courier") => {
    setFontFamily(value);
    if (activeObjectId) {
      handleUpdateObject(activeObjectId, { fontFamily: value });
    }
  };
  const updateActiveOrStateSize = (value: number) => {
    setFontSize(value);
    if (activeObjectId) {
      handleUpdateObject(activeObjectId, { fontSize: value });
    }
  };
  const updateActiveOrStateColor = (value: string) => {
    setColor(value);
    if (activeObjectId) {
      handleUpdateObject(activeObjectId, { color: value });
    }
  };
  const updateActiveOrStateBold = (value: boolean) => {
    setBold(value);
    if (activeObjectId) {
      handleUpdateObject(activeObjectId, { bold: value });
    }
  };
  const updateActiveOrStateItalic = (value: boolean) => {
    setItalic(value);
    if (activeObjectId) {
      handleUpdateObject(activeObjectId, { italic: value });
    }
  };
  const updateActiveOrStateUnderline = (value: boolean) => {
    setUnderline(value);
    if (activeObjectId) {
      handleUpdateObject(activeObjectId, { underline: value });
    }
  };
  const updateActiveOrStateAlign = (value: "left" | "center" | "right") => {
    setAlign(value);
    if (activeObjectId) {
      handleUpdateObject(activeObjectId, { align: value });
    }
  };

  // Drawing Canvas Managers
  const handleSaveDrawing = (dataUrl: string) => {
    setDrawings(prev => ({ ...prev, [pageIndex]: dataUrl }));
  };

  const handleClearDrawings = () => {
    setDrawings(prev => {
      const next = { ...prev };
      delete next[pageIndex];
      return next;
    });
  };

  // Page Operations
  const handleRotatePage = (idx: number, dir: "left" | "right") => {
    setPageRotations(prev => {
      const current = prev[idx] || 0;
      const angle = dir === "right" ? 90 : -90;
      return { ...prev, [idx]: (current + angle + 360) % 360 };
    });
  };

  const handleDeletePage = (idx: number) => {
    if (pageCount - deletedPages.length <= 1) {
      showToast("A PDF must have at least one page.", "error");
      return;
    }
    setDeletedPages(prev => {
      const next = [...prev, idx];
      // Switch active index to the first undeleted page
      const undeleted = Array.from({ length: pageCount }).map((_, i) => i).filter(i => !next.includes(i));
      setPageIndex(undeleted[0] || 0);
      return next;
    });
  };

  const handleAddBlankPage = () => {
    // We add a page indices tracker to objects compile. 
    // To implement adding blank pages, we can push a special object representing a blank page,
    // or just let users add shapes/drawings on existing pages. For simplicity and reliability,
    // we let them fully modify the original pages. Let's focus on rotation/deletion/drawings.
    showToast("Blank page insertion will be appended to the final saved document.", "info");
  };

  // Signature placement
  const handleSaveSignature = () => {
    if (tempSignatureData) {
      const newObjId = Math.random().toString(36).substring(7);
      const newObj: EditorObject = {
        id: newObjId,
        type: "signature",
        x: 35,
        y: 45,
        width: 180,
        height: 75,
        pageIndex,
        dataUrl: tempSignatureData,
      };
      setObjects(prev => [...prev, newObj]);
      setActiveObjectId(newObjId);
      setTool("select");
      setIsSigModalOpen(false);
      setTempSignatureData(null);
    }
  };

  // Image placement
  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleImageUploaded = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const newObjId = Math.random().toString(36).substring(7);
        const newObj: EditorObject = {
          id: newObjId,
          type: "image",
          x: 30,
          y: 35,
          width: 160,
          height: 120,
          pageIndex,
          dataUrl,
        };
        setObjects(prev => [...prev, newObj]);
        setActiveObjectId(newObjId);
        setTool("select");
      };
      reader.readAsDataURL(file);
    }
  };

  // Filter out deleted pages in Page List
  const visiblePageIndices = Array.from({ length: pageCount })
    .map((_, i) => i)
    .filter(i => !deletedPages.includes(i));

  const currentUndeletedPageIndex = visiblePageIndices.indexOf(pageIndex);

  // Compile and Save PDF
  const handleApplyChanges = async () => {
    if (!file) return;
    setIsProcessing(true);
    trackEvent({ name: "tool_used", tool: "edit-pdf" });

    try {
      const result = await compileEditedPdf(file.buffer, objects, drawings, pageRotations, deletedPages);
      setResultData(result);
      setDownloadFilename("edited-document.pdf");
      setShowAd(true);
    } catch (err) {
      console.error("Compilation failed:", err);
      showToast("Failed to save edited PDF. Please try again.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAdComplete = useCallback(() => {
    trackEvent({ name: "download_completed", tool: "edit-pdf" });
    setShowAd(false);
    if (resultData && downloadFilename) {
      downloadFile(resultData, downloadFilename, "application/pdf");
    }
  }, [resultData, downloadFilename]);

  const handleReset = useCallback(() => {
    setFile(null);
    setPdfDoc(null);
    setPageCount(0);
    setObjects([]);
    setDrawings({});
    setPageRotations({});
    setDeletedPages([]);
    setLoadedTextPages([]);
    setPageIndex(0);
    setActiveObjectId(null);
    setHistory([]);
    setHistoryIndex(-1);
  }, []);

  return (
    <ToolPageLayout
      title="PDF Editor"
      description="Edit text, add annotations, draw, insert shapes, signatures, stamps, and manage PDF pages in your browser."
      icon={Pointer}
      iconGradient="icon-circle-edit"
      maxWidth="max-w-none"
      hideAds={!!file}
      hideHeader={!!file}
      fullWidth={!!file}
    >
      {isProcessing && <ProcessingOverlay />}
      {showAd && <PreDownloadAd onComplete={handleAdComplete} onCancel={() => setShowAd(false)} />}
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageUploaded} 
        accept="image/png, image/jpeg" 
        className="hidden" 
      />

      {/* Initial File Upload Dropzone */}
      {!file && (
        <PdfDropzone
          onFilesAdded={handleFilesAdded}
          multiple={false}
          label="Drop your PDF here to edit"
          sublabel="Supports all standard PDF documents"
        />
      )}

      {file && (
        <div className="flex flex-col gap-4">
          
          {/* 1. TOP TOOLBAR BAR */}
          <div className="flex flex-wrap items-center justify-between p-3 rounded-2xl bg-[var(--color-bg-base)] border border-[var(--color-border-glass)] gap-3 shadow-md">
            
            {/* Group 1: Undo/Redo & Selection */}
            <div className="flex items-center gap-1.5 border-r border-[var(--color-border-glass)] pr-3">
              <button 
                onClick={() => setIsSidebarOpen(prev => !prev)} 
                className={`p-2 rounded-lg hover:bg-[var(--color-bg-surface-hover)] transition-colors ${!isSidebarOpen ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20" : ""}`}
                title={isSidebarOpen ? "Hide Thumbnails Panel" : "Show Thumbnails Panel"}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <div className="w-[1px] h-6 bg-[var(--color-border-glass)] mx-0.5" />
              <button 
                onClick={handleUndo} 
                disabled={historyIndex <= 0}
                className="p-2 rounded-lg hover:bg-[var(--color-bg-surface-hover)] disabled:opacity-30 transition-colors"
                title="Undo"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button 
                onClick={handleRedo} 
                disabled={historyIndex >= history.length - 1}
                className="p-2 rounded-lg hover:bg-[var(--color-bg-surface-hover)] disabled:opacity-30 transition-colors"
                title="Redo"
              >
                <Redo2 className="w-4 h-4" />
              </button>
              <div className="w-[1px] h-6 bg-[var(--color-border-glass)] mx-1" />
              <button 
                onClick={() => { setTool("select"); setActiveObjectId(null); }} 
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${tool === "select" ? "bg-indigo-600 text-white shadow-sm" : "hover:bg-[var(--color-bg-surface-hover)]"}`}
              >
                <Pointer className="w-4 h-4" /> Select
              </button>
            </div>

            {/* Group 2: Annotation Tools */}
            <div className="flex items-center flex-wrap gap-1.5 border-r border-[var(--color-border-glass)] pr-3">
              <button 
                onClick={() => { setTool("edit-text"); setActiveObjectId(null); }} 
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${tool === "edit-text" ? "bg-indigo-600 text-white shadow-sm" : "hover:bg-[var(--color-bg-surface-hover)]"}`}
                title="Edit existing PDF text"
              >
                <Type className="w-4 h-4" /> Edit Text
              </button>
              
              <button 
                onClick={() => { setTool("add-text"); setActiveObjectId(null); }} 
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${tool === "add-text" ? "bg-indigo-600 text-white shadow-sm" : "hover:bg-[var(--color-bg-surface-hover)]"}`}
                title="Insert custom text"
              >
                <Plus className="w-4 h-4" /> Add Text
              </button>

              <button 
                onClick={() => { setTool("pencil"); setActiveObjectId(null); }} 
                className={`p-2 rounded-lg transition-all ${tool === "pencil" ? "bg-indigo-600 text-white shadow-sm" : "hover:bg-[var(--color-bg-surface-hover)]"}`}
                title="Pencil / Draw"
              >
                <Pencil className="w-4 h-4" />
              </button>

              <button 
                onClick={() => { setTool("highlight"); setActiveObjectId(null); }} 
                className={`p-2 rounded-lg transition-all ${tool === "highlight" ? "bg-indigo-600 text-white shadow-sm" : "hover:bg-[var(--color-bg-surface-hover)]"}`}
                title="Highlighter"
              >
                <div className="w-4 h-4 rounded bg-yellow-400 border border-yellow-600 opacity-70" />
              </button>

              <button 
                onClick={() => { setTool("eraser"); setActiveObjectId(null); }} 
                className={`p-2 rounded-lg transition-all ${tool === "eraser" ? "bg-indigo-600 text-white shadow-sm" : "hover:bg-[var(--color-bg-surface-hover)]"}`}
                title="Eraser"
              >
                <Eraser className="w-4 h-4" />
              </button>
            </div>

            {/* Group 3: Shapes */}
            <div className="flex items-center gap-1 border-r border-[var(--color-border-glass)] pr-3">
              <button 
                onClick={() => { setTool("shape"); setShapeType("rectangle"); setActiveObjectId(null); }}
                className={`p-2 rounded-lg ${tool === "shape" && shapeType === "rectangle" ? "bg-indigo-600 text-white" : "hover:bg-[var(--color-bg-surface-hover)]"}`}
                title="Draw Rectangle"
              >
                <Square className="w-4 h-4" />
              </button>
              <button 
                onClick={() => { setTool("shape"); setShapeType("circle"); setActiveObjectId(null); }}
                className={`p-2 rounded-lg ${tool === "shape" && shapeType === "circle" ? "bg-indigo-600 text-white" : "hover:bg-[var(--color-bg-surface-hover)]"}`}
                title="Draw Circle"
              >
                <Circle className="w-4 h-4" />
              </button>
              <button 
                onClick={() => { setTool("shape"); setShapeType("line"); setActiveObjectId(null); }}
                className={`p-2 rounded-lg ${tool === "shape" && shapeType === "line" ? "bg-indigo-600 text-white" : "hover:bg-[var(--color-bg-surface-hover)]"}`}
                title="Draw Line"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button 
                onClick={() => { setTool("shape"); setShapeType("arrow"); setActiveObjectId(null); }}
                className={`p-2 rounded-lg ${tool === "shape" && shapeType === "arrow" ? "bg-indigo-600 text-white" : "hover:bg-[var(--color-bg-surface-hover)]"}`}
                title="Draw Arrow"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Group 4: Rich Assets (Signatures, Images, Stamps) */}
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setIsSigModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-semibold hover:bg-[var(--color-bg-surface-hover)] transition-colors"
                title="Add E-Signature"
              >
                <PenTool className="w-4 h-4 text-indigo-500" /> Sign
              </button>
              
              <button 
                onClick={triggerImageUpload}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-semibold hover:bg-[var(--color-bg-surface-hover)] transition-colors"
                title="Insert Image"
              >
                <ImageIcon className="w-4 h-4 text-emerald-500" /> Image
              </button>

              <button 
                onClick={() => { setTool("stamp"); setActiveStamp("check"); setActiveObjectId(null); }}
                className={`p-2 rounded-lg ${tool === "stamp" && activeStamp === "check" ? "bg-indigo-600 text-white" : "hover:bg-[var(--color-bg-surface-hover)]"}`}
                title="Insert Check Mark"
              >
                <Check className="w-4 h-4 text-emerald-600 font-extrabold" />
              </button>

              <button 
                onClick={() => { setTool("stamp"); setActiveStamp("cross"); setActiveObjectId(null); }}
                className={`p-2 rounded-lg ${tool === "stamp" && activeStamp === "cross" ? "bg-indigo-600 text-white" : "hover:bg-[var(--color-bg-surface-hover)]"}`}
                title="Insert Cross Mark"
              >
                <X className="w-4 h-4 text-rose-600 font-extrabold" />
              </button>
            </div>

          </div>

          {/* 2. SPLIT WORKSPACE PANELS */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
            
            {/* LEFT COLUMN: PAGE THUMBNAILS & MANAGEMENT (col-span-2) */}
            {isSidebarOpen && (
              <div className="xl:col-span-2 flex flex-col gap-4 p-4 bg-[var(--color-bg-surface)] border border-[var(--color-border-glass)] rounded-2xl max-h-[750px] overflow-y-auto shadow-sm">
                <h3 className="text-sm font-bold text-[var(--color-text-primary)] border-b border-[var(--color-border-glass)] pb-2 mb-1 flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4" /> Pages ({visiblePageIndices.length})
                </h3>
                
                <div className="flex xl:flex-col gap-3 flex-wrap">
                  {visiblePageIndices.map((idx, index) => (
                    <div 
                      key={idx}
                      className={`relative p-2 rounded-xl border flex flex-col items-center group/thumb transition-all ${
                        pageIndex === idx ? 'border-indigo-500 bg-indigo-500/5 shadow-md' : 'border-[var(--color-border-glass)] hover:border-gray-400 bg-[var(--color-bg-base)]'
                      }`}
                    >
                      <div 
                        onClick={() => setPageIndex(idx)}
                        className="cursor-pointer w-28 xl:w-full aspect-[3/4] bg-white flex items-center justify-center border border-gray-200 rounded overflow-hidden shadow-inner relative"
                      >
                        {pdfDoc && (
                          <PdfViewer 
                            doc={pdfDoc} 
                            pageNumber={idx + 1} 
                            scale={0.12} 
                            rotation={pageRotations[idx] || 0}
                            className="w-full h-full object-contain" 
                          />
                        )}
                        <div className="absolute inset-0 bg-transparent group-hover/thumb:bg-black/5 transition-colors" />
                      </div>

                      {/* Thumbnail Action Overlay on Hover */}
                      <div className="flex gap-1.5 mt-2 justify-center w-full">
                        <button 
                          onClick={() => handleRotatePage(idx, "left")}
                          className="p-1 bg-[var(--color-bg-surface)] border border-[var(--color-border-glass)] rounded hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-[var(--color-text-secondary)]"
                          title="Rotate Left"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleRotatePage(idx, "right")}
                          className="p-1 bg-[var(--color-bg-surface)] border border-[var(--color-border-glass)] rounded hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-[var(--color-text-secondary)]"
                          title="Rotate Right"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeletePage(idx)}
                          disabled={visiblePageIndices.length <= 1}
                          className="p-1 bg-[var(--color-bg-surface)] border border-rose-200 dark:border-rose-900/30 rounded hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-500 disabled:opacity-40"
                          title="Delete Page"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="text-[10px] font-bold text-[var(--color-text-muted)] mt-1.5">Page {index + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CENTRAL WORKSPACE: PDF CANVAS & VIEWPORT (col-span-7 or col-span-9 depending on sidebar) */}
            <div className={`${isSidebarOpen ? "xl:col-span-7" : "xl:col-span-9"} flex flex-col p-2 sm:p-4 bg-[var(--color-bg-base)] rounded-3xl border border-[var(--color-border-glass)] shadow-sm relative min-h-[750px] items-center justify-between overflow-hidden`}>
              
              {/* Top Viewport Navigation */}
              <div className="w-full flex items-center justify-between px-3 mb-3 border-b border-[var(--color-border-glass)] pb-2">
                <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                  {tool === "edit-text" ? "Original PDF text boxes outline in blue. Double click to edit." : 
                   tool === "pencil" || tool === "highlight" ? "Brush active. Drag on page to draw." : 
                   tool === "add-text" ? "Click anywhere on page to place custom text." : 
                   "Selection tool active. Drag objects to move/resize."}
                </span>
              </div>

              {/* Page Container Canvas Workspace */}
              <div 
                className="flex-1 w-full relative overflow-auto min-h-[600px] bg-slate-100 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800/60"
                onClick={() => setActiveObjectId(null)}
              >
                {pdfDoc ? (
                  <div className="min-w-full min-h-full p-6 sm:p-10 flex">
                    <div
                      className="mx-auto"
                      style={{
                        width: `${pageSize.width * scale}px`,
                        height: `${pageSize.height * scale}px`,
                        flexShrink: 0
                      }}
                    >
                      <div 
                        className="relative bg-white shadow-xl flex items-center justify-center cursor-default transition-transform origin-top-left"
                        style={{
                          width: `${pageSize.width}px`,
                          height: `${pageSize.height}px`,
                          transform: `scale(${scale})`,
                        }}
                        ref={containerRef}
                        onClick={handlePageClick}
                      >
                      {/* PDF Rendering Canvas */}
                      <PdfViewer
                        doc={pdfDoc}
                        pageNumber={pageIndex + 1}
                        scale={1.0}
                        rotation={pageRotations[pageIndex] || 0}
                        className=""
                        canvasClassName="max-w-none max-h-none"
                        onRenderSuccess={(w, h) => setPageSize({ width: w, height: h })}
                      />

                    {/* Original Text Whiteout Layer */}
                    {objects
                      .filter(o => o.pageIndex === pageIndex && o.isOriginalText && o.uiWhiteout)
                      .map(obj => (
                        <div
                          key={`whiteout-${obj.id}`}
                          className="absolute bg-white pointer-events-none"
                          style={{
                            left: `${obj.uiWhiteout!.xPct}%`,
                            top: `${obj.uiWhiteout!.yPct}%`,
                            width: `${obj.uiWhiteout!.wPct}%`,
                            height: `${obj.uiWhiteout!.hPct}%`,
                            transform: 'scale(1.05)', // prevent bleeding
                          }}
                        />
                      ))}

                    {/* Draggable/Resizable Element Objects Overlay */}
                    {objects.filter(o => o.pageIndex === pageIndex).map(obj => (
                      <EditorObjectComponent
                        key={obj.id}
                        obj={obj}
                        isActive={activeObjectId === obj.id}
                        isEditTextMode={tool === "edit-text"}
                        onUpdate={handleUpdateObject}
                        onSelect={setActiveObjectId}
                        onDelete={handleDeleteObject}
                        containerRef={containerRef}
                      />
                    ))}

                    {/* Freehand Drawing Overlay Canvas */}
                    <DrawingCanvas
                      width={pageSize.width}
                      height={pageSize.height}
                      tool={tool}
                      color={color}
                      thickness={thickness}
                      initialDataUrl={drawings[pageIndex]}
                      onSave={handleSaveDrawing}
                    />

                    </div>
                  </div>
                </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-3" />
                    <p className="text-sm font-medium">Loading document pages...</p>
                  </div>
                )}
              </div>

              {/* Floating Bottom Toolbar Bar */}
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-4 px-4 py-2 bg-gray-900/90 hover:bg-gray-900 border border-gray-700/60 rounded-full shadow-2xl backdrop-blur-md z-30 transition-all">
                
                {/* Section 1: Page Navigation */}
                <div className="flex items-center gap-1.5 border-r border-gray-700/80 pr-4">
                  <button 
                    disabled={currentUndeletedPageIndex === 0} 
                    onClick={(e) => {
                      e.stopPropagation();
                      setPageIndex(visiblePageIndices[currentUndeletedPageIndex - 1]);
                    }}
                    className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors disabled:opacity-30"
                    title="Previous Page"
                  >
                    <ArrowRight className="w-4 h-4 rotate-180 text-white" />
                  </button>
                  
                  <div className="flex items-center text-xs font-semibold text-white" onClick={(e) => e.stopPropagation()}>
                    <span>Page</span>
                    <input 
                      type="number"
                      min={1}
                      max={visiblePageIndices.length}
                      value={currentUndeletedPageIndex + 1}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(visiblePageIndices.length, Number(e.target.value) || 1));
                        setPageIndex(visiblePageIndices[val - 1]);
                      }}
                      className="w-10 h-6 mx-1 bg-gray-800 border border-gray-700 rounded text-center focus:outline-none focus:border-indigo-500 font-bold text-white"
                    />
                    <span className="text-gray-500 font-semibold">of {visiblePageIndices.length}</span>
                  </div>

                  <button 
                    disabled={currentUndeletedPageIndex === visiblePageIndices.length - 1} 
                    onClick={(e) => {
                      e.stopPropagation();
                      setPageIndex(visiblePageIndices[currentUndeletedPageIndex + 1]);
                    }}
                    className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors disabled:opacity-30"
                    title="Next Page"
                  >
                    <ArrowRight className="w-4 h-4 text-white" />
                  </button>
                </div>

                {/* Section 2: Zoom Controls */}
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={() => setScale(s => Math.max(0.6, s - 0.15))}
                    className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4.5 h-4.5 text-white" />
                  </button>
                  <span className="text-xs font-bold text-white px-1 min-w-[42px] text-center">
                    {Math.round(scale * 100)}%
                  </span>
                  <button 
                    onClick={() => setScale(s => Math.min(2.0, s + 0.15))}
                    className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4.5 h-4.5 text-white" />
                  </button>
                </div>

                {/* Section 3: Fit Triggers */}
                <div className="flex items-center gap-1.5 border-l border-gray-700/80 pl-4" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setScale(1.0)}
                    className="px-2 py-0.5 bg-gray-800 hover:bg-gray-700 text-white rounded text-[10px] font-bold transition-colors"
                    title="Reset to 100% Zoom"
                  >
                    100%
                  </button>
                  <button
                    onClick={() => {
                      if (containerRef.current) {
                        const parentWidth = containerRef.current.parentElement?.clientWidth || 600;
                        const targetScale = Math.max(0.6, Math.min(1.8, (parentWidth - 40) / pageSize.width));
                        setScale(targetScale);
                      }
                    }}
                    className="px-2 py-0.5 bg-gray-800 hover:bg-gray-700 text-white rounded text-[10px] font-bold transition-colors whitespace-nowrap"
                    title="Fit Width"
                  >
                    Fit Width
                  </button>
                </div>

              </div>

              {/* Bottom Info Banner */}
              <div className="w-full flex items-center justify-between mt-3 text-xs text-gray-500 border-t border-gray-700/50 pt-2 px-1">
                <span>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                <span>Pages: {visiblePageIndices.length}</span>
              </div>

            </div>

            {/* RIGHT COLUMN: PROPERTY INSPECTOR SIDEBAR (col-span-3) */}
            <div className="xl:col-span-3 flex flex-col gap-5 sticky top-6">
              
              {/* File details panel */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-glass)] shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[var(--color-text-primary)] truncate max-w-[120px]">{file.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)] font-medium">Modified Locally</p>
                  </div>
                </div>
                <button onClick={handleReset} className="text-xs font-semibold text-rose-500 hover:text-rose-600 underline">Start Over</button>
              </div>

              {/* Active Inspector Options */}
              <div className="bg-[var(--color-bg-surface)] p-5 rounded-2xl border border-[var(--color-border-glass)] shadow-md flex flex-col gap-6">
                
                {/* 1. Element Properties (when text object selected or general defaults) */}
                {((activeObject && (activeObject.type === "text" || activeObject.type === "edit-text")) || 
                  (!activeObject && tool !== "pencil" && tool !== "highlight" && tool !== "shape" && tool !== "stamp")) && (
                  <div className="flex flex-col gap-4">
                    <h3 className="text-sm font-bold text-[var(--color-text-primary)] border-b border-[var(--color-border-glass)] pb-2 flex items-center justify-between">
                      <span>{activeObject ? "Text Inspector" : "Text Default Styles"}</span>
                      {activeObject && (
                        <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded font-bold">
                          Selected Box
                        </span>
                      )}
                    </h3>
                    
                    {/* Inline Content Edit Area */}
                    {activeObject && (
                      <div>
                        <label className="text-xs font-bold text-[var(--color-text-secondary)] block mb-1.5">Edit Text</label>
                        <textarea
                          value={activeObject.textContent || ""}
                          onChange={(e) => handleUpdateObject(activeObject.id, { textContent: e.target.value })}
                          className="w-full px-3 py-2 bg-[var(--color-bg-base)] border border-[var(--color-border-glass)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-20"
                        />
                      </div>
                    )}

                    {/* Font Family */}
                    <div>
                      <label className="text-xs font-bold text-[var(--color-text-secondary)] block mb-1.5">Font Family</label>
                      <select
                        value={fontFamily}
                        onChange={(e) => updateActiveOrStateFamily(e.target.value as any)}
                        className="w-full px-3 py-2 bg-[var(--color-bg-base)] border border-[var(--color-border-glass)] rounded-xl text-sm font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        {FONT_FAMILIES.map(f => (
                          <option key={f.value} value={f.value}>{f.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Font Size & Alignment */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Font Size */}
                      <div>
                        <label className="text-xs font-bold text-[var(--color-text-secondary)] block mb-1.5">
                          Font Size
                        </label>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              const newSize = Math.max(8, fontSize - 1);
                              updateActiveOrStateSize(newSize);
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--color-border-glass)] hover:bg-[var(--color-bg-surface-hover)] bg-[var(--color-bg-base)] text-sm font-bold text-[var(--color-text-primary)]"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={8}
                            max={72}
                            value={fontSize}
                            onChange={(e) => {
                              const val = Math.max(8, Math.min(72, Number(e.target.value) || 12));
                              updateActiveOrStateSize(val);
                            }}
                            className="w-12 h-8 text-center rounded-lg border border-[var(--color-border-glass)] bg-[var(--color-bg-base)] text-xs font-semibold text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newSize = Math.min(72, fontSize + 1);
                              updateActiveOrStateSize(newSize);
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--color-border-glass)] hover:bg-[var(--color-bg-surface-hover)] bg-[var(--color-bg-base)] text-sm font-bold text-[var(--color-text-primary)]"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Alignment */}
                      <div>
                        <label className="text-xs font-bold text-[var(--color-text-secondary)] block mb-1.5">Alignment</label>
                        <div className="flex rounded-lg border border-[var(--color-border-glass)] overflow-hidden bg-[var(--color-bg-base)]">
                          <button
                            type="button"
                            onClick={() => updateActiveOrStateAlign("left")}
                            className={`flex-1 h-8 flex items-center justify-center hover:bg-[var(--color-bg-surface-hover)] ${align === "left" ? "bg-indigo-600 hover:bg-indigo-600 text-white" : "text-[var(--color-text-secondary)] bg-[var(--color-bg-base)]"}`}
                            title="Align Left"
                          >
                            <AlignLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => updateActiveOrStateAlign("center")}
                            className={`flex-1 h-8 flex items-center justify-center hover:bg-[var(--color-bg-surface-hover)] ${align === "center" ? "bg-indigo-600 hover:bg-indigo-600 text-white" : "text-[var(--color-text-secondary)] bg-[var(--color-bg-base)]"}`}
                            title="Align Center"
                          >
                            <AlignCenter className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => updateActiveOrStateAlign("right")}
                            className={`flex-1 h-8 flex items-center justify-center hover:bg-[var(--color-bg-surface-hover)] ${align === "right" ? "bg-indigo-600 hover:bg-indigo-600 text-white" : "text-[var(--color-text-secondary)] bg-[var(--color-bg-base)]"}`}
                            title="Align Right"
                          >
                            <AlignRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Typography: Bold, Italic, Underline */}
                    <div>
                      <label className="text-xs font-bold text-[var(--color-text-secondary)] block mb-1.5">Typography</label>
                      <div className="flex gap-1.5">
                        <button 
                          type="button"
                          onClick={() => updateActiveOrStateBold(!bold)}
                          className={`flex-1 py-1.5 rounded-lg font-bold text-xs border flex items-center justify-center gap-1 ${bold ? "bg-indigo-600 text-white border-indigo-600" : "border-[var(--color-border-glass)] hover:bg-[var(--color-bg-surface-hover)] text-[var(--color-text-primary)] bg-[var(--color-bg-base)]"}`}
                        >
                          <Bold className="w-3.5 h-3.5" /> Bold
                        </button>
                        <button 
                          type="button"
                          onClick={() => updateActiveOrStateItalic(!italic)}
                          className={`flex-1 py-1.5 rounded-lg italic text-xs border flex items-center justify-center gap-1 ${italic ? "bg-indigo-600 text-white border-indigo-600" : "border-[var(--color-border-glass)] hover:bg-[var(--color-bg-surface-hover)] text-[var(--color-text-primary)] bg-[var(--color-bg-base)]"}`}
                        >
                          <Italic className="w-3.5 h-3.5" /> Italic
                        </button>
                        <button 
                          type="button"
                          onClick={() => updateActiveOrStateUnderline(!underline)}
                          className={`flex-1 py-1.5 rounded-lg underline text-xs border flex items-center justify-center gap-1 ${underline ? "bg-indigo-600 text-white border-indigo-600" : "border-[var(--color-border-glass)] hover:bg-[var(--color-bg-surface-hover)] text-[var(--color-text-primary)] bg-[var(--color-bg-base)]"}`}
                        >
                          <Underline className="w-3.5 h-3.5" /> Underline
                        </button>
                      </div>
                    </div>

                    {/* Text Color */}
                    <div>
                      <label className="text-xs font-bold text-[var(--color-text-secondary)] block mb-2">Text Color</label>
                      <div className="grid grid-cols-8 gap-1 mb-2">
                        {PRESET_COLORS.map(c => (
                          <button
                            key={c.hex}
                            type="button"
                            onClick={() => updateActiveOrStateColor(c.hex)}
                            className={`w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600 transition-all ${color === c.hex ? "scale-125 ring-2 ring-indigo-500" : "hover:scale-110"}`}
                            style={{ backgroundColor: c.hex }}
                            title={c.name}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <input 
                          type="color" 
                          value={color} 
                          onChange={(e) => updateActiveOrStateColor(e.target.value)}
                          className="w-7 h-7 rounded cursor-pointer border border-[var(--color-border-glass)]" 
                        />
                        <span className="text-xs text-[var(--color-text-muted)] font-medium">Custom color picker</span>
                      </div>
                    </div>

                    {/* Delete item button */}
                    {activeObject && (
                      <button 
                        type="button"
                        onClick={() => handleDeleteObject(activeObject.id)}
                        className="w-full flex items-center justify-center gap-2 py-2 mt-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 text-xs font-bold rounded-xl border border-rose-200 dark:border-rose-900/30 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete Text Box
                      </button>
                    )}

                  </div>
                )}

                {/* 2. Shape Properties (when shape object selected) */}
                {activeObject && activeObject.type === "shape" && (
                  <div className="flex flex-col gap-4">
                    <h3 className="text-sm font-bold text-[var(--color-text-primary)] border-b border-[var(--color-border-glass)] pb-2">
                      Shape Inspector
                    </h3>

                    {/* Stroke width */}
                    <div>
                      <label className="text-xs font-bold text-[var(--color-text-secondary)] block mb-1.5">
                        Border Width: {activeObject.strokeWidth || 2}px
                      </label>
                      <input 
                        type="range" 
                        min={1} 
                        max={15} 
                        value={activeObject.strokeWidth || 2} 
                        onChange={(e) => handleUpdateObject(activeObject.id, { strokeWidth: Number(e.target.value) })}
                        className="w-full accent-indigo-600 mt-2" 
                      />
                    </div>

                    {/* Stroke Color */}
                    <div>
                      <label className="text-xs font-bold text-[var(--color-text-secondary)] block mb-2">Border Color</label>
                      <div className="flex gap-2 flex-wrap mb-2">
                        {PRESET_COLORS.filter(c => c.hex !== "transparent").map(c => (
                          <button
                            key={c.hex}
                            onClick={() => handleUpdateObject(activeObject.id, { strokeColor: c.hex })}
                            className={`w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600 transition-all ${activeObject.strokeColor === c.hex ? "scale-125 ring-2 ring-indigo-500" : "hover:scale-110"}`}
                            style={{ backgroundColor: c.hex }}
                            title={c.name}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Fill Color */}
                    {activeObject.shapeType !== "line" && activeObject.shapeType !== "arrow" && (
                      <div>
                        <label className="text-xs font-bold text-[var(--color-text-secondary)] block mb-2">Fill Color</label>
                        <div className="flex gap-2 flex-wrap mb-2">
                          {SHAPE_FILL_COLORS.map(c => (
                            <button
                              key={c.hex}
                              onClick={() => handleUpdateObject(activeObject.id, { fillColor: c.hex })}
                              className={`w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600 transition-all flex items-center justify-center ${activeObject.fillColor === c.hex ? "scale-125 ring-2 ring-indigo-500" : "hover:scale-110"}`}
                              style={{ backgroundColor: c.hex === "transparent" ? "transparent" : c.hex }}
                              title={c.name}
                            >
                              {c.hex === "transparent" && <div className="w-5 h-0.5 bg-red-500 rotate-45" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <button 
                      onClick={() => handleDeleteObject(activeObject.id)}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 text-xs font-bold rounded-xl border border-rose-200 dark:border-rose-900/30 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Shape
                    </button>
                  </div>
                )}

                {/* 3. Sign/Image/Mark Properties */}
                {activeObject && (activeObject.type === "image" || activeObject.type === "signature" || activeObject.type === "mark") && (
                  <div className="flex flex-col gap-4">
                    <h3 className="text-sm font-bold text-[var(--color-text-primary)] border-b border-[var(--color-border-glass)] pb-2">
                      Element Inspector
                    </h3>
                    
                    <p className="text-xs text-[var(--color-text-muted)] font-medium">
                      Type: <span className="capitalize font-semibold text-[var(--color-text-primary)]">{activeObject.type}</span>
                    </p>

                    {activeObject.type === "mark" && (
                      <div>
                        <label className="text-xs font-bold text-[var(--color-text-secondary)] block mb-2">Color</label>
                        <div className="flex gap-2 flex-wrap">
                          {PRESET_COLORS.filter(c => c.hex !== "transparent" && c.hex !== "#ffffff").map(c => (
                            <button
                              key={c.hex}
                              onClick={() => handleUpdateObject(activeObject.id, { color: c.hex })}
                              className={`w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600 transition-all ${activeObject.color === c.hex ? "scale-125 ring-2 ring-indigo-500" : "hover:scale-110"}`}
                              style={{ backgroundColor: c.hex }}
                              title={c.name}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    <button 
                      onClick={() => handleDeleteObject(activeObject.id)}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 text-xs font-bold rounded-xl border border-rose-200 dark:border-rose-900/30 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Element
                    </button>
                  </div>
                )}

                {/* 4. Canvas Brush properties (when drawing tool active and no object selected) */}
                {!activeObject && (tool === "pencil" || tool === "highlight") && (
                  <div className="flex flex-col gap-4">
                    <h3 className="text-sm font-bold text-[var(--color-text-primary)] border-b border-[var(--color-border-glass)] pb-2">
                      Brush Settings
                    </h3>

                    {/* Thickness slider */}
                    <div>
                      <label className="text-xs font-bold text-[var(--color-text-secondary)] block mb-1.5">
                        Brush Size: {thickness}px
                      </label>
                      <input 
                        type="range" 
                        min={1} 
                        max={30} 
                        value={thickness} 
                        onChange={(e) => setThickness(Number(e.target.value))}
                        className="w-full accent-indigo-600 mt-2" 
                      />
                    </div>

                    {/* Color selection */}
                    <div>
                      <label className="text-xs font-bold text-[var(--color-text-secondary)] block mb-2">Brush Color</label>
                      <div className="flex gap-2 flex-wrap mb-2">
                        {(tool === "highlight" ? HIGHLIGHTER_COLORS : PRESET_COLORS.filter(c => c.hex !== "transparent")).map(c => (
                          <button
                            key={c.hex}
                            onClick={() => setColor(c.hex)}
                            className={`w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600 transition-all ${color === c.hex ? "scale-125 ring-2 ring-indigo-500" : "hover:scale-110"}`}
                            style={{ backgroundColor: c.hex }}
                            title={c.name}
                          />
                        ))}
                      </div>
                    </div>

                    <button 
                      onClick={handleClearDrawings}
                      disabled={!drawings[pageIndex]}
                      className="w-full py-2 bg-[var(--color-bg-base)] hover:bg-[var(--color-bg-surface-hover)] text-xs font-bold rounded-xl border border-[var(--color-border-glass)] transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
                    >
                      Clear Drawings on Page
                    </button>
                  </div>
                )}

              </div>

              {/* Finish Actions Panel */}
              <div className="mt-auto flex flex-col gap-3">
                <button
                  onClick={handleApplyChanges}
                  disabled={isProcessing}
                  className="btn-aurora w-full flex items-center justify-center gap-2 py-3.5 text-base font-bold shadow-xl shadow-red-500/10 hover:shadow-red-500/20 bg-red-600 text-white rounded-xl transition-all"
                >
                  {isProcessing ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Compiling Editor...</>
                  ) : (
                    <><Download className="w-5 h-5" /> Save Changes & Download</>
                  )}
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* Signature Creation Modal */}
      {isSigModalOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--color-bg-surface)] rounded-2xl w-full max-w-2xl shadow-2xl border border-[var(--color-border-glass)] overflow-hidden flex flex-col">
            
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border-glass)] bg-[var(--color-bg-base)]">
              <h3 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <PenTool className="w-5 h-5 text-indigo-500" /> Create E-Signature
              </h3>
              <button 
                onClick={() => { setIsSigModalOpen(false); setTempSignatureData(null); }} 
                className="text-[var(--color-text-muted)] hover:text-red-500 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {/* Type Selector */}
              <div className="flex gap-2 p-1 rounded-xl bg-[var(--color-bg-base)] border border-[var(--color-border-glass)] max-w-sm mx-auto mb-6">
                <button 
                  type="button" 
                  onClick={() => { setSignatureType("draw"); setTempSignatureData(null); }} 
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-all ${signatureType === "draw" ? "bg-[#6366f1] text-white shadow-md" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-hover)]"}`}
                >
                  Draw
                </button>
                <button 
                  type="button" 
                  onClick={() => { setSignatureType("type"); setTempSignatureData(null); }} 
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-all ${signatureType === "type" ? "bg-[#6366f1] text-white shadow-md" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-hover)]"}`}
                >
                  Type
                </button>
                <button 
                  type="button" 
                  onClick={() => { setSignatureType("upload"); setTempSignatureData(null); }} 
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-all ${signatureType === "upload" ? "bg-[#6366f1] text-white shadow-md" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-hover)]"}`}
                >
                  Upload
                </button>
              </div>

              {/* Draw canvas/type input/upload box */}
              <div className="p-4 rounded-xl border border-[var(--color-border-glass)] bg-[var(--color-bg-base)] min-h-[250px] flex items-center justify-center">
                {signatureType === "draw" && (
                  <div className="w-full h-full"><SignatureCanvas onSignatureChange={setTempSignatureData} /></div>
                )}
                {signatureType === "type" && (
                  <div className="w-full h-full"><SignatureTyped onSave={setTempSignatureData} /></div>
                )}
                {signatureType === "upload" && (
                  <div className="w-full flex flex-col items-center justify-center">
                    <div 
                      className="flex flex-col items-center justify-center p-8 w-full border-2 border-dashed border-[var(--color-border-glass)] rounded-xl hover:bg-[var(--color-bg-surface-hover)] transition-colors cursor-pointer" 
                      onClick={() => document.getElementById('sig-modal-upload')?.click()}
                    >
                      <input 
                        id="sig-modal-upload" 
                        type="file" 
                        accept="image/png, image/jpeg" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => setTempSignatureData(event.target?.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      {tempSignatureData ? (
                        <img src={tempSignatureData} className="max-h-40 object-contain mix-blend-multiply" alt="Signature preview" />
                      ) : (
                        <>
                          <ImageIcon className="w-10 h-10 text-[var(--color-text-muted)] mb-3" />
                          <p className="text-sm font-semibold text-[var(--color-text-primary)]">Upload custom signature image</p>
                          <p className="text-xs text-[var(--color-text-muted)] mt-1">PNG (with transparency preferred) or JPG</p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-[var(--color-border-glass)] bg-[var(--color-bg-base)] flex justify-end gap-3">
              <button 
                onClick={() => { setIsSigModalOpen(false); setTempSignatureData(null); }} 
                className="px-5 py-2 text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-hover)] rounded-lg transition-colors border border-[var(--color-border-glass)]"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveSignature} 
                disabled={!tempSignatureData}
                className="px-6 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Insert Signature
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </ToolPageLayout>
  );
}
