import { useState, useEffect, useRef } from "react";
import { EditorObject } from "@/lib/pdf/edit";
import { Trash2, Type, Move } from "lucide-react";

interface EditorObjectComponentProps {
  obj: EditorObject;
  isActive: boolean;
  isEditTextMode: boolean;
  onUpdate: (id: string, updates: Partial<EditorObject>) => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function EditorObjectComponent({
  obj,
  isActive,
  isEditTextMode,
  onUpdate,
  onSelect,
  onDelete,
  containerRef,
}: EditorObjectComponentProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isEditingText, setIsEditingText] = useState(false);
  
  const dragStart = useRef({ x: 0, y: 0, objX: 0, objY: 0 });
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Manage body cursor or drag state
  useEffect(() => {
    if (isDragging) {
      const handlePointerMove = (e: PointerEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        
        const deltaX = e.clientX - dragStart.current.x;
        const deltaY = e.clientY - dragStart.current.y;
        
        const pctDeltaX = (deltaX / rect.width) * 100;
        const pctDeltaY = (deltaY / rect.height) * 100;
        
        let newX = dragStart.current.objX + pctDeltaX;
        let newY = dragStart.current.objY + pctDeltaY;
        
        // Keep within bounds
        newX = Math.max(0, Math.min(newX, 100 - (obj.width / rect.width) * 100));
        newY = Math.max(0, Math.min(newY, 100 - (obj.height / rect.height) * 100));
        
        onUpdate(obj.id, { x: newX, y: newY });
      };

      const handlePointerUp = () => setIsDragging(false);

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);

      return () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };
    } else if (isResizing) {
      const handlePointerMove = (e: PointerEvent) => {
        const deltaX = e.clientX - resizeStart.current.x;
        const deltaY = e.clientY - resizeStart.current.y;
        
        // Minimum sizes based on type
        const minWidth = obj.type === "shape" ? 20 : 50;
        const minHeight = obj.type === "shape" ? 20 : 20;

        const newWidth = Math.max(minWidth, resizeStart.current.width + deltaX);
        const newHeight = Math.max(minHeight, resizeStart.current.height + deltaY);
        
        onUpdate(obj.id, { width: newWidth, height: newHeight });
      };

      const handlePointerUp = () => setIsResizing(false);

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);

