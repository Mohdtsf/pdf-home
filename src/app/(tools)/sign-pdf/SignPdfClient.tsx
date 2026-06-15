"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { PenTool, Download, Loader2, FileText, Type, Paintbrush, Upload, Trash2, User, Users, Lock, X, PlusCircle, Calendar, AlignLeft, Building, Award, Crown } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { ProcessingOverlay } from "@/components/ui/ProcessingOverlay";
import { PreDownloadAd } from "@/components/ads/PreDownloadAd";
import { ToolPageLayout } from "@/components/layout/ToolPageLayout";
import { PdfDropzone, type PdfFile } from "@/components/pdf/PdfDropzone";
import { addMultipleSignatures, FieldType, SignatureFieldOptions } from "@/lib/pdf/sign";
import { SignatureCanvas } from "@/components/pdf/SignatureCanvas";
import { SignatureTyped } from "@/components/pdf/SignatureTyped";
import { downloadFile } from "@/lib/download";
import { PdfViewer } from "@/components/pdf/PdfViewer";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { DraggableField, PlacedField } from "@/components/pdf/DraggableField";

// A small utility to convert dataUrl to Uint8Array
function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function SignPdfClient() {
  const [file, setFile] = useState<PdfFile | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [pageCount, setPageCount] = useState(0);
  
  // App States
  const [pageIndex, setPageIndex] = useState(0);
  
  // Field Management
  const [fields, setFields] = useState<PlacedField[]>([]);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Modal States
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [pendingFieldType, setPendingFieldType] = useState<FieldType | null>(null);
  const [signatureType, setSignatureType] = useState<"draw" | "type" | "upload">("draw");
  const [signatureMode, setSignatureMode] = useState<"simple" | "digital">("simple");
  const [tempSignatureData, setTempSignatureData] = useState<string | null>(null);
  const [tempTextData, setTempTextData] = useState<string>("");
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [resultData, setResultData] = useState<any>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>('');

  const handleFilesAdded = useCallback(async (files: PdfFile[]) => {
    const pdfFile = files[0];
    setFile(pdfFile);
    setFields([]);
    setPageIndex(0);
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
    } catch (err) {
      console.error("Error loading PDF preview:", err);
    }
  }, []);

  const handleAddFieldClick = (type: FieldType) => {
    setPendingFieldType(type);
    
    // Always clear old data when opening a new modal
    setTempSignatureData(null);
    setTempTextData("");

    if (type === "signature" || type === "initials" || type === "company_stamp") {
      setSignatureType(type === "initials" ? "type" : (type === "company_stamp" ? "upload" : "draw"));
    } else if (type === "date") {
      // Use standard YYYY-MM-DD for date inputs
      setTempTextData(new Date().toISOString().split("T")[0]);
    } else if (type === "name") {
      setTempTextData("Full Name");
    } else if (type === "text") {
      setTempTextData("Sample Text");
    }
    
    setIsConfigModalOpen(true);
  };

  const handleUpdateField = useCallback((id: string, updates: Partial<PlacedField>) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  }, []);

  const handleDeleteField = useCallback((id: string) => {
    setFields(prev => prev.filter(f => f.id !== id));
    if (activeFieldId === id) setActiveFieldId(null);
  }, [activeFieldId]);

  const handleSaveModal = () => {
    if (pendingFieldType) {
      const isText = pendingFieldType === "date" || pendingFieldType === "name" || pendingFieldType === "text";
      const newField: PlacedField = {
        id: Math.random().toString(36).substring(7),
        type: pendingFieldType,
        x: 35, // centerish
        y: 40,
        width: pendingFieldType === "signature" || pendingFieldType === "company_stamp" ? 200 : 100,
        height: pendingFieldType === "signature" || pendingFieldType === "company_stamp" ? 80 : 40,
        pageIndex,
        dataUrl: isText ? undefined : (tempSignatureData || undefined),
        textContent: isText ? tempTextData : undefined,
        fontSize: 14,
      };

      // Format date for better readability if needed
      if (pendingFieldType === "date" && tempTextData) {
        try {
          // Prevent JS timezone offset from pushing date back 1 day
          const d = new Date(tempTextData);
          newField.textContent = new Date(d.getTime() + Math.abs(d.getTimezoneOffset() * 60000)).toLocaleDateString();
        } catch {
          newField.textContent = tempTextData;
        }
      }

      setFields(prev => [...prev, newField]);
      setActiveFieldId(newField.id);
      setPendingFieldType(null);
    } else if (activeFieldId && tempSignatureData) {
      handleUpdateField(activeFieldId, { dataUrl: tempSignatureData });
    }
    setIsConfigModalOpen(false);
  };

  const handleCancelModal = () => {
    setIsConfigModalOpen(false);
    setPendingFieldType(null);
  };

  const getFieldCount = (type: FieldType) => fields.filter(f => f.type === type).length;

  const handleApplySignature = useCallback(async () => {
    if (!file || fields.length === 0) {
      alert("Please add at least one signature or field.");
      return;
    }
    
    // Validate fields
    const invalidFields = fields.filter(f => 
      (f.type === "signature" || f.type === "initials" || f.type === "company_stamp") && !f.dataUrl
    );
    if (invalidFields.length > 0) {
      alert("Please fill in all signature and stamp fields before applying.");
      return;
    }

    setIsProcessing(true);
    trackEvent({ name: "tool_used", tool: "sign-pdf" });

    try {
      const processedFields: SignatureFieldOptions[] = fields.map(f => ({
        id: f.id,
        type: f.type,
        pageIndex: f.pageIndex,
        x: f.x,
        y: f.y,
        width: f.width,
        height: f.height,
        imageData: f.dataUrl ? dataUrlToUint8Array(f.dataUrl) : undefined,
        textContent: f.textContent,
        fontSize: f.fontSize,
      }));

      let result = await addMultipleSignatures(file.buffer, processedFields);

      if (signatureMode === "digital") {
        const formData = new FormData();
        formData.append("file", new File([result as any], "signed.pdf", { type: "application/pdf" }));
        
        const response = await fetch("/api/sign-digital", {
          method: "POST",
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error("Failed to apply cryptographic digital signature.");
        }
        
        const arrayBuffer = await response.arrayBuffer();
        result = new Uint8Array(arrayBuffer);
      }

      setResultData(result);
      setDownloadFilename("signed.pdf");
      setShowAd(true);
    } catch (err) {
      console.error("Signing failed:", err);
      alert("Failed to apply signature. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [file, fields, signatureMode]);

  const handleReset = useCallback(() => {
    setFile(null);
    setPdfDoc(null);
    setPageCount(0);
    setFields([]);
  }, []);

  const handleAdComplete = useCallback(() => {
    trackEvent({ name: "download_completed", tool: "sign-pdf" });
    setShowAd(false);
    if (resultData && downloadFilename) {
      downloadFile(resultData, downloadFilename, "application/pdf");
    }
  }, [resultData, downloadFilename]);

  return (
    <ToolPageLayout
      title="Sign PDF"
      description="Draw or type your signature to securely sign PDF documents entirely in your browser."
      icon={PenTool}
      iconGradient="icon-circle-edit"
    >
      {isProcessing && <ProcessingOverlay />}
      {showAd && <PreDownloadAd onComplete={handleAdComplete} onCancel={() => setShowAd(false)} />}
      
      {/* Initial Dropzone */}
      {!file && (
        <PdfDropzone
          onFilesAdded={handleFilesAdded}
          multiple={false}
          label="Drop your PDF file here"
          sublabel="Select a PDF to sign"
        />
      )}

      {/* Main Workspace */}
      {file && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
          
          {/* Left Column: Massive Live Preview (col-span-8) */}
          <div className="lg:col-span-8 flex flex-col p-5 bg-[var(--color-bg-base)] rounded-2xl border border-[var(--color-border-glass)] shadow-inner min-h-[700px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Document Preview</h2>
              {pageCount > 0 && (
                <div className="flex items-center gap-2">
                  <button 
                    disabled={pageIndex === 0} 
                    onClick={() => setPageIndex(p => p - 1)}
                    className="px-2 py-1 bg-[var(--color-bg-surface)] rounded border border-[var(--color-border-glass)] disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <div className="bg-[var(--color-bg-surface)] px-3 py-1.5 rounded-lg border border-[var(--color-border-glass)] text-sm font-medium">
                    <span className="text-indigo-600 font-bold">{pageIndex + 1}</span>
                    <span className="text-[var(--color-text-muted)]"> / {pageCount}</span>
                  </div>
                  <button 
                    disabled={pageIndex === pageCount - 1} 
                    onClick={() => setPageIndex(p => p + 1)}
                    className="px-2 py-1 bg-[var(--color-bg-surface)] rounded border border-[var(--color-border-glass)] disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>

            <div 
              className="flex-1 relative flex items-center justify-center bg-[#e5e7eb] rounded-xl border border-[var(--color-border-glass)] overflow-hidden p-4 md:p-8 min-h-[500px]"
              onClick={() => setActiveFieldId(null)}
            >
              {pdfDoc ? (
                <div className="relative shadow-2xl bg-white max-w-full max-h-full flex items-center justify-center" ref={containerRef}>
                  <PdfViewer
                    doc={pdfDoc}
                    pageNumber={pageIndex + 1}
                    scale={1}
                    className="max-w-full max-h-full object-contain"
                  />
                  
                  {/* Draggable Fields Overlay */}
                  {fields.filter(f => f.pageIndex === pageIndex).map(field => (
                    <DraggableField
                      key={field.id}
                      field={field}
                      isActive={activeFieldId === field.id}
                      onUpdate={handleUpdateField}
                      onSelect={setActiveFieldId}
                      onDelete={handleDeleteField}
                      containerRef={containerRef}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-[var(--color-text-muted)]">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
                  <p>Loading document preview...</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Configuration Panel (col-span-4) */}
          <div className="lg:col-span-4 flex flex-col gap-6 sticky top-6">
            
            {/* File Info */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-glass)] shadow-sm">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><FileText className="w-5 h-5" /></div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate max-w-[150px]">{file.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">Ready to sign</p>
                </div>
              </div>
              <button onClick={handleReset} className="text-xs font-medium text-red-500 hover:text-red-600 underline">Remove</button>
            </div>

            {/* Field Options */}
            <div className="bg-[var(--color-bg-surface)] p-5 rounded-2xl border border-[var(--color-border-glass)] shadow-sm flex flex-col gap-6">
              
              {/* Type Selection */}
              <div>
                <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-3">Type</h3>
                <div className="grid grid-cols-2 gap-3 group/tooltip">
                  <button 
                    onClick={() => setSignatureMode("simple")}
                    className={`flex flex-col items-center justify-center py-4 px-2 gap-2 rounded-xl border-[1.5px] transition-all ${signatureMode === "simple" ? "border-red-500 text-red-500 bg-red-50/30 dark:bg-red-500/10" : "border-[var(--color-border-glass)] text-[var(--color-text-secondary)] hover:border-red-300"}`}
                  >
                    <PenTool className="w-6 h-6" />
                    <span className="text-sm font-medium">Simple Signature</span>
                  </button>
                  <div className="relative group/btn">
                    <button 
                      onClick={() => setSignatureMode("digital")}
                      className={`w-full flex flex-col items-center justify-center py-4 px-2 gap-2 rounded-xl border-[1.5px] transition-all ${signatureMode === "digital" ? "border-[var(--color-text-primary)] bg-[var(--color-bg-surface-hover)] text-[var(--color-text-primary)]" : "border-[var(--color-border-glass)] text-[var(--color-text-secondary)] hover:border-gray-400 bg-[var(--color-bg-base)]"}`}
                    >
                      <Award className="w-6 h-6" />
                      <span className="text-sm font-medium">Digital Signature</span>
                    </button>
                    {/* Tooltip */}
                    <div className="absolute opacity-0 invisible group-hover/btn:opacity-100 group-hover/btn:visible transition-all bottom-full left-1/2 -translate-x-1/2 mb-3 w-[280px] bg-gray-800 text-white text-xs p-3 rounded-lg shadow-xl z-10 text-center leading-relaxed">
                      A signed Certified Hash and a Qualified Timestamp is embedded to the signed documents, ensuring document and signatures integrity in the future. Certified signatures are eIDAS, ESIGN & UETA compliant.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-3">Required fields</h3>
                <button 
                  onClick={() => handleAddFieldClick("signature")}
                  className={`w-full flex items-center justify-between p-3 rounded-xl bg-[var(--color-bg-base)] border transition-colors group ${getFieldCount("signature") > 0 ? "border-indigo-500 bg-indigo-500/10" : "border-indigo-200 dark:border-indigo-500/30 hover:border-indigo-500 hover:bg-indigo-500/10"}`}
                >
                  <div className="flex items-center gap-3">
                    <PenTool className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <span className={`font-semibold ${getFieldCount("signature") > 0 ? "text-indigo-700 dark:text-indigo-300" : "text-[var(--color-text-primary)]"}`}>Signature</span>
                    {getFieldCount("signature") > 0 && (
                      <span className="bg-indigo-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{getFieldCount("signature")}</span>
                    )}
                  </div>
                  <PlusCircle className={`w-5 h-5 transition-colors ${getFieldCount("signature") > 0 ? "text-indigo-600 dark:text-indigo-400" : "text-indigo-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"}`} />
                </button>
              </div>

              <div>
                <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-3">Optional fields</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => handleAddFieldClick("initials")} className={`flex flex-col items-center justify-center p-3 gap-2 rounded-xl bg-[var(--color-bg-base)] border transition-colors ${getFieldCount("initials") > 0 ? "border-indigo-500 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300" : "border-[var(--color-border-glass)] hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 text-[var(--color-text-secondary)]"}`}>
                    <div className="relative">
                      <Type className="w-5 h-5" />
                      {getFieldCount("initials") > 0 && <span className="absolute -top-2 -right-3 bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{getFieldCount("initials")}</span>}
                    </div>
                    <span className="text-xs font-medium">Initials</span>
                  </button>
                  <button onClick={() => handleAddFieldClick("date")} className={`flex flex-col items-center justify-center p-3 gap-2 rounded-xl bg-[var(--color-bg-base)] border transition-colors ${getFieldCount("date") > 0 ? "border-indigo-500 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300" : "border-[var(--color-border-glass)] hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 text-[var(--color-text-secondary)]"}`}>
                    <div className="relative">
                      <Calendar className="w-5 h-5" />
                      {getFieldCount("date") > 0 && <span className="absolute -top-2 -right-3 bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{getFieldCount("date")}</span>}
                    </div>
                    <span className="text-xs font-medium">Date</span>
                  </button>
                  <button onClick={() => handleAddFieldClick("name")} className={`flex flex-col items-center justify-center p-3 gap-2 rounded-xl bg-[var(--color-bg-base)] border transition-colors ${getFieldCount("name") > 0 ? "border-indigo-500 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300" : "border-[var(--color-border-glass)] hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 text-[var(--color-text-secondary)]"}`}>
                    <div className="relative">
                      <User className="w-5 h-5" />
                      {getFieldCount("name") > 0 && <span className="absolute -top-2 -right-3 bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{getFieldCount("name")}</span>}
                    </div>
                    <span className="text-xs font-medium">Name</span>
                  </button>
                  <button onClick={() => handleAddFieldClick("text")} className={`flex flex-col items-center justify-center p-3 gap-2 rounded-xl bg-[var(--color-bg-base)] border transition-colors ${getFieldCount("text") > 0 ? "border-indigo-500 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300" : "border-[var(--color-border-glass)] hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 text-[var(--color-text-secondary)]"}`}>
                    <div className="relative">
                      <AlignLeft className="w-5 h-5" />
                      {getFieldCount("text") > 0 && <span className="absolute -top-2 -right-3 bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{getFieldCount("text")}</span>}
                    </div>
                    <span className="text-xs font-medium">Text</span>
                  </button>
                  <button onClick={() => handleAddFieldClick("company_stamp")} className={`col-span-2 flex items-center justify-center p-3 gap-2 rounded-xl bg-[var(--color-bg-base)] border transition-colors ${getFieldCount("company_stamp") > 0 ? "border-indigo-500 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300" : "border-[var(--color-border-glass)] hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 text-[var(--color-text-secondary)]"}`}>
                    <div className="relative">
                      <Building className="w-5 h-5" />
                      {getFieldCount("company_stamp") > 0 && <span className="absolute -top-2 -right-3 bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{getFieldCount("company_stamp")}</span>}
                    </div>
                    <span className="text-xs font-medium">Company Stamp</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Active Field Tweaks (if text) */}
            {activeFieldId && fields.find(f => f.id === activeFieldId)?.type === "text" && (
              <div className="bg-[var(--color-bg-surface)] p-5 rounded-2xl border border-[var(--color-border-glass)] shadow-sm">
                <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-3">Edit Text</h3>
                <input 
                  type="text" 
                  value={fields.find(f => f.id === activeFieldId)?.textContent || ""} 
                  onChange={(e) => handleUpdateField(activeFieldId, { textContent: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--color-bg-base)] border border-[var(--color-border-glass)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {/* Finish Action */}
            <div className="mt-auto pt-4">
              <button
                onClick={handleApplySignature}
                disabled={isProcessing || fields.length === 0}
                className="btn-aurora w-full flex items-center justify-center gap-2 py-4 text-base font-bold shadow-xl shadow-indigo-500/30 disabled:opacity-50 disabled:shadow-none transition-all rounded-xl"
              >
                {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : <><Download className="w-5 h-5" /> Finish & Download</>}
              </button>
              {fields.length === 0 && <p className="text-center text-xs text-[var(--color-text-muted)] mt-2">Add at least one field to finish.</p>}
            </div>

          </div>
        </div>
      )}

      {/* Configuration Modal */}
      {isConfigModalOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--color-bg-surface)] rounded-2xl w-full max-w-2xl shadow-2xl border border-[var(--color-border-glass)] overflow-hidden flex flex-col">
            
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border-glass)] bg-[var(--color-bg-base)]">
              <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
                {pendingFieldType === "date" ? "Set Date" : 
                 pendingFieldType === "name" ? "Set Name" : 
                 pendingFieldType === "text" ? "Set Text" : 
                 "Set your signature details"}
              </h3>
              <button onClick={handleCancelModal} className="text-[var(--color-text-muted)] hover:text-red-500 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {(pendingFieldType === "signature" || pendingFieldType === "initials" || pendingFieldType === "company_stamp") ? (
                <>
                  {/* Type selector */}
                  <div className="flex gap-2 p-1 rounded-xl bg-[var(--color-bg-base)] border border-[var(--color-border-glass)] max-w-sm mx-auto mb-6">
                    <button type="button" onClick={() => { setSignatureType("draw"); setTempSignatureData(null); }} className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-all ${signatureType === "draw" ? "bg-[#6366f1] text-white shadow-md" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-hover)]"}`}>
                      <Paintbrush className="w-4 h-4" /> Draw
                    </button>
                    <button type="button" onClick={() => { setSignatureType("type"); setTempSignatureData(null); }} className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-all ${signatureType === "type" ? "bg-[#6366f1] text-white shadow-md" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-hover)]"}`}>
                      <Type className="w-4 h-4" /> Type
                    </button>
                    <button type="button" onClick={() => { setSignatureType("upload"); setTempSignatureData(null); }} className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-all ${signatureType === "upload" ? "bg-[#6366f1] text-white shadow-md" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-hover)]"}`}>
                      <Upload className="w-4 h-4" /> Upload
                    </button>
                  </div>

                  {/* Input Area */}
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
                          onClick={() => document.getElementById('modal-sig-upload')?.click()}
                        >
                          <input 
                            id="modal-sig-upload" 
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
                            <img src={tempSignatureData} className="max-h-40 object-contain mix-blend-multiply" alt="Uploaded" />
                          ) : (
                            <>
                              <Upload className="w-10 h-10 text-[var(--color-text-muted)] mb-3" />
                              <p className="text-sm font-medium text-[var(--color-text-primary)]">Click to upload image</p>
                              <p className="text-xs text-[var(--color-text-muted)] mt-1">PNG or JPG supported</p>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-4">
                  <label className="text-sm font-medium text-[var(--color-text-primary)]">
                    {pendingFieldType === "date" ? "Select Date" : 
                     pendingFieldType === "name" ? "Enter Name" : "Enter Text"}
                  </label>
                  <input
                    type={pendingFieldType === "date" ? "date" : "text"}
                    value={tempTextData}
                    onChange={(e) => setTempTextData(e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--color-bg-base)] border border-[var(--color-border-glass)] rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[var(--color-border-glass)] bg-[var(--color-bg-base)] flex justify-end gap-3">
              <button onClick={handleCancelModal} className="px-5 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-hover)] rounded-lg transition-colors border border-[var(--color-border-glass)]">
                Cancel
              </button>
              <button 
                onClick={handleSaveModal} 
                disabled={(pendingFieldType === "signature" || pendingFieldType === "initials" || pendingFieldType === "company_stamp") ? !tempSignatureData : !tempTextData}
                className="px-6 py-2 text-sm font-bold text-white bg-[#6366f1] hover:bg-indigo-600 rounded-lg transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </ToolPageLayout>
  );
}


