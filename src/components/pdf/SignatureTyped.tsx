"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Check } from "lucide-react";

interface SignatureTypedProps {
  onSave: (dataUrl: string) => void;
  onClear?: () => void;
}

const FONTS = [
  { id: "style-1", name: "Brush Script", font: "Brush Script MT, cursive" },
  { id: "style-2", name: "Lucida", font: "Lucida Handwriting, cursive" },
  { id: "style-3", name: "Caveat", font: "'Caveat', cursive, sans-serif" },
  { id: "style-4", name: "Great Vibes", font: "'Great Vibes', cursive, serif" },
];

const SIGN_COLORS = [
  { name: "Black", color: "#000000" },
  { name: "Dark Blue", color: "#0f172a" },
  { name: "Blue", color: "#2563eb" },
  { name: "Red", color: "#dc2626" },
];

export function SignatureTyped({ onSave }: SignatureTypedProps) {
  const [text, setText] = useState("");
  const [selectedFont, setSelectedFont] = useState(FONTS[0].font);
  const [selectedColor, setSelectedColor] = useState(SIGN_COLORS[0].color);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Generate PNG data URL from text on canvas
  const generateSignatureImage = useCallback(() => {
    if (!text.trim()) return;

    const canvas = canvasRef.current || document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set font to measure text width
    ctx.font = `italic 48px ${selectedFont}`;
    const textMetrics = ctx.measureText(text);
    
    // Set appropriate canvas sizing
    const paddingX = 40;
    const paddingY = 30;
    canvas.width = Math.max(300, textMetrics.width + paddingX);
    canvas.height = 100;

    // Clear and set high quality rendering
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.font = `italic 48px ${selectedFont}`;
    ctx.fillStyle = selectedColor;

    // Draw text centered
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    // Save PNG
    const dataUrl = canvas.toDataURL("image/png");
    onSave(dataUrl);
  }, [text, selectedFont, selectedColor, onSave]);

  // Update signature whenever text, font, or color changes
  useEffect(() => {
    const timer = setTimeout(() => {
      generateSignatureImage();
    }, 200);
    return () => clearTimeout(timer);
  }, [text, selectedFont, selectedColor, generateSignatureImage]);

  return (
    <div className="space-y-5">
      {/* Hidden canvas for PNG export */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Input */}
      <div>
        <label className="text-sm font-medium block mb-2">Type Your Name</label>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type name here..."
          maxLength={30}
          className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-glass)] text-[var(--color-text-primary)] text-base focus:border-[#6366f1] focus:outline-none transition-colors"
        />
      </div>

      {text.trim() && (
        <>
          {/* Colors Selection */}
          <div>
            <label className="text-xs text-[var(--color-text-muted)] block mb-2 uppercase tracking-wider">Ink Color</label>
            <div className="flex gap-2">
              {SIGN_COLORS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setSelectedColor(c.color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center`}
                  style={{ backgroundColor: c.color, borderColor: selectedColor === c.color ? "#6366f1" : "transparent" }}
                  title={c.name}
                >
                  {selectedColor === c.color && (
                    <Check className={`w-4 h-4 ${c.color === "#000000" || c.color === "#0f172a" ? "text-white" : "text-black"}`} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Styled Fonts Options */}
          <div>
            <label className="text-xs text-[var(--color-text-muted)] block mb-2 uppercase tracking-wider">Select Style</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FONTS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFont(f.font)}
                  className={`p-4 rounded-xl border text-center transition-all min-h-[80px] flex flex-col justify-center items-center ${
                    selectedFont === f.font
                      ? "bg-gradient-to-br from-[#06b6d4]/10 to-[#0ea5e9]/10 border-[#06b6d4]/40"
                      : "bg-[var(--color-bg-surface)] border-[var(--color-border-glass)] hover:border-[var(--color-border-glass-hover)]"
                  }`}
                >
                  <p
                    className="text-2xl truncate max-w-full px-2"
                    style={{ fontFamily: f.font, color: selectedColor }}
                  >
                    {text}
                  </p>
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-1">{f.name}</p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
