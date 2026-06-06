"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
const ThemeToggle = dynamic(() => import("./ThemeToggle").then((mod) => mod.ThemeToggle), {
  ssr: false,
});
import {
  Menu,
  X,
  ChevronDown,
  FileText,
  Scissors,
  RotateCw,
  Merge,
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

const toolCategories = [
  {
    name: "Organize",
    gradient: "icon-circle-organize",
    glow: "tool-card-organize",
    tools: [
      { name: "Merge PDF", href: "/merge-pdf", icon: Merge, description: "Combine multiple PDFs" },
      { name: "Split PDF", href: "/split-pdf", icon: Scissors, description: "Separate PDF pages" },
      { name: "Rotate PDF", href: "/rotate-pdf", icon: RotateCw, description: "Rotate PDF pages" },
    ],
  },
  {
    name: "Convert",
    gradient: "icon-circle-convert",
    glow: "tool-card-convert",
    tools: [
      { name: "PDF to JPG", href: "/pdf-to-jpg", icon: FileOutput, description: "PDF to images" },
      { name: "JPG to PDF", href: "/jpg-to-pdf", icon: FileInput, description: "Images to PDF" },
    ],
  },
  {
    name: "Edit",
    gradient: "icon-circle-edit",
    glow: "tool-card-edit",
    tools: [
      { name: "Edit PDF", href: "/edit-pdf", icon: Type, description: "Edit, draw, and annotate PDF" },
      { name: "Watermark", href: "/watermark-pdf", icon: Stamp, description: "Add watermark" },
      { name: "Sign PDF", href: "/sign-pdf", icon: PenTool, description: "Sign documents" },
      { name: "Page Numbers", href: "/add-page-numbers", icon: Hash, description: "Add numbering" },
    ],
  },
  {
    name: "Optimize",
    gradient: "icon-circle-optimize",
    glow: "tool-card-optimize",
    tools: [
      { name: "Compress PDF", href: "/compress-pdf", icon: Minimize2, description: "Reduce file size" },
    ],
  },
  {
    name: "Security",
    gradient: "icon-circle-security",
    glow: "tool-card-security",
    tools: [
      { name: "Protect PDF", href: "/protect-pdf", icon: Lock, description: "Password protect" },
      { name: "Unlock PDF", href: "/unlock-pdf", icon: Unlock, description: "Remove password" },
    ],
  },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border-glass)] bg-[var(--color-bg-base)]/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-[var(--color-text-primary)] group-hover:opacity-80 transition-opacity">
              PDF<span className="gradient-text-aurora">Home</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {/* All Tools Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setToolsDropdownOpen(true)}
              onMouseLeave={() => setToolsDropdownOpen(false)}
            >
              <button
                className="flex items-center gap-1 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                aria-expanded={toolsDropdownOpen}
                aria-haspopup="true"
              >
                All Tools
                <ChevronDown className={`w-4 h-4 transition-transform ${toolsDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {toolsDropdownOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[600px] glass-card p-6 grid grid-cols-3 gap-4">
                  {toolCategories.map((category) => (
                    <div key={category.name}>
                      <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
                        {category.name}
                      </p>
                      <div className="space-y-2">
                        {category.tools.map((tool) => (
                          <Link
                            key={tool.href}
                            href={tool.href}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-hover)] transition-all"
                          >
                            <tool.icon className="w-3.5 h-3.5" />
                            {tool.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Link href="/about" className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
              About
            </Link>
            <Link href="/contact" className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
              Contact
            </Link>
            <Link href="/privacy" className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
              Privacy
            </Link>
            <ThemeToggle />
          </nav>

          {/* Mobile Theme Toggle & Menu Toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[var(--color-border-glass)] bg-[var(--color-bg-base)]/95 backdrop-blur-xl">
          <div className="px-4 py-4 space-y-4">
            {toolCategories.map((category) => (
              <div key={category.name}>
                <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                  {category.name}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {category.tools.map((tool) => (
                    <Link
                      key={tool.href}
                      href={tool.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-hover)] transition-all"
                    >
                      <tool.icon className="w-4 h-4" />
                      {tool.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            <div className="border-t border-[var(--color-border-glass)] pt-4 flex flex-col gap-2">
              <Link href="/about" className="px-3 py-2 text-sm text-[var(--color-text-secondary)]" onClick={() => setMobileMenuOpen(false)}>About</Link>
              <Link href="/contact" className="px-3 py-2 text-sm text-[var(--color-text-secondary)]" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
              <Link href="/privacy" className="px-3 py-2 text-sm text-[var(--color-text-secondary)]" onClick={() => setMobileMenuOpen(false)}>Privacy</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export { toolCategories };
