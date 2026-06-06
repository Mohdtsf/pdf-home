import { useState, useEffect, useRef } from "react";
import { FieldType } from "@/lib/pdf/sign";

export interface PlacedField {
  id: string;
  type: FieldType;
  dataUrl?: string;
  textContent?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pageIndex: number;
  fontSize?: number;
}

interface DraggableFieldProps {
  field: PlacedField;
  isActive: boolean;
  onUpdate: (id: string, updates: Partial<PlacedField>) => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function DraggableField({ field, isActive, onUpdate, onSelect, onDelete, containerRef }: DraggableFieldProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, fieldX: 0, fieldY: 0 });
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 });

  useEffect(() => {
    if (isDragging) {
      const handlePointerMove = (e: PointerEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        
        const deltaX = e.clientX - dragStart.current.x;
        const deltaY = e.clientY - dragStart.current.y;
        
        const pctDeltaX = (deltaX / rect.width) * 100;
        const pctDeltaY = (deltaY / rect.height) * 100;
        
        let newX = dragStart.current.fieldX + pctDeltaX;
        let newY = dragStart.current.fieldY + pctDeltaY;
        
        // Keep within bounds
        newX = Math.max(0, Math.min(newX, 100 - (field.width / rect.width) * 100));
        newY = Math.max(0, Math.min(newY, 100 - (field.height / rect.height) * 100));
        
        onUpdate(field.id, { x: newX, y: newY });
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
        
        const newWidth = Math.max(50, resizeStart.current.width + deltaX);
        const newHeight = Math.max(20, resizeStart.current.height + deltaY);
        
        onUpdate(field.id, { width: newWidth, height: newHeight });
      };

      const handlePointerUp = () => setIsResizing(false);

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);

      return () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };
    }
  }, [isDragging, isResizing, containerRef, field.id, field.width, field.height, onUpdate]);

  const getDisplayText = () => {
    if (field.textContent) return field.textContent;
    switch(field.type) {
      case "signature": return "Signature";
      case "initials": return "Initials";
      case "company_stamp": return "Stamp";
      case "date": return new Date().toLocaleDateString();
      case "name": return "John Doe";
      case "text": return "Double click to edit";
      default: return "";
    }
  };

  return (
    <div
      className={`absolute cursor-move touch-none flex items-center justify-center transition-shadow ${
        isActive ? "border-2 border-dashed border-indigo-500 bg-indigo-500/10 shadow-lg ring-4 ring-indigo-500/20" : "border border-transparent hover:border-gray-400"
      }`}
      style={{
        left: `${field.x}%`,
        top: `${field.y}%`,
        width: `${field.width}px`,
        height: `${field.height}px`,
        zIndex: isActive ? 50 : 10,
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect(field.id);
        setIsDragging(true);
        dragStart.current = {
          x: e.clientX,
          y: e.clientY,
          fieldX: field.x,
          fieldY: field.y
        };
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(field.id);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onSelect(field.id);
      }}
    >
      {field.dataUrl ? (
        <img src={field.dataUrl} className="w-full h-full object-contain pointer-events-none mix-blend-multiply" alt={field.type} />
      ) : (
        <span className="text-gray-700 font-medium pointer-events-none text-center px-2">{getDisplayText()}</span>
      )}
      
      {isActive && (
        <>
          <button
            className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 z-50"
            onPointerDown={(e) => {
              e.stopPropagation();
              onDelete(field.id);
            }}
          >
            ×
          </button>
          <div
            className="absolute -bottom-2 -right-2 w-4 h-4 bg-indigo-500 rounded-full cursor-se-resize shadow-md z-50"
            onPointerDown={(e) => {
              e.stopPropagation();
              setIsResizing(true);
              resizeStart.current = {
                x: e.clientX,
                y: e.clientY,
                width: field.width,
                height: field.height
              };
            }}
          />
        </>
      )}
    </div>
  );
}
