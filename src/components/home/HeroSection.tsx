import Link from "next/link";
import { Zap, ArrowRight } from "lucide-react";

export function HeroSection() {
  return (
    <section className="aurora-bg relative py-20 md:py-32 px-4">
      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200/60 bg-white/80 backdrop-blur-md shadow-sm mb-8">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="text-sm text-[var(--color-text-secondary)]">
            100% Free • No Signup • Privacy First
          </span>
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
          Every PDF Tool You Need{" "}
          <span className="gradient-text-aurora">— 100% Free</span>
        </h1>

        <p className="text-lg md:text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed">
          Edit, merge, split, compress, and convert PDFs directly in your browser.
          No signup. No upload to servers. Completely private.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="#tools" className="btn-aurora inline-flex items-center gap-2">
            Explore All Tools
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="/merge-pdf" className="btn-secondary inline-flex items-center gap-2">
            Try Merge PDF
          </Link>
        </div>
      </div>
    </section>
  );
}
