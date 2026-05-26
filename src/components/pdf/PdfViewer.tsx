"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";

interface PdfViewerProps {
  doc: PDFDocumentProxy;
  pageNumber: number;
  scale?: number;
  rotation?: number;
  className?: string;
}

export function PdfViewer({ doc, pageNumber, scale = 1, rotation = 0, className = "" }: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    if (!doc || !canvasRef.current) return;

    let isSubscribed = true;
    let renderTask: any = null;

    const renderPage = async () => {
      try {
        const page = await doc.getPage(pageNumber);
        
        if (!isSubscribed) return;
        
        // Add additional rotation from props to the page's intrinsic rotation
        const viewport = page.getViewport({ scale, rotation: page.rotate + rotation });
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext: any = {
          canvasContext: context,
          viewport: viewport,
        };

        renderTask = page.render(renderContext);
        await renderTask.promise;
        if (isSubscribed) setIsRendered(true);
      } catch (err) {
        if ((err as Error)?.name === "RenderingCancelledException") {
          // Task cancelled, ignore
        } else {
          console.error(`Error rendering page ${pageNumber}:`, err);
        }
      }
    };

    renderPage();

    return () => {
      isSubscribed = false;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [doc, pageNumber, scale, rotation]);

  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-white/5 ${className}`}>
      <canvas
        ref={canvasRef}
        className={`max-w-full max-h-full transition-opacity duration-300 ${isRendered ? 'opacity-100' : 'opacity-0'}`}
      />
      {!isRendered && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-[#667eea] border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}
