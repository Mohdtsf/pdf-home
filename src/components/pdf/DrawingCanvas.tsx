import { useRef, useEffect, useState } from "react";

interface DrawingCanvasProps {
  width: number;
  height: number;
  tool: string; // "pencil" | "highlight" | "eraser" or others (if others, canvas is inert)
  color: string; // hex
  thickness: number; // brush thickness
  initialDataUrl?: string; // load drawings from previous states
  onSave: (dataUrl: string) => void;
}

export function DrawingCanvas({
  width,
  height,
  tool,
  color,
  thickness,
  initialDataUrl,
  onSave,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const active = tool === "pencil" || tool === "highlight" || tool === "eraser";

  // Load initial data
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (initialDataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
      };
      img.src = initialDataUrl;
    }
  }, [initialDataUrl, width, height]);

  // Setup drawing context styles based on current tool
  const setupContext = (ctx: CanvasRenderingContext2D) => {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (tool === "pencil") {
      ctx.strokeStyle = color;
      ctx.lineWidth = thickness;
      ctx.globalAlpha = 1.0;
      ctx.globalCompositeOperation = "source-over";
    } else if (tool === "highlight") {
      ctx.strokeStyle = color;
      ctx.lineWidth = thickness * 2.5; // Highlighters are thicker
      ctx.globalAlpha = 0.45; // Translucent
      ctx.globalCompositeOperation = "source-over";
    } else if (tool === "eraser") {
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.lineWidth = thickness * 3; // Eraser is thicker
      ctx.globalAlpha = 1.0;
      ctx.globalCompositeOperation = "destination-out"; // Erase drawings
    }
  };

  const getPointerPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Scale pointer coordinate to match the canvas resolution
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);

    const pos = getPointerPos(e);
    lastPos.current = pos;
    setIsDrawing(true);

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      setupContext(ctx);
      ctx.moveTo(pos.x, pos.y);
      // Draw a point immediately on click
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pos = getPointerPos(e);
    
    ctx.beginPath();
    setupContext(ctx);
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    lastPos.current = pos;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.releasePointerCapture(e.pointerId);
    setIsDrawing(false);

    // Save state
    onSave(canvas.toDataURL());
  };

  return (
    <canvas
      ref={canvasRef}
      width={width * 2} // Use double resolution for high DPI screens
      height={height * 2}
      className={`absolute inset-0 w-full h-full select-none ${
        active ? "cursor-crosshair z-20 pointer-events-auto" : "pointer-events-none z-0"
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
    />
  );
}