      return () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };
    }
  }, [isDragging, isResizing, containerRef, obj.id, obj.width, obj.height, obj.type, onUpdate]);

  // Focus input when editing text
  useEffect(() => {
    if (isEditingText && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingText]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isEditingText) return; // Don't drag while editing text inline
    e.stopPropagation();
    onSelect(obj.id);
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      objX: obj.x,
      objY: obj.y
    };
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(obj.id);
    if (obj.type === "text" || obj.type === "edit-text") {
      setIsEditingText(true);
    }
  };

  const getTextStyle = () => {
    return {
      fontFamily: obj.fontFamily === "courier" ? "Courier, monospace" : obj.fontFamily === "times" ? "'Times New Roman', Times, serif" : "Helvetica, Arial, sans-serif",
      fontSize: `${obj.fontSize || 14}px`,
      color: obj.color || "#000000",
      fontWeight: obj.bold ? "bold" : "normal",
      fontStyle: obj.italic ? "italic" : "normal",
      textDecoration: obj.underline ? "underline" : "none",
      textAlign: obj.align || "left",
    };
  };

  const renderContent = () => {
    if (isEditingText) {
      return (
        <textarea
          ref={inputRef}
          value={obj.textContent || ""}
          onChange={(e) => onUpdate(obj.id, { textContent: e.target.value })}
          onBlur={() => setIsEditingText(false)}
          className="w-full h-full p-1 border border-indigo-500 bg-white/95 text-black rounded resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500 overflow-hidden leading-tight"
          style={getTextStyle()}
        />
      );
    }

    switch (obj.type) {
      case "text":
      case "edit-text":
        return (
          <div 
            className="w-full h-full flex items-center px-1 select-none overflow-hidden whitespace-pre-wrap break-words leading-tight" 
            style={getTextStyle()}
          >
            {obj.textContent || "Double click to edit"}
          </div>
        );

      case "shape":
        if (obj.shapeType === "rectangle") {
          return (
            <div 
              className="w-full h-full"
              style={{
                border: `${obj.strokeWidth || 2}px solid ${obj.strokeColor || "#000000"}`,
                backgroundColor: obj.fillColor || "transparent",
              }}
            />
          );
        }
        if (obj.shapeType === "circle") {
          return (
            <div 
              className="w-full h-full rounded-full"
              style={{
                border: `${obj.strokeWidth || 2}px solid ${obj.strokeColor || "#000000"}`,
                backgroundColor: obj.fillColor || "transparent",
              }}
            />
          );
        }
        if (obj.shapeType === "line" || obj.shapeType === "arrow") {
          return (
            <svg className="w-full h-full overflow-visible pointer-events-none" style={{ position: "absolute" }}>
              <defs>
                <marker
                  id={`arrowhead-${obj.id}`}
                  markerWidth="8"
                  markerHeight="8"
                  refX="4"
                  refY="4"
                  orient="auto"
                >
                  <polygon points="0 0, 8 4, 0 8, 2 4" fill={obj.strokeColor || "#000000"} />
                </marker>
              </defs>
              <line
                x1="0"
                y1="100%"
                x2="100%"
                y2="0"
                stroke={obj.strokeColor || "#000000"}
                strokeWidth={obj.strokeWidth || 2}
                markerEnd={obj.shapeType === "arrow" ? `url(#arrowhead-${obj.id})` : undefined}
              />
            </svg>
          );
        }
        return null;

      case "image":
      case "signature":
        return obj.dataUrl ? (
          <img 
            src={obj.dataUrl} 
            className="w-full h-full object-contain pointer-events-none select-none mix-blend-multiply" 
            alt={obj.type} 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-xs text-gray-500 border border-dashed border-gray-400">
            No image
          </div>
        );

      case "mark":
        const strokeColor = obj.color || "#e11d48";
        return (
          <svg className="w-full h-full overflow-visible pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            {obj.markType === "check" ? (
              <path 
                d="M 15 45 L 45 75 L 85 15" 
                fill="none" 
                stroke={strokeColor} 
                strokeWidth="12" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            ) : (
              <>
                <line x1="20" y1="20" x2="80" y2="80" stroke={strokeColor} strokeWidth="12" strokeLinecap="round" />
                <line x1="20" y1="80" x2="80" y2="20" stroke={strokeColor} strokeWidth="12" strokeLinecap="round" />
              </>
            )}
          </svg>
        );

      default:
        return null;
    }
  };

  // Determine classes
  let borderClass = "border border-transparent";
  if (isActive) {
    borderClass = "border-2 border-dashed border-indigo-600 bg-indigo-500/5 shadow-lg ring-4 ring-indigo-500/10";
  } else if (isEditTextMode && obj.type === "edit-text" && obj.isOriginalText) {
    // Dotted blue boxes for original text elements to show they are editable
    borderClass = "border border-dashed border-blue-400 hover:border-blue-600 hover:bg-blue-500/5 cursor-pointer";
  } else {
    borderClass = "border border-transparent hover:border-gray-400";
  }

  return (
    <div
      className={`absolute cursor-move touch-none flex items-center justify-center transition-shadow group/obj ${borderClass}`}
      style={{
        left: `${obj.x}%`,
        top: `${obj.y}%`,
        width: `${obj.width}px`,
        height: `${obj.height}px`,
        zIndex: isActive ? 50 : 10,
      }}
      onPointerDown={handlePointerDown}
      onDoubleClick={handleDoubleClick}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(obj.id);
      }}
    >
      {/* Object content */}
      {renderContent()}

      {/* Show move handle for original text elements in edit mode */}
      {isEditTextMode && obj.type === "edit-text" && obj.isOriginalText && !isActive && (
        <div className="absolute -top-3 -left-3 hidden group-hover/obj:flex p-1 bg-blue-500 text-white rounded-full shadow-md z-40 pointer-events-none">
          <Move className="w-3 h-3" />
        </div>
      )}

      {/* Delete and Resize handles */}
      {isActive && !isEditingText && (
        <>
          <button
            className="absolute -top-3 -right-3 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-rose-600 z-50 transition-colors"
            onPointerDown={(e) => {
              e.stopPropagation();
              onDelete(obj.id);
            }}
          >
            <span className="text-sm font-bold leading-none">×</span>
          </button>
          
          {/* Resize handle (hide for lines/arrows since they are simple diagonals, or show everywhere) */}
          <div
            className="absolute -bottom-2 -right-2 w-4 h-4 bg-indigo-600 border border-white rounded-full cursor-se-resize shadow-md z-50 hover:scale-125 transition-transform"
            onPointerDown={(e) => {
              e.stopPropagation();
              setIsResizing(true);
              resizeStart.current = {
                x: e.clientX,
                y: e.clientY,
                width: obj.width,
                height: obj.height
              };
            }}
          />
        </>
      )}
    </div>
  );
}
