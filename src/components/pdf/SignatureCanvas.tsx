"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { Undo2, Trash2 } from "lucide-react";

interface SignatureCanvasProps {
  onSignatureChange: (dataUrl: string | null) => void;
  width?: number;
  height?: number;
}

export function SignatureCanvas({ onSignatureChange, width = 500, height = 200 }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [penColor, setPenColor] = useState("#000000");
  const pathsRef = useRef<ImageData[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;
    ctx.fillStyle = "transparent";
    ctx.fillRect(0, 0, width, height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = penColor;
  }, [width, height, penColor]);

  const getPosition = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      if ("touches" in e) {
        const touch = e.touches[0];
        return {
          x: (touch.clientX - rect.left) * scaleX,
          y: (touch.clientY - rect.top) * scaleY,
        };
      }
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    []
  );

  const startDrawing = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Save current state for undo
      pathsRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));

      const pos = getPosition(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      setIsDrawing(true);
    },
    [getPosition]
  );

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      if (!isDrawing) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const pos = getPosition(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    },
    [isDrawing, getPosition]
  );

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setHasDrawn(true);

    const canvas = canvasRef.current;
    if (canvas) {
      onSignatureChange(canvas.toDataURL("image/png"));
    }
  }, [isDrawing, onSignatureChange]);

  const handleUndo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const lastState = pathsRef.current.pop();
    if (lastState) {
      ctx.putImageData(lastState, 0, 0);
      onSignatureChange(canvas.toDataURL("image/png"));
    }

    if (pathsRef.current.length === 0) {
      setHasDrawn(false);
      onSignatureChange(null);
    }
  }, [onSignatureChange]);

  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pathsRef.current = [];
    setHasDrawn(false);
    onSignatureChange(null);
  }, [onSignatureChange]);

  const PEN_COLORS = ["#000000", "#1e40af", "#dc2626"];

  return (
    <div className="space-y-3">
      <div className="relative rounded-xl border-2 border-dashed border-[var(--color-border-glass)] bg-white overflow-hidden cursor-crosshair">
        <canvas
          ref={canvasRef}
          className="w-full touch-none"
          style={{ aspectRatio: `${width}/${height}` }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasDrawn && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-gray-400 text-sm">Draw your signature here</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex gap-2">
          {PEN_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => {
                setPenColor(c);
                const canvas = canvasRef.current;
                if (canvas) {
                  const ctx = canvas.getContext("2d");
                  if (ctx) ctx.strokeStyle = c;
                }
              }}
              className={`w-7 h-7 rounded-full border-2 transition-all ${penColor === c ? "border-[#6366f1] scale-110" : "border-gray-300"}`}
              style={{ background: c }}
            />
          ))}
        </div>
        <div className="flex gap-2 ml-auto">
          <button
            onClick={handleUndo}
            disabled={!hasDrawn}
            className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border-glass)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-hover)] disabled:opacity-40 transition-all"
          >
            <Undo2 className="w-3.5 h-3.5" /> Undo
          </button>
          <button
            onClick={handleClear}
            disabled={!hasDrawn}
            className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 disabled:opacity-40 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </button>
        </div>
      </div>
    </div>
  );
}
