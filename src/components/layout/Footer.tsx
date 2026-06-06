import Link from "next/link";
import { FileText, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border-glass)] bg-[var(--color-bg-surface)]/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-[var(--color-text-primary)]">
                PDF<span className="gradient-text-aurora">Home</span>
              </span>
            </Link>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Free online PDF tools that work entirely in your browser. No signup, no upload to servers.
            </p>
          </div>

          {/* Tools */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Popular Tools</h3>
            <ul className="space-y-2">
              {[
                { name: "Merge PDF", href: "/merge-pdf" },
                { name: "Split PDF", href: "/split-pdf" },
                { name: "Rotate PDF", href: "/rotate-pdf" },
                { name: "Compress PDF", href: "/compress-pdf" },
                { name: "PDF to JPG", href: "/pdf-to-jpg" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* More Tools */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">More Tools</h3>
            <ul className="space-y-2">
              {[
                { name: "Edit PDF", href: "/edit-pdf" },
                { name: "Watermark", href: "/watermark-pdf" },
                { name: "Sign PDF", href: "/sign-pdf" },
                { name: "Protect PDF", href: "/protect-pdf" },
                { name: "Unlock PDF", href: "/unlock-pdf" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Company</h3>
            <ul className="space-y-2">
              {[
                { name: "About", href: "/about" },
                { name: "Contact", href: "/contact" },
                { name: "Privacy Policy", href: "/privacy" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-[var(--color-border-glass)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--color-text-muted)]">
            © {new Date().getFullYear()} PDFHome. All rights reserved.
          </p>
          <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-red-400" /> for everyone
          </p>
        </div>
      </div>
    </footer>
  );
}
