"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Check, Bold, Italic } from "lucide-react";

interface SignatureTypedProps {
  onSave: (dataUrl: string) => void;
  onClear?: () => void;
}

const FONTS = [
  // Signature / Cursive Fonts
  { id: "style-1", name: "Brush Script", font: "Brush Script MT, cursive" },
  { id: "style-2", name: "Lucida Handwriting", font: "Lucida Handwriting, cursive" },
  { id: "style-3", name: "Caveat", font: "'Caveat', cursive, sans-serif" },
  { id: "style-4", name: "Great Vibes", font: "'Great Vibes', cursive, serif" },
  { id: "style-5", name: "Bradley Hand", font: "'Bradley Hand', cursive" },
  { id: "style-6", name: "Snell Roundhand", font: "'Snell Roundhand', cursive" },
  { id: "style-7", name: "Dancing Script", font: "'Dancing Script', cursive" },
  { id: "style-8", name: "Pacifico", font: "'Pacifico', cursive" },
  { id: "style-9", name: "Satisfy", font: "'Satisfy', cursive" },
  { id: "style-10", name: "Sacramento", font: "'Sacramento', cursive" },
  { id: "style-11", name: "Kaushan Script", font: "'Kaushan Script', cursive" },
  { id: "style-12", name: "Yellowtail", font: "'Yellowtail', cursive" },
  { id: "style-13", name: "Marck Script", font: "'Marck Script', cursive" },
  { id: "style-14", name: "Alex Brush", font: "'Alex Brush', cursive" },
  { id: "style-15", name: "Parisienne", font: "'Parisienne', cursive" },
  { id: "style-16", name: "Comic Sans MS", font: "'Comic Sans MS', cursive, sans-serif" },
  
  // Serif Fonts
  { id: "style-17", name: "Georgia", font: "Georgia, serif" },
  { id: "style-18", name: "Times New Roman", font: "'Times New Roman', serif" },
  { id: "style-19", name: "Garamond", font: "Garamond, serif" },
  { id: "style-20", name: "Palatino", font: "'Palatino Linotype', 'Book Antiqua', Palatino, serif" },
  { id: "style-21", name: "Baskerville", font: "Baskerville, 'Baskerville Old Face', serif" },
  
  // Sans-Serif Fonts
  { id: "style-22", name: "Arial", font: "Arial, sans-serif" },
  { id: "style-23", name: "Helvetica", font: "Helvetica, sans-serif" },
  { id: "style-24", name: "Verdana", font: "Verdana, sans-serif" },
  { id: "style-25", name: "Trebuchet MS", font: "'Trebuchet MS', sans-serif" },
  { id: "style-26", name: "Tahoma", font: "Tahoma, sans-serif" },
  
  // Monospace Fonts
  { id: "style-27", name: "Courier New", font: "'Courier New', monospace" },
  { id: "style-28", name: "Monaco", font: "Monaco, monospace" },
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
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Generate PNG data URL from text on canvas
  const generateSignatureImage = useCallback(() => {
    if (!text.trim()) return;

    const canvas = canvasRef.current || document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set font to measure text width
    const fontStyle = isItalic ? "italic" : "normal";
    const fontWeight = isBold ? "bold" : "normal";
    ctx.font = `${fontStyle} ${fontWeight} 48px ${selectedFont}`;
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
    ctx.font = `${fontStyle} ${fontWeight} 48px ${selectedFont}`;
    ctx.fillStyle = selectedColor;

    // Draw text centered
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    // Save PNG
    const dataUrl = canvas.toDataURL("image/png");
    onSave(dataUrl);
  }, [text, selectedFont, selectedColor, isBold, isItalic, onSave]);

  // Update signature whenever text, font, or color changes
  useEffect(() => {
    const timer = setTimeout(() => {
      generateSignatureImage();
    }, 200);
    return () => clearTimeout(timer);
  }, [text, selectedFont, selectedColor, isBold, isItalic, generateSignatureImage]);

  return (
    <div className="space-y-5">
      {/* Hidden canvas for PNG export */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Input */}
      <div>
        <label className="text-sm font-medium block mb-2">Full Name or Initials</label>
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
            <div className="flex gap-2 items-center">
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
              <div className="w-px h-6 bg-[var(--color-border-glass)] mx-1" />
              
              <div 
                className="relative rounded-full border-2 overflow-hidden w-8 h-8 flex items-center justify-center cursor-pointer transition-all" 
                style={{ borderColor: !SIGN_COLORS.find(c => c.color === selectedColor) ? "#6366f1" : "transparent" }}
                title="Custom Color"
              >
                <input 
                  type="color" 
                  value={selectedColor} 
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Preview Area */}
          <div>
            <label className="text-xs text-[var(--color-text-muted)] block mb-2 uppercase tracking-wider">Preview</label>
            <div className="bg-white border border-gray-200 rounded-xl h-32 flex items-center justify-center p-4 shadow-sm overflow-hidden relative w-full">
               <p
                 className="text-4xl truncate max-w-full px-2"
                 style={{ 
                   fontFamily: selectedFont, 
                   color: selectedColor,
                   fontWeight: isBold ? "bold" : "normal",
                   fontStyle: isItalic ? "italic" : "normal"
                 }}
               >
                 {text}
               </p>
               <div className="absolute bottom-2 right-3 text-[10px] text-gray-400 font-sans">
                 {FONTS.find(f => f.font === selectedFont)?.name}
               </div>
            </div>
          </div>

          {/* Styled Fonts Options */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-xs text-[var(--color-text-muted)] block mb-2 uppercase tracking-wider">Select Style</label>
              <div className="relative">
                <select
                  value={selectedFont}
                  onChange={(e) => setSelectedFont(e.target.value)}
                  className="w-full px-4 py-3 pr-10 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-glass)] text-[var(--color-text-primary)] text-base focus:border-[#6366f1] focus:outline-none transition-colors appearance-none cursor-pointer"
                >
                  {FONTS.map((f) => (
                    <option key={f.id} value={f.font}>
                      {f.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-[var(--color-text-muted)]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
            
            <div>
              <label className="text-xs text-[var(--color-text-muted)] block mb-2 uppercase tracking-wider">Formatting</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsBold(!isBold)}
                  className={`p-3 rounded-xl border transition-colors flex items-center justify-center ${isBold ? "bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300" : "bg-[var(--color-bg-surface)] border-[var(--color-border-glass)] text-[var(--color-text-secondary)] hover:border-indigo-400"}`}
                  title="Bold"
                >
                  <Bold className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsItalic(!isItalic)}
                  className={`p-3 rounded-xl border transition-colors flex items-center justify-center ${isItalic ? "bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300" : "bg-[var(--color-bg-surface)] border-[var(--color-border-glass)] text-[var(--color-text-secondary)] hover:border-indigo-400"}`}
                  title="Italic"
                >
                  <Italic className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
