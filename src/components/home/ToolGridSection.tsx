import Link from "next/link";
import {
  Merge,
  Scissors,
  RotateCw,
  FileOutput,
  FileInput,
  Type,
  Stamp,
  PenTool,
  Hash,
  Minimize2,
  Lock,
  Unlock,
} from "lucide-react";

const tools = [
  // Organize
  { name: "Merge PDF", description: "Combine multiple PDFs into one document", href: "/merge-pdf", icon: Merge, category: "organize" },
  { name: "Split PDF", description: "Separate pages into individual PDF files", href: "/split-pdf", icon: Scissors, category: "organize" },
  { name: "Rotate PDF", description: "Rotate PDF pages to any orientation", href: "/rotate-pdf", icon: RotateCw, category: "organize" },
  // Convert
  { name: "PDF to JPG", description: "Convert PDF pages into JPG images", href: "/pdf-to-jpg", icon: FileOutput, category: "convert" },
  { name: "JPG to PDF", description: "Convert images into PDF documents", href: "/jpg-to-pdf", icon: FileInput, category: "convert" },
  // Edit
  { name: "Edit PDF", description: "Edit text, draw, sign, and annotate PDF", href: "/edit-pdf", icon: Type, category: "edit" },
  { name: "Watermark", description: "Stamp text or images over your PDF", href: "/watermark-pdf", icon: Stamp, category: "edit" },
  { name: "Sign PDF", description: "Draw or type your signature on PDFs", href: "/sign-pdf", icon: PenTool, category: "edit" },
  { name: "Page Numbers", description: "Add page numbering to your document", href: "/add-page-numbers", icon: Hash, category: "edit" },
  // Optimize
  { name: "Compress PDF", description: "Reduce file size without losing quality", href: "/compress-pdf", icon: Minimize2, category: "optimize" },
  // Security
  { name: "Protect PDF", description: "Add password protection to your PDF", href: "/protect-pdf", icon: Lock, category: "security" },
  { name: "Unlock PDF", description: "Remove password from protected PDFs", href: "/unlock-pdf", icon: Unlock, category: "security" },
];

const categoryStyles: Record<string, { gradient: string; glow: string }> = {
  organize: { gradient: "icon-circle-organize", glow: "tool-card-organize" },
  convert: { gradient: "icon-circle-convert", glow: "tool-card-convert" },
  edit: { gradient: "icon-circle-edit", glow: "tool-card-edit" },
  optimize: { gradient: "icon-circle-optimize", glow: "tool-card-optimize" },
  security: { gradient: "icon-circle-security", glow: "tool-card-security" },
};

export function ToolGridSection() {
  return (
    <section id="tools" className="py-20 px-4">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">All PDF Tools</h2>
          <p className="text-[var(--color-text-secondary)] text-lg max-w-xl mx-auto">
            Everything you need to work with PDFs, all in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {tools.map((tool) => {
            const style = categoryStyles[tool.category];
            return (
              <Link
                key={tool.href}
                href={tool.href}
                className={`glass-card ${style.glow} p-6 group`}
              >
                <div className="flex items-start gap-4">
                  <div className={`icon-circle ${style.gradient}`}>
                    <tool.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-[var(--color-text-primary)] mb-1 group-hover:text-indigo-600 transition-colors">
                      {tool.name}
                    </h3>
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                      {tool.description}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
